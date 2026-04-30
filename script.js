// ── State ──
const state = {
  nickname: '',
  datetime: new Date(),
  avatarDataUrl: null,
  idol: '',
  groupDataUrl: null,
  selectedReasons: new Set(),
  note: '',
  certDataUrl: null,
};

// ── DOM refs ──
const viewForm    = document.getElementById('view-form');
const viewResult  = document.getElementById('view-result');

const inputNickname     = document.getElementById('input-nickname');
const inputDatetimeEl   = document.getElementById('input-datetime');
const btnResetDatetime  = document.getElementById('btn-reset-datetime');
const uploadAvatar      = document.getElementById('upload-avatar');
const avatarPlaceholder = document.getElementById('avatar-placeholder');
const avatarPreview     = document.getElementById('avatar-preview');
const inputIdol         = document.getElementById('input-idol');
const uploadGroup       = document.getElementById('upload-group');
const groupPlaceholder  = document.getElementById('group-placeholder');
const groupPreview      = document.getElementById('group-preview');
const reasonTags        = document.getElementById('reason-tags');
const inputNote         = document.getElementById('input-note');
const btnGenerate       = document.getElementById('btn-generate');

const certNo          = document.getElementById('cert-no');
const certAvatar      = document.getElementById('cert-avatar');
const certAvatarEmpty = document.getElementById('cert-avatar-empty');
const certName        = document.getElementById('cert-name');
const certGroupImg    = document.getElementById('cert-group');
const certGroupEmpty  = document.getElementById('cert-group-empty');
const certXMark       = document.getElementById('cert-x-mark');
const certIdol        = document.getElementById('cert-idol');
const certReason      = document.getElementById('cert-reason');
const certDate        = document.getElementById('cert-date');
const certSig         = document.getElementById('cert-sig');

const certLoading    = document.getElementById('cert-loading');
const certDisplayImg = document.getElementById('cert-display-img');
const btnDownload    = document.getElementById('btn-download');
const btnBack        = document.getElementById('btn-back');

// ── Navbar & Menu Logic ──
const menuToggle = document.getElementById('menu-toggle');
const dropdownMenu = document.getElementById('dropdown-menu');
const navbarBrand = document.getElementById('navbar-brand');

// 切換選單開關
menuToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  menuToggle.classList.toggle('active');
  dropdownMenu.classList.toggle('active');
});

// 點擊外部關閉選單
document.addEventListener('click', (e) => {
  if (!menuToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
    menuToggle.classList.remove('active');
    dropdownMenu.classList.remove('active');
  }
});

// ── Date helpers ──
function formatDatetime(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── flatpickr ──
const fp = flatpickr(inputDatetimeEl, {
  locale: 'zh_tw',
  enableTime: true,
  dateFormat: 'Y/m/d H:i',
  defaultDate: state.datetime,
  time_24hr: true,
  disableMobile: false,
  onChange: (selectedDates) => {
    if (selectedDates[0]) state.datetime = selectedDates[0];
  },
});

btnResetDatetime.addEventListener('click', () => {
  state.datetime = new Date();
  fp.setDate(state.datetime, true);
});

// ── Image upload ──
function handleImageUpload(input, placeholder, preview, key) {
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      state[key] = e.target.result;
      preview.src = e.target.result;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });
}

handleImageUpload(uploadAvatar, avatarPlaceholder, avatarPreview, 'avatarDataUrl');
handleImageUpload(uploadGroup, groupPlaceholder, groupPreview, 'groupDataUrl');

// ── Tags ──
reasonTags.addEventListener('click', e => {
  const tag = e.target.closest('.tag');
  if (!tag) return;
  const val = tag.dataset.value;
  if (state.selectedReasons.has(val)) {
    state.selectedReasons.delete(val);
    tag.classList.remove('selected');
  } else {
    state.selectedReasons.add(val);
    tag.classList.add('selected');
  }
});

// ── Build certificate HTML ──
function buildCertHTML() {
  certNo.textContent = 'No.' + String(Math.floor(100000 + Math.random() * 900000));
  certName.textContent = state.nickname;
  certSig.textContent  = state.nickname;
  certDate.textContent = fp.input.value || formatDatetime(state.datetime);
  certIdol.textContent = `【 ${state.idol} 】`;

  if (state.avatarDataUrl) {
    certAvatar.src = state.avatarDataUrl;
    certAvatar.style.display = 'block';
    certAvatarEmpty.style.display = 'none';
  } else {
    certAvatar.style.display = 'none';
    certAvatarEmpty.style.display = 'block';
  }

  if (state.groupDataUrl) {
    certGroupImg.src = state.groupDataUrl;
    certGroupImg.style.display = 'block';
    certGroupEmpty.style.display = 'none';
    certXMark.style.display = 'flex';
  } else {
    certGroupImg.style.display = 'none';
    certGroupEmpty.style.display = 'block';
    certXMark.style.display = 'none';
  }

  const reasons = [...state.selectedReasons];
  let reasonLine = '';
  if (reasons.length > 0 && state.note) {
    reasonLine = reasons.join('、') + '\n' + state.note;
  } else if (reasons.length > 0) {
    reasonLine = reasons.join('、');
  } else if (state.note) {
    reasonLine = state.note;
  } else {
    reasonLine = '—';
  }
  certReason.textContent = reasonLine;
}

// ── Render certificate to image ──
async function renderCertToImage() {
  const certEl = document.getElementById('certificate');
  certLoading.style.display = 'block';
  certDisplayImg.style.display = 'none';

  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 100));

  const canvas = await html2canvas(certEl, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#f6f0ff',
    logging: false,
    width: certEl.offsetWidth,
    height: certEl.offsetHeight,
  });

  const dataUrl = canvas.toDataURL('image/png');
  state.certDataUrl = dataUrl;

  certDisplayImg.src = dataUrl;
  certDisplayImg.style.display = 'block';
  certLoading.style.display = 'none';
}

// ── Generate ──
btnGenerate.addEventListener('click', async () => {
  let ok = true;
  if (!inputNickname.value.trim()) {
    inputNickname.classList.add('error');
    ok = false;
  } else {
    inputNickname.classList.remove('error');
  }
  if (!inputIdol.value.trim()) {
    inputIdol.classList.add('error');
    ok = false;
  } else {
    inputIdol.classList.remove('error');
  }

  if (!ok) {
    const firstError = document.querySelector('.error');
    firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  state.nickname = inputNickname.value.trim();
  state.idol     = inputIdol.value.trim();
  state.note     = inputNote.value.trim();

  btnGenerate.textContent = '產生中...';
  btnGenerate.disabled = true;

  buildCertHTML();

  viewForm.classList.remove('active');
  viewResult.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  await renderCertToImage();

  btnGenerate.textContent = '✦ 生成脫粉說明書 ✦';
  btnGenerate.disabled = false;
});

// ── Back ──
function goToForm() {
  viewResult.classList.remove('active');
  viewForm.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

btnBack.addEventListener('click', goToForm);
// 讓 Logo + 標題區域點擊後可返回首頁
navbarBrand.addEventListener('click', goToForm);

// ── Download ──
btnDownload.addEventListener('click', () => {
  if (!state.certDataUrl) return;
  const link = document.createElement('a');
  link.download = `脫粉聲明書_${state.nickname || 'unnamed'}.png`;
  link.href = state.certDataUrl;
  link.click();
});

// ── Clear error on input ──
[inputNickname, inputIdol].forEach(el => {
  el.addEventListener('input', () => el.classList.remove('error'));
});
