let currentSettings = {};
let isApplying = false;
let observerTimer = null;

chrome.storage.local.get([
  'mascotEnabled', 'decorHidden', 'ellieImg', 'ameliaImg',
  'bgEnabled', 'bgType', 'bgValue',
  'navbarEnabled', 'customShortcuts'
], (data) => {
  currentSettings = data || {};
  scheduleApply();
});

chrome.storage.onChanged.addListener((changes) => {
  for (let key in changes) {
    currentSettings[key] = changes[key].newValue;
  }
  scheduleApply();
});

function scheduleApply() {
  clearTimeout(observerTimer);
  observerTimer = setTimeout(() => {
    applyAllSettings();
  }, 80);
}

function applyAllSettings() {
  if (isApplying) return;
  isApplying = true;

  try { applyMascots(); } catch (e) {}
  try { applyMascotDecor(); } catch (e) {}
  try { applyBackground(); } catch (e) {}
  try { applyNavbarShortcuts(); } catch (e) {}

  setTimeout(() => {
    isApplying = false;
  }, 50);
}

// A. 마스코트 바꾸기 (엘리 & 아멜리아)
function applyMascots() {
  const enabled = !!currentSettings.mascotEnabled;
  const ellieCustom = currentSettings.ellieImg;
  const ameliaCustom = currentSettings.ameliaImg;

  document.querySelectorAll('.submission-art--pass, .submission-art--level, [class*="submission-art"]').forEach(el => {
    const isEllie = el.classList.contains('submission-art--pass');
    const isAmelia = el.classList.contains('submission-art--level');

    if (enabled && isEllie && ellieCustom) {
      if (el.dataset.tufPlusApplied === 'ellie') return;
      if (!el.dataset.origBg) el.dataset.origBg = el.style.backgroundImage || 'default';
      el.style.setProperty('background-image', `url("${ellieCustom}")`, 'important');
      el.style.setProperty('background-size', 'contain', 'important');
      el.style.setProperty('background-repeat', 'no-repeat', 'important');
      el.style.setProperty('background-position', 'center', 'important');
      el.dataset.tufPlusApplied = 'ellie';
    } else if (enabled && isAmelia && ameliaCustom) {
      if (el.dataset.tufPlusApplied === 'amelia') return;
      if (!el.dataset.origBg) el.dataset.origBg = el.style.backgroundImage || 'default';
      el.style.setProperty('background-image', `url("${ameliaCustom}")`, 'important');
      el.style.setProperty('background-size', 'contain', 'important');
      el.style.setProperty('background-repeat', 'no-repeat', 'important');
      el.style.setProperty('background-position', 'center', 'important');
      el.dataset.tufPlusApplied = 'amelia';
    } else if (el.dataset.origBg) {
      if (el.dataset.origBg === 'default') {
        el.style.removeProperty('background-image');
      } else {
        el.style.backgroundImage = el.dataset.origBg;
      }
      delete el.dataset.origBg;
      delete el.dataset.tufPlusApplied;
    }
  });

  document.querySelectorAll('img').forEach(img => {
    const origSrc = img.dataset.origSrc || img.src;
    if (origSrc.includes('ellie.BXM0XSha.png')) {
      img.dataset.origSrc = origSrc;
      const targetSrc = (enabled && ellieCustom) ? ellieCustom : origSrc;
      if (img.src !== targetSrc) img.src = targetSrc;
    } else if (origSrc.includes('amelia.DCMtvIku.png')) {
      img.dataset.origSrc = origSrc;
      const targetSrc = (enabled && ameliaCustom) ? ameliaCustom : origSrc;
      if (img.src !== targetSrc) img.src = targetSrc;
    }
  });
}

// A-2. 마스코트 주변 장식(타일, 별, 카메라, C2 배지 등) 숨기기/보이기
function applyMascotDecor() {
  const hideDecor = !!currentSettings.decorHidden;

  const candidates = document.querySelectorAll(
    '.submission-art__layer--bg, ' +
    '.submission-art__layer--cam, ' +
    '.submission-art__layer--c2, ' +
    '.submission-art__layer--c2-glow, ' +
    '.submission-art__layer-group-c2, ' +
    '[class*="submission-art__layer--"][class*="star"], ' +
    '[class*="submission-art__layer--"][class*="tile"], ' +
    '[class*="submission-art__layer--"][class*="cam"], ' +
    '[class*="submission-art__layer--"][class*="c2"], ' +
    '[class*="bgSTARS"], [class*="bgTILES"], [class*="bgCAM"]'
  );

  candidates.forEach(el => {
    // 캐릭터 본체(--char)나 메인 마스코트 컨테이너는 보호
    if (
      el.classList.contains('submission-art__layer--char') ||
      el.classList.contains('submission-art--pass') ||
      el.classList.contains('submission-art--level')
    ) {
      return;
    }

    if (hideDecor) {
      if (!el.dataset.tufPlusHidden) {
        el.dataset.tufPlusOrigDisplay = el.style.display || '';
        el.style.setProperty('display', 'none', 'important');
        el.dataset.tufPlusHidden = '1';
      }
    } else if (el.dataset.tufPlusHidden) {
      if (el.dataset.tufPlusOrigDisplay) {
        el.style.display = el.dataset.tufPlusOrigDisplay;
      } else {
        el.style.removeProperty('display');
      }
      delete el.dataset.tufPlusHidden;
      delete el.dataset.tufPlusOrigDisplay;
    }
  });

  // 파일명에 bgSTARS, bgTILES, bgCAM, _C2 들어간 img 태그도 추가 대응
  document.querySelectorAll('img').forEach(img => {
    const src = (img.dataset.origSrc || img.src || '').toLowerCase();
    const isDecorImg =
      (src.includes('bgtiles') || src.includes('bgstars') || src.includes('bgcam') || src.includes('_c2')) &&
      !src.includes('ellie.bxm0xsha') &&
      !src.includes('amelia.dcmtviku');

    if (!isDecorImg) return;

    if (hideDecor) {
      if (!img.dataset.tufPlusImgHidden) {
        img.dataset.tufPlusImgOrigDisplay = img.style.display || '';
        img.style.setProperty('display', 'none', 'important');
        img.dataset.tufPlusImgHidden = '1';
      }
    } else if (img.dataset.tufPlusImgHidden) {
      if (img.dataset.tufPlusImgOrigDisplay) {
        img.style.display = img.dataset.tufPlusImgOrigDisplay;
      } else {
        img.style.removeProperty('display');
      }
      delete img.dataset.tufPlusImgHidden;
      delete img.dataset.tufPlusImgOrigDisplay;
    }
  });
}

// B. 커스텀 배경 (단색 / 이미지)
function applyBackground() {
  const enabled = !!currentSettings.bgEnabled;
  const type = currentSettings.bgType;
  const value = currentSettings.bgValue;

  const bgTargets = [document.body, document.querySelector('.background')].filter(Boolean);

  bgTargets.forEach(el => {
    if (enabled && type === 'color' && value) {
      if (el.dataset.tufPlusBg === `color:${value}`) return;
      el.style.setProperty('background', value, 'important');
      el.style.setProperty('background-image', 'none', 'important');
      el.dataset.tufPlusBg = `color:${value}`;
    } else if (enabled && type === 'image' && value) {
      if (el.dataset.tufPlusBg === 'image') return;
      el.style.setProperty('background-image', `url("${value}")`, 'important');
      el.style.setProperty('background-size', 'cover', 'important');
      el.style.setProperty('background-position', 'center', 'important');
      el.style.setProperty('background-attachment', 'fixed', 'important');
      el.dataset.tufPlusBg = 'image';
    } else if (el.dataset.tufPlusBg) {
      el.style.removeProperty('background');
      el.style.removeProperty('background-image');
      delete el.dataset.tufPlusBg;
    }
  });
}

// C. 상단바 커스텀 빠른 이동 (최대 3개)
function applyNavbarShortcuts() {
  const enabled = !!currentSettings.navbarEnabled;
  const rawShortcuts = Array.isArray(currentSettings.customShortcuts) ? currentSettings.customShortcuts : [];

  const validItems = rawShortcuts.slice(0, 3).map((item) => {
    const label = (item && item.name ? item.name : '').trim();
    let url = (item && item.url ? item.url : '').trim();
    if (!label || !url) return null;
    if (!url.startsWith('/') && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return { label, url };
  }).filter(Boolean);

  const signature = enabled ? JSON.stringify(validItems) : 'OFF';

  const nav = document.querySelector('nav.base-nav, nav');
  if (!nav) return;

  if (nav.dataset.tufPlusNavSig === signature && nav.querySelector('.tuf-plus-custom-link') === (enabled && validItems.length > 0 ? nav.querySelector('.tuf-plus-custom-link') : null)) {
    if (!enabled || validItems.length === 0) return;
  }

  nav.querySelectorAll('.tuf-plus-custom-link').forEach(el => el.remove());
  nav.dataset.tufPlusNavSig = signature;

  if (!enabled || validItems.length === 0) return;

  const navLinks = Array.from(nav.querySelectorAll('a'));
  const sampleLink = navLinks.find(a => {
    const href = a.getAttribute('href') || '';
    return href.includes('level') || href.includes('ranking') || href.includes('creator') || href.includes('tool') || href.includes('help');
  }) || navLinks.find(a => !a.querySelector('img'));

  if (!sampleLink || !sampleLink.parentElement) return;

  const container = sampleLink.parentElement;

  validItems.forEach((item) => {
    const link = document.createElement('a');
    link.className = `${sampleLink.className} tuf-plus-custom-link`.trim();
    link.href = item.url;
    link.textContent = item.label;
    link.style.display = 'inline-flex';
    link.style.alignItems = 'center';
    link.style.whiteSpace = 'nowrap';

    if (item.url.startsWith('http') && !url.includes('tuforums.com')) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }

    container.appendChild(link);
  });
}

// 4. React 페이지 이동 감시
if (document.body) {
  const observer = new MutationObserver((mutations) => {
    const hasAddedNodes = mutations.some(m => m.addedNodes && m.addedNodes.length > 0);
    if (hasAddedNodes && !isApplying) {
      scheduleApply();
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}