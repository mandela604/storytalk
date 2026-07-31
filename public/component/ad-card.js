/**
 * ad-card.js — Droboard Reusable Ad Cards (4 formats)
 * ─────────────────────────────────────────────
 * DroboardAdCard.attach(rootEl, hooks) once, then render cards with:
 *   DroboardAdCard.renderNative(ad)      → Type 1: heading + body(+see more) + image, love/comment/share
 *   DroboardAdCard.renderStoryPromo(ad)  → Type 2: promotes a platform story, author or cover-border style
 *   DroboardAdCard.renderFullscreen(ad)  → Type 3: full-height snap ad card (from feed.html's index)
 *   DroboardAdCard.renderBanner(ad)      → Type 4: small horizontal banner (from profile.html)
 *
 * Hooks (all optional):
 *   onOpen(ad, type)     — body/cover tapped → e.g. window.open(ad.url)
 *   onLike(ad)           — love icon tapped (native ad only)
 *   onComment(ad)        — comment icon tapped (native ad only)
 *   onShare(ad, type)    — share icon tapped
 *   onCta(ad, type)      — CTA button tapped
 *
 * ad shapes:
 *   native:      {id, brand, logo, heading, body, image, likes, liked, comments}
 *   storyPromo:  {id, mode:'author'|'cover', authorAv, authorName, cover, title, cat, cta}
 *   fullscreen:  {id, bg, brand, logo, headline, sub, cta, url}
 *   banner:      {id, logo, brand, headline, sub, cta}
 */
(function () {
  'use strict';
  if (window.__droboardAdCard) return;
  window.__droboardAdCard = true;

  const CSS = `
    /* shared */
    .dac-sp-flag{font-size:7px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#3f3f46}

    /* ── Type 1: Native ad (post-style) ── */
    .dac-native{border-bottom:1px solid #1a1b22;background:#000;font-family:'DM Sans',system-ui,sans-serif;padding:13px 14px 0}
    .dac-native-top{display:flex;align-items:center;gap:9px;margin-bottom:9px}
    .dac-logo{width:34px;height:34px;border-radius:9px;object-fit:cover;flex-shrink:0;border:1px solid rgba(255,255,255,.07)}
    .dac-brand{font-size:12px;font-weight:800;color:#38bdf8;flex:1}
    .dac-body{cursor:pointer}
    .dac-heading{font-family:'Playfair Display',Georgia,serif;font-size:15px;font-weight:800;color:#dedede;margin-bottom:5px;line-height:1.3}
    .dac-text{font-size:13px;color:#a8b0ba;line-height:1.6}
    .dac-text.dac-trunc{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .dac-more{font-size:11px;font-weight:700;color:#ff4d7a;cursor:pointer;display:inline-block;margin-top:3px}
    .dac-less{font-size:11px;font-weight:700;color:#71717a;cursor:pointer;display:inline-block;margin-top:3px}
    .dac-img{width:100%;max-height:220px;object-fit:cover;border-radius:10px;margin-top:9px;display:block}
    .dac-native-footer{display:flex;align-items:center;padding:8px 0 10px;border-top:1px solid rgba(255,255,255,.04);margin-top:9px}
    .dac-act{display:flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#3f3f46;cursor:pointer;padding:5px 8px;border-radius:9px}
    .dac-act:active{background:rgba(255,255,255,.04)}
    .dac-act.dac-liked{color:#ff0050}
    .dac-act i{font-size:13px}
    .dac-spacer{flex:1}

    /* ── Type 2: Story promo ── */
    .dac-promo{border-bottom:1px solid #1a1b22;background:#000;font-family:'DM Sans',system-ui,sans-serif;padding:13px 14px 14px;cursor:pointer;position:relative}
    .dac-promo-sp{position:absolute;top:13px;right:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#888;padding:3px 8px;border-radius:8px}
    .dac-promo-author{display:flex;align-items:center;gap:9px;margin-bottom:10px}
    .dac-promo-av{width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #ff0050}
    .dac-promo-aname{font-size:12px;font-weight:700;color:#e8e8e8}
    .dac-promo-cover-wrap{width:100%;border-radius:12px;overflow:hidden;border:2px solid #ff0050;position:relative}
    .dac-promo-cover{width:100%;height:170px;object-fit:cover;display:block}
    .dac-promo-cat{font-size:9px;font-weight:800;color:#ff0050;text-transform:uppercase;letter-spacing:.05em;margin:10px 0 4px}
    .dac-promo-title{font-family:'Playfair Display',Georgia,serif;font-size:14px;font-weight:800;color:#dedede;line-height:1.35}
    .dac-promo-cta{display:inline-flex;align-items:center;gap:6px;background:#ff0050;color:#fff;border:none;padding:8px 16px;border-radius:20px;font-size:11px;font-weight:800;margin-top:10px;font-family:inherit}

    /* ── Type 3: Fullscreen snap ad ── */
    .dac-full{position:relative;height:100vh;width:100%;scroll-snap-align:start;scroll-snap-stop:always;display:flex;flex-direction:column;justify-content:flex-end;background-size:cover;background-position:center;overflow:hidden;font-family:'DM Sans',system-ui,sans-serif}
    .dac-full-grad{position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.94) 10%,rgba(0,0,0,.3) 55%,rgba(0,0,0,.5) 100%);z-index:0}
    .dac-full-flag{position:absolute;top:60px;left:0;right:0;z-index:10;display:flex;justify-content:center}
    .dac-full-flag-inner{background:#ff0050;padding:5px 18px;border-radius:24px;font-size:10px;font-weight:800;color:#fff;display:flex;align-items:center;gap:6px;box-shadow:0 4px 16px rgba(255,0,80,.3)}
    .dac-full-flag-dot{width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.8)}
    .dac-full-body{position:relative;z-index:3;padding:18px 18px 90px}
    .dac-full-brand{font-size:11px;font-weight:800;color:#ff0050;text-transform:uppercase;margin-bottom:5px;display:flex;align-items:center;gap:7px;letter-spacing:.05em}
    .dac-full-logo{width:22px;height:22px;border-radius:6px;object-fit:cover}
    .dac-full-headline{font-family:'Playfair Display',Georgia,serif;font-size:24px;font-weight:900;line-height:1.18;margin-bottom:7px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.9)}
    .dac-full-sub{font-size:13px;color:#ccc;line-height:1.45;margin-bottom:15px;max-width:280px}
    .dac-full-cta{display:inline-flex;align-items:center;gap:7px;background:#ff0050;color:#fff;font-weight:800;font-size:13px;padding:10px 22px;border-radius:24px;cursor:pointer;border:none;box-shadow:0 0 18px rgba(255,0,80,.3)}

    /* ── Type 4: Banner ── */
    .dac-banner{background:#08090c;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:11px 13px;display:flex;align-items:center;gap:10px;position:relative;overflow:hidden;font-family:'DM Sans',system-ui,sans-serif}
    .dac-banner::after{content:'AD';position:absolute;top:6px;right:8px;font-size:7px;font-weight:800;color:#333;letter-spacing:.08em}
    .dac-banner-logo{width:36px;height:36px;border-radius:9px;object-fit:cover;flex-shrink:0;border:1px solid rgba(255,255,255,.07)}
    .dac-banner-body{flex:1;min-width:0}
    .dac-banner-brand{font-size:9px;font-weight:800;color:#38bdf8;margin-bottom:2px}
    .dac-banner-headline{font-size:11px;font-weight:700;color:#e0e0e0;margin-bottom:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .dac-banner-sub{font-size:9px;color:#3f3f46}
    .dac-banner-cta{background:#ff0050;color:#fff;border:none;padding:5px 11px;border-radius:10px;font-size:9px;font-weight:800;cursor:pointer;white-space:nowrap;flex-shrink:0;font-family:inherit}
  `;

  let _root = null, _hooks = {};
  const _esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const _fmtN = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n || 0));

  // ── Type 1: Native ──
  function renderNative(ad) {
    return `<div class="dac-native" data-adid="${ad.id}" data-adtype="native">
      <div class="dac-native-top">
        <img class="dac-logo" src="${ad.logo}" loading="lazy"/>
        <span class="dac-brand">${_esc(ad.brand)}</span>
        <span class="dac-sp-flag">Sponsored</span>
      </div>
      <div class="dac-body" data-open="1">
        <div class="dac-heading">${_esc(ad.heading)}</div>
        <div class="dac-text dac-trunc" id="dac-txt-${ad.id}">${_esc(ad.body)}</div>
        <span class="dac-more" data-more="${ad.id}">See more <i class="fas fa-chevron-down" style="font-size:8px"></i></span>
        ${ad.image ? `<img class="dac-img" src="${ad.image}" loading="lazy"/>` : ''}
      </div>
      <div class="dac-native-footer">
        <div class="dac-act dac-like${ad.liked ? ' dac-liked' : ''}" data-like="${ad.id}">
          <i class="${ad.liked ? 'fas' : 'far'} fa-heart"></i><span class="dac-like-ct">${_fmtN(ad.likes)}</span>
        </div>
        <div class="dac-act" data-comment="${ad.id}"><i class="fas fa-comment-dots"></i><span>${_fmtN(ad.comments)}</span></div>
        <div class="dac-act" data-share="${ad.id}" data-adtype="native"><i class="fas fa-share-nodes"></i></div>
        <div class="dac-spacer"></div>
      </div>
    </div>`;
  }

  // ── Type 2: Story promo ──
  function renderStoryPromo(ad) {
    if (ad.mode === 'author') {
      return `<div class="dac-promo" data-adid="${ad.id}" data-adtype="storyPromo" data-open="1">
        <span class="dac-promo-sp">Sponsored</span>
        <div class="dac-promo-author">
          <img class="dac-promo-av" src="${ad.authorAv}" loading="lazy"/>
          <span class="dac-promo-aname">@${_esc(ad.authorName)}</span>
        </div>
        <div class="dac-promo-cat">${_esc(ad.cat)}</div>
        <div class="dac-promo-title">${_esc(ad.title)}</div>
        <img src="${ad.cover}" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;margin-top:9px" loading="lazy"/>
        <button class="dac-promo-cta" data-cta="${ad.id}" data-adtype="storyPromo">${_esc(ad.cta || 'Read Now')} <i class="fas fa-arrow-right" style="font-size:9px"></i></button>
      </div>`;
    }
    return `<div class="dac-promo" data-adid="${ad.id}" data-adtype="storyPromo" data-open="1">
      <span class="dac-promo-sp">Sponsored</span>
      <div class="dac-promo-cover-wrap"><img class="dac-promo-cover" src="${ad.cover}" loading="lazy"/></div>
      <div class="dac-promo-cat">${_esc(ad.cat)}</div>
      <div class="dac-promo-title">${_esc(ad.title)}</div>
      <button class="dac-promo-cta" data-cta="${ad.id}" data-adtype="storyPromo">${_esc(ad.cta || 'Read Now')} <i class="fas fa-arrow-right" style="font-size:9px"></i></button>
    </div>`;
  }

  // ── Type 3: Fullscreen (from feed.html) ──
  function renderFullscreen(ad) {
    return `<div class="dac-full" data-cardtype="ad" data-adid="${ad.id}" data-adtype="fullscreen" style="background-image:url('${ad.bg}')">
      <div class="dac-full-grad"></div>
      <div class="dac-full-flag"><div class="dac-full-flag-inner"><div class="dac-full-flag-dot"></div>SPONSORED AD<div class="dac-full-flag-dot"></div></div></div>
      <div class="dac-full-body">
        <div class="dac-full-brand"><img class="dac-full-logo" src="${ad.logo}" loading="lazy"/>${_esc(ad.brand)}</div>
        <div class="dac-full-headline">${_esc(ad.headline)}</div>
        <div class="dac-full-sub">${_esc(ad.sub)}</div>
        <button class="dac-full-cta" data-cta="${ad.id}" data-adtype="fullscreen">${_esc(ad.cta)} <i class="fas fa-arrow-right" style="font-size:10px"></i></button>
      </div>
    </div>`;
  }

  // ── Type 4: Banner (from profile.html) ──
  function renderBanner(ad) {
    return `<div class="dac-banner" data-adid="${ad.id}" data-adtype="banner">
      <img class="dac-banner-logo" src="${ad.logo}" loading="lazy"/>
      <div class="dac-banner-body">
        <div class="dac-banner-brand">${_esc(ad.brand)}</div>
        <div class="dac-banner-headline">${_esc(ad.headline)}</div>
        <div class="dac-banner-sub">${_esc(ad.sub)}</div>
      </div>
      <button class="dac-banner-cta" data-cta="${ad.id}" data-adtype="banner">${_esc(ad.cta || 'Start')}</button>
    </div>`;
  }

  // ── Events ──
  function _findAd(all, id) { return (all || []).find(a => String(a.id) === String(id)); }

  function attach(rootEl, hooks) {
    if (!document.getElementById('dac-style')) {
      const style = document.createElement('style');
      style.id = 'dac-style';
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    _root = rootEl;
    _hooks = hooks || {};

    _root.addEventListener('click', (e) => {
      const ads = typeof _hooks.getAds === 'function' ? _hooks.getAds() : [];

      const more = e.target.closest('[data-more]');
      if (more) {
        e.stopPropagation();
        const ad = _findAd(ads, more.dataset.more);
        const txt = document.getElementById('dac-txt-' + more.dataset.more);
        if (ad && txt) {
          txt.classList.remove('dac-trunc');
          more.className = 'dac-less';
          more.innerHTML = 'See less <i class="fas fa-chevron-up" style="font-size:8px"></i>';
        }
        return;
      }

      const like = e.target.closest('[data-like]');
      if (like) {
        e.stopPropagation();
        const ad = _findAd(ads, like.dataset.like);
        if (ad && typeof _hooks.onLike === 'function') _hooks.onLike(ad);
        return;
      }

      const comment = e.target.closest('[data-comment]');
      if (comment) {
        e.stopPropagation();
        const ad = _findAd(ads, comment.dataset.comment);
        if (ad && typeof _hooks.onComment === 'function') _hooks.onComment(ad);
        return;
      }

      const share = e.target.closest('[data-share]');
      if (share) {
        e.stopPropagation();
        const ad = _findAd(ads, share.dataset.share);
        if (ad && typeof _hooks.onShare === 'function') _hooks.onShare(ad, share.dataset.adtype);
        return;
      }

      const cta = e.target.closest('[data-cta]');
      if (cta) {
        e.stopPropagation();
        const ad = _findAd(ads, cta.dataset.cta);
        if (ad && typeof _hooks.onCta === 'function') _hooks.onCta(ad, cta.dataset.adtype);
        return;
      }

      const openable = e.target.closest('[data-open], .dac-full, .dac-banner');
      if (openable) {
        const card = openable.closest('[data-adid]');
        if (!card) return;
        const ad = _findAd(ads, card.dataset.adid);
        if (ad && typeof _hooks.onOpen === 'function') _hooks.onOpen(ad, card.dataset.adtype);
      }
    });
  }

  window.DroboardAdCard = { attach, renderNative, renderStoryPromo, renderFullscreen, renderBanner };
})();