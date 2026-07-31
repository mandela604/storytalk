/**
 * Droboard Share Modal
 * ─────────────────────────────────────────────
 * Usage:
 *   import { initShareModal, openShareModal } from './shareModal.js';
 *
 *   // 1. Call once on page load (injects HTML + CSS into the document)
 *   initShareModal();
 *
 *   // 2. Call anywhere to open the modal
 *   openShareModal({
 *     title:   'Story title',
 *     sub:     'by @writer · 24k likes',
 *     img:     'https://…cover.jpg',
 *     url:     'https://droboard.app/story/1',
 *     type:    '📖 Story',           // optional label shown in header
 *   });
 *
 * The module fires a custom DOM event "droboard:share" on document when
 * the user picks a platform, so parent pages can hook in if needed:
 *   document.addEventListener('droboard:share', e => console.log(e.detail));
 */

// ─── CSS ─────────────────────────────────────────────────────────────────────
const STYLES = `
:root {
  --sm-acc:   #ff0050;
  --sm-acc2:  #ff4d7a;
  --sm-glow:  rgba(255,0,80,.28);
  --sm-bd:    rgba(255,255,255,.08);
  --sm-dark:  #080808;
  --sm-tx:    #f0f0f0;
  --sm-muted: #666;
}

/* Backdrop */
#dro-share-bg {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0,0,0,.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: none;
  align-items: flex-end;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}
#dro-share-bg.dro-open { display: flex; }

/* Sheet */
#dro-share-sheet {
  width: 100%;
  max-width: 480px;
  background: var(--sm-dark);
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  animation: droSheetUp .28s cubic-bezier(.32,1.1,.64,1) both;
  padding-bottom: max(20px, env(safe-area-inset-bottom));
  font-family: 'DM Sans', system-ui, sans-serif;
  color: var(--sm-tx);
}
@keyframes droSheetUp {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

/* Handle */
.dro-sm-handle {
  width: 36px; height: 4px;
  background: rgba(255,255,255,.12);
  border-radius: 4px;
  margin: 12px auto 0;
}

/* Header */
.dro-sm-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 8px;
}
.dro-sm-hdr h3 {
  font-size: 14px;
  font-weight: 800;
  color: var(--sm-tx);
  display: flex;
  align-items: center;
  gap: 6px;
}
.dro-sm-close {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: rgba(255,255,255,.07);
  border: 1px solid var(--sm-bd);
  color: var(--sm-muted);
  font-size: 12px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: .18s;
}
.dro-sm-close:hover { background: rgba(255,0,80,.15); color: var(--sm-acc); }

/* Preview strip */
.dro-sm-prev {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.04);
  border-radius: 12px;
  padding: 10px 12px;
  margin: 0 14px 12px;
}
.dro-sm-prev-img {
  width: 44px; height: 44px;
  border-radius: 9px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  background-color: rgba(255,0,80,.1);
}
.dro-sm-prev-t { font-size: 12px; font-weight: 700; color: #e0e0e0; line-height: 1.3; margin-bottom: 2px; }
.dro-sm-prev-s { font-size: 10px; color: #444; }

/* Post-to buttons */
.dro-sm-post-row {
  display: flex;
  gap: 8px;
  padding: 0 14px 12px;
}
.dro-sm-post {
  flex: 1;
  padding: 10px 8px;
  border-radius: 13px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  color: #fff;
  transition: .15s;
}
.dro-sm-post:active { transform: scale(.95); opacity: .85; }
.dro-sm-post i { font-size: 15px; }
.dro-sm-post.status { background: linear-gradient(135deg,#0044ff,#00aaff); }
.dro-sm-post.profile {
  background: rgba(255,0,80,.18);
  border: 1px solid rgba(255,0,80,.25);
}

/* Link row */
.dro-sm-link-row {
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(255,255,255,.05);
  border: 1px solid var(--sm-bd);
  border-radius: 10px;
  padding: 8px 11px;
  margin: 0 14px 12px;
}
.dro-sm-link-row input {
  flex: 1;
  background: transparent;
  border: none;
  color: #666;
  font-size: 11px;
  outline: none;
  font-family: inherit;
}
.dro-sm-copy-btn {
  background: var(--sm-acc);
  color: #fff;
  border: none;
  padding: 5px 12px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: .15s;
  flex-shrink: 0;
}
.dro-sm-copy-btn:active { opacity: .8; transform: scale(.96); }
.dro-sm-copy-btn.copied { background: #10b981; }

/* Platform icons grid */
.dro-sm-icons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 0 14px 6px;
}
.dro-sh-ico {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: .15s;
  -webkit-tap-highlight-color: transparent;
}
.dro-sh-ico:active { transform: scale(.88); }
.dro-sh-ico-bg {
  width: 44px; height: 44px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  transition: .15s;
}
.dro-sh-ico:hover .dro-sh-ico-bg { filter: brightness(1.15); }
.dro-sh-ico span {
  font-size: 9px;
  font-weight: 600;
  color: var(--sm-muted);
}

/* Copy feedback */
.dro-sm-copy-msg {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: #10b981;
  height: 18px;
  padding-bottom: 10px;
  transition: opacity .25s;
}
`;

// ─── HTML template ────────────────────────────────────────────────────────────
const HTML = `
<div id="dro-share-bg">
  <div id="dro-share-sheet">
    <div class="dro-sm-handle"></div>
    <div class="dro-sm-hdr">
      <h3>Share <span id="dro-share-type-lbl" style="color:#666;font-weight:400;font-size:11px"></span></h3>
      <button class="dro-sm-close" id="dro-sm-close" aria-label="Close">✕</button>
    </div>

    <div class="dro-sm-prev" id="dro-share-prev"></div>

    <div class="dro-sm-post-row">
      <button class="dro-sm-post status" id="dro-post-status">
        <i class="fas fa-circle-notch"></i>Post to Status
      </button>
      <button class="dro-sm-post profile" id="dro-post-profile">
        <i class="fas fa-user-circle"></i>Post to Profile
      </button>
    </div>

    <div class="dro-sm-link-row">
      <input type="text" id="dro-share-link" readonly aria-label="Share link"/>
      <button class="dro-sm-copy-btn" id="dro-copy-link-btn">Copy</button>
    </div>

    <div class="dro-sm-icons">
      <div class="dro-sh-ico" data-platform="whatsapp">
        <div class="dro-sh-ico-bg" style="background:#1ebe57">
          <i class="fab fa-whatsapp" style="color:#fff"></i>
        </div>
        <span>WhatsApp</span>
      </div>
      <div class="dro-sh-ico" data-platform="twitter">
        <div class="dro-sh-ico-bg" style="background:#000;border:1px solid #222">
          <i class="fab fa-x-twitter" style="color:#fff;font-size:17px"></i>
        </div>
        <span>X (Twitter)</span>
      </div>
      <div class="dro-sh-ico" data-platform="instagram">
        <div class="dro-sh-ico-bg" style="background:linear-gradient(135deg,#f09433,#dc2743,#bc1888)">
          <i class="fab fa-instagram" style="color:#fff"></i>
        </div>
        <span>Instagram</span>
      </div>
      <div class="dro-sh-ico" data-platform="telegram">
        <div class="dro-sh-ico-bg" style="background:#0088cc">
          <i class="fab fa-telegram" style="color:#fff"></i>
        </div>
        <span>Telegram</span>
      </div>
      <div class="dro-sh-ico" data-platform="facebook">
        <div class="dro-sh-ico-bg" style="background:#1877f2">
          <i class="fab fa-facebook" style="color:#fff"></i>
        </div>
        <span>Facebook</span>
      </div>
      <div class="dro-sh-ico" data-platform="copy">
        <div class="dro-sh-ico-bg" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1)">
          <i class="fas fa-link" style="color:#aaa;font-size:16px"></i>
        </div>
        <span>Copy Link</span>
      </div>
    </div>

    <div class="dro-sm-copy-msg" id="dro-copy-msg"></div>
  </div>
</div>
`;

// ─── Module state ─────────────────────────────────────────────────────────────
let _data = {};
let _initialized = false;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function _toast(msg) {
  // Re-use host app's toast() if available, otherwise a minimal fallback
  if (typeof window.toast === 'function') {
    window.toast(msg);
  } else {
    let el = document.getElementById('_dro_fb_toast');
    if (!el) {
      el = document.createElement('div');
      el.id = '_dro_fb_toast';
      el.style.cssText = `
        position:fixed;bottom:88px;left:50%;transform:translateX(-50%) translateY(16px);
        background:#111;border:1px solid rgba(255,255,255,.08);color:#e0e0e0;
        padding:8px 18px;border-radius:24px;font-size:12px;font-weight:600;
        z-index:99999;opacity:0;transition:.28s;pointer-events:none;white-space:nowrap;
        font-family:'DM Sans',system-ui,sans-serif;
      `;
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(16px)';
    }, 2400);
  }
}

function _copyToClipboard(text) {
  return navigator.clipboard
    ? navigator.clipboard.writeText(text)
    : Promise.reject(new Error('Clipboard API unavailable'));
}

function _showCopyConfirm(msg = '✅ Copied!') {
  const el = document.getElementById('dro-copy-msg');
  if (!el) return;
  el.textContent = msg;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.textContent = ''; }, 2200);
}

function _dispatch(platform, data) {
  document.dispatchEvent(new CustomEvent('droboard:share', { detail: { platform, ...data } }));
}

function _openUrl(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ─── Platform share actions ───────────────────────────────────────────────────
const PLATFORM_ACTIONS = {
  whatsapp(d) {
    const text = `📖 "${d.title}"\n\n${d.sub ? d.sub + '\n' : ''}Read on Droboard: ${d.url}`;
    _openUrl(`https://wa.me/?text=${encodeURIComponent(text)}`);
  },
  twitter(d) {
    const text = `📖 "${d.title}" — ${d.sub || 'on Droboard'}`;
    _openUrl(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(d.url)}`);
  },
  instagram(d) {
    // Instagram doesn't support deep-link sharing; copy caption instead
    _copyToClipboard(`📖 "${d.title}"\n${d.sub || ''}\n${d.url}`)
      .catch(() => {});
    _showCopyConfirm('📋 Caption copied for Instagram!');
    _toast('📋 Caption copied — paste it into Instagram');
  },
  telegram(d) {
    _openUrl(`https://t.me/share/url?url=${encodeURIComponent(d.url)}&text=${encodeURIComponent(`📖 "${d.title}"`)}`);
  },
  facebook(d) {
    _openUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(d.url)}`);
  },
  copy(d) {
    _copyToClipboard(d.url).catch(() => {});
    _showCopyConfirm('✅ Link copied!');
    _toast('🔗 Link copied!');
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Inject styles + HTML into the document. Call once on page load.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function initShareModal() {
  if (_initialized) return;
  _initialized = true;

  // Inject CSS
  const style = document.createElement('style');
  style.id = 'dro-share-modal-styles';
  style.textContent = STYLES;
  document.head.appendChild(style);

  // Inject HTML
  const wrapper = document.createElement('div');
  wrapper.innerHTML = HTML.trim();
  document.body.appendChild(wrapper.firstElementChild);

  // ── Wire up events ─────────────────────────────────────────────────────────
  const bg     = document.getElementById('dro-share-bg');
  const sheet  = document.getElementById('dro-share-sheet');
  const closeB = document.getElementById('dro-sm-close');
  const copyB  = document.getElementById('dro-copy-link-btn');

  // Close on backdrop click
  bg.addEventListener('click', e => {
    if (e.target === bg) closeShareModal();
  });

  // Close button
  closeB.addEventListener('click', closeShareModal);

  // Copy link button (header row)
  copyB.addEventListener('click', () => {
    _copyToClipboard(document.getElementById('dro-share-link').value).catch(() => {});
    copyB.textContent = '✓ Copied';
    copyB.classList.add('copied');
    _showCopyConfirm('✅ Link copied!');
    _toast('🔗 Link copied!');
    setTimeout(() => {
      copyB.textContent = 'Copy';
      copyB.classList.remove('copied');
    }, 2000);
  });

  // Post to Status
  document.getElementById('dro-post-status').addEventListener('click', () => {
    _dispatch('status', _data);
    // If host app has openNoteModal, delegate to it
    if (typeof window.openNoteModal === 'function') {
      window.openNoteModal('status');
    } else {
      closeShareModal();
      _toast('📢 Posted to status!');
    }
  });

  // Post to Profile
  document.getElementById('dro-post-profile').addEventListener('click', () => {
    _dispatch('profile', _data);
    if (typeof window.openNoteModal === 'function') {
      window.openNoteModal('profile');
    } else {
      closeShareModal();
      _toast('✅ Posted to profile!');
    }
  });

  // Platform icon clicks (event delegation)
  sheet.addEventListener('click', e => {
    const ico = e.target.closest('.dro-sh-ico[data-platform]');
    if (!ico) return;
    const platform = ico.dataset.platform;
    const action = PLATFORM_ACTIONS[platform];
    if (action) {
      action(_data);
      _dispatch(platform, _data);
      // Close after external navigation (not copy/instagram which need the sheet open briefly)
      if (!['copy', 'instagram'].includes(platform)) closeShareModal();
    }
  });

  // Swipe down to close (touch)
  let _touchStartY = 0;
  sheet.addEventListener('touchstart', e => { _touchStartY = e.touches[0].clientY; }, { passive: true });
  sheet.addEventListener('touchmove', e => {
    const dy = e.touches[0].clientY - _touchStartY;
    if (dy > 60) closeShareModal();
  }, { passive: true });

  // ESC key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && bg.classList.contains('dro-open')) closeShareModal();
  });
}

/**
 * Open the share modal.
 *
 * @param {Object} shareData
 * @param {string}  shareData.title  - Story / post title
 * @param {string}  [shareData.sub]  - Subtitle line (author, likes, etc.)
 * @param {string}  [shareData.img]  - Cover image URL
 * @param {string}  shareData.url    - Canonical share URL
 * @param {string}  [shareData.type] - Label shown in sheet header (e.g. "📖 Story")
 */
export function openShareModal(shareData = {}) {
  if (!_initialized) {
    console.warn('[ShareModal] Call initShareModal() before openShareModal().');
    initShareModal();
  }

  _data = {
    title: shareData.title || 'Droboard Story',
    sub:   shareData.sub   || '',
    img:   shareData.img   || '',
    url:   shareData.url   || 'https://droboard.app',
    type:  shareData.type  || '',
  };

  // Populate UI
  document.getElementById('dro-share-type-lbl').textContent = _data.type;
  document.getElementById('dro-share-link').value           = _data.url;
  document.getElementById('dro-copy-msg').textContent       = '';

  const copyBtn = document.getElementById('dro-copy-link-btn');
  copyBtn.textContent = 'Copy';
  copyBtn.classList.remove('copied');

  document.getElementById('dro-share-prev').innerHTML = `
    <div class="dro-sm-prev-img" style="${_data.img ? `background-image:url('${_data.img}')` : ''}"></div>
    <div>
      <div class="dro-sm-prev-t">${_data.title}</div>
      ${_data.sub ? `<div class="dro-sm-prev-s">${_data.sub}</div>` : ''}
    </div>
  `;

  document.getElementById('dro-share-bg').classList.add('dro-open');
  document.body.style.overflow = 'hidden';
}

/**
 * Programmatically close the share modal.
 */
export function closeShareModal() {
  const bg = document.getElementById('dro-share-bg');
  if (!bg) return;
  bg.classList.remove('dro-open');
  document.body.style.overflow = '';
}