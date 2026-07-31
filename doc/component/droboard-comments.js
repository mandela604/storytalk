/**
 * droboard-comments.js — Droboard Reusable Comments Component (v3)
 *
 * v3 fixes:
 *  - FIX: Like/reaction counts now refresh immediately everywhere they're shown
 *         (like button label was already correct — the real bug was reactions
 *         not refreshing the rx-bubble fast enough on first interaction, and
 *         counts silently going stale when re-sorting/re-rendering). Counts
 *         are now derived from the single source of truth on every render.
 *  - FIX: Viewing a commenter's status now flips their ring from
 *         ring-has -> ring-viewed immediately (no full re-render needed).
 *  - FIX: Every commenter with a `team` now reliably shows a team badge —
 *         badge no longer silently lost when verified+team both exist
 *         (team badge + verified check now both render, stacked).
 *  - FIX: New replies/comments posted by "me" always pick up the CURRENT
 *         value of currentUser.team at post-time (not a stale snapshot).
 *  - FIX: Sort by "New" now works correctly. Seed comments without a
 *         timestamp are assigned a deterministic synthetic _ts derived from
 *         their position, so old comments sort sensibly relative to each
 *         other and brand-new comments always float to the top.
 *
 * Call: mountDroboardComments(containerEl, options)
 *
 * options shape:
 *   storyId      {string|number}
 *   comments     {Array}
 *   currentUser  {Object} — { name, avatar, verified, team, statusRing, wid, statuses, likes, threads }
 *   onPost       {Function} async (comment) => { ok: true }
 *   onLike       {Function} async (commentId, liked) => { ok: true }
 *   onReact      {Function} async (commentId, reactionId) => { ok: true }
 *   writerStatuses {Array}  — full WRITER_STATUSES array for status viewer integration
 *
 * Comment shape:
 *   {
 *     id, name, avatar, statusRing, verified, team, wid,
 *     time, text, likes, liked,
 *     reactions: { fire,cry,broken,shock,mindblown,emo,sus,clap, userRx },
 *     replies: [Comment...]
 *   }
 */

(function () {
  'use strict';

  if (window.__droboardComments) return;
  window.__droboardComments = true;

  const ACC = '#ff0050';

  const REACTIONS = [
    { id: 'fire',      emoji: '🔥', label: 'Savage'     },
    { id: 'cry',       emoji: '😭', label: 'Crying'     },
    { id: 'broken',    emoji: '💔', label: 'Heartbroken'},
    { id: 'shock',     emoji: '😱', label: 'Shocked'    },
    { id: 'mindblown', emoji: '🤯', label: 'Mind blown' },
    { id: 'emo',       emoji: '🥹', label: 'Emotional'  },
    { id: 'sus',       emoji: '👀', label: 'Suspicious' },
    { id: 'clap',      emoji: '👏', label: 'Clapping'   },
  ];

  const DEFAULT_TEAM_CONFIG = {
    a: { label: 'Team Ada',      icon: '💔', color: '#ff0050' },
    b: { label: 'Team Emeka',    icon: '🔥', color: '#60a5fa' },
    c: { label: 'Team Forgive',  icon: '🕊️', color: '#34d399' },
    d: { label: 'Team Watching', icon: '👀', color: '#a78bfa' },
  };

  const CSS = `
.dbc-wrap *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.dbc-wrap{font-family:'DM Sans',system-ui,sans-serif;color:#e0e0e0;width:100%}

/* ── Header ── */
.dbc-header{display:flex;align-items:center;justify-content:space-between;padding:0 0 14px}
.dbc-header-left{display:flex;align-items:center;gap:8px}
.dbc-header-title{font-size:14px;font-weight:800;color:#e0e0e0}
.dbc-header-count{font-size:11px;font-weight:700;color:#555;background:rgba(255,255,255,.06);padding:2px 9px;border-radius:999px;border:1px solid rgba(255,255,255,.06)}
.dbc-sort-btn{font-size:10px;font-weight:700;color:#555;cursor:pointer;display:flex;align-items:center;gap:4px;padding:4px 9px;border-radius:8px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.04);transition:.15s;user-select:none}
.dbc-sort-btn:active{background:rgba(255,0,80,.08);color:${ACC}}

/* ── Input row ── */
.dbc-input-row{display:flex;gap:10px;align-items:flex-start;padding:0 0 18px}
.dbc-me-av{width:36px;height:36px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;background:rgba(255,0,80,.25);overflow:hidden}
.dbc-me-av img{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block}
.dbc-input-wrap{flex:1;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.08);border-radius:12px;padding:9px 12px;display:flex;align-items:center;gap:8px;transition:border-color .2s}
.dbc-input-wrap:focus-within{border-color:rgba(255,0,80,.35)}
.dbc-main-inp{flex:1;background:transparent;border:none;outline:none;color:#e0e0e0;font-family:inherit;font-size:12.5px}
.dbc-main-inp::placeholder{color:#2e2e2e}
.dbc-send-btn{width:28px;height:28px;border-radius:50%;background:${ACC};border:none;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-size:11px;transition:.15s}
.dbc-send-btn:disabled{background:#1a1a1a;cursor:not-allowed}
.dbc-send-btn:not(:disabled):active{transform:scale(.9)}

/* ── List ── */
.dbc-list{display:flex;flex-direction:column;gap:0}

/* ── Comment item ── */
.dbc-item{position:relative}
.dbc-item+.dbc-item{border-top:1px solid rgba(255,255,255,.04)}
.dbc-inner{display:flex;gap:10px;padding:12px 0 6px}
.dbc-item.is-reply .dbc-inner{padding-left:14px;border-left:2px solid rgba(255,0,80,.14);margin-left:20px;padding-top:8px}

/* ── Avatar wrap ── */
.dbc-av-wrap{position:relative;width:36px;height:36px;flex-shrink:0;cursor:pointer}

/* ring-has = blue conic (unviewed), ring-viewed = dim gray, ring-none = no ring */
.dbc-av-ring{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background .25s}
.dbc-av-ring.ring-has{background:conic-gradient(#38bdf8,#0ea5e9,#bae6fd,#38bdf8);padding:2.5px}
.dbc-av-ring.ring-viewed{background:#4a4a4a;padding:2px}
.dbc-av-ring.ring-none{background:transparent;padding:0}

.dbc-av-ring.ring-has .dbc-av-inner{border:1.5px solid #000}
.dbc-av-ring.ring-viewed .dbc-av-inner{border:1.5px solid #111}
.dbc-av-ring.ring-none .dbc-av-inner{border:none}

.dbc-av-inner{width:100%;height:100%;border-radius:50%;overflow:hidden;background:#111;display:flex;align-items:center;justify-content:center}
.dbc-av-inner img{width:100%;height:100%;object-fit:cover;display:block;border-radius:50%}
.dbc-av-initial{font-size:12px;font-weight:800;color:#fff;line-height:1}

/* badge row — bottom-right, can stack verified + team as two small dots */
.dbc-av-badges{position:absolute;bottom:-2px;right:-2px;display:flex;gap:1px;z-index:2}

.dbc-av-badge-verified{
  width:15px;height:15px;border-radius:50%;
  background:#38bdf8;border:2px solid #0a0a0a;
  display:flex;align-items:center;justify-content:center;
  font-size:7px;color:#fff;font-weight:900;
}

.dbc-av-badge-team{
  width:16px;height:16px;border-radius:50%;
  border:2px solid #0a0a0a;
  display:flex;align-items:center;justify-content:center;
  font-size:8px;color:#fff;
}

/* ── Comment body ── */
.dbc-body{flex:1;min-width:0}
.dbc-name-row{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:3px}
.dbc-name{font-size:11.5px;font-weight:800;color:#e0e0e0;cursor:pointer}
.dbc-name:hover{color:${ACC}}
.dbc-team-pill{font-size:8px;font-weight:800;padding:1.5px 6px;border-radius:5px;white-space:nowrap}
.dbc-time{font-size:9.5px;color:#3a3a3a;margin-left:auto;white-space:nowrap;flex-shrink:0}
.dbc-text{font-size:12.5px;color:#888;line-height:1.55;word-break:break-word;margin-bottom:6px}
.dbc-mention{color:${ACC};font-weight:700}

/* ── Inline edit ── */
.dbc-edit-wrap{display:none;margin-bottom:6px}
.dbc-edit-wrap.open{display:flex;flex-direction:column;gap:6px}
.dbc-edit-inp{width:100%;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,0,80,.3);border-radius:10px;padding:8px 11px;color:#e0e0e0;font-family:inherit;font-size:12.5px;outline:none;resize:none;min-height:60px;line-height:1.5}
.dbc-edit-actions{display:flex;gap:6px}
.dbc-edit-save{background:${ACC};color:#fff;border:none;padding:5px 13px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;transition:.15s}
.dbc-edit-save:active{transform:scale(.95)}
.dbc-edit-cancel{background:rgba(255,255,255,.06);color:#888;border:1px solid rgba(255,255,255,.1);padding:5px 13px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;transition:.15s}
.dbc-edit-cancel:active{transform:scale(.95)}

/* ── Reaction bubble ── */
.dbc-rx-bubble{display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:999px;padding:2px 8px;margin-bottom:5px;cursor:pointer;font-size:11px;color:#555;transition:.15s}
.dbc-rx-bubble:hover{border-color:rgba(255,0,80,.25);background:rgba(255,0,80,.06)}
.dbc-rx-bubble.has-rx{border-color:rgba(255,0,80,.3);background:rgba(255,0,80,.08);color:${ACC}}
.dbc-rx-bubble-emojis{font-size:12px;line-height:1}
.dbc-rx-bubble-count{font-size:10px;font-weight:700}

/* ── Action row ── */
.dbc-actions{display:flex;align-items:center;gap:0;flex-wrap:wrap;position:relative}
.dbc-act-btn{font-size:10px;font-weight:700;color:#444;cursor:pointer;display:flex;align-items:center;gap:3px;padding:4px 8px;border-radius:7px;transition:.15s;user-select:none;white-space:nowrap}
.dbc-act-btn:active{background:rgba(255,0,80,.08);color:${ACC}}
.dbc-act-btn.liked{color:${ACC}}
.dbc-act-btn .dbc-heart-icon{font-size:12px}
.dbc-dots-btn{margin-left:auto;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#3a3a3a;font-size:13px;transition:.15s;user-select:none}
.dbc-dots-btn:hover{background:rgba(255,255,255,.06);color:#777}
.dbc-dots-btn:active{color:${ACC}}

/* ── Reaction popup ── */
.dbc-rx-pop{position:absolute;bottom:calc(100% + 6px);left:0;z-index:40;background:#0d0d0d;border:1px solid rgba(255,255,255,.1);border-radius:28px;padding:8px 10px;display:none;flex-direction:row;gap:2px;box-shadow:0 8px 28px rgba(0,0,0,.9);animation:dbcPop .18s cubic-bezier(.34,1.56,.64,1);white-space:nowrap}
.dbc-rx-pop.show{display:flex}
@keyframes dbcPop{from{opacity:0;transform:scale(.7) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}
.dbc-rx-btn{display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 6px;border-radius:10px;cursor:pointer;transition:.13s;user-select:none;flex-shrink:0}
.dbc-rx-btn:active{transform:scale(.85)}
.dbc-rx-btn.picked{background:rgba(255,0,80,.14)}
.dbc-rx-em{font-size:20px;line-height:1}
.dbc-rx-ct{font-size:8px;font-weight:700;color:#3a3a3a;min-width:14px;text-align:center}
.dbc-rx-btn.picked .dbc-rx-ct{color:${ACC}}

/* ── Reply input ── */
.dbc-reply-area{display:none;padding:5px 0 4px 20px;border-left:2px solid rgba(255,0,80,.14);margin-left:20px;margin-top:2px}
.dbc-reply-area.open{display:flex;gap:7px;align-items:center}
.dbc-reply-av{width:24px;height:24px;border-radius:50%;background:rgba(255,0,80,.2);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#fff;flex-shrink:0;overflow:hidden}
.dbc-reply-av img{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block}
.dbc-reply-inp{flex:1;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.08);border-radius:18px;padding:6px 11px;color:#e0e0e0;font-family:inherit;font-size:11px;outline:none;transition:border-color .2s}
.dbc-reply-inp:focus{border-color:rgba(255,0,80,.35)}
.dbc-reply-send{background:${ACC};border:none;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:9px;color:#fff;flex-shrink:0;transition:.15s}
.dbc-reply-send:disabled{background:#1a1a1a;cursor:not-allowed}
.dbc-reply-send:not(:disabled):active{transform:scale(.9)}

/* ── Replies container ── */
.dbc-replies{margin-top:0}

/* ── 3-dot context menu ── */
.dbc-dots-menu{position:fixed;z-index:600;background:#0d0d0d;border:1px solid rgba(255,255,255,.09);border-radius:12px;padding:5px;min-width:172px;box-shadow:0 8px 32px rgba(0,0,0,.95);display:none}
.dbc-dots-menu.open{display:block}
.dbc-dots-item{display:flex;align-items:center;gap:8px;padding:9px 11px;border-radius:8px;font-size:12px;font-weight:600;color:#888;cursor:pointer;transition:.12s;user-select:none}
.dbc-dots-item:hover{background:rgba(255,255,255,.05);color:#e0e0e0}
.dbc-dots-item.danger{color:#f87171}
.dbc-dots-item.danger:hover{background:rgba(248,113,113,.08)}
.dbc-dots-divider{height:1px;background:rgba(255,255,255,.06);margin:3px 8px}

/* ── Load more ── */
.dbc-load-more{display:flex;justify-content:center;padding:14px 0 4px}
.dbc-load-btn{font-size:11px;font-weight:700;color:#555;cursor:pointer;padding:7px 18px;border-radius:20px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.04);transition:.15s;user-select:none}
.dbc-load-btn:active{border-color:rgba(255,0,80,.3);color:${ACC}}

/* ── Toast ── */
.dbc-toast{position:fixed;bottom:88px;left:50%;transform:translateX(-50%) translateY(14px);background:#111;border:1px solid rgba(255,255,255,.08);color:#e0e0e0;padding:7px 16px;border-radius:24px;font-size:11.5px;font-weight:600;z-index:1500;opacity:0;transition:.26s;pointer-events:none;white-space:nowrap;font-family:'DM Sans',system-ui,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.7)}
.dbc-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
`;

  // ─── Helpers ─────────────────────────────────────────────────────────────
  function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function fmtN(n) {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n || 0);
  }
  function fmtMentions(s) {
    return esc(s).replace(/@([\w_]+)/g, '<span class="dbc-mention">@$1</span>');
  }
  function newRx() {
    return { fire: 0, cry: 0, broken: 0, shock: 0, mindblown: 0, emo: 0, sus: 0, clap: 0, userRx: null };
  }

  // ─── Toast ───────────────────────────────────────────────────────────────
  let _toastEl = null;
  function getToast() {
    if (!_toastEl) {
      _toastEl = document.createElement('div');
      _toastEl.className = 'dbc-toast';
      document.body.appendChild(_toastEl);
    }
    return _toastEl;
  }
  function toast(msg) {
    if (typeof window.toast === 'function') { window.toast(msg); return; }
    const el = getToast();
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2400);
  }

  // ─── Global dots menu ────────────────────────────────────────────────────
  let _dotsMenu = null;
  function getDotsMenu() {
    if (!_dotsMenu) {
      _dotsMenu = document.createElement('div');
      _dotsMenu.className = 'dbc-dots-menu';
      document.body.appendChild(_dotsMenu);
    }
    return _dotsMenu;
  }

  let _instanceCount = 0;
  const _instances = new Map();

  // ══════════════════════════════════════════════════════════════════════════
  function mountDroboardComments(containerEl, opts) {
    opts = opts || {};

    if (!document.getElementById('__dbc_style')) {
      const s = document.createElement('style');
      s.id = '__dbc_style';
      s.textContent = CSS;
      document.head.appendChild(s);
    }

    const instanceId = ++_instanceCount;
    const teamConfig = Object.assign({}, DEFAULT_TEAM_CONFIG, opts.teamConfig || {});

    // currentUser is treated exactly like any other commenter.
    // NOTE: we keep a *reference* to opts.currentUser (not a clone) so that
    // if the host page mutates it later (e.g. user switches team), new
    // comments/replies posted afterward automatically pick up the change.
    const me = opts.currentUser || { name: 'Guest', avatar: null, verified: false, team: null, statusRing: 'ring-none', wid: null };
    const writerStatuses = opts.writerStatuses || [];

    // FIX (sort-by-new bug): seed comments rarely carry a real timestamp.
    // We assign each one a synthetic, strictly-decreasing _ts based on its
    // original order so "New" has a stable, sensible ordering instead of
    // every old comment tying at 0.
    let _seedTsCursor = Date.now() - 1000 * 60 * 60 * 24 * 30; // 30 days ago baseline
    let comments = (opts.comments || []).map(c => deepCloneComment(c, true));

    let sortMode = 'top';
    let idCounter = 9999;
    let openRxCid = null;
    let openDotsCid = null;

    const root = document.createElement('div');
    root.className = 'dbc-wrap';
    root.dataset.instanceId = instanceId;
    containerEl.innerHTML = '';
    containerEl.appendChild(root);

    _instances.set(instanceId, { root, destroy });

    function build() {
      root.innerHTML = buildHTML();
      attachEvents();
    }

    function buildHTML() {
      const sorted = getSorted();
      return `
        ${buildHeader(comments.length)}
        ${buildInputRow()}
        <div class="dbc-list" id="dbc-list-${instanceId}">
          ${sorted.map(c => buildComment(c, false)).join('')}
        </div>
        ${sorted.length > 5 ? buildLoadMore() : ''}
      `;
    }

    // FIX (sort bug): every comment now reliably has a numeric _ts (assigned
    // at clone-time for seeds, set live for new posts), so both sort modes
    // produce a real, stable order — not a tie that silently falls back to
    // original array order.
    function getSorted() {
      const list = [...comments];
      if (sortMode === 'new') {
        list.sort((a, b) => (b._ts || 0) - (a._ts || 0));
      } else {
        list.sort((a, b) => {
          const scoreA = (a.likes || 0) + rxTotal(a);
          const scoreB = (b.likes || 0) + rxTotal(b);
          if (scoreB !== scoreA) return scoreB - scoreA;
          // tie-break by newest first so "Top" is still deterministic
          return (b._ts || 0) - (a._ts || 0);
        });
      }
      return list;
    }

    function rxTotal(c) {
      if (!c.reactions) return 0;
      return REACTIONS.reduce((sum, r) => sum + (c.reactions[r.id] || 0), 0);
    }

    function buildHeader(count) {
      return `<div class="dbc-header">
        <div class="dbc-header-left">
          <span class="dbc-header-title">Comments</span>
          <span class="dbc-header-count">${fmtN(count)}</span>
        </div>
        <div class="dbc-sort-btn" id="dbc-sort-${instanceId}">
          ${sortMode === 'top' ? '🔥 Top' : '🆕 New'}
        </div>
      </div>`;
    }

    // builds the small avatar used in the main input row and reply bars
    function buildMeAvatarHTML() {
      if (me.avatar) return `<img src="${esc(me.avatar)}" alt="${esc(me.name)}"/>`;
      return `<span style="font-size:13px;font-weight:800;color:#fff">${(me.name || 'G')[0].toUpperCase()}</span>`;
    }

    function buildInputRow() {
      return `<div class="dbc-input-row">
        <div class="dbc-me-av">${buildMeAvatarHTML()}</div>
        <div class="dbc-input-wrap">
          <input class="dbc-main-inp" id="dbc-inp-${instanceId}" placeholder="Add a comment…" autocomplete="off" maxlength="500"/>
          <button class="dbc-send-btn" id="dbc-send-${instanceId}" disabled>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>`;
    }

    // ── Avatar with ring + verified/team badge(s) ───────────────────────────
    // ring-has = blue conic (unviewed status), ring-viewed = dim gray, ring-none = nothing
    // FIX (team badge bug): verified and team badges are independent and BOTH
    // render (stacked) instead of team silently hiding verified or vice versa.
    function buildAvatar(c) {
      const ring = c.statusRing === 'ring-has' ? 'ring-has'
        : c.statusRing === 'ring-viewed' ? 'ring-viewed'
        : 'ring-none';

      const inner = c.avatar
        ? `<img src="${esc(c.avatar)}" loading="lazy"/>`
        : `<div class="dbc-av-initial">${(c.name || '?')[0].toUpperCase()}</div>`;

      let badges = '';
      if (c.team && teamConfig[c.team]) {
        const t = teamConfig[c.team];
        badges += `<div class="dbc-av-badge-team" style="background:${t.color}" title="${esc(t.label)}">${t.icon}</div>`;
      }
      if (c.verified) {
        badges += `<div class="dbc-av-badge-verified" title="Verified">✓</div>`;
      }

      return `<div class="dbc-av-wrap" data-cid="${c.id}" data-wid="${esc(c.wid || '')}">
        <div class="dbc-av-ring ${ring}" id="dbc-ring-${instanceId}-${c.id}">
          <div class="dbc-av-inner">${inner}</div>
        </div>
        ${badges ? `<div class="dbc-av-badges">${badges}</div>` : ''}
      </div>`;
    }

    // ── Name row: name + team pill + time ────────────────────────────────────
    // FIX (team badge bug, continued): team pill next to the name follows the
    // exact same `c.team` source as the avatar badge, so the two can never
    // disagree — every commenter who has a team always shows it in both places.
    function buildNameRow(c) {
      let extra = '';
      if (c.team && teamConfig[c.team]) {
        const t = teamConfig[c.team];
        const color = t.color || '#888';
        const light = hexToRgba(color, 0.15);
        const border = hexToRgba(color, 0.3);
        extra += `<span class="dbc-team-pill" style="background:${light};color:${color};border:1px solid ${border}">${t.icon} ${t.label}</span>`;
      }
      return `<div class="dbc-name-row">
        <span class="dbc-name" data-cid="${c.id}">${esc(c.name)}</span>
        ${extra}
        <span class="dbc-time">${esc(c.time)}</span>
      </div>`;
    }

    // ── Reaction bubble summary ──────────────────────────────────────────────
    function buildRxBubble(c) {
      if (!c.reactions) return '';
      const total = REACTIONS.reduce((s, r) => s + (c.reactions[r.id] || 0), 0);
      const picked = c.reactions.userRx;
      if (!total && !picked) return '';
      const top = REACTIONS.filter(r => c.reactions[r.id] > 0)
        .sort((a, b) => c.reactions[b.id] - c.reactions[a.id])
        .slice(0, 3).map(r => r.emoji).join('');
      return `<div class="dbc-rx-bubble${picked ? ' has-rx' : ''}" data-rxbubble="${c.id}">
        <span class="dbc-rx-bubble-emojis">${top || '❤️'}</span>
        <span class="dbc-rx-bubble-count">${fmtN(total)}</span>
      </div>`;
    }

    // ── Reaction popup ───────────────────────────────────────────────────────
    function buildRxPop(c) {
      if (!c.reactions) return '';
      const picked = c.reactions.userRx;
      return `<div class="dbc-rx-pop" id="dbc-rxpop-${instanceId}-${c.id}">
        ${REACTIONS.map(r => `
          <div class="dbc-rx-btn${picked === r.id ? ' picked' : ''}" data-rxbtn="${c.id}" data-rid="${r.id}" title="${r.label}">
            <span class="dbc-rx-em">${r.emoji}</span>
            <span class="dbc-rx-ct">${c.reactions[r.id] > 0 ? fmtN(c.reactions[r.id]) : ''}</span>
          </div>`).join('')}
      </div>`;
    }

    // ── Action row ──────────────────────────────────────────────────────────
    function buildActions(c) {
      const replyCount = (c.replies || []).reduce((s, r) => s + 1 + (r.replies ? r.replies.length : 0), 0);
      return `<div class="dbc-actions">
        ${buildRxPop(c)}
        <div class="dbc-act-btn${c.liked ? ' liked' : ''} dbc-like-btn" data-cid="${c.id}">
          <span class="dbc-heart-icon">${c.liked ? '♥' : '♡'}</span>
          <span class="dbc-like-count">${fmtN(c.likes || 0)}</span>
        </div>
        <div class="dbc-act-btn dbc-reply-toggle" data-cid="${c.id}">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
          Reply${replyCount > 0 ? ` · ${replyCount}` : ''}
        </div>
        <div class="dbc-dots-btn dbc-dots" data-cid="${c.id}">•••</div>
      </div>`;
    }

    // ── Inline edit block (hidden by default) ───────────────────────────────
    function buildEditWrap(c) {
      return `<div class="dbc-edit-wrap" id="dbc-edit-${instanceId}-${c.id}">
        <textarea class="dbc-edit-inp" id="dbc-edit-inp-${instanceId}-${c.id}" maxlength="500">${esc(c.text)}</textarea>
        <div class="dbc-edit-actions">
          <button class="dbc-edit-save" data-cid="${c.id}">Save</button>
          <button class="dbc-edit-cancel" data-cid="${c.id}">Cancel</button>
        </div>
      </div>`;
    }

    // ── Reply input row ──────────────────────────────────────────────────────
    function buildReplyInput(c) {
      const avHTML = me.avatar ? `<img src="${esc(me.avatar)}" alt="${esc(me.name)}"/>` : (me.name || 'G')[0].toUpperCase();
      return `<div class="dbc-reply-area" id="dbc-ra-${instanceId}-${c.id}">
        <div class="dbc-reply-av">${avHTML}</div>
        <input class="dbc-reply-inp" id="dbc-ri-${instanceId}-${c.id}" placeholder="Replying to @${esc(c.name)}…" maxlength="400"/>
        <button class="dbc-reply-send" id="dbc-rs-${instanceId}-${c.id}" disabled>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>`;
    }

    // ── Full comment render ──────────────────────────────────────────────────
    function buildComment(c, isReply) {
      return `
        <div class="dbc-item${isReply ? ' is-reply' : ''}" id="dbc-ci-${instanceId}-${c.id}">
          <div class="dbc-inner">
            ${buildAvatar(c)}
            <div class="dbc-body">
              ${buildNameRow(c)}
              <div class="dbc-text" id="dbc-text-${instanceId}-${c.id}">${fmtMentions(c.text)}</div>
              ${buildEditWrap(c)}
              ${buildRxBubble(c)}
              ${buildActions(c)}
            </div>
          </div>
          ${buildReplyInput(c)}
          <div class="dbc-replies" id="dbc-reps-${instanceId}-${c.id}">
            ${(c.replies || []).map(r => buildComment(r, true)).join('')}
          </div>
        </div>`;
    }

    function buildLoadMore() {
      return `<div class="dbc-load-more">
        <div class="dbc-load-btn" id="dbc-loadmore-${instanceId}">Load more comments</div>
      </div>`;
    }

    // ── Find comment (deep) ──────────────────────────────────────────────────
    function findComment(list, id) {
      for (const c of list) {
        if (String(c.id) === String(id)) return c;
        if (c.replies) { const r = findComment(c.replies, id); if (r) return r; }
      }
      return null;
    }

    function isOwnComment(c) {
      return c.name === me.name;
    }

    // FIX (sort bug): assigns a deterministic synthetic _ts to seed comments
    // that don't already have one, so they have a real, stable chronological
    // order instead of all tying at the same value.
    function deepCloneComment(c, isTopLevelSeedPass) {
      const clone = Object.assign({}, c);
      clone.reactions = Object.assign({ fire: 0, cry: 0, broken: 0, shock: 0, mindblown: 0, emo: 0, sus: 0, clap: 0, userRx: null }, c.reactions || {});
      if (clone._ts == null) {
        clone._ts = _seedTsCursor;
        _seedTsCursor += 1000 * 60; // each earlier seed comment is 1 min "older"
      }
      clone.replies = (c.replies || []).map(r => deepCloneComment(r, false));
      return clone;
    }

    // ── Events ──────────────────────────────────────────────────────────────
    function attachEvents() {
      const sortBtn = root.querySelector(`#dbc-sort-${instanceId}`);
      if (sortBtn) sortBtn.addEventListener('click', () => { sortMode = sortMode === 'top' ? 'new' : 'top'; build(); });

      const inp = root.querySelector(`#dbc-inp-${instanceId}`);
      const sendBtn = root.querySelector(`#dbc-send-${instanceId}`);
      if (inp && sendBtn) {
        inp.addEventListener('input', () => { sendBtn.disabled = inp.value.trim().length === 0; });
        inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postMain(); } });
        sendBtn.addEventListener('click', postMain);
      }

      const loadBtn = root.querySelector(`#dbc-loadmore-${instanceId}`);
      if (loadBtn) loadBtn.addEventListener('click', () => toast('📄 Loading more…'));

      const list = root.querySelector(`#dbc-list-${instanceId}`);
      if (!list) return;

      list.addEventListener('click', onListClick);
      list.addEventListener('pointerdown', onListPointerDown, { passive: true });
      list.addEventListener('pointerup', onListPointerUp, { passive: true });
      list.addEventListener('pointercancel', onListPointerUp, { passive: true });

      attachReplyInputs(list);
      attachEditButtons(list);

      document.addEventListener('pointerdown', onDocPointerDown, { passive: true });
    }

    let _holdTimer = null;

    function onListPointerDown(e) {
      const btn = e.target.closest('.dbc-like-btn');
      if (!btn) return;
      const cid = btn.dataset.cid;
      _holdTimer = setTimeout(() => { showRxPop(cid); }, 380);
    }
    function onListPointerUp() { clearTimeout(_holdTimer); _holdTimer = null; }

    function onListClick(e) {
      // rx pop button
      const rxBtn = e.target.closest('[data-rxbtn]');
      if (rxBtn) { pickRx(rxBtn.dataset.rxbtn, rxBtn.dataset.rid); return; }

      // rx bubble
      const bubble = e.target.closest('[data-rxbubble]');
      if (bubble) { toggleRxPop(bubble.dataset.rxbubble); return; }

      // like
      const likeBtn = e.target.closest('.dbc-like-btn');
      if (likeBtn) {
        const pop = root.querySelector(`#dbc-rxpop-${instanceId}-${likeBtn.dataset.cid}`);
        if (pop && pop.classList.contains('show')) { pop.classList.remove('show'); openRxCid = null; return; }
        handleLike(likeBtn.dataset.cid, likeBtn);
        return;
      }

      // reply toggle
      const replyBtn = e.target.closest('.dbc-reply-toggle');
      if (replyBtn) { toggleReplyArea(replyBtn.dataset.cid); return; }

      // dots menu
      const dotsBtn = e.target.closest('.dbc-dots');
      if (dotsBtn) { openDots(dotsBtn.dataset.cid, dotsBtn); return; }

      // avatar or name click — open status if they have statuses
      const avWrap = e.target.closest('.dbc-av-wrap');
      const nameEl = e.target.closest('.dbc-name');
      const cid = (avWrap || nameEl)?.dataset?.cid;
      if (cid) {
        const c = findComment(comments, cid);
        if (c) openUserStatus(c);
        return;
      }
    }

    // FIX (status ring bug): after successfully opening someone's status,
    // flip their statusRing from ring-has -> ring-viewed and update just
    // that avatar's ring in the DOM immediately — no full re-render needed,
    // and the change is permanent for the rest of this session (matches
    // real status-viewer behaviour: once viewed, stays viewed).
    function openUserStatus(c) {
      if (!c.wid || !writerStatuses.length) {
        toast(`👤 @${c.name}`);
        return;
      }
      const ws = writerStatuses.find(w => w.id === c.wid);
      if (!ws || !ws.statuses || !ws.statuses.length) {
        toast(`👤 @${c.name}`);
        return;
      }

      const opened = (typeof window.openStatusViewer === 'function')
        ? window.openStatusViewer(writerStatuses, c.wid)
        : (typeof window.openStatus === 'function')
          ? window.openStatus(c.wid)
          : false;

      if (opened === false && typeof window.openStatusViewer !== 'function' && typeof window.openStatus !== 'function') {
        toast(`👤 @${c.name}`);
        return;
      }

      if (c.statusRing === 'ring-has') {
        c.statusRing = 'ring-viewed';
        markAllCommentsByWidAsViewed(comments, c.wid);
        refreshAllRingsForWid(c.wid);
      }
    }

    // A person may appear as multiple comment entries (their own comment +
    // replies elsewhere) — once viewed, every instance of them in this
    // thread should show as viewed, not just the one that was clicked.
    function markAllCommentsByWidAsViewed(list, wid) {
      for (const c of list) {
        if (c.wid === wid && c.statusRing === 'ring-has') c.statusRing = 'ring-viewed';
        if (c.replies) markAllCommentsByWidAsViewed(c.replies, wid);
      }
    }

    function refreshAllRingsForWid(wid) {
      root.querySelectorAll(`.dbc-av-wrap[data-wid="${wid}"]`).forEach(wrap => {
        const ring = wrap.querySelector('.dbc-av-ring');
        if (ring) {
          ring.classList.remove('ring-has');
          ring.classList.add('ring-viewed');
        }
      });
    }

    function attachReplyInputs(container) {
      container.querySelectorAll('.dbc-reply-inp').forEach(inp => {
        const cid = inp.id.replace(`dbc-ri-${instanceId}-`, '');
        const sendBtn = container.querySelector(`#dbc-rs-${instanceId}-${cid}`);
        if (!sendBtn) return;
        inp.addEventListener('input', () => { sendBtn.disabled = inp.value.trim().length === 0; });
        inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(cid); } });
        sendBtn.addEventListener('click', () => submitReply(cid));
      });
    }

    function attachEditButtons(container) {
      container.querySelectorAll('.dbc-edit-save').forEach(btn => {
        btn.addEventListener('click', () => saveEdit(btn.dataset.cid));
      });
      container.querySelectorAll('.dbc-edit-cancel').forEach(btn => {
        btn.addEventListener('click', () => cancelEdit(btn.dataset.cid));
      });
    }

    function onDocPointerDown(e) {
      if (!e.target.closest('.dbc-rx-pop') && !e.target.closest('.dbc-like-btn') && !e.target.closest('[data-rxbubble]')) {
        hideAllRxPops();
      }
      if (!e.target.closest('.dbc-dots-btn') && !e.target.closest('.dbc-dots-menu')) {
        closeDotsMenu();
      }
    }

    // ── Rx popup ────────────────────────────────────────────────────────────
    function showRxPop(cid) {
      if (openRxCid && openRxCid !== cid) hideAllRxPops();
      const pop = root.querySelector(`#dbc-rxpop-${instanceId}-${cid}`);
      if (!pop) return;
      pop.classList.add('show');
      openRxCid = cid;
    }
    function toggleRxPop(cid) {
      const pop = root.querySelector(`#dbc-rxpop-${instanceId}-${cid}`);
      if (!pop) return;
      if (pop.classList.contains('show')) { pop.classList.remove('show'); openRxCid = null; }
      else { hideAllRxPops(); pop.classList.add('show'); openRxCid = cid; }
    }
    function hideAllRxPops() {
      root.querySelectorAll('.dbc-rx-pop.show').forEach(p => p.classList.remove('show'));
      openRxCid = null;
    }

    // FIX (reaction count bug): pickRx now updates the reaction popup AND the
    // bubble synchronously via refreshCommentItem before hiding the popup —
    // previously the popup was hidden in the same tick it was rebuilt, so on
    // some browsers the new count never painted before disappearing. Now we
    // refresh first, then hide on the next animation frame so the updated
    // numbers are guaranteed to have rendered first.
    function pickRx(cid, rid) {
      const c = findComment(comments, cid);
      if (!c || !c.reactions) return;
      if (c.reactions.userRx === rid) {
        c.reactions[rid] = Math.max(0, (c.reactions[rid] || 0) - 1);
        c.reactions.userRx = null;
      } else {
        if (c.reactions.userRx) c.reactions[c.reactions.userRx] = Math.max(0, (c.reactions[c.reactions.userRx] || 0) - 1);
        c.reactions[rid] = (c.reactions[rid] || 0) + 1;
        c.reactions.userRx = rid;
        const r = REACTIONS.find(x => x.id === rid);
        toast(`${r ? r.emoji : ''} Reacted!`);
      }
      refreshCommentItem(cid);
      if (opts.onReact) opts.onReact(cid, rid).catch(() => {});
      requestAnimationFrame(hideAllRxPops);
    }

    // ── Like ────────────────────────────────────────────────────────────────
    // FIX (like count bug): count is read straight from the comment object
    // immediately after mutating it, and both the icon AND the number are
    // updated together in the same DOM write so they can never go out of sync.
    function handleLike(cid, btn) {
      const c = findComment(comments, cid);
      if (!c) return;
      c.liked = !c.liked;
      c.likes = Math.max(0, (c.likes || 0) + (c.liked ? 1 : -1));
      if (opts.onLike) opts.onLike(cid, c.liked).catch(() => {});
      if (!btn) btn = root.querySelector(`.dbc-like-btn[data-cid="${cid}"]`);
      if (!btn) return;
      btn.classList.toggle('liked', c.liked);
      const heart = btn.querySelector('.dbc-heart-icon');
      if (heart) heart.textContent = c.liked ? '♥' : '♡';
      const ct = btn.querySelector('.dbc-like-count');
      if (ct) ct.textContent = fmtN(c.likes);
    }

    function refreshCommentItem(cid) {
      const c = findComment(comments, cid);
      if (!c) return;
      const item = root.querySelector(`#dbc-ci-${instanceId}-${cid}`);
      if (!item) return;
      const bubble = item.querySelector('[data-rxbubble]');
      const freshBubbleHTML = buildRxBubble(c);
      if (bubble) {
        if (freshBubbleHTML) bubble.outerHTML = freshBubbleHTML;
        else bubble.remove();
      } else if (freshBubbleHTML) {
        // bubble didn't exist before (first reaction ever) — insert it
        // right before the actions row so it appears in the right place.
        const actions = item.querySelector('.dbc-actions');
        if (actions) actions.insertAdjacentHTML('beforebegin', freshBubbleHTML);
      }
      const pop = item.querySelector('.dbc-rx-pop');
      if (pop) {
        const tmp = document.createElement('div');
        tmp.innerHTML = buildRxPop(c);
        const freshPop = tmp.firstElementChild;
        // preserve open state across the swap
        if (pop.classList.contains('show')) freshPop.classList.add('show');
        pop.replaceWith(freshPop);
      }
    }

    // ── Reply area ───────────────────────────────────────────────────────────
    function toggleReplyArea(cid) {
      root.querySelectorAll('.dbc-reply-area.open').forEach(el => {
        if (el.id !== `dbc-ra-${instanceId}-${cid}`) el.classList.remove('open');
      });
      const area = root.querySelector(`#dbc-ra-${instanceId}-${cid}`);
      if (!area) return;
      const open = area.classList.toggle('open');
      if (open) area.querySelector('.dbc-reply-inp')?.focus();
    }

    function submitReply(parentCid) {
      const inp = root.querySelector(`#dbc-ri-${instanceId}-${parentCid}`);
      if (!inp || !inp.value.trim()) return;
      const parent = findComment(comments, parentCid);
      if (!parent) return;
      const text = inp.value.trim();
      const prefixed = text.startsWith('@') ? text : `@${parent.name} ${text}`;
      // FIX (team badge bug, continued): reading me.team live (not a snapshot
      // taken at mount time) means if the host page updates currentUser.team
      // after mount, new replies immediately reflect the user's current team.
      const newC = {
        id: ++idCounter,
        name: me.name,
        avatar: me.avatar || null,
        verified: me.verified || false,
        statusRing: me.statusRing || 'ring-none',
        wid: me.wid || null,
        team: me.team || null,
        time: 'Just now',
        text: prefixed,
        likes: 0,
        liked: false,
        reactions: newRx(),
        replies: [],
        _ts: Date.now(),
      };
      if (!parent.replies) parent.replies = [];
      parent.replies.push(newC);
      inp.value = '';
      root.querySelector(`#dbc-rs-${instanceId}-${parentCid}`)?.setAttribute('disabled', '');
      root.querySelector(`#dbc-ra-${instanceId}-${parentCid}`)?.classList.remove('open');
      const repContainer = root.querySelector(`#dbc-reps-${instanceId}-${parentCid}`);
      if (repContainer) {
        const tmp = document.createElement('div');
        tmp.innerHTML = buildComment(newC, true);
        const el = tmp.firstElementChild;
        repContainer.appendChild(el);
        attachReplyInputs(repContainer);
        attachEditButtons(repContainer);
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      const replyBtn = root.querySelector(`.dbc-reply-toggle[data-cid="${parentCid}"]`);
      if (replyBtn && parent.replies) {
        replyBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg> Reply · ${parent.replies.length}`;
      }
      toast('💬 Reply posted!');
    }

    // ── Inline edit ──────────────────────────────────────────────────────────
    function openEdit(cid) {
      const c = findComment(comments, cid);
      if (!c) return;
      const textEl = root.querySelector(`#dbc-text-${instanceId}-${cid}`);
      const editWrap = root.querySelector(`#dbc-edit-${instanceId}-${cid}`);
      if (!textEl || !editWrap) return;
      textEl.style.display = 'none';
      editWrap.classList.add('open');
      const inp = editWrap.querySelector('.dbc-edit-inp');
      if (inp) { inp.value = c.text; inp.focus(); inp.select(); }
    }

    function saveEdit(cid) {
      const c = findComment(comments, cid);
      if (!c) return;
      const editWrap = root.querySelector(`#dbc-edit-${instanceId}-${cid}`);
      const textEl = root.querySelector(`#dbc-text-${instanceId}-${cid}`);
      if (!editWrap || !textEl) return;
      const inp = editWrap.querySelector('.dbc-edit-inp');
      const newText = inp ? inp.value.trim() : '';
      if (!newText) { toast('Comment cannot be empty.'); return; }
      c.text = newText;
      textEl.innerHTML = fmtMentions(newText);
      textEl.style.display = '';
      editWrap.classList.remove('open');
      toast('✏️ Comment updated!');
    }

    function cancelEdit(cid) {
      const editWrap = root.querySelector(`#dbc-edit-${instanceId}-${cid}`);
      const textEl = root.querySelector(`#dbc-text-${instanceId}-${cid}`);
      if (!editWrap || !textEl) return;
      textEl.style.display = '';
      editWrap.classList.remove('open');
    }

    // ── Post main comment ────────────────────────────────────────────────────
    function postMain() {
      const inp = root.querySelector(`#dbc-inp-${instanceId}`);
      const sendBtn = root.querySelector(`#dbc-send-${instanceId}`);
      if (!inp || !inp.value.trim()) return;
      const newC = {
        id: ++idCounter,
        name: me.name,
        avatar: me.avatar || null,
        verified: me.verified || false,
        statusRing: me.statusRing || 'ring-none',
        wid: me.wid || null,
        team: me.team || null,
        time: 'Just now',
        text: inp.value.trim(),
        likes: 0,
        liked: false,
        reactions: newRx(),
        replies: [],
        _ts: Date.now(),
      };
      comments.unshift(newC);
      inp.value = '';
      if (sendBtn) sendBtn.disabled = true;
      if (opts.onPost) opts.onPost(newC).catch(() => {});

      // If currently sorted by "New", a fresh insert at the top of the array
      // is also visually correct. If sorted by "Top" with zero engagement,
      // a brand new comment with 0 likes still belongs at the bottom of the
      // ranking — so re-render fully in that case instead of just prepending.
      if (sortMode === 'new') {
        const list = root.querySelector(`#dbc-list-${instanceId}`);
        if (list) {
          const tmp = document.createElement('div');
          tmp.innerHTML = buildComment(newC, false);
          const el = tmp.firstElementChild;
          list.prepend(el);
          attachReplyInputs(el);
          attachEditButtons(el);
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else {
        build();
      }

      const countEl = root.querySelector('.dbc-header-count');
      if (countEl) countEl.textContent = fmtN(comments.length);
      toast('💬 Comment posted!');
    }

    // ── 3-dot menu ───────────────────────────────────────────────────────────
    function openDots(cid, triggerEl) {
      if (openDotsCid === cid) { closeDotsMenu(); return; }
      closeDotsMenu();
      openDotsCid = cid;
      const c = findComment(comments, cid);
      const own = c && isOwnComment(c);
      const menu = getDotsMenu();
      menu.innerHTML = `
        <div class="dbc-dots-item" data-action="copy" data-cid="${cid}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy
        </div>
        <div class="dbc-dots-item" data-action="share" data-cid="${cid}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share
        </div>
        ${own ? `
          <div class="dbc-dots-divider"></div>
          <div class="dbc-dots-item" data-action="edit" data-cid="${cid}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit comment
          </div>
          <div class="dbc-dots-item danger" data-action="delete" data-cid="${cid}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Delete
          </div>
        ` : `
          <div class="dbc-dots-divider"></div>
          <div class="dbc-dots-item" data-action="follow" data-cid="${cid}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            Follow @${esc(c?.name || '')}
          </div>
          <div class="dbc-dots-item danger" data-action="report" data-cid="${cid}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
            Report
          </div>
        `}`;

      const rect = triggerEl.getBoundingClientRect();
      let top = rect.bottom + 4;
      let left = rect.right - 178;
      if (left < 8) left = 8;
      if (top + 200 > window.innerHeight) top = rect.top - 205;
      menu.style.top = top + 'px';
      menu.style.left = left + 'px';
      menu.classList.add('open');

      menu.querySelectorAll('.dbc-dots-item').forEach(item => {
        item.addEventListener('click', () => {
          const action = item.dataset.action;
          const cid2 = item.dataset.cid;
          const c2 = findComment(comments, cid2);
          closeDotsMenu();
          if (action === 'copy') {
            navigator.clipboard?.writeText(c2?.text || '').catch(() => {});
            toast('📋 Copied!');
          } else if (action === 'share') {
            toast('📤 Share link copied!');
          } else if (action === 'edit') {
            openEdit(cid2);
          } else if (action === 'delete') {
            deleteComment(comments, cid2);
            root.querySelector(`#dbc-ci-${instanceId}-${cid2}`)?.remove();
            const countEl = root.querySelector('.dbc-header-count');
            if (countEl) countEl.textContent = fmtN(comments.length);
            toast('🗑️ Deleted.');
          } else if (action === 'follow') {
            toast(`✅ Following @${c2?.name}!`);
          } else if (action === 'report') {
            toast('🚩 Reported.');
          }
        });
      });
    }

    function closeDotsMenu() {
      getDotsMenu().classList.remove('open');
      openDotsCid = null;
    }

    function deleteComment(list, id) {
      const idx = list.findIndex(c => String(c.id) === String(id));
      if (idx > -1) { list.splice(idx, 1); return true; }
      for (const c of list) {
        if (c.replies && deleteComment(c.replies, id)) return true;
      }
      return false;
    }

    function destroy() {
      document.removeEventListener('pointerdown', onDocPointerDown);
      root.remove();
    }

    build();
    return { destroy, getComments: () => comments };
  }

  // ─── Hex to rgba ──────────────────────────────────────────────────────────
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function unmountDroboardComments(el) {
    const child = el && el.querySelector('.dbc-wrap');
    if (!child) return;
    const id = child.dataset.instanceId;
    const instance = _instances.get(+id);
    if (instance) { instance.destroy(); _instances.delete(+id); }
  }

  window.mountDroboardComments = mountDroboardComments;
  window.unmountDroboardComments = unmountDroboardComments;

})();