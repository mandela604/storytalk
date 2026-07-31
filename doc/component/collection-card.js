/**
 * collection-card.js — Droboard Reusable Collection Card
 * ─────────────────────────────────────────────
 * Drop one <script src="collection-card.js"></script> in any page (after your
 * icon font is loaded). Then:
 *
 *   DroboardCollectionCard.attach(document.getElementById('collectionsGrid'), {
 *     onOpen:       (coll) => { ... e.g. location.href = 'collection.html?cid=' + coll.id },
 *     onShare:      (coll) => { ... e.g. window.openShareModal({...}) or openPlatformShare({...}) },
 *     onCreateNew:  () => { ... e.g. openNewCollection() },
 *     createButtonEl: document.querySelector('.new-coll-btn'),  // optional — binds click -> onCreateNew
 *   });
 *
 *   DroboardCollectionCard.setCollections(collectionsArray);   // renders the grid
 *   DroboardCollectionCard.update(collection);                 // re-renders one card in place
 *
 * IMPORTANT — this component does NOT know about share-modal.js or any other
 * modal/page on the site. It only detects *what* was clicked (open card vs.
 * share button vs. create-new) and hands it to your hooks — the host page
 * decides *what happens* (open a share sheet, navigate, etc).
 *
 * Each `collection` needs:
 *   {
 *     id, name, count,
 *     covers,          // array of up to 4 image URLs, shown as a 2x2 grid
 *     privacy,         // 'private' | 'public' | 'followers'
 *   }
 *
 * Unknown/missing privacy falls back to 'private'.
 */

(function () {
  'use strict';

  if (window.__droboardCollectionCard) return;
  window.__droboardCollectionCard = true;

  // ══════════════════════════════════════════════════════════════════════
  // CSS  (cc- prefixed, self-contained so this file works on any page)
  // ══════════════════════════════════════════════════════════════════════
  const CSS = `
    .cc-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .cc-card{background:#08090c;border:1px solid rgba(255,255,255,.07);border-radius:13px;overflow:hidden;cursor:pointer;transition:border-color .2s;position:relative;font-family:'DM Sans',system-ui,sans-serif;animation:cc-fadeUp .2s ease both}
    @keyframes cc-fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .cc-card:hover,.cc-card:active{border-color:rgba(255,0,80,.2)}
    .cc-covers{display:grid;grid-template-columns:1fr 1fr;height:76px;background:#0e0f13}
    .cc-cover-img{background-size:cover;background-position:center;background-color:#0e0f13}
    .cc-privacy{position:absolute;top:6px;right:6px;font-size:7px;font-weight:800;padding:2px 6px;border-radius:6px;display:flex;align-items:center;gap:3px;pointer-events:none}
    .cc-privacy.private{background:rgba(0,0,0,.7);color:#71717a;border:1px solid rgba(255,255,255,.07)}
    .cc-privacy.public{background:rgba(52,211,153,.12);color:#34d399;border:1px solid rgba(52,211,153,.22)}
    .cc-privacy.followers{background:rgba(56,189,248,.12);color:#38bdf8;border:1px solid rgba(56,189,248,.22)}
    .cc-info{padding:7px 10px 9px}
    .cc-name{font-size:11px;font-weight:800;color:#e0e0e0;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .cc-count{font-size:9px;color:#71717a}
    .cc-share-btn{display:flex;align-items:center;gap:3px;font-size:8px;font-weight:700;color:#ff7a9a;cursor:pointer;padding:2px 7px;border-radius:8px;background:rgba(255,0,80,.05);border:1px solid rgba(255,0,80,.2);margin-top:5px;width:fit-content}
    .cc-share-btn:active{background:rgba(255,0,80,.12)}
    .cc-share-btn i{font-size:8px}

    .cc-new-btn{width:100%;padding:10px;border-radius:13px;background:rgba(255,255,255,.02);border:1px dashed rgba(255,255,255,.07);color:#3f3f46;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;transition:.15s}
    .cc-new-btn:hover{background:rgba(255,0,80,.04);border-color:rgba(255,0,80,.2);color:#ff7a9a}
  `;

  const PRIVACY_META = {
    private:   { label: '🔒 Private',    icon: 'fa-lock',          iconColor: '#ff0050' },
    public:    { label: '🌍 Public',     icon: 'fa-globe-africa',  iconColor: '#34d399' },
    followers: { label: '👥 Followers',  icon: 'fa-user-friends',  iconColor: '#38bdf8' },
  };

  // ══════════════════════════════════════════════════════════════════════
  // State
  // ══════════════════════════════════════════════════════════════════════
  let _root         = null;
  let _hooks         = {};
  let _collections   = [];

  // ══════════════════════════════════════════════════════════════════════
  // Utils
  // ══════════════════════════════════════════════════════════════════════
  function _esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // ══════════════════════════════════════════════════════════════════════
  // Card render
  // ══════════════════════════════════════════════════════════════════════
  function renderCard(coll, index) {
    const privacy = PRIVACY_META[coll.privacy] ? coll.privacy : 'private';
    const meta = PRIVACY_META[privacy];
    const covers = (coll.covers || []).slice(0, 4);
    const coverHtml = covers.length
      ? covers.map(img => `<div class="cc-cover-img" style="background-image:url('${img}')"></div>`).join('')
      : `<div class="cc-cover-img" style="grid-column:1/3;display:flex;align-items:center;justify-content:center;font-size:20px;color:#3f3f46">📂</div>`;

    return `<div class="cc-card" data-cid="${coll.id}" style="animation-delay:${Math.min((index || 0) * .04, .4)}s">
      <div class="cc-covers" data-open-coll="${coll.id}">${coverHtml}</div>
      <div class="cc-privacy ${privacy}"><i class="fas ${meta.icon}" style="font-size:7px;color:${meta.iconColor}"></i>${meta.label}</div>
      <div class="cc-info">
        <div class="cc-name" data-open-coll="${coll.id}">${_esc(coll.name)}</div>
        <div class="cc-count">${coll.count || 0} ${coll.count === 1 ? 'story' : 'stories'}</div>
        <div class="cc-share-btn" data-share-coll="${coll.id}"><i class="fas fa-share-alt"></i> Share</div>
      </div>
    </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // Full render pass
  // ══════════════════════════════════════════════════════════════════════
  function setCollections(collections) {
    _collections = collections || [];
    if (!_root) return;
    _root.innerHTML = _collections.map((c, i) => renderCard(c, i)).join('');
  }

  function updateCard(coll) {
    if (!_root) return;
    const idx = _collections.findIndex(c => c.id === coll.id);
    if (idx > -1) _collections[idx] = coll;
    const el = _root.querySelector(`.cc-card[data-cid="${coll.id}"]`);
    if (!el) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = renderCard(coll, idx);
    el.replaceWith(tmp.firstElementChild);
  }

  function _findColl(cid) {
    return _collections.find(c => c.id === cid);
  }

  // ══════════════════════════════════════════════════════════════════════
  // Event delegation — bound once on the root container
  // ══════════════════════════════════════════════════════════════════════
  function _bindDelegatedEvents() {
    _root.addEventListener('click', (e) => {
      // share button (stop before the open-card handler fires)
      const shareEl = e.target.closest('[data-share-coll]');
      if (shareEl) {
        e.stopPropagation();
        const c = _findColl(shareEl.dataset.shareColl);
        if (c && typeof _hooks.onShare === 'function') _hooks.onShare(c);
        return;
      }

      // open card
      const openEl = e.target.closest('[data-open-coll]');
      if (openEl) {
        const c = _findColl(openEl.dataset.openColl);
        if (c && typeof _hooks.onOpen === 'function') _hooks.onOpen(c);
        return;
      }
    });
  }

  function _bindCreateButton(btnEl) {
    if (!btnEl) return;
    btnEl.addEventListener('click', () => {
      if (typeof _hooks.onCreateNew === 'function') _hooks.onCreateNew();
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════════════
  function attach(rootEl, hooks) {
    if (!document.getElementById('cc-style')) {
      const style = document.createElement('style');
      style.id = 'cc-style';
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    _root = rootEl;
    _root.classList.add('cc-grid');
    _hooks = hooks || {};
    _bindDelegatedEvents();
    if (_hooks.createButtonEl) _bindCreateButton(_hooks.createButtonEl);
  }

  window.DroboardCollectionCard = {
    attach,
    setCollections,
    update: updateCard,
    render: renderCard,   // renderCard(coll, index) -> HTML string, for manual insertion
  };

})();