/**
 * post-card.js — Droboard Reusable Post Card
 * ─────────────────────────────────────────────
 * Drop one <script src="post-card.js"></script> in any page (after your
 * icon font is loaded). Then:
 *
 *   DroboardPostCard.attach(document.getElementById('feedArea'), {
 *     onLike:        (post) => { ... your mutation ... },
 *     onReact:       (post, reactionId) => { ... },
 *     onComment:     (post) => location.href = 'post.html?pid=' + post.id,
 *     onShare:       (post) => { ... e.g. window.openShareModal({...}) ... },
 *     onDotsAction:  (action, post) => { ... 'edit'|'delete'|'report'|'less'|'follow'|'share'|'save' },
 *     onPollVote:    (post, optionIndex) => { ... },
 *     onDebateVote:  (post, side) => { ... },       // side: 'for' | 'against'
 *     onAvatarClick: (post) => { ... open status viewer or profile ... },
 *     onReplySend:   (post, text) => { ... },
 *     getReaction:   (post) => ({ userRx, love: 12, fire: 3, ... }),  // optional
 *   });
 *
 *   DroboardPostCard.setPosts(postsArray);   // renders everything
 *   DroboardPostCard.update(post);           // re-renders one card in place
 *
 * IMPORTANT — this component does NOT know about share-modal.js, save-modal.js,
 * status-viewer.js, or anything else on the page. It only detects *what* was
 * clicked and hands it to your hooks — the host page decides *what happens*.
 * The footer share icon fires `onShare(post)`. The dots-menu "Share post" and
 * "Save post" items fire `onDotsAction('share', post)` / `onDotsAction('save', post)`,
 * same as every other dots action (edit/delete/report/less/follow). Call
 * `window.openShareModal` / `window.openSaveModal` from inside those hooks
 * yourself if you want them wired up.
 *
 * Each `post` needs at minimum:
 *   {
 *     id, type,                 // type drives which renderer runs (see TYPE_RENDERERS)
 *     name, avatar, avatarBg, avatarRing,   // avatarRing: 'ring-has'|'ring-live'|'ring-viewed'|'ring-none'
 *     verified, badge,          // badge: 'writer' | 'anon' | null
 *     rank, rankClass, time,
 *     pinned, mine,
 *     likes, liked, comments,
 *     // + type-specific fields: title, text, quote, caption, chapterRef,
 *     //   debateData, amaData, poll, image, storyRef, note, statusUpdate
 *   }
 *
 * Post types:
 *   'post'          — generic: optional title + optional text + optional image + optional
 *                      storyRef, any combination valid (heading-only, body-only, all three, etc).
 *   'motivation'     — renders exactly like 'post' (title/text/image/storyRef); only the
 *                      type pill label differs. No longer a pull-quote block.
 *   'quote'          — styled pull-quote block (quote + caption) — for literal quoted lines.
 *   'chapter-drop'   — text + a chapter reference card.
 *   'debate'         — text + for/against voting block.
 *   'ama'            — live/upcoming AMA banner.
 *   'forum-poll'     — text + poll options.
 *   'repost'         — a quoted note + a story reference chip.
 *   anything else    — falls back to the generic 'post' renderer.
 *
 * Unregistered / unknown types fall back to the generic renderer, so you can
 * add new content types without touching this file — see
 * DroboardPostCard.registerType(name, rendererFn) at the bottom.
 *
 * THEMING — this component supports light/dark mode by reading the
 * `data-theme` attribute on <html> (the same attribute the host page's
 * theme toggle sets, e.g. `document.documentElement.setAttribute('data-theme','light')`).
 * No configuration needed: attach() injects both the dark (default) rules
 * and the `[data-theme="light"] .dpc-*` overrides below. If the host page
 * never sets data-theme, the component simply stays in its original dark look.
 */

(function () {
  'use strict';

  if (window.__droboardPostCard) return;
  window.__droboardPostCard = true;

  // ══════════════════════════════════════════════════════════════════════
  // CSS  (dpc- prefixed, self-contained so this file works on any page)
  // ══════════════════════════════════════════════════════════════════════
  const CSS = `
    .dpc-card{border-bottom:1px solid #1a1b22;background:#000;position:relative;font-family:'DM Sans',system-ui,sans-serif;animation:dpc-fadeUp .2s ease both;transition:background .25s,border-color .25s}
    @keyframes dpc-fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .dpc-card.pinned::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:#fbbf24}
    .dpc-inner{padding:13px 14px 0}
    .dpc-pinned-lbl{display:flex;align-items:center;gap:4px;font-size:9px;font-weight:800;color:#fbbf24;margin-bottom:5px}

    .dpc-header{display:flex;align-items:flex-start;gap:10px;margin-bottom:9px}
    .dpc-av-ring{width:40px;height:40px;border-radius:50%;flex-shrink:0;padding:2px;cursor:pointer}
    .dpc-av-ring.ring-has{background:conic-gradient(#38bdf8,#0ea5e9,#bae6fd,#38bdf8)}
    .dpc-av-ring.ring-live{background:conic-gradient(#ff0050,#ff4d7a,#ff0050)}
    .dpc-av-ring.ring-viewed{background:#3f3f46}
    .dpc-av-ring.ring-none{background:#13141a}
    .dpc-av-inner{width:100%;height:100%;border-radius:50%;overflow:hidden;background:#000}
    .dpc-av-inner img{width:100%;height:100%;object-fit:cover;display:block}
    .dpc-av-initial{width:100%;height:100%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#e8e8e8}
    .dpc-meta{flex:1;min-width:0}
    .dpc-name-row{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:1px}
    .dpc-name{font-size:13px;font-weight:700;color:#e8e8e8;cursor:pointer;text-decoration:none}
    .dpc-verified{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:#38bdf8;flex-shrink:0}
    .dpc-verified i{font-size:7px;color:#fff}
    .dpc-rank{font-size:8px;font-weight:800;padding:1px 6px;border-radius:6px;white-space:nowrap}
    .dpc-rank.top{background:rgba(255,0,80,.12);border:1px solid rgba(255,0,80,.22);color:#ff4d7a}
    .dpc-meta-sub{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:2px}
    .dpc-badge{font-size:8px;font-weight:800;padding:1px 6px;border-radius:6px}
    .dpc-badge.writer{background:rgba(255,0,80,.1);border:1px solid rgba(255,0,80,.2);color:#ff7a9a}
    .dpc-badge.anon{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);color:#71717a}
    .dpc-time{font-size:10px;color:#3f3f46}
    .dpc-type-pill{font-size:8px;font-weight:900;padding:2px 8px;border-radius:8px;text-transform:uppercase;letter-spacing:.05em;flex-shrink:0;align-self:flex-start;margin-top:2px}

    .dpc-su-strip{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:7px 11px;margin:8px 0;cursor:pointer}
    .dpc-su-dot{width:7px;height:7px;border-radius:50%;background:#34d399;flex-shrink:0}
    .dpc-su-text{font-size:11px;color:#a8b0ba;font-style:italic;flex:1}
    .dpc-su-time{font-size:9px;color:#3f3f46}

    .dpc-body{padding:0 0 9px}
    .dpc-title{font-family:'Playfair Display',Georgia,serif;font-size:16px;font-weight:700;line-height:1.35;color:#dedede;margin-bottom:6px}
    .dpc-text{font-size:14px;color:#a8b0ba;line-height:1.65;word-break:break-word}
    .dpc-text.trunc-5{display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}
    .dpc-text.trunc-3{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
    .dpc-mention{color:#ff4d7a;font-weight:700}
    .dpc-more,.dpc-less{font-size:11px;font-weight:700;cursor:pointer;display:inline-block;margin-top:4px}
    .dpc-more{color:#ff4d7a}
    .dpc-less{color:#71717a}
    .dpc-quote{font-family:'Playfair Display',Georgia,serif;font-size:15px;font-style:italic;font-weight:700;color:#dedede;line-height:1.5;border-left:3px solid #ff0050;padding-left:11px;margin:2px 0 5px}

    .dpc-story-chip{display:flex;align-items:center;gap:9px;background:#0e0f13;border:1px solid rgba(255,255,255,.07);border-radius:11px;padding:8px 10px;margin:7px 0;cursor:pointer}
    .dpc-story-thumb{width:38px;height:44px;border-radius:7px;background-size:cover;background-position:center;flex-shrink:0}
    .dpc-story-cat{font-size:8px;font-weight:800;color:#ff0050;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px}
    .dpc-story-title{font-family:'Playfair Display',Georgia,serif;font-size:11px;font-weight:700;color:#dedede;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .dpc-story-writer{font-size:9px;color:#3f3f46;margin-top:2px}

    .dpc-debate{margin:8px 0;background:#0e0f13;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:12px}
    .dpc-debate-motion{font-size:12px;font-weight:700;color:#a8b0ba;line-height:1.4;margin-bottom:10px;font-style:italic}
    .dpc-debate-sides{display:flex;gap:6px;margin-bottom:8px}
    .dpc-debate-side{flex:1;border-radius:10px;padding:8px;text-align:center;cursor:pointer;border:1.5px solid rgba(255,255,255,.05)}
    .dpc-debate-side.for{background:rgba(52,211,153,.03)}
    .dpc-debate-side.against{background:rgba(248,113,113,.03)}
    .dpc-debate-side.for.voted{border-color:#34d399}
    .dpc-debate-side.against.voted{border-color:#f87171}
    .dpc-ds-label{font-size:10px;font-weight:800;margin-bottom:4px}
    .dpc-debate-side.for .dpc-ds-label{color:#34d399}
    .dpc-debate-side.against .dpc-ds-label{color:#f87171}
    .dpc-ds-bar{height:4px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden;margin-bottom:3px}
    .dpc-ds-fill{height:100%;border-radius:4px}
    .dpc-debate-side.for .dpc-ds-fill{background:#34d399}
    .dpc-debate-side.against .dpc-ds-fill{background:#f87171}
    .dpc-ds-pct{font-size:12px;font-weight:900}
    .dpc-debate-side.for .dpc-ds-pct{color:#34d399}
    .dpc-debate-side.against .dpc-ds-pct{color:#f87171}
    .dpc-ds-ct{font-size:8px;color:#3f3f46}
    .dpc-debate-total{font-size:9px;color:#3f3f46;text-align:center}

    .dpc-poll{margin:8px 0;background:#0e0f13;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:12px}
    .dpc-poll-q{font-size:12px;font-weight:700;color:#a8b0ba;margin-bottom:9px;line-height:1.4}
    .dpc-poll-opt{position:relative;border-radius:8px;padding:8px 10px;border:1px solid rgba(255,255,255,.05);background:rgba(255,255,255,.02);margin-bottom:5px;cursor:pointer;overflow:hidden}
    .dpc-poll-opt.voted{border-color:#ff0050}
    .dpc-poll-bar{position:absolute;left:0;top:0;bottom:0;background:rgba(255,0,80,.07);z-index:0;border-radius:8px}
    .dpc-poll-row{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:6px}
    .dpc-poll-txt{font-size:12px;font-weight:600;color:#a8b0ba}
    .dpc-poll-pct{font-size:11px;font-weight:800;color:#ff0050}
    .dpc-poll-meta{font-size:9px;color:#3f3f46;margin-top:6px}

    .dpc-ama{margin:8px 0;background:linear-gradient(135deg,rgba(251,146,60,.08),rgba(255,0,80,.04));border:1px solid rgba(251,146,60,.25);border-radius:12px;padding:12px;cursor:pointer}
    .dpc-ama-top{display:flex;align-items:center;gap:6px;margin-bottom:6px}
    .dpc-ama-live{display:flex;align-items:center;gap:4px;background:#ff0050;color:#fff;font-size:8px;font-weight:900;padding:3px 8px;border-radius:8px;letter-spacing:.07em}
    .dpc-ama-dot{width:5px;height:5px;border-radius:50%;background:#fff;animation:dpc-pulse 1.2s ease-in-out infinite}
    @keyframes dpc-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
    .dpc-ama-viewers{font-size:10px;color:#fb923c;font-weight:600}
    .dpc-ama-title{font-size:13px;font-weight:700;color:#e8e8e8;line-height:1.35;margin-bottom:4px}
    .dpc-ama-meta{font-size:10px;color:rgba(251,146,60,.65)}
    .dpc-ama-join{display:inline-block;background:linear-gradient(135deg,#fb923c,#ea580c);color:#fff;border:none;padding:6px 14px;border-radius:10px;font-size:10px;font-weight:800;cursor:pointer;margin-top:8px;font-family:inherit}

    .dpc-chapter{margin:8px 0;background:linear-gradient(135deg,rgba(52,211,153,.05),rgba(0,0,0,0));border:1px solid rgba(52,211,153,.15);border-radius:12px;padding:12px;cursor:pointer}
    .dpc-chapter-badge{background:rgba(52,211,153,.12);color:#34d399;font-size:8px;font-weight:900;padding:2px 8px;border-radius:7px;border:1px solid rgba(52,211,153,.2)}
    .dpc-chapter-title{font-family:'Playfair Display',Georgia,serif;font-size:12px;font-weight:700;color:#dedede;margin:7px 0 3px;line-height:1.3}
    .dpc-chapter-meta{font-size:9px;color:#34d399;display:flex;align-items:center;gap:6px}
    .dpc-chapter-btn{display:inline-block;background:#34d399;color:#000;border:none;padding:6px 14px;border-radius:10px;font-size:10px;font-weight:800;cursor:pointer;margin-top:8px;font-family:inherit}

    .dpc-image{width:100%;max-height:280px;object-fit:cover;display:block;border-radius:10px;margin-bottom:6px;cursor:pointer}

    .dpc-footer{display:flex;align-items:center;padding:7px 0 10px;border-top:1px solid rgba(255,255,255,.04);margin-top:5px}
    .dpc-act{display:flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#3f3f46;cursor:pointer;padding:5px 8px;border-radius:9px;user-select:none;flex-shrink:0;position:relative}
    .dpc-act:active{background:rgba(255,255,255,.04)}
    .dpc-act.liked{color:#ff0050}
    .dpc-act i{font-size:13px}
    .dpc-spacer{flex:1}
    .dpc-dots{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;color:#3f3f46;cursor:pointer}

    .dpc-rx-popup{position:absolute;bottom:40px;left:0;z-index:50;background:#13141a;border:1px solid rgba(255,255,255,.07);border-radius:36px;padding:8px 10px;display:none;flex-direction:row;gap:2px;box-shadow:0 8px 32px rgba(0,0,0,.95)}
    .dpc-rx-popup.show{display:flex}
    .dpc-rx-btn{display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:5px 6px;border-radius:12px}
    .dpc-rx-btn:active{transform:scale(.88)}
    .dpc-rx-ct{font-size:8px;font-weight:700;color:#3f3f46;min-width:16px;text-align:center}
    .dpc-rx-btn.reacted .dpc-rx-ct{color:#ff7a9a}

    .dpc-dots-menu{position:fixed;z-index:1000;background:#13141a;border:1px solid rgba(255,255,255,.07);border-radius:13px;padding:5px;min-width:195px;box-shadow:0 8px 40px rgba(0,0,0,.95);display:none}
    .dpc-dots-menu.open{display:block}
    .dpc-dots-item{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:9px;font-size:12px;font-weight:600;color:#a8b0ba;cursor:pointer}
    .dpc-dots-item:hover{background:rgba(255,255,255,.04);color:#e8e8e8}
    .dpc-dots-item.danger{color:#f87171}
    .dpc-dots-item i{width:16px;text-align:center}
    .dpc-dots-sep{height:1px;background:rgba(255,255,255,.04);margin:3px 8px}
    .dpc-menu-overlay{position:fixed;inset:0;z-index:998;display:none}
    .dpc-menu-overlay.on{display:block}

    .dpc-reply-bar{display:none;align-items:center;gap:8px;padding:0 14px 10px}
    .dpc-reply-bar.open{display:flex}
    .dpc-reply-av{width:26px;height:26px;border-radius:50%;background:#ff0050;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;flex-shrink:0}
    .dpc-reply-inp{flex:1;background:#0e0f13;border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:7px 12px;color:#a8b0ba;font-family:inherit;font-size:12px;outline:none}
    .dpc-reply-send{background:#ff0050;border:none;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:11px;color:#fff;flex-shrink:0}
    .dpc-reply-send:disabled{background:#1a1b22;cursor:default}

    /* ══════════════════════════════════════════════════════════════════
       LIGHT MODE — activated when the host page sets
       <html data-theme="light">. Mirrors the token choices used in
       discover.html / profile.html's light theme (white surfaces,
       soft gray borders, dark text), leaving accent colors untouched.
    ══════════════════════════════════════════════════════════════════ */
    [data-theme="light"] .dpc-card{background:#ffffff;border-bottom:1px solid #ececec}
    [data-theme="light"] .dpc-av-ring.ring-none{background:#eef0f3}
    [data-theme="light"] .dpc-av-inner{background:#f2f2f2}
    [data-theme="light"] .dpc-av-initial{color:#1a1a1a;background:#e4e4e7}
    [data-theme="light"] .dpc-name{color:#161616}
    [data-theme="light"] .dpc-time{color:#8a8a8a}
    [data-theme="light"] .dpc-badge.anon{background:rgba(0,0,0,.04);border-color:rgba(0,0,0,.08);color:#666}

    [data-theme="light"] .dpc-su-strip{background:rgba(0,0,0,.03);border-color:rgba(0,0,0,.08)}
    [data-theme="light"] .dpc-su-text{color:#444}
    [data-theme="light"] .dpc-su-time{color:#999}

    [data-theme="light"] .dpc-title{color:#171717}
    [data-theme="light"] .dpc-text{color:#3a3a3a}
    [data-theme="light"] .dpc-less{color:#8a8a8a}
    [data-theme="light"] .dpc-quote{color:#171717}

    [data-theme="light"] .dpc-story-chip{background:#f7f7f8;border-color:rgba(0,0,0,.08)}
    [data-theme="light"] .dpc-story-title{color:#171717}
    [data-theme="light"] .dpc-story-writer{color:#8a8a8a}

    [data-theme="light"] .dpc-debate{background:#f7f7f8;border-color:rgba(0,0,0,.08)}
    [data-theme="light"] .dpc-debate-motion{color:#3a3a3a}
    [data-theme="light"] .dpc-debate-side{border-color:rgba(0,0,0,.05)}
    [data-theme="light"] .dpc-ds-bar{background:rgba(0,0,0,.07)}
    [data-theme="light"] .dpc-ds-ct{color:#999}
    [data-theme="light"] .dpc-debate-total{color:#999}

    [data-theme="light"] .dpc-poll{background:#f7f7f8;border-color:rgba(0,0,0,.08)}
    [data-theme="light"] .dpc-poll-q{color:#3a3a3a}
    [data-theme="light"] .dpc-poll-opt{border-color:rgba(0,0,0,.06);background:rgba(0,0,0,.02)}
    [data-theme="light"] .dpc-poll-txt{color:#3a3a3a}
    [data-theme="light"] .dpc-poll-meta{color:#999}

    [data-theme="light"] .dpc-ama-title{color:#171717}
    [data-theme="light"] .dpc-chapter-title{color:#171717}
    [data-theme="light"] .dpc-chapter-btn{color:#062}

    [data-theme="light"] .dpc-footer{border-top-color:rgba(0,0,0,.06)}
    [data-theme="light"] .dpc-act{color:#8a8a8a}
    [data-theme="light"] .dpc-act:active{background:rgba(0,0,0,.05)}
    [data-theme="light"] .dpc-dots{color:#8a8a8a}

    [data-theme="light"] .dpc-rx-popup{background:#ffffff;border-color:rgba(0,0,0,.08);box-shadow:0 8px 32px rgba(0,0,0,.18)}
    [data-theme="light"] .dpc-rx-ct{color:#999}

    [data-theme="light"] .dpc-dots-menu{background:#ffffff;border-color:rgba(0,0,0,.08);box-shadow:0 8px 40px rgba(0,0,0,.18)}
    [data-theme="light"] .dpc-dots-item{color:#3a3a3a}
    [data-theme="light"] .dpc-dots-item:hover{background:rgba(0,0,0,.05);color:#161616}
    [data-theme="light"] .dpc-dots-sep{background:rgba(0,0,0,.07)}

    [data-theme="light"] .dpc-reply-inp{background:#f2f2f2;border-color:rgba(0,0,0,.08);color:#222}
    [data-theme="light"] .dpc-reply-inp::placeholder{color:#999}
    [data-theme="light"] .dpc-reply-send:disabled{background:#e4e4e7}
  `;

  const REACTIONS = [
    { id: 'love',  fa: 'fa-heart',            col: '#ff4d7a' },
    { id: 'fire',  fa: 'fa-fire',             col: '#fb923c' },
    { id: 'cry',   fa: 'fa-face-sad-cry',     col: '#38bdf8' },
    { id: 'shock', fa: 'fa-face-surprise',    col: '#fbbf24' },
    { id: 'angry', fa: 'fa-face-angry',       col: '#f87171' },
    { id: 'clap',  fa: 'fa-hands-clapping',   col: '#a78bfa' },
  ];

  const TYPE_PILL = {
    'writer-post':   ['Post', '#71717a', 'rgba(255,255,255,.05)', 'rgba(255,255,255,.07)'],
    'chapter-drop':  ['Chapter Drop', '#34d399', 'rgba(52,211,153,.08)', 'rgba(52,211,153,.2)'],
    'debate':        ['Debate', '#fb923c', 'rgba(251,146,60,.08)', 'rgba(251,146,60,.18)'],
    'forum-post':    ['Forum', '#a78bfa', 'rgba(167,139,250,.08)', 'rgba(167,139,250,.18)'],
    'forum-poll':    ['Poll', '#a78bfa', 'rgba(167,139,250,.08)', 'rgba(167,139,250,.18)'],
    'forum-review':  ['Review', '#fbbf24', 'rgba(251,191,36,.08)', 'rgba(251,191,36,.16)'],
    'confession':    ['Confession', '#ff4d7a', 'rgba(255,0,80,.08)', 'rgba(255,0,80,.18)'],
    'ama':           ['AMA \ud83d\udd34', '#fb923c', 'rgba(251,146,60,.1)', 'rgba(251,146,60,.2)'],
    'repost':        ['Repost', '#38bdf8', 'rgba(56,189,248,.08)', 'rgba(56,189,248,.18)'],
    'quote':         ['Quote', '#ff7a9a', 'rgba(255,0,80,.1)', 'rgba(255,0,80,.2)'],
    'motivation':    ['Motivation', '#34d399', 'rgba(52,211,153,.08)', 'rgba(52,211,153,.2)'],
    'post':          ['Post', '#71717a', 'rgba(255,255,255,.05)', 'rgba(255,255,255,.07)'],
    'career-post':   ['Career', '#38bdf8', 'rgba(56,189,248,.08)', 'rgba(56,189,248,.18)'],
  };

  // ══════════════════════════════════════════════════════════════════════
  // State
  // ══════════════════════════════════════════════════════════════════════
  let _root      = null;
  let _hooks     = {};
  let _posts     = [];
  let _openMenu  = null;
  const _rxCache = {}; // per-post reaction counters, only used if hooks.getReaction not supplied

  function _defaultRx(post) {
    if (!_rxCache[post.id]) {
      const o = { userRx: null };
      REACTIONS.forEach(r => (o[r.id] = Math.floor(Math.random() * 300) + 5));
      _rxCache[post.id] = o;
    }
    return _rxCache[post.id];
  }
  function _getRx(post) {
    return (typeof _hooks.getReaction === 'function') ? _hooks.getReaction(post) : _defaultRx(post);
  }

  // ══════════════════════════════════════════════════════════════════════
  // Utils
  // ══════════════════════════════════════════════════════════════════════
  function _fmtN(n) { return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n || 0); }
  function _esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function _fmtTx(t) { return _esc(t || '').replace(/(@[\w_]+)/g, '<span class="dpc-mention">$1</span>'); }
  function _nl(s) { return (s || '').replace(/\n/g, '<br>'); }

  function _toast(msg) {
    if (typeof window.toast === 'function') window.toast(msg);
  }

  // ══════════════════════════════════════════════════════════════════════
  // Shared header/footer pieces
  // ══════════════════════════════════════════════════════════════════════
  function _buildAvatar(post) {
    const ring = post.avatarRing || 'ring-none';
    if (post.avatar) {
      return `<div class="dpc-av-ring ${ring}" data-avatar-for="${post.id}">
        <div class="dpc-av-inner"><img src="${post.avatar}" loading="lazy" alt=""/></div>
      </div>`;
    }
    const bg = post.avatarBg || '#555';
    const init = post.name === 'Anonymous' ? '?' : (post.name || '?')[0];
    return `<div class="dpc-av-ring ring-none" data-avatar-for="${post.id}">
      <div class="dpc-av-inner"><div class="dpc-av-initial" style="background:${bg}">${init}</div></div>
    </div>`;
  }

  function _buildBadge(badge) {
    if (badge === 'writer') return `<span class="dpc-badge writer">\u270d\ufe0f Writer</span>`;
    if (badge === 'anon')   return `<span class="dpc-badge anon">Anon</span>`;
    return '';
  }

  function _buildTypePill(type) {
    const [label, col, bg, bd] = TYPE_PILL[type] || ['Post', '#71717a', 'rgba(255,255,255,.05)', 'rgba(255,255,255,.07)'];
    return `<span class="dpc-type-pill" style="color:${col};background:${bg};border:1px solid ${bd}">${label}</span>`;
  }

  function _buildStatusStrip(post) {
    if (!post.statusUpdate) return '';
    return `<div class="dpc-su-strip" data-status-for="${post.id}">
      <div class="dpc-su-dot"></div>
      <div class="dpc-su-text">${_esc(post.statusUpdate)}</div>
      <div class="dpc-su-time">Now</div>
    </div>`;
  }

  function _buildRxPopup(post) {
    const rx = _getRx(post);
    return `<div class="dpc-rx-popup" id="dpc-rx-${post.id}">
      ${REACTIONS.map(r => `
        <div class="dpc-rx-btn${rx.userRx === r.id ? ' reacted' : ''}" data-rx-pid="${post.id}" data-rid="${r.id}">
          <i class="fas ${r.fa}" style="font-size:22px;color:${r.col}"></i>
          <span class="dpc-rx-ct">${_fmtN(rx[r.id])}</span>
        </div>`).join('')}
    </div>`;
  }

  function _buildFooter(post) {
    return `<div class="dpc-footer">
      <div class="dpc-act dpc-like${post.liked ? ' liked' : ''}" data-pid="${post.id}" style="position:relative">
        ${_buildRxPopup(post)}
        <i class="${post.liked ? 'fas' : 'far'} fa-heart"></i>
        <span class="dpc-like-ct">${_fmtN(post.likes)}</span>
      </div>
      <div class="dpc-act dpc-comment" data-pid="${post.id}">
        <i class="fas fa-comment-dots"></i><span>${_fmtN(post.comments)}</span>
      </div>
      <div class="dpc-act dpc-share" data-pid="${post.id}"><i class="fas fa-share-nodes"></i></div>
      <div class="dpc-spacer"></div>
      <div class="dpc-dots" data-pid="${post.id}"><i class="fas fa-ellipsis-vertical"></i></div>
    </div>`;
  }

  function _textWithMore(post, text, truncClass) {
    if (!text) return '';
    return `<div class="dpc-text ${truncClass}" id="dpc-txt-${post.id}">${_nl(_fmtTx(text))}</div>
      <span class="dpc-more" data-pid="${post.id}">See more <i class="fas fa-chevron-down" style="font-size:8px"></i></span>`;
  }

  function _storyChip(sr) {
    if (!sr) return '';
    return `<div class="dpc-story-chip" data-story-chip="1">
      <div class="dpc-story-thumb" style="background-image:url('${sr.cover}')"></div>
      <div>
        <div class="dpc-story-cat">${_esc(sr.cat)}</div>
        <div class="dpc-story-title">${_esc(sr.title)}</div>
        <div class="dpc-story-writer">by @${_esc(sr.writer)}</div>
      </div>
      <i class="fas fa-arrow-right" style="color:#ff4d7a;font-size:11px;margin-left:auto"></i>
    </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // TYPE RENDERERS — each returns the inner .dpc-body HTML for a post
  // ══════════════════════════════════════════════════════════════════════
  const TYPE_RENDERERS = {

    'quote': (post) => `<div class="dpc-body">
      <div class="dpc-quote">${_esc(post.quote)}</div>
      ${post.caption ? `<div style="font-size:11px;color:#3f3f46;margin-top:2px">${_esc(post.caption)}</div>` : ''}
    </div>`,

    'chapter-drop': (post) => {
      const cr = post.chapterRef || {};
      return `<div class="dpc-body">
        ${post.title ? `<div class="dpc-title">${_esc(post.title)}</div>` : ''}
        ${_textWithMore(post, post.text, 'trunc-3')}
        <div class="dpc-chapter" data-chapter-open="1">
          <span class="dpc-chapter-badge"><i class="fas fa-book-open" style="font-size:7px;margin-right:3px"></i>New Chapter</span>
          <div class="dpc-chapter-title">${_esc(cr.title)}</div>
          <div class="dpc-chapter-meta"><span>${_esc(cr.cat)}</span><span>\u00b7</span><span style="font-weight:800">${_esc(cr.ch)}</span></div>
          <button class="dpc-chapter-btn">Read Now <i class="fas fa-arrow-right" style="font-size:9px"></i></button>
        </div>
      </div>`;
    },

    'debate': (post) => {
      const d = post.debateData || { forV: 0, agV: 0, userVote: null };
      const tot = Math.max(d.forV + d.agV, 1);
      const fp = Math.round((d.forV / tot) * 100), ap = 100 - fp;
      return `<div class="dpc-body">
        ${post.title ? `<div class="dpc-title">${_esc(post.title)}</div>` : ''}
        <div class="dpc-debate">
          <div class="dpc-debate-motion">${_esc(d.motion)}</div>
          <div class="dpc-debate-sides">
            <div class="dpc-debate-side for${d.userVote === 'for' ? ' voted' : ''}" data-debate-pid="${post.id}" data-side="for">
              <div class="dpc-ds-label"><i class="fas fa-check" style="font-size:8px"></i> FOR</div>
              <div class="dpc-ds-bar"><div class="dpc-ds-fill" id="dpc-db-for-${post.id}" style="width:${fp}%"></div></div>
              <div class="dpc-ds-pct" id="dpc-dp-for-${post.id}">${fp}%</div>
              <div class="dpc-ds-ct" id="dpc-dc-for-${post.id}">${_fmtN(d.forV)} readers</div>
            </div>
            <div class="dpc-debate-side against${d.userVote === 'against' ? ' voted' : ''}" data-debate-pid="${post.id}" data-side="against">
              <div class="dpc-ds-label"><i class="fas fa-xmark" style="font-size:8px"></i> AGAINST</div>
              <div class="dpc-ds-bar"><div class="dpc-ds-fill" id="dpc-db-ag-${post.id}" style="width:${ap}%"></div></div>
              <div class="dpc-ds-pct" id="dpc-dp-ag-${post.id}">${ap}%</div>
              <div class="dpc-ds-ct" id="dpc-dc-ag-${post.id}">${_fmtN(d.agV)} readers</div>
            </div>
          </div>
          <div class="dpc-debate-total" id="dpc-dt-${post.id}">${_fmtN(tot)} total votes</div>
        </div>
      </div>`;
    },

    'ama': (post) => {
      const a = post.amaData || {};
      return `<div class="dpc-body">
        <div class="dpc-ama" data-ama-open="1">
          <div class="dpc-ama-top">
            ${a.isLive ? `<div class="dpc-ama-live"><div class="dpc-ama-dot"></div>LIVE</div>` : ''}
            <span class="dpc-ama-viewers"><i class="fas fa-eye" style="font-size:9px"></i> ${_fmtN(a.viewers)} watching</span>
          </div>
          <div class="dpc-ama-title">${_esc(a.title)}</div>
          <div class="dpc-ama-meta">${_esc(a.meta)}</div>
          <button class="dpc-ama-join">Join AMA <i class="fas fa-arrow-right" style="font-size:9px"></i></button>
        </div>
      </div>`;
    },

    'forum-poll': (post) => {
      const pl = post.poll || { opts: [], total: 0, voted: -1 };
      const tot = Math.max(pl.total, 1);
      return `<div class="dpc-body">
        ${post.title ? `<div class="dpc-title">${_esc(post.title)}</div>` : ''}
        ${_textWithMore(post, post.text, 'trunc-3')}
        <div class="dpc-poll">
          <div class="dpc-poll-q">${_esc(pl.q)}</div>
          ${pl.opts.map((o, i) => `
            <div class="dpc-poll-opt${pl.voted === i ? ' voted' : ''}" data-poll-pid="${post.id}" data-oi="${i}">
              <div class="dpc-poll-bar" style="width:${Math.round(o.v / tot * 100)}%"></div>
              <div class="dpc-poll-row"><span class="dpc-poll-txt">${_esc(o.t)}</span><span class="dpc-poll-pct">${Math.round(o.v / tot * 100)}%</span></div>
            </div>`).join('')}
          <div class="dpc-poll-meta"><i class="fas fa-users" style="font-size:8px"></i> ${_fmtN(tot)} votes</div>
        </div>
      </div>`;
    },

    'repost': (post) => `<div class="dpc-body">
      ${post.note ? `<div class="dpc-text" style="font-style:italic;margin-bottom:7px">${_esc(post.note)}</div>` : ''}
      ${_storyChip(post.storyRef)}
    </div>`,
  };

  // ── Generic post renderer ────────────────────────────────────────────
  // Used for: 'post' (plain writer post), 'motivation', and as the fallback
  // for any unregistered type (forum-post, confession, career-post, etc).
  // Every piece is optional and independent — heading only, body only,
  // heading + body, heading + body + photo, body + photo, etc are all valid.
  function _genericPostRenderer(post) {
    const truncClass = post.image ? 'trunc-3' : 'trunc-5';
    return `<div class="dpc-body">
      ${post.title ? `<div class="dpc-title">${_esc(post.title)}</div>` : ''}
      ${_textWithMore(post, post.text, truncClass)}
      ${post.image ? `<img class="dpc-image" src="${post.image}" loading="lazy" data-image-open="1"/>` : ''}
      ${_storyChip(post.storyRef)}
    </div>`;
  }

  TYPE_RENDERERS.post       = _genericPostRenderer;
  TYPE_RENDERERS.motivation = _genericPostRenderer;
  TYPE_RENDERERS.default    = _genericPostRenderer;

  // ══════════════════════════════════════════════════════════════════════
  // Dots menu
  // ══════════════════════════════════════════════════════════════════════
  function _buildDotsMenu(post) {
    const existing = document.getElementById('dpc-dm-' + post.id);
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = 'dpc-dots-menu';
    div.id = 'dpc-dm-' + post.id;
    div.innerHTML = post.mine
      ? `<div class="dpc-dots-item" data-action="edit" data-pid="${post.id}"><i class="fas fa-pen"></i>Edit post</div>
         <div class="dpc-dots-item danger" data-action="delete" data-pid="${post.id}"><i class="fas fa-trash"></i>Delete post</div>`
      : `<div class="dpc-dots-item" data-action="report" data-pid="${post.id}"><i class="fas fa-flag"></i>Report post</div>
         <div class="dpc-dots-item" data-action="less" data-pid="${post.id}"><i class="fas fa-eye-slash"></i>See less of this</div>
         <div class="dpc-dots-sep"></div>
         <div class="dpc-dots-item" data-action="follow" data-pid="${post.id}"><i class="fas fa-user-plus"></i>Follow @${_esc(post.name)}</div>`;
    div.innerHTML += `<div class="dpc-dots-sep"></div>
      <div class="dpc-dots-item" data-action="share" data-pid="${post.id}"><i class="fas fa-share-nodes"></i>Share post</div>
      <div class="dpc-dots-item" data-action="save" data-pid="${post.id}"><i class="far fa-bookmark"></i>Save post</div>`;
    document.body.appendChild(div);
  }

function _positionMenu(post, triggerEl) {
  const menu = document.getElementById('dpc-dm-' + post.id);
  const card = triggerEl.closest('.dpc-card');
  if (!menu || !card) return;

  menu.classList.add('open'); // must be visible before measuring offsetWidth/Height
  document.getElementById('dpcMenuOverlay').classList.add('on');
  _openMenu = post.id;

  const rect = card.getBoundingClientRect();
  const top  = rect.top + rect.height / 2 - menu.offsetHeight / 2;
  const left = rect.left + rect.width / 2 - menu.offsetWidth / 2;

  menu.style.top  = Math.max(8, top) + 'px';
  menu.style.left = Math.max(8, left) + 'px';
}

  function _closeAllMenus() {
    if (_openMenu) {
      const m = document.getElementById('dpc-dm-' + _openMenu);
      if (m) m.classList.remove('open');
      _openMenu = null;
    }
    document.getElementById('dpcMenuOverlay')?.classList.remove('on');
    document.querySelectorAll('.dpc-rx-popup.show').forEach(p => p.classList.remove('show'));
  }

  // ══════════════════════════════════════════════════════════════════════
  // Card render
  // ══════════════════════════════════════════════════════════════════════
  function renderCard(post, index) {
    const renderer = TYPE_RENDERERS[post.type] || TYPE_RENDERERS.default;
    const bodyHtml = renderer(post);

    return `<div class="dpc-card${post.pinned ? ' pinned' : ''}" data-pid="${post.id}" style="animation-delay:${Math.min((index || 0) * .04, .5)}s">
      <div class="dpc-inner">
        ${post.pinned ? `<div class="dpc-pinned-lbl"><i class="fas fa-thumbtack" style="font-size:9px"></i> Pinned</div>` : ''}
        <div class="dpc-header">
          ${_buildAvatar(post)}
          <div class="dpc-meta">
            <div class="dpc-name-row">
              <a class="dpc-name" data-profile-for="${post.id}">${_esc(post.name)}</a>
              ${post.verified ? `<div class="dpc-verified" title="Verified"><i class="fas fa-check"></i></div>` : ''}
              ${_buildBadge(post.badge)}
            </div>
            <div class="dpc-meta-sub">
              ${post.rank ? `<span class="dpc-rank top">${_esc(post.rank)}</span>` : ''}
              <span class="dpc-time">${_esc(post.time)}</span>
            </div>
          </div>
          ${_buildTypePill(post.type)}
        </div>
        ${_buildStatusStrip(post)}
        ${bodyHtml}
        ${_buildFooter(post)}
      </div>
      <div class="dpc-reply-bar" id="dpc-rb-${post.id}">
        <div class="dpc-reply-av">Y</div>
        <input class="dpc-reply-inp" id="dpc-ri-${post.id}" placeholder="Write a reply\u2026"/>
        <button class="dpc-reply-send" id="dpc-rs-${post.id}" disabled data-reply-send="${post.id}"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // Full render pass
  // ══════════════════════════════════════════════════════════════════════
  function setPosts(posts) {
    _posts = posts || [];
    if (!_root) return;
    document.querySelectorAll('.dpc-dots-menu').forEach(m => m.remove());
    _root.innerHTML = _posts.map((p, i) => renderCard(p, i)).join('');
    _posts.forEach(p => _buildDotsMenu(p));
  }

  function updateCard(post) {
    if (!_root) return;
    const idx = _posts.findIndex(p => p.id === post.id);
    if (idx > -1) _posts[idx] = post;
    const el = _root.querySelector(`.dpc-card[data-pid="${post.id}"]`);
    if (!el) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = renderCard(post, idx);
    el.replaceWith(tmp.firstElementChild);
    _buildDotsMenu(post);
  }

  function _findPost(pid) {
    return _posts.find(p => p.id === pid);
  }

  // ══════════════════════════════════════════════════════════════════════
  // Event delegation — bound once on the root container
  // ══════════════════════════════════════════════════════════════════════
  function _bindDelegatedEvents() {
    if (!document.getElementById('dpcMenuOverlay')) {
      const ov = document.createElement('div');
      ov.id = 'dpcMenuOverlay';
      ov.className = 'dpc-menu-overlay';
      ov.addEventListener('click', _closeAllMenus);
      document.body.appendChild(ov);
    }

    _root.addEventListener('click', (e) => {
      const pid = e.target.closest('[data-pid]')?.dataset.pid;

      // avatar / profile
      const avEl = e.target.closest('[data-avatar-for], [data-profile-for]');
      if (avEl) {
        const p = _findPost(avEl.dataset.avatarFor || avEl.dataset.profileFor);
        if (p && typeof _hooks.onAvatarClick === 'function') _hooks.onAvatarClick(p);
        return;
      }

      // like / react (single click, not the react popup itself)
      const likeEl = e.target.closest('.dpc-like');
      if (likeEl && !e.target.closest('.dpc-rx-popup')) {
        const p = _findPost(likeEl.dataset.pid);
        if (p && typeof _hooks.onLike === 'function') _hooks.onLike(p);
        return;
      }

      // reaction popup buttons
      const rxBtn = e.target.closest('.dpc-rx-btn');
      if (rxBtn) {
        const p = _findPost(rxBtn.dataset.rxPid);
        if (p && typeof _hooks.onReact === 'function') _hooks.onReact(p, rxBtn.dataset.rid);
        _closeAllMenus();
        return;
      }

      // comment
      const commentEl = e.target.closest('.dpc-comment');
      if (commentEl) {
        const p = _findPost(commentEl.dataset.pid);
        if (p && typeof _hooks.onComment === 'function') _hooks.onComment(p);
        return;
      }

      // share (footer icon)
      const shareEl = e.target.closest('.dpc-share');
      if (shareEl) {
        const p = _findPost(shareEl.dataset.pid);
        if (p && typeof _hooks.onShare === 'function') _hooks.onShare(p);
        return;
      }

      // dots menu toggle
      const dotsEl = e.target.closest('.dpc-dots');
      if (dotsEl) {
        e.stopPropagation();
        const p = _findPost(dotsEl.dataset.pid);
        if (_openMenu === dotsEl.dataset.pid) { _closeAllMenus(); return; }
        _closeAllMenus();
        if (p) _positionMenu(p, dotsEl);
        return;
      }

      // debate vote
      const debateEl = e.target.closest('[data-debate-pid]');
      if (debateEl) {
        const p = _findPost(debateEl.dataset.debatePid);
        if (p && typeof _hooks.onDebateVote === 'function') _hooks.onDebateVote(p, debateEl.dataset.side);
        return;
      }

      // poll vote
      const pollEl = e.target.closest('[data-poll-pid]');
      if (pollEl) {
        const p = _findPost(pollEl.dataset.pollPid);
        if (p && typeof _hooks.onPollVote === 'function') _hooks.onPollVote(p, parseInt(pollEl.dataset.oi, 10));
        return;
      }

      // reply send
      const sendEl = e.target.closest('[data-reply-send]');
      if (sendEl) {
        const pid = sendEl.dataset.replySend;
        const inp = document.getElementById('dpc-ri-' + pid);
        const p = _findPost(pid);
        if (p && inp && inp.value.trim().length >= 2) {
          if (typeof _hooks.onReplySend === 'function') _hooks.onReplySend(p, inp.value.trim());
          inp.value = '';
          sendEl.disabled = true;
        }
        return;
      }

      // "See more" text expand
      const moreEl = e.target.closest('.dpc-more');
      if (moreEl) {
        const p = _findPost(moreEl.dataset.pid);
        const txtEl = document.getElementById('dpc-txt-' + moreEl.dataset.pid);
        if (p && txtEl) {
          txtEl.classList.remove('trunc-5', 'trunc-3');
          txtEl.innerHTML = _nl(_fmtTx(p.text || p.quote || ''));
          moreEl.className = 'dpc-less';
          moreEl.innerHTML = 'See less <i class="fas fa-chevron-up" style="font-size:8px"></i>';
        }
        return;
      }
      const lessEl = e.target.closest('.dpc-less');
      if (lessEl) {
        const p = _findPost(lessEl.dataset.pid);
        const txtEl = document.getElementById('dpc-txt-' + lessEl.dataset.pid);
        if (p && txtEl) {
          txtEl.classList.add(p.image ? 'trunc-3' : 'trunc-5');
          txtEl.innerHTML = _nl(_fmtTx(p.text || p.quote || ''));
          lessEl.className = 'dpc-more';
          lessEl.innerHTML = 'See more <i class="fas fa-chevron-down" style="font-size:8px"></i>';
        }
        return;
      }
    });

    // Long-press to open reaction popup
    _root.addEventListener('pointerdown', (e) => {
      const likeEl = e.target.closest('.dpc-like');
      if (!likeEl) return;
      likeEl._holdTimer = setTimeout(() => {
        _closeAllMenus();
        document.getElementById('dpc-rx-' + likeEl.dataset.pid)?.classList.add('show');
      }, 550);
    });
    _root.addEventListener('pointerup', (e) => {
      const likeEl = e.target.closest('.dpc-like');
      if (likeEl) clearTimeout(likeEl._holdTimer);
    });
    _root.addEventListener('pointercancel', (e) => {
      const likeEl = e.target.closest('.dpc-like');
      if (likeEl) clearTimeout(likeEl._holdTimer);
    });

    // Reply input enable/disable
    _root.addEventListener('input', (e) => {
      if (e.target.matches('.dpc-reply-inp')) {
        const pid = e.target.id.replace('dpc-ri-', '');
        const send = document.getElementById('dpc-rs-' + pid);
        if (send) send.disabled = e.target.value.trim().length < 2;
      }
    });

    // Dots-menu items (attached to <body>, delegate globally)
    document.addEventListener('click', (e) => {
      const item = e.target.closest('.dpc-dots-item');
      if (item) {
        const action = item.dataset.action; // 'edit'|'delete'|'report'|'less'|'follow'|'share'|'save'
        const p = _findPost(item.dataset.pid);
        _closeAllMenus();
        if (p && typeof _hooks.onDotsAction === 'function') _hooks.onDotsAction(action, p);
        return;
      }
      if (!e.target.closest('.dpc-dots') && !e.target.closest('.dpc-dots-menu')) _closeAllMenus();
      if (!e.target.closest('.dpc-like') && !e.target.closest('.dpc-rx-popup')) {
        document.querySelectorAll('.dpc-rx-popup.show').forEach(p => p.classList.remove('show'));
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════════════
  function attach(rootEl, hooks) {
    if (!document.getElementById('dpc-style')) {
      const style = document.createElement('style');
      style.id = 'dpc-style';
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    _root = rootEl;
    _hooks = hooks || {};
    _bindDelegatedEvents();
  }

  function registerType(name, rendererFn) {
    TYPE_RENDERERS[name] = rendererFn;
  }

  window.DroboardPostCard = {
    attach,
    setPosts,
    update: updateCard,
    render: renderCard,       // renderCard(post, index) -> HTML string, for manual insertion
    registerType,             // add new content types without editing this file
  };

})();