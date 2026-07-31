/**
 * ═══════════════════════════════════════════════════════════════
 *  DroboardComments.js  — v1.0.0
 *  A single self-contained comment component for all Droboard
 *  surfaces: story, debate, and status thread.
 *
 *  Usage:
 *    import { DroboardComments } from './DroboardComments.js';
 *
 *    const comments = new DroboardComments({
 *      container: document.getElementById('comments-root'),
 *      mode: 'story',          // 'story' | 'debate' | 'thread'
 *      config: { ... },        // see CONFIG section below
 *      initialData: [...],     // seed comments array
 *      currentUser: { ... },   // logged-in user
 *      onPost: (comment) => {}, // called after new top-level post
 *    });
 *
 *    comments.mount();
 *    comments.addComment(newComment);   // push from outside
 *    comments.destroy();
 * ═══════════════════════════════════════════════════════════════
 */

/* ──────────────────────────────────────────────
   STYLE INJECTION  (runs once per page)
   All CSS is namespaced under .dbc-root so it
   never bleeds into the host page.
────────────────────────────────────────────── */
const STYLE_ID = 'dbc-styles-v1';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
/* ── RESET / SCOPE ── */
.dbc-root *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.dbc-root{
  --dbc-bg:         #000000;
  --dbc-layer-1:    #08090c;
  --dbc-layer-2:    #0e0f13;
  --dbc-layer-3:    #13141a;
  --dbc-acc:        #ff0050;
  --dbc-acc2:       #ff4d7a;
  --dbc-acc3:       #ff6b8a;
  --dbc-glow:       rgba(255,0,80,.22);
  --dbc-for:        #10b981;
  --dbc-for-dim:    rgba(16,185,129,.12);
  --dbc-ag:         #ff4444;
  --dbc-ag-dim:     rgba(255,68,68,.12);
  --dbc-blue:       #00aaff;
  --dbc-gold:       #f59e0b;
  --dbc-green:      #10b981;
  --dbc-purple:     #a78bfa;
  --dbc-tx:         #f0f0f0;
  --dbc-tx2:        #aaa;
  --dbc-tx3:        #555;
  --dbc-bd:         rgba(255,255,255,.07);
  --dbc-bd2:        rgba(255,255,255,.04);
  --dbc-bd-acc:     rgba(255,0,80,.2);
  --dbc-av:         36px;
  --dbc-av-sm:      26px;
  --dbc-line:       rgba(255,0,80,.18);
  --dbc-font:       'DM Sans', system-ui, sans-serif;
  font-family:      var(--dbc-font);
  color:            var(--dbc-tx);
}

/* ── SORT / FILTER BAR ── */
.dbc-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.dbc-count{font-size:11px;font-weight:700;color:var(--dbc-tx3)}
.dbc-count strong{color:var(--dbc-acc);font-size:13px}
.dbc-sort-row,.dbc-filter-row{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none}
.dbc-sort-row::-webkit-scrollbar,.dbc-filter-row::-webkit-scrollbar{display:none}
.dbc-btn-pill{font-size:9px;font-weight:800;padding:4px 10px;border-radius:20px;cursor:pointer;border:1px solid var(--dbc-bd);color:var(--dbc-tx3);background:transparent;transition:.15s;white-space:nowrap;font-family:var(--dbc-font)}
.dbc-btn-pill.active{background:var(--dbc-acc);color:#fff;border-color:var(--dbc-acc);box-shadow:0 0 8px var(--dbc-glow)}
.dbc-btn-pill.for-f.active{background:var(--dbc-for-dim);color:var(--dbc-for);border-color:var(--dbc-for);box-shadow:none}
.dbc-btn-pill.ag-f.active{background:var(--dbc-ag-dim);color:var(--dbc-ag);border-color:var(--dbc-ag);box-shadow:none}

/* ── COMPOSER ── */
.dbc-composer{background:var(--dbc-layer-1);border:1px solid var(--dbc-bd);border-radius:16px;padding:12px;margin-bottom:16px}
.dbc-composer-top{display:flex;align-items:center;gap:9px;margin-bottom:8px}
.dbc-composer-meta{flex:1;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.dbc-composer-side-tag{font-size:9px;font-weight:800;padding:2px 8px;border-radius:10px}
.dbc-composer-side-tag.for{background:var(--dbc-for-dim);color:var(--dbc-for);border:1px solid var(--dbc-for)}
.dbc-composer-side-tag.against{background:var(--dbc-ag-dim);color:var(--dbc-ag);border:1px solid var(--dbc-ag)}
.dbc-composer-side-tag.team{background:rgba(167,139,250,.15);color:var(--dbc-purple);border:1px solid rgba(167,139,250,.3)}
.dbc-composer-side-tag.none{background:rgba(255,255,255,.05);color:var(--dbc-tx3);border:1px solid var(--dbc-bd)}
.dbc-textarea{width:100%;background:transparent;border:none;color:var(--dbc-tx);font-family:var(--dbc-font);font-size:13px;outline:none;resize:none;line-height:1.5;min-height:56px}
.dbc-textarea::placeholder{color:#444}
.dbc-composer-footer{display:flex;align-items:center;justify-content:space-between;margin-top:7px;padding-top:7px;border-top:1px solid var(--dbc-bd2)}
.dbc-chars{font-size:10px;color:var(--dbc-tx3)}
.dbc-post-btn{background:var(--dbc-acc);color:#fff;border:none;padding:6px 16px;border-radius:20px;font-size:11px;font-weight:800;cursor:pointer;font-family:var(--dbc-font);box-shadow:0 0 10px var(--dbc-glow);transition:.15s}
.dbc-post-btn:disabled{background:#222;color:#555;box-shadow:none;cursor:default}

/* ── COMMENT LIST ── */
.dbc-list{display:flex;flex-direction:column;gap:0}
.dbc-item{padding:12px 0;border-bottom:1px solid var(--dbc-bd2);animation:dbcFadeIn .22s ease}
.dbc-item:last-child{border-bottom:none}
@keyframes dbcFadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}

/* ── COMMENT ROW ── */
.dbc-row{display:flex;gap:9px}
.dbc-av-wrap{flex-shrink:0;cursor:pointer}

/* Avatar ring states */
.dbc-ring{border-radius:50%;padding:2px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.dbc-ring.none{background:var(--dbc-acc)}
.dbc-ring.new{background:conic-gradient(#00aaff,#0066ff,#00eeff,#00aaff);animation:dbcSpin 3s linear infinite;cursor:pointer}
.dbc-ring.viewed{background:#3a3a55}
@keyframes dbcSpin{to{transform:rotate(360deg)}}
.dbc-ring-inner{width:100%;height:100%;border-radius:50%;overflow:hidden;background:#111;display:flex;align-items:center;justify-content:center}
.dbc-ring-inner img{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block}
.dbc-av-init{background:rgba(255,0,80,.18);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--dbc-acc3);flex-shrink:0}

/* ── BODY ── */
.dbc-body{flex:1;min-width:0}
.dbc-bubble{background:var(--dbc-layer-1);border:1px solid var(--dbc-bd);border-radius:0 14px 14px 14px;padding:9px 11px;transition:border-color .15s}
.dbc-bubble.writer{background:rgba(255,0,80,.04);border-color:var(--dbc-bd-acc)}
.dbc-bubble.pinned{background:rgba(245,158,11,.04);border-color:rgba(245,158,11,.22)}
.dbc-bubble.team-bubble{background:rgba(167,139,250,.04);border-color:rgba(167,139,250,.2)}

/* ── NAME ROW / BADGES ── */
.dbc-name-row{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:3px}
.dbc-name{font-size:12px;font-weight:700;color:var(--dbc-tx);cursor:pointer;transition:.12s}
.dbc-name:hover{color:var(--dbc-acc2)}

/* Badge base */
.dbc-badge{display:inline-flex;align-items:center;gap:2px;font-size:8px;font-weight:800;padding:1px 5px;border-radius:6px;letter-spacing:.03em;line-height:1.4;flex-shrink:0}

/* Verified — icon only, gold checkmark */
.dbc-badge.verified{background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);color:var(--dbc-gold)}
/* Writer */
.dbc-badge.writer{background:rgba(255,0,80,.12);border:1px solid rgba(255,0,80,.25);color:var(--dbc-acc3)}
/* Top comment (thread mode) */
.dbc-badge.top{background:rgba(0,170,255,.1);border:1px solid rgba(0,170,255,.25);color:var(--dbc-blue)}
/* Pinned */
.dbc-badge.pinned{background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.28);color:var(--dbc-gold)}
/* FOR side */
.dbc-badge.for{background:var(--dbc-for-dim);border:1px solid var(--dbc-for);color:var(--dbc-for)}
/* AGAINST side */
.dbc-badge.against{background:var(--dbc-ag-dim);border:1px solid var(--dbc-ag);color:var(--dbc-ag)}
/* Team badge — purple tint, team name */
.dbc-badge.team{background:rgba(167,139,250,.12);border:1px solid rgba(167,139,250,.3);color:var(--dbc-purple)}
/* Mod */
.dbc-badge.mod{background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.28);color:var(--dbc-green)}

.dbc-time{font-size:9px;color:var(--dbc-tx3)}

/* ── TEXT ── */
.dbc-text{font-size:13px;color:#ddd;line-height:1.55;word-break:break-word}
.dbc-mention{color:var(--dbc-acc2);font-weight:700}

/* ── STORY REF inside comment ── */
.dbc-story-ref{display:flex;align-items:center;gap:8px;background:var(--dbc-layer-2);border:1px solid var(--dbc-bd2);border-radius:9px;padding:7px 9px;margin-top:7px;cursor:pointer;transition:border-color .15s}
.dbc-story-ref:active{border-color:var(--dbc-bd-acc)}
.dbc-story-ref-img{width:34px;height:38px;border-radius:6px;background-size:cover;background-position:center;flex-shrink:0}
.dbc-story-ref-title{font-size:10px;font-weight:700;color:var(--dbc-tx);line-height:1.3;flex:1;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dbc-story-ref-cta{font-size:9px;font-weight:700;color:var(--dbc-acc);white-space:nowrap}

/* ── META ROW ── */
.dbc-meta{display:flex;align-items:center;gap:2px;margin-top:6px;flex-wrap:wrap}

/* Action buttons */
.dbc-act{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:600;color:var(--dbc-tx3);cursor:pointer;padding:3px 7px;border-radius:8px;transition:.12s;user-select:none;border:none;background:transparent;font-family:var(--dbc-font)}
.dbc-act:active{background:rgba(255,255,255,.05)}
.dbc-act svg,.dbc-act i{font-size:12px}
.dbc-act.liked{color:var(--dbc-acc)}
.dbc-act.liked i{color:var(--dbc-acc)}
.dbc-act.voted-up{color:var(--dbc-for)}
.dbc-act.voted-up i{color:var(--dbc-for)}
.dbc-act.voted-down{color:var(--dbc-ag)}
.dbc-act.voted-down i{color:var(--dbc-ag)}
.dbc-sep{width:1px;height:12px;background:var(--dbc-bd2);margin:0 2px;display:inline-block;vertical-align:middle}
.dbc-reply-btn{font-size:11px;font-weight:700;color:var(--dbc-acc2);cursor:pointer;padding:3px 7px;border-radius:8px;transition:.12s;user-select:none}
.dbc-reply-btn:active{background:rgba(255,0,80,.08)}
.dbc-show-replies-btn{font-size:10px;color:var(--dbc-tx3);cursor:pointer;padding:3px 7px;border-radius:8px;display:inline-flex;align-items:center;gap:3px;transition:.12s}
.dbc-show-replies-btn:active{color:var(--dbc-acc2)}

/* ── REPLIES BLOCK ── */
.dbc-replies{margin-left:20px;border-left:2px solid var(--dbc-line);padding-left:10px;margin-top:7px;display:none}
.dbc-replies.open{display:block}
.dbc-reply-item{padding:8px 0;border-bottom:1px solid rgba(255,255,255,.03)}
.dbc-reply-item:last-child{border-bottom:none}

/* ── REPLY INPUT ── */
.dbc-reply-inp-wrap{margin-left:20px;border-left:2px solid rgba(255,0,80,.1);padding-left:10px;margin-top:6px;display:none;gap:7px;align-items:center}
.dbc-reply-inp-wrap.open{display:flex}
.dbc-inp-av-sm{width:var(--dbc-av-sm);height:var(--dbc-av-sm);border-radius:50%;background:var(--dbc-acc);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;flex-shrink:0}
.dbc-reply-inp{flex:1;background:rgba(255,255,255,.06);border:1px solid var(--dbc-bd);border-radius:16px;padding:6px 11px;color:var(--dbc-tx);font-family:var(--dbc-font);font-size:11px;outline:none;transition:border-color .15s}
.dbc-reply-inp::placeholder{color:#555}
.dbc-reply-inp:focus{border-color:var(--dbc-bd-acc)}
.dbc-reply-send{background:var(--dbc-acc);border:none;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:11px;color:#fff;flex-shrink:0;transition:.15s}
.dbc-reply-send:disabled{background:#222;cursor:default}
.dbc-reply-send:not(:disabled):active{transform:scale(.9)}

/* ── TEAM JOIN PROMPT (story mode) ── */
.dbc-team-prompt{background:var(--dbc-layer-1);border:1px solid rgba(167,139,250,.2);border-radius:14px;padding:13px;margin-bottom:14px;text-align:center}
.dbc-team-prompt p{font-size:11px;color:var(--dbc-tx2);margin-bottom:10px;line-height:1.45}
.dbc-team-btns{display:flex;gap:7px;justify-content:center;flex-wrap:wrap}
.dbc-team-btn{padding:7px 16px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;border:1px solid var(--dbc-bd);color:var(--dbc-tx2);background:rgba(255,255,255,.04);transition:.18s;font-family:var(--dbc-font)}
.dbc-team-btn:active{transform:scale(.96)}
.dbc-team-btn.chosen{background:rgba(167,139,250,.15);border-color:rgba(167,139,250,.4);color:var(--dbc-purple);box-shadow:0 0 10px rgba(167,139,250,.15)}

/* ── LOAD MORE ── */
.dbc-load-more{width:100%;padding:10px;border-radius:12px;background:var(--dbc-layer-1);border:1px solid var(--dbc-bd);color:var(--dbc-tx2);font-size:11px;font-weight:700;cursor:pointer;font-family:var(--dbc-font);margin-top:8px;transition:.15s;display:flex;align-items:center;justify-content:center;gap:7px}
.dbc-load-more:active{background:var(--dbc-layer-2);border-color:var(--dbc-bd-acc)}
.dbc-load-more:disabled{opacity:.4;cursor:default}
@keyframes dbcRotate{to{transform:rotate(360deg)}}
.dbc-spin{display:inline-block;animation:dbcRotate .7s linear infinite}

/* ── EMPTY STATE ── */
.dbc-empty{text-align:center;padding:32px 16px;color:var(--dbc-tx3)}
.dbc-empty .icon{font-size:34px;margin-bottom:8px}
.dbc-empty h4{font-size:14px;font-weight:700;color:var(--dbc-tx2);margin-bottom:4px;font-family:'Playfair Display',serif}
.dbc-empty p{font-size:11px;line-height:1.5;max-width:200px;margin:0 auto}
  `;
  document.head.appendChild(style);
}


/* ──────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────── */
let _uid = 1;
function uid() { return 'dbc_' + Date.now() + '_' + (_uid++); }

function fmtN(n) {
  if (n === undefined || n === null) return '0';
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
}

function fmtText(text) {
  return (text || '').replace(/(@[\w_]+)/g, '<span class="dbc-mention">$1</span>');
}

function escape(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* Deep search a flat-structure array by id */
function findById(arr, id) {
  for (const item of arr) {
    if (item.id === id) return item;
    if (item.replies && item.replies.length) {
      const found = findById(item.replies, id);
      if (found) return found;
    }
  }
  return null;
}

/* Flatten all nested replies into a single array (for 1-level display) */
function flattenReplies(replies) {
  const out = [];
  function walk(arr) {
    arr.forEach(r => { out.push(r); if (r.replies && r.replies.length) walk(r.replies); });
  }
  walk(replies || []);
  return out;
}


/* ──────────────────────────────────────────────
   AVATAR / RING BUILDER
   ring: 'none' | 'new' | 'viewed'
────────────────────────────────────────────── */
function buildAvatar(opts = {}) {
  const {
    src,            // image url or null
    initials = '?', // fallback initials
    size = 36,
    ring = 'none',  // 'none' | 'new' | 'viewed'
    clickable = false,
    statusWid = null,
  } = opts;

  const outer = document.createElement('div');
  outer.className = `dbc-ring ${ring}`;
  outer.style.cssText = `width:${size + 4}px;height:${size + 4}px`;
  if (clickable && statusWid) {
    outer.style.cursor = 'pointer';
    outer.dataset.statusWid = statusWid;
    outer.classList.add('dbc-status-trigger');
  }

  const inner = document.createElement('div');
  inner.className = 'dbc-ring-inner';
  inner.style.cssText = `width:${size}px;height:${size}px`;

  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = initials;
    img.loading = 'lazy';
    inner.appendChild(img);
  } else {
    const init = document.createElement('div');
    init.className = 'dbc-av-init';
    init.style.cssText = `width:${size}px;height:${size}px;font-size:${Math.round(size * 0.34)}px`;
    init.textContent = (initials || '?')[0].toUpperCase();
    inner.appendChild(init);
  }

  outer.appendChild(inner);
  return outer;
}


/* ──────────────────────────────────────────────
   BADGE BUILDER
   type: 'verified' | 'writer' | 'top' | 'pinned' |
         'for' | 'against' | 'team' | 'mod'
────────────────────────────────────────────── */
const BADGE_ICONS = {
  verified: '✓',       // gold checkmark — icon only
  writer:   '✍️',
  top:      '🔥',
  pinned:   '📌',
  for:      '✅ FOR',
  against:  '❌ AG',
  mod:      '🛡️ Mod',
};

function buildBadge(type, label) {
  const span = document.createElement('span');
  span.className = `dbc-badge ${type}`;
  const icon = BADGE_ICONS[type];

  if (type === 'verified') {
    // Icon only — no text
    span.title = 'Verified';
    span.textContent = '✓';
    return span;
  }
  if (type === 'team') {
    span.textContent = label || 'Team'; // e.g. "Team Ada"
    return span;
  }
  span.textContent = icon || label || type;
  return span;
}


/* ──────────────────────────────────────────────
   MAIN CLASS
────────────────────────────────────────────── */
export class DroboardComments {
  /**
   * @param {Object} options
   * @param {HTMLElement}   options.container     - Mount target
   * @param {'story'|'debate'|'thread'} options.mode
   * @param {Object}        [options.config]      - Feature flags (see defaults)
   * @param {Array}         [options.initialData] - Seed comments
   * @param {Object}        [options.currentUser] - { name, avatar, verified, team, isMod }
   * @param {Function}      [options.onPost]      - Called with new top-level comment
   * @param {Function}      [options.onReply]     - Called with { parentId, reply }
   * @param {Function}      [options.onVote]      - Called with { id, vote: 'up'|'down'|'like'|null }
   * @param {Function}      [options.onTeamJoin]  - Called with teamName (story mode)
   * @param {Function}      [options.onLoadMore]  - Called to fetch more; return Promise<Array>
   */
  constructor(options) {
    this.container  = options.container;
    this.mode       = options.mode || 'story';  // 'story' | 'debate' | 'thread'
    this.onPost     = options.onPost     || null;
    this.onReply    = options.onReply    || null;
    this.onVote     = options.onVote     || null;
    this.onTeamJoin = options.onTeamJoin || null;
    this.onLoadMore = options.onLoadMore || null;

    /* ── DEFAULT CONFIGS per mode ── */
    const modeDefaults = {
      story: {
        voteMode:      'like',    // 'like' | 'updown'
        teamMode:      false,     // show team join prompt & badges
        teams:         [],        // ['Team Ada', 'Team Emeka']
        maxDepth:      2,         // how many nesting levels to show
        showSideBadge: false,     // FOR/AGAINST badge
        showWriterBadge: true,
        showVerifiedBadge: true,
        showTopBadge:  false,
        showPinnedBadge: true,
        showModBadge:  true,
        sortOptions:   ['Top', 'New', 'Writers First'],
        filterOptions: [],        // no side filters in story
        composerPlaceholder: 'Add a comment…',
        maxLength:     500,
        loadMoreLabel: 'Load more comments',
      },
      debate: {
        voteMode:      'updown',
        teamMode:      false,
        teams:         [],
        maxDepth:      2,
        showSideBadge: true,
        showWriterBadge: true,
        showVerifiedBadge: true,
        showTopBadge:  false,
        showPinnedBadge: true,
        showModBadge:  true,
        sortOptions:   ['Top', 'New', 'Hot 🔥'],
        filterOptions: ['All', 'FOR', 'AGAINST'],
        composerPlaceholder: 'Make your case…',
        maxLength:     500,
        loadMoreLabel: 'Load more arguments',
      },
      thread: {
        voteMode:      'like',
        teamMode:      false,
        teams:         [],
        maxDepth:      1,         // flat threading
        showSideBadge: false,
        showWriterBadge: true,    // show ✍️ Writer badge in thread
        showVerifiedBadge: true,
        showTopBadge:  true,      // show 🔥 Top badge in thread
        showPinnedBadge: true,
        showModBadge:  true,
        sortOptions:   ['Top', 'Newest', 'Writer'],
        filterOptions: [],
        composerPlaceholder: 'Reply to this status…',
        maxLength:     300,
        loadMoreLabel: 'Load more replies',
      },
    };

    this.cfg = Object.assign({}, modeDefaults[this.mode], options.config || {});

    /* Current user */
    this.user = Object.assign({
      name: 'You',
      avatar: null,
      verified: false,
      isMod: false,
      team: null,       // active team (story mode)
      side: null,       // active side (debate mode): 'for'|'against'
    }, options.currentUser || {});

    /* Internal state */
    this._data         = JSON.parse(JSON.stringify(options.initialData || []));
    this._filter       = 'All';
    this._sort         = this.cfg.sortOptions[0];
    this._loadingMore  = false;
    this._allLoaded    = false;

    /* DOM root */
    this._root = null;
  }

  /* ── PUBLIC: mount ── */
  mount() {
    injectStyles();

    this._root = document.createElement('div');
    this._root.className = 'dbc-root';
    this.container.appendChild(this._root);

    this._render();
  }

  /* ── PUBLIC: destroy ── */
  destroy() {
    if (this._root) {
      this._root.remove();
      this._root = null;
    }
  }

  /* ── PUBLIC: add a comment from outside ── */
  addComment(comment) {
    this._data.unshift(comment);
    this._renderList();
    this._updateCount();
  }

  /* ── PUBLIC: update current user (e.g. after team join or vote cast) ── */
  updateUser(patch) {
    Object.assign(this.user, patch);
    this._renderComposer();
  }

  /* ── FULL RENDER ── */
  _render() {
    this._root.innerHTML = '';

    /* Team join prompt (story mode) */
    if (this.mode === 'story' && this.cfg.teamMode && !this.user.team) {
      this._root.appendChild(this._buildTeamPrompt());
    }

    /* Toolbar (sort + filter + count) */
    this._root.appendChild(this._buildToolbar());

    /* Composer */
    this._composerEl = this._buildComposer();
    this._root.appendChild(this._composerEl);

    /* List container */
    this._listEl = document.createElement('div');
    this._listEl.className = 'dbc-list';
    this._root.appendChild(this._listEl);
    this._renderList();

    /* Load more */
    this._loadMoreBtn = document.createElement('button');
    this._loadMoreBtn.className = 'dbc-load-more';
    this._loadMoreBtn.innerHTML = `<i class="fas fa-chevron-down"></i> ${this.cfg.loadMoreLabel}`;
    this._loadMoreBtn.addEventListener('click', () => this._handleLoadMore());
    this._root.appendChild(this._loadMoreBtn);
    if (this._allLoaded) this._loadMoreBtn.disabled = true;
  }

  /* ── TOOLBAR ── */
  _buildToolbar() {
    const bar = document.createElement('div');
    bar.className = 'dbc-toolbar';

    /* Count */
    const count = document.createElement('div');
    count.className = 'dbc-count';
    count.innerHTML = `<strong id="dbc-count-val-${this._id()}">${this._visibleCount()}</strong> ${this.mode === 'debate' ? 'arguments' : this.mode === 'thread' ? 'replies' : 'comments'}`;
    bar.appendChild(count);
    this._countEl = count.querySelector(`#dbc-count-val-${this._lastId}`);

    const right = document.createElement('div');
    right.style.cssText = 'display:flex;flex-direction:column;gap:5px;align-items:flex-end';

    /* Sort pills */
    const sortRow = document.createElement('div');
    sortRow.className = 'dbc-sort-row';
    this.cfg.sortOptions.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'dbc-btn-pill' + (s === this._sort ? ' active' : '');
      btn.textContent = s;
      btn.addEventListener('click', () => {
        this._sort = s;
        sortRow.querySelectorAll('.dbc-btn-pill').forEach(b => b.classList.toggle('active', b === btn));
        this._renderList();
      });
      sortRow.appendChild(btn);
    });
    right.appendChild(sortRow);

    /* Filter pills (debate mode) */
    if (this.cfg.filterOptions && this.cfg.filterOptions.length) {
      const filterRow = document.createElement('div');
      filterRow.className = 'dbc-filter-row';
      this.cfg.filterOptions.forEach(f => {
        const btn = document.createElement('button');
        const cls = f === 'FOR' ? 'for-f' : f === 'AGAINST' ? 'ag-f' : '';
        btn.className = `dbc-btn-pill ${cls}` + (f === this._filter ? ' active' : '');
        btn.textContent = f === 'FOR' ? '✅ FOR' : f === 'AGAINST' ? '❌ AGAINST' : '🔥 All';
        btn.addEventListener('click', () => {
          this._filter = f;
          filterRow.querySelectorAll('.dbc-btn-pill').forEach(b => b.classList.toggle('active', b === btn));
          this._renderList();
          this._updateCount();
        });
        filterRow.appendChild(btn);
      });
      right.appendChild(filterRow);
    }

    bar.appendChild(right);
    return bar;
  }

  /* ── COMPOSER ── */
  _buildComposer() {
    const box = document.createElement('div');
    box.className = 'dbc-composer';

    const top = document.createElement('div');
    top.className = 'dbc-composer-top';

    /* My avatar */
    const av = buildAvatar({
      src: this.user.avatar,
      initials: this.user.name,
      size: 30,
      ring: 'none',
    });
    top.appendChild(av);

    const meta = document.createElement('div');
    meta.className = 'dbc-composer-meta';

    /* Side / team tag for composer */
    const sideTag = document.createElement('span');
    if (this.mode === 'debate') {
      if (this.user.side) {
        sideTag.className = `dbc-composer-side-tag ${this.user.side}`;
        sideTag.textContent = this.user.side === 'for' ? '✅ FOR' : '❌ AGAINST';
      } else {
        sideTag.className = 'dbc-composer-side-tag none';
        sideTag.textContent = 'Pick a side first';
      }
    } else if (this.mode === 'story' && this.cfg.teamMode && this.user.team) {
      sideTag.className = 'dbc-composer-side-tag team';
      sideTag.textContent = this.user.team;
    }
    meta.appendChild(sideTag);
    top.appendChild(meta);
    box.appendChild(top);

    /* Textarea */
    const ta = document.createElement('textarea');
    ta.className = 'dbc-textarea';
    ta.placeholder = this.cfg.composerPlaceholder;
    ta.maxLength = this.cfg.maxLength;
    ta.rows = 2;
    box.appendChild(ta);

    /* Footer */
    const footer = document.createElement('div');
    footer.className = 'dbc-composer-footer';

    const chars = document.createElement('span');
    chars.className = 'dbc-chars';
    chars.textContent = `0 / ${this.cfg.maxLength}`;

    const postBtn = document.createElement('button');
    postBtn.className = 'dbc-post-btn';
    postBtn.textContent = this.mode === 'debate' ? 'Post Argument' : this.mode === 'thread' ? 'Reply' : 'Comment';
    postBtn.disabled = true;

    ta.addEventListener('input', () => {
      chars.textContent = `${ta.value.length} / ${this.cfg.maxLength}`;
      postBtn.disabled = ta.value.trim().length < 2;
    });

    postBtn.addEventListener('click', () => {
      const text = ta.value.trim();
      if (text.length < 2) return;
      const comment = this._makeComment(text);
      this._data.unshift(comment);
      ta.value = '';
      chars.textContent = `0 / ${this.cfg.maxLength}`;
      postBtn.disabled = true;
      this._renderList();
      this._updateCount();
      if (this.onPost) this.onPost(comment);
      /* Scroll to new comment */
      setTimeout(() => {
        const el = this._listEl.querySelector(`[data-id="${comment.id}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    });

    footer.appendChild(chars);
    footer.appendChild(postBtn);
    box.appendChild(footer);

    return box;
  }

  _renderComposer() {
    if (!this._composerEl || !this._root) return;
    const newComposer = this._buildComposer();
    this._root.replaceChild(newComposer, this._composerEl);
    this._composerEl = newComposer;
  }

  /* ── TEAM PROMPT ── */
  _buildTeamPrompt() {
    const wrap = document.createElement('div');
    wrap.className = 'dbc-team-prompt';

    const p = document.createElement('p');
    p.textContent = 'Join a team to comment with your badge showing.';
    wrap.appendChild(p);

    const btns = document.createElement('div');
    btns.className = 'dbc-team-btns';

    (this.cfg.teams || []).forEach(team => {
      const btn = document.createElement('button');
      btn.className = 'dbc-team-btn' + (this.user.team === team ? ' chosen' : '');
      btn.textContent = team;
      btn.addEventListener('click', () => {
        this.user.team = team;
        btns.querySelectorAll('.dbc-team-btn').forEach(b => b.classList.toggle('chosen', b === btn));
        this._renderComposer();
        if (this.onTeamJoin) this.onTeamJoin(team);
        /* Re-render list to show team badges */
        this._renderList();
      });
      btns.appendChild(btn);
    });

    wrap.appendChild(btns);
    return wrap;
  }

  /* ── LIST RENDER ── */
  _renderList() {
    if (!this._listEl) return;
    const visible = this._getVisible();

    if (!visible.length) {
      this._listEl.innerHTML = `<div class="dbc-empty">
        <div class="icon">💬</div>
        <h4>No ${this.mode === 'debate' ? 'arguments' : 'comments'} yet</h4>
        <p>Be the first to ${this.mode === 'debate' ? 'make your case' : 'say something'}!</p>
      </div>`;
      return;
    }

    this._listEl.innerHTML = '';
    visible.forEach(comment => {
      this._listEl.appendChild(this._buildCommentItem(comment, 0));
    });

    this._attachListEvents();
  }

  /* ── BUILD ONE COMMENT ITEM (root level) ── */
  _buildCommentItem(cm, depth) {
    const item = document.createElement('div');
    item.className = 'dbc-item';
    item.dataset.id = cm.id;

    /* Main row */
    item.appendChild(this._buildCommentRow(cm, depth));

    /* Replies block */
    const flat = flattenReplies(cm.replies || []);
    if (flat.length > 0) {
      const repliesBlock = document.createElement('div');
      repliesBlock.className = 'dbc-replies';
      repliesBlock.id = `dbc-rep-${cm.id}`;

      flat.forEach(r => {
        const ri = document.createElement('div');
        ri.className = 'dbc-reply-item';
        ri.dataset.id = r.id;
        ri.appendChild(this._buildCommentRow(r, 1));
        repliesBlock.appendChild(ri);
      });

      item.appendChild(repliesBlock);
    } else {
      /* Empty replies block so reply inputs can open it */
      const emptyBlock = document.createElement('div');
      emptyBlock.className = 'dbc-replies';
      emptyBlock.id = `dbc-rep-${cm.id}`;
      item.appendChild(emptyBlock);
    }

    /* Reply input wrap */
    const riWrap = document.createElement('div');
    riWrap.className = 'dbc-reply-inp-wrap';
    riWrap.id = `dbc-ria-${cm.id}`;

    const riAv = document.createElement('div');
    riAv.className = 'dbc-inp-av-sm';
    riAv.textContent = (this.user.name || 'Y')[0].toUpperCase();

    const riInp = document.createElement('input');
    riInp.className = 'dbc-reply-inp';
    riInp.id = `dbc-ri-${cm.id}`;
    riInp.placeholder = `Reply to @${cm.name}…`;

    const riSend = document.createElement('button');
    riSend.className = 'dbc-reply-send';
    riSend.disabled = true;
    riSend.innerHTML = '<i class="fas fa-paper-plane"></i>';

    riInp.addEventListener('input', () => {
      riSend.disabled = riInp.value.trim().length < 1;
    });
    riSend.addEventListener('click', () => {
      const text = riInp.value.trim();
      if (!text) return;
      const reply = this._makeComment(`@${cm.name} ${text}`, cm.id);
      const parent = findById(this._data, cm.id);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(reply);
      }
      riInp.value = '';
      riSend.disabled = true;
      riWrap.classList.remove('open');
      this._renderList();
      this._updateCount();
      if (this.onReply) this.onReply({ parentId: cm.id, reply });
      setTimeout(() => {
        const rb = document.getElementById(`dbc-rep-${cm.id}`);
        if (rb) rb.classList.add('open');
      }, 60);
    });

    riWrap.appendChild(riAv);
    riWrap.appendChild(riInp);
    riWrap.appendChild(riSend);
    item.appendChild(riWrap);

    return item;
  }

  /* ── BUILD ONE COMMENT ROW (used for root + replies) ── */
  _buildCommentRow(cm, depth) {
    const isReply = depth > 0;
    const avSize  = isReply ? 26 : 32;

    const row = document.createElement('div');
    row.className = 'dbc-row';

    /* Avatar */
    const avWrap = document.createElement('div');
    avWrap.className = 'dbc-av-wrap';
    const ring = cm.statusRing || 'none';
    const av = buildAvatar({
      src: cm.avatar || null,
      initials: cm.name || '?',
      size: avSize,
      ring,
      clickable: ring === 'new' || ring === 'viewed',
      statusWid: cm.statusWid || null,
    });
    avWrap.appendChild(av);
    row.appendChild(avWrap);

    /* Body */
    const body = document.createElement('div');
    body.className = 'dbc-body';

    /* Bubble */
    const bubbleCls = [
      'dbc-bubble',
      cm.isWriter ? 'writer' : '',
      cm.pinned   ? 'pinned' : '',
      cm.team     ? 'team-bubble' : '',
    ].filter(Boolean).join(' ');

    const bubble = document.createElement('div');
    bubble.className = bubbleCls;

    /* Name row */
    const nameRow = document.createElement('div');
    nameRow.className = 'dbc-name-row';

    const nameEl = document.createElement('span');
    nameEl.className = 'dbc-name';
    nameEl.textContent = '@' + (cm.name || 'Unknown');
    nameEl.addEventListener('click', () => {
      if (cm.onProfileClick) cm.onProfileClick(cm);
    });
    nameRow.appendChild(nameEl);

    /* Badges — order: verified → writer → mod → top → pinned → side → team */
    if (cm.verified    && this.cfg.showVerifiedBadge) nameRow.appendChild(buildBadge('verified'));
    if (cm.isWriter    && this.cfg.showWriterBadge)   nameRow.appendChild(buildBadge('writer'));
    if (cm.isMod       && this.cfg.showModBadge)      nameRow.appendChild(buildBadge('mod'));
    if (cm.isTop       && this.cfg.showTopBadge)      nameRow.appendChild(buildBadge('top'));
    if (cm.pinned      && this.cfg.showPinnedBadge)   nameRow.appendChild(buildBadge('pinned'));
    if (cm.side        && this.cfg.showSideBadge)     nameRow.appendChild(buildBadge(cm.side));
    if (cm.team        && this.cfg.teamMode)          nameRow.appendChild(buildBadge('team', cm.team));

    const timeEl = document.createElement('span');
    timeEl.className = 'dbc-time';
    timeEl.textContent = cm.time || '';
    nameRow.appendChild(timeEl);

    bubble.appendChild(nameRow);

    /* Text */
    const textEl = document.createElement('div');
    textEl.className = 'dbc-text';
    textEl.innerHTML = fmtText(escape(cm.text || ''));
    bubble.appendChild(textEl);

    /* Story ref (optional, story mode) */
    if (cm.storyRef) {
      const ref = document.createElement('div');
      ref.className = 'dbc-story-ref';
      ref.innerHTML = `<div class="dbc-story-ref-img" style="background-image:url('${escape(cm.storyRef.cover)}')"></div>
        <div class="dbc-story-ref-title">${escape(cm.storyRef.title)}</div>
        <div class="dbc-story-ref-cta">Read →</div>`;
      ref.addEventListener('click', () => { if (cm.storyRef.onClick) cm.storyRef.onClick(); });
      bubble.appendChild(ref);
    }

    body.appendChild(bubble);

    /* Meta row */
    const meta = document.createElement('div');
    meta.className = 'dbc-meta';

    if (this.cfg.voteMode === 'updown') {
      /* Upvote */
      const upBtn = document.createElement('button');
      upBtn.className = `dbc-act${cm.uv === 'up' ? ' voted-up' : ''}`;
      upBtn.dataset.action = 'upvote';
      upBtn.dataset.cid = cm.id;
      upBtn.innerHTML = `<i class="${cm.uv === 'up' ? 'fas' : 'far'} fa-thumbs-up"></i> <span>${fmtN(cm.upvotes || 0)}</span>`;
      meta.appendChild(upBtn);

      const sep1 = document.createElement('span');
      sep1.className = 'dbc-sep';
      meta.appendChild(sep1);

      /* Downvote */
      const downBtn = document.createElement('button');
      downBtn.className = `dbc-act${cm.uv === 'down' ? ' voted-down' : ''}`;
      downBtn.dataset.action = 'downvote';
      downBtn.dataset.cid = cm.id;
      downBtn.innerHTML = `<i class="${cm.uv === 'down' ? 'fas' : 'far'} fa-thumbs-down"></i> <span>${fmtN(cm.downvotes || 0)}</span>`;
      meta.appendChild(downBtn);

    } else {
      /* Like */
      const likeBtn = document.createElement('button');
      likeBtn.className = `dbc-act${cm.liked ? ' liked' : ''}`;
      likeBtn.dataset.action = 'like';
      likeBtn.dataset.cid = cm.id;
      likeBtn.innerHTML = `<i class="${cm.liked ? 'fas' : 'far'} fa-heart"></i> <span>${fmtN(cm.likes || 0)}</span>`;
      meta.appendChild(likeBtn);
    }

    const sep2 = document.createElement('span');
    sep2.className = 'dbc-sep';
    meta.appendChild(sep2);

    /* Show replies button (only on root, if has replies) */
    if (!isReply) {
      const flat = flattenReplies(cm.replies || []);
      if (flat.length > 0) {
        const showRep = document.createElement('span');
        showRep.className = 'dbc-show-replies-btn';
        showRep.dataset.action = 'toggle-replies';
        showRep.dataset.cid = cm.id;
        showRep.innerHTML = `<i class="far fa-comment-dots"></i> ${flat.length} ${flat.length === 1 ? 'reply' : 'replies'}`;
        meta.appendChild(showRep);

        const sep3 = document.createElement('span');
        sep3.className = 'dbc-sep';
        meta.appendChild(sep3);
      }
    }

    /* Reply button */
    const replyBtn = document.createElement('span');
    replyBtn.className = 'dbc-reply-btn';
    replyBtn.dataset.action = 'reply';
    replyBtn.dataset.cid = isReply ? (cm.parentId || cm.id) : cm.id;
    replyBtn.dataset.name = cm.name;
    replyBtn.textContent = 'Reply';
    meta.appendChild(replyBtn);

    body.appendChild(meta);
    row.appendChild(body);
    return row;
  }

  /* ── ATTACH EVENTS (event delegation on list) ── */
  _attachListEvents() {
    /* Remove previous listener if re-rendering */
    if (this._listEl._handler) {
      this._listEl.removeEventListener('click', this._listEl._handler);
    }
    this._listEl._handler = (e) => {
      const target = e.target;

      /* Like */
      const likeBtn = target.closest('[data-action="like"]');
      if (likeBtn) {
        e.stopPropagation();
        const item = findById(this._data, likeBtn.dataset.cid);
        if (!item) return;
        item.liked = !item.liked;
        item.likes = (item.likes || 0) + (item.liked ? 1 : -1);
        likeBtn.className = `dbc-act${item.liked ? ' liked' : ''}`;
        likeBtn.querySelector('i').className = item.liked ? 'fas fa-heart' : 'far fa-heart';
        likeBtn.querySelector('span').textContent = fmtN(item.likes);
        if (this.onVote) this.onVote({ id: item.id, vote: item.liked ? 'like' : null });
        return;
      }

      /* Upvote */
      const upBtn = target.closest('[data-action="upvote"]');
      if (upBtn) {
        e.stopPropagation();
        const item = findById(this._data, upBtn.dataset.cid);
        if (!item) return;
        if (item.uv === 'up') { item.uv = null; item.upvotes--; }
        else { if (item.uv === 'down') item.downvotes--; item.uv = 'up'; item.upvotes = (item.upvotes || 0) + 1; }
        this._renderList();
        if (this.onVote) this.onVote({ id: item.id, vote: item.uv });
        return;
      }

      /* Downvote */
      const downBtn = target.closest('[data-action="downvote"]');
      if (downBtn) {
        e.stopPropagation();
        const item = findById(this._data, downBtn.dataset.cid);
        if (!item) return;
        if (item.uv === 'down') { item.uv = null; item.downvotes--; }
        else { if (item.uv === 'up') item.upvotes--; item.uv = 'down'; item.downvotes = (item.downvotes || 0) + 1; }
        this._renderList();
        if (this.onVote) this.onVote({ id: item.id, vote: item.uv });
        return;
      }

      /* Toggle replies */
      const togBtn = target.closest('[data-action="toggle-replies"]');
      if (togBtn) {
        e.stopPropagation();
        const block = document.getElementById(`dbc-rep-${togBtn.dataset.cid}`);
        if (block) block.classList.toggle('open');
        return;
      }

      /* Reply */
      const replyBtn = target.closest('[data-action="reply"]');
      if (replyBtn) {
        e.stopPropagation();
        const parentId = replyBtn.dataset.cid;
        const name = replyBtn.dataset.name;

        /* Close all other reply inputs */
        this._root.querySelectorAll('.dbc-reply-inp-wrap.open').forEach(w => {
          if (w.id !== `dbc-ria-${parentId}`) w.classList.remove('open');
        });

        const wrap = document.getElementById(`dbc-ria-${parentId}`);
        if (!wrap) return;
        const isOpen = wrap.classList.contains('open');
        wrap.classList.toggle('open', !isOpen);

        if (!isOpen) {
          /* Open replies block too */
          const block = document.getElementById(`dbc-rep-${parentId}`);
          if (block) block.classList.add('open');

          const inp = document.getElementById(`dbc-ri-${parentId}`);
          if (inp) {
            inp.value = `@${name} `;
            inp.focus();
            inp.setSelectionRange(inp.value.length, inp.value.length);
          }
        }
        return;
      }
    };
    this._listEl.addEventListener('click', this._listEl._handler);
  }

  /* ── LOAD MORE ── */
  async _handleLoadMore() {
    if (this._loadingMore || this._allLoaded) return;
    if (!this.onLoadMore) {
      this._loadMoreBtn.disabled = true;
      this._loadMoreBtn.innerHTML = `✅ All loaded`;
      this._allLoaded = true;
      return;
    }
    this._loadingMore = true;
    this._loadMoreBtn.innerHTML = `<i class="fas fa-circle-notch dbc-spin"></i> Loading…`;
    this._loadMoreBtn.disabled = true;

    try {
      const more = await this.onLoadMore();
      if (!more || !more.length) {
        this._allLoaded = true;
        this._loadMoreBtn.innerHTML = `✅ All ${this.mode === 'debate' ? 'arguments' : 'comments'} loaded`;
      } else {
        more.forEach(c => this._data.push(c));
        this._renderList();
        this._updateCount();
        this._loadMoreBtn.innerHTML = `<i class="fas fa-chevron-down"></i> ${this.cfg.loadMoreLabel}`;
        this._loadMoreBtn.disabled = false;
      }
    } catch (err) {
      this._loadMoreBtn.innerHTML = `<i class="fas fa-chevron-down"></i> ${this.cfg.loadMoreLabel}`;
      this._loadMoreBtn.disabled = false;
      console.error('DroboardComments: onLoadMore error', err);
    }
    this._loadingMore = false;
  }

  /* ── VISIBLE DATA (filter + sort) ── */
  _getVisible() {
    let list = [...this._data];

    /* Filter (debate only) */
    if (this._filter === 'FOR')     list = list.filter(c => c.side === 'for');
    if (this._filter === 'AGAINST') list = list.filter(c => c.side === 'against');

    /* Thread mode: Writer-first sort */
    const sortLabel = this._sort;
    if (sortLabel === 'Top' || sortLabel === 'Hot 🔥') {
      list.sort((a, b) => {
        const ap = a.pinned ? 10000 : 0, bp = b.pinned ? 10000 : 0;
        const av = a.isTop  ? 5000  : 0, bv = b.isTop  ? 5000  : 0;
        const al = (a.upvotes || a.likes || 0), bl = (b.upvotes || b.likes || 0);
        return (bp + bv + bl) - (ap + av + al);
      });
    } else if (sortLabel === 'New' || sortLabel === 'Newest') {
      /* Keep insertion order (already newest-first if added via unshift) */
    } else if (sortLabel === 'Writers First' || sortLabel === 'Writer') {
      list.sort((a, b) => {
        if (a.isWriter && !b.isWriter) return -1;
        if (!a.isWriter && b.isWriter) return 1;
        return 0;
      });
    }

    return list;
  }

  /* ── MAKE COMMENT ── */
  _makeComment(text, parentId = null) {
    return {
      id:       uid(),
      parentId: parentId || null,
      name:     this.user.name,
      avatar:   this.user.avatar,
      verified: this.user.verified,
      isMod:    this.user.isMod,
      isWriter: this.user.isWriter || false,
      team:     this.cfg.teamMode ? this.user.team : null,
      side:     this.mode === 'debate' ? this.user.side : null,
      statusRing: 'none',
      text,
      time:     'Just now',
      likes:    0,
      liked:    false,
      upvotes:  0,
      downvotes:0,
      uv:       null,
      pinned:   false,
      isTop:    false,
      replies:  [],
    };
  }

  /* ── HELPERS ── */
  _updateCount() {
    if (this._countEl) {
      this._countEl.textContent = this._visibleCount();
    }
  }

  _visibleCount() {
    return this._getVisible().length;
  }

  _lastId = '';
  _id() {
    this._lastId = 'dbc_id_' + Date.now();
    return this._lastId;
  }
}


/* ──────────────────────────────────────────────
   COMMENT SCHEMA  (for reference)
   Pass these fields in initialData / onLoadMore.
──────────────────────────────────────────────

Each comment object:
{
  id:          string,          // unique id
  name:        string,          // display name (without @)
  avatar:      string|null,     // image URL or null for initials
  verified:    boolean,         // shows ✓ gold badge
  isWriter:    boolean,         // shows ✍️ Writer badge
  isMod:       boolean,         // shows 🛡️ Mod badge
  isTop:       boolean,         // shows 🔥 Top badge (thread mode)
  pinned:      boolean,         // shows 📌 Pinned badge
  side:        'for'|'against'|null,  // debate mode side badge
  team:        string|null,     // e.g. 'Team Ada' — story mode
  statusRing:  'none'|'new'|'viewed', // avatar ring state
  statusWid:   string|null,     // writer id for status tap
  text:        string,
  time:        string,          // e.g. '2h ago'
  likes:       number,          // used in like mode
  liked:       boolean,
  upvotes:     number,          // used in updown mode
  downvotes:   number,
  uv:          'up'|'down'|null,
  replies:     Array,           // nested array of same shape
  storyRef:    {                // optional — story ref card inside comment
    cover:     string,
    title:     string,
    onClick:   Function,
  } | null,
  onProfileClick: Function,     // optional tap handler on name
}

──────────────────────────────────────────────── */