const DEFAULT_ELLIE = 'https://tuforums.com/assets/ellie.BXM0XSha.png';
const DEFAULT_AMELIA = 'https://tuforums.com/assets/amelia.DCMtvIku.png';

const toggleMascot = document.getElementById('toggle-mascot');
const toggleDecor = document.getElementById('toggle-decor');
const toggleBg = document.getElementById('toggle-bg');
const toggleNavbar = document.getElementById('toggle-navbar');

const previewEllie = document.getElementById('preview-ellie');
const nameEllie = document.getElementById('name-ellie');
const coverEllie = document.getElementById('cover-ellie');

const previewAmelia = document.getElementById('preview-amelia');
const nameAmelia = document.getElementById('name-amelia');
const coverAmelia = document.getElementById('cover-amelia');

const previewBgBox = document.getElementById('preview-bg-box');
const nameBg = document.getElementById('name-bg');
const colorBgInput = document.getElementById('color-bg');
const coverBg = document.getElementById('cover-bg');

const shortcutListEl = document.getElementById('shortcut-list');
const addShortcutBtn = document.getElementById('add-shortcut-btn');
const shortcutCountEl = document.getElementById('shortcut-count');

let customShortcuts = [];

function setCoverVisible(coverEl, visible) {
  if (visible) {
    coverEl.classList.remove('hidden');
  } else {
    coverEl.classList.add('hidden');
  }
}

function bindEyeToggle(btnId, coverEl, storageKey) {
  document.getElementById(btnId).addEventListener('click', () => {
    const isHidden = coverEl.classList.contains('hidden');
    const nextVisible = isHidden;
    setCoverVisible(coverEl, nextVisible);
    chrome.storage.local.set({ [storageKey]: nextVisible });
  });
}

bindEyeToggle('eye-ellie', coverEllie, 'coverEllie');
bindEyeToggle('eye-amelia', coverAmelia, 'coverAmelia');
bindEyeToggle('eye-bg', coverBg, 'coverBg');

// 1. 저장된 설정 불러오기
chrome.storage.local.get([
  'mascotEnabled', 'decorHidden', 'ellieImg', 'ellieName', 'ameliaImg', 'ameliaName',
  'bgEnabled', 'bgType', 'bgValue', 'bgName',
  'navbarEnabled', 'customShortcuts',
  'coverEllie', 'coverAmelia', 'coverBg'
], (data) => {
  toggleMascot.checked = !!data.mascotEnabled;
  toggleDecor.checked = !!data.decorHidden;
  toggleBg.checked = !!data.bgEnabled;
  toggleNavbar.checked = !!data.navbarEnabled;

  setCoverVisible(coverEllie, data.coverEllie !== false);
  setCoverVisible(coverAmelia, data.coverAmelia !== false);
  setCoverVisible(coverBg, data.coverBg !== false);

  if (data.ellieImg) {
    previewEllie.src = data.ellieImg;
    nameEllie.textContent = data.ellieName || '커스텀 이미지';
  }
  if (data.ameliaImg) {
    previewAmelia.src = data.ameliaImg;
    nameAmelia.textContent = data.ameliaName || '커스텀 이미지';
  }

  updateBgPreview(data.bgType, data.bgValue, data.bgName);

  if (Array.isArray(data.customShortcuts)) {
    customShortcuts = data.customShortcuts;
  } else {
    customShortcuts = [{ name: '에셋 목록', url: 'https://tuforums.com/asset-list' }];
    chrome.storage.local.set({ customShortcuts });
  }
  renderShortcuts();
});

function updateBgPreview(type, value, name) {
  if (type === 'image' && value) {
    previewBgBox.style.backgroundImage = `url("${value}")`;
    previewBgBox.style.backgroundColor = '';
    previewBgBox.textContent = '';
    nameBg.textContent = name || '커스텀 배경 이미지';
  } else if (type === 'color' && value) {
    previewBgBox.style.backgroundImage = 'none';
    previewBgBox.style.backgroundColor = value;
    previewBgBox.textContent = '';
    colorBgInput.value = value;
    nameBg.textContent = `단색 (${value.toUpperCase()})`;
  } else {
    previewBgBox.style.backgroundImage = '';
    previewBgBox.style.backgroundColor = '';
    previewBgBox.textContent = '기본 배경';
    nameBg.textContent = '기본 남보라 테마';
  }
}

function renderShortcuts() {
  shortcutListEl.innerHTML = '';
  shortcutCountEl.textContent = customShortcuts.length;
  addShortcutBtn.disabled = customShortcuts.length >= 3;

  customShortcuts.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'shortcut-item';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'input-name';
    nameInput.placeholder = '메뉴 이름';
    nameInput.value = item.name;
    nameInput.addEventListener('input', (e) => {
      customShortcuts[idx].name = e.target.value;
      chrome.storage.local.set({ customShortcuts });
    });

    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.className = 'input-url';
    urlInput.placeholder = 'https://... 또는 /경로';
    urlInput.value = item.url;
    urlInput.addEventListener('input', (e) => {
      customShortcuts[idx].url = e.target.value;
      chrome.storage.local.set({ customShortcuts });
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.title = '삭제';
    delBtn.textContent = '✖️';
    delBtn.addEventListener('click', () => {
      customShortcuts.splice(idx, 1);
      chrome.storage.local.set({ customShortcuts });
      renderShortcuts();
    });

    row.appendChild(nameInput);
    row.appendChild(urlInput);
    row.appendChild(delBtn);
    shortcutListEl.appendChild(row);
  });
}

addShortcutBtn.addEventListener('click', () => {
  if (customShortcuts.length >= 3) return;
  customShortcuts.push({ name: '', url: '' });
  toggleNavbar.checked = true;
  chrome.storage.local.set({ customShortcuts, navbarEnabled: true });
  renderShortcuts();
});

// 체크박스 토글 저장
toggleMascot.addEventListener('change', () => {
  chrome.storage.local.set({ mascotEnabled: toggleMascot.checked });
});
toggleDecor.addEventListener('change', () => {
  chrome.storage.local.set({ decorHidden: toggleDecor.checked });
});
toggleBg.addEventListener('change', () => {
  chrome.storage.local.set({ bgEnabled: toggleBg.checked });
});
toggleNavbar.addEventListener('change', () => {
  chrome.storage.local.set({ navbarEnabled: toggleNavbar.checked });
});

function readAndCompressImage(file, maxWidth, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    if (file.size < 800 * 1024 || file.type === 'image/gif') {
      callback(e.target.result);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/webp', 0.85));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

document.getElementById('upload-ellie').addEventListener('click', () => document.getElementById('file-ellie').click());
document.getElementById('file-ellie').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  readAndCompressImage(file, 600, (dataUrl) => {
    previewEllie.src = dataUrl;
    nameEllie.textContent = file.name;
    toggleMascot.checked = true;
    chrome.storage.local.set({ ellieImg: dataUrl, ellieName: file.name, mascotEnabled: true });
  });
});
document.getElementById('reset-ellie').addEventListener('click', () => {
  previewEllie.src = DEFAULT_ELLIE;
  nameEllie.textContent = '기본 이미지';
  document.getElementById('file-ellie').value = '';
  chrome.storage.local.remove(['ellieImg', 'ellieName']);
});

document.getElementById('upload-amelia').addEventListener('click', () => document.getElementById('file-amelia').click());
document.getElementById('file-amelia').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  readAndCompressImage(file, 600, (dataUrl) => {
    previewAmelia.src = dataUrl;
    nameAmelia.textContent = file.name;
    toggleMascot.checked = true;
    chrome.storage.local.set({ ameliaImg: dataUrl, ameliaName: file.name, mascotEnabled: true });
  });
});
document.getElementById('reset-amelia').addEventListener('click', () => {
  previewAmelia.src = DEFAULT_AMELIA;
  nameAmelia.textContent = '기본 이미지';
  document.getElementById('file-amelia').value = '';
  chrome.storage.local.remove(['ameliaImg', 'ameliaName']);
});

document.getElementById('upload-bg').addEventListener('click', () => document.getElementById('file-bg').click());
document.getElementById('file-bg').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  readAndCompressImage(file, 1600, (dataUrl) => {
    toggleBg.checked = true;
    updateBgPreview('image', dataUrl, file.name);
    chrome.storage.local.set({ bgEnabled: true, bgType: 'image', bgValue: dataUrl, bgName: file.name });
  });
});

colorBgInput.addEventListener('input', (e) => {
  const hex = e.target.value;
  toggleBg.checked = true;
  updateBgPreview('color', hex, '');
  chrome.storage.local.set({ bgEnabled: true, bgType: 'color', bgValue: hex, bgName: '' });
});

document.getElementById('reset-bg').addEventListener('click', () => {
  document.getElementById('file-bg').value = '';
  updateBgPreview(null, null, null);
  chrome.storage.local.remove(['bgType', 'bgValue', 'bgName']);
});

document.getElementById('btn-tuf-settings').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://tuforums.com/settings/preferences' });
});

document.getElementById('btn-bug-report').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://forms.gle/aYFg5pS1dPnHYRLn6' });
});