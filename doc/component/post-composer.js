/**
 * post-composer.js — Droboard Reusable Post Composer
 * ─────────────────────────────────────────────
 * Drop one <script src="post-composer.js"></script> in any page (after your
 * icon font is loaded). Then:
 *
 *   DroboardPostComposer.open({
 *     author: { name: 'Ada_Writes', avatar: WRITER_AV, avatarRing: 'ring-live',
 *               verified: true, badge: 'writer', rank: '#1 This Week' },
 *     stories: [                              // used by Chapter Drop + Review types
 *       { id:'s1', title:'...', cat:'💔 Betrayal', cover:'https://...', writer:'Ada_Writes' },
 *       ...
 *     ],
 *     defaultType: 'post',                    // optional, defaults to 'post'
 *     onSubmit: (post) => {
 *       FEED_POSTS.unshift(post);             // post is already shaped for DroboardPostCard
 *       DroboardPostCard.setPosts(FEED_POSTS);
 *     },
 *   });
 *
 *   DroboardPostComposer.close();
 *
 * IMPORTANT — this component does NOT touch your feed array or call
 * DroboardPostCard itself. It only builds a post object in the exact shape
 * post-card.js expects and hands it to onSubmit(post) — the host page
 * decides where it goes.
 *
 * Post types covered (matches post-card.js's TYPE_RENDERERS, minus debate):
 *   post          — title? + text + image?(upload)
 *   motivation    — same fields as post, different pill label
 *   career-post   — same fields as post, different pill label
 *   chapter-drop  — pick an existing story OR create a new one (title/cat/cover
 *                   via photo upload) + a teaser text
 *   ama           — title + description/meta + live toggle
 *   quote         — quote + caption
 *   forum-poll    — optional title/text + question + 2-6 options
 *   forum-review  — pick a story to review + review title + review text
 */

(function () {
  'use strict';

  if (window.__droboardPostComposer) return;
  window.__droboardPostComposer = true;

  // ══════════════════════════════════════════════════════════════════════
  // CSS
  // ══════════════════════════════════════════════════════════════════════
  const CSS = `
    .pcm-bg{position:fixed;inset:0;z-index:1600;background:rgba(0,0,0,.78);backdrop-filter:blur(10px);display:none;align-items:flex-end;justify-content:center;font-family:'DM Sans',system-ui,sans-serif}
    .pcm-bg.open{display:flex}
    .pcm-sheet{width:100%;max-width:520px;background:#0a0a0a;border-radius:20px 20px 0 0;max-height:92vh;overflow-y:auto;scrollbar-width:none;animation:pcm-up .28s cubic-bezier(.32,1.1,.64,1) both;padding-bottom:max(18px,env(safe-area-inset-bottom))}
    .pcm-sheet::-webkit-scrollbar{display:none}
    @keyframes pcm-up{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
    .pcm-handle{width:36px;height:4px;background:rgba(255,255,255,.12);border-radius:4px;margin:12px auto 0}
    .pcm-hdr{display:flex;align-items:center;justify-content:space-between;padding:12px 16px 6px}
    .pcm-hdr h3{font-size:14px;font-weight:800;color:#e8e8e8;display:flex;align-items:center;gap:7px}
    .pcm-close{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.07);border:none;color:#999;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit}
    .pcm-close:hover{background:rgba(255,0,80,.15);color:#ff4d7a}

    .pcm-author-row{display:flex;align-items:center;gap:9px;padding:8px 16px 4px}
    .pcm-author-av{width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #ff0050;flex-shrink:0}
    .pcm-author-name{font-size:12px;font-weight:700;color:#e0e0e0}
    .pcm-author-sub{font-size:10px;color:#555}

    .pcm-type-row{display:flex;gap:6px;padding:10px 16px 12px;overflow-x:auto;scrollbar-width:none}
    .pcm-type-row::-webkit-scrollbar{display:none}
    .pcm-type-chip{flex-shrink:0;padding:6px 13px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:#777;transition:.15s;white-space:nowrap;user-select:none}
    .pcm-type-chip.on{background:rgba(255,0,80,.14);border-color:rgba(255,0,80,.35);color:#ff4d7a}

    .pcm-body{padding:0 16px 4px;display:flex;flex-direction:column;gap:10px}
    .pcm-lbl{font-size:9px;font-weight:800;color:#666;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;display:block}
    .pcm-inp,.pcm-select{width:100%;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.08);border-radius:11px;padding:10px 12px;color:#e0e0e0;font-family:inherit;font-size:13px;outline:none;transition:border-color .2s}
    .pcm-inp:focus,.pcm-select:focus{border-color:rgba(255,0,80,.4)}
    .pcm-inp::placeholder{color:#3a3a3a}
    .pcm-select{cursor:pointer}
    .pcm-select option{background:#111}
    .pcm-ta{width:100%;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.08);border-radius:11px;padding:11px 13px;color:#e0e0e0;font-family:inherit;font-size:13px;line-height:1.55;outline:none;resize:none;min-height:76px;transition:border-color .2s}
    .pcm-ta:focus{border-color:rgba(255,0,80,.4)}
    .pcm-ta::placeholder{color:#3a3a3a}
    .pcm-ta.pcm-quote-ta{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:15px;min-height:96px}

    .pcm-row2{display:flex;gap:8px}
    .pcm-row2 > *{flex:1;min-width:0}

    /* Toggle between existing / new story (chapter-drop) */
    .pcm-seg{display:flex;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:3px;gap:3px}
    .pcm-seg-btn{flex:1;text-align:center;padding:7px 6px;border-radius:9px;font-size:11px;font-weight:700;color:#666;cursor:pointer;transition:.15s;user-select:none}
    .pcm-seg-btn.on{background:#ff0050;color:#fff}

    /* Image upload */
    .pcm-upload{border:1.5px dashed rgba(255,255,255,.14);border-radius:12px;padding:14px;text-align:center;cursor:pointer;transition:.15s;position:relative;overflow:hidden}
    .pcm-upload:hover{border-color:rgba(255,0,80,.35);background:rgba(255,0,80,.03)}
    .pcm-upload i{font-size:18px;color:#555;margin-bottom:5px;display:block}
    .pcm-upload span{font-size:11px;font-weight:700;color:#666}
    .pcm-upload input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer}
    .pcm-preview-wrap{position:relative;border-radius:12px;overflow:hidden}
    .pcm-preview-img{width:100%;max-height:180px;object-fit:cover;display:block}
    .pcm-preview-remove{position:absolute;top:7px;right:7px;width:26px;height:26px;border-radius:50%;background:rgba(0,0,0,.65);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center}

    /* AMA live toggle */
    .pcm-switch-row{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:10px 13px}
    .pcm-switch-lbl{font-size:12px;font-weight:700;color:#ccc}
    .pcm-switch-sub{font-size:10px;color:#555;margin-top:1px}
    .pcm-switch{width:38px;height:22px;border-radius:14px;background:rgba(255,255,255,.12);position:relative;cursor:pointer;flex-shrink:0;transition:.2s}
    .pcm-switch.on{background:#ff0050}
    .pcm-switch-knob{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s}
    .pcm-switch.on .pcm-switch-knob{transform:translateX(16px)}

    /* Poll options */
    .pcm-poll-opts{display:flex;flex-direction:column;gap:7px}
    .pcm-poll-opt-row{display:flex;align-items:center;gap:7px}
    .pcm-poll-opt-row .pcm-inp{flex:1}
    .pcm-poll-remove{width:30px;height:30px;border-radius:9px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:#666;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .pcm-poll-remove:hover{background:rgba(248,113,113,.12);border-color:rgba(248,113,113,.3);color:#f87171}
    .pcm-poll-add{display:flex;align-items:center;justify-content:center;gap:6px;padding:9px;border-radius:11px;border:1.5px dashed rgba(255,255,255,.14);color:#666;font-size:11px;font-weight:700;cursor:pointer;transition:.15s}
    .pcm-poll-add:hover{border-color:rgba(255,0,80,.35);color:#ff4d7a}

    /* Story picker cards (chapter-drop existing / review) */
    .pcm-story-list{display:flex;flex-direction:column;gap:6px;max-height:220px;overflow-y:auto;scrollbar-width:none}
    .pcm-story-list::-webkit-scrollbar{display:none}
    .pcm-story-pick{display:flex;align-items:center;gap:9px;padding:8px;border-radius:11px;border:1.5px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02);cursor:pointer;transition:.15s}
    .pcm-story-pick:hover{border-color:rgba(255,0,80,.25)}
    .pcm-story-pick.on{border-color:#ff0050;background:rgba(255,0,80,.06)}
    .pcm-story-pick-thumb{width:36px;height:42px;border-radius:7px;background-size:cover;background-position:center;flex-shrink:0;background-color:#141414}
    .pcm-story-pick-body{flex:1;min-width:0}
    .pcm-story-pick-cat{font-size:8px;font-weight:800;color:#ff0050;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px}
    .pcm-story-pick-title{font-size:11px;font-weight:700;color:#ddd;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .pcm-story-pick-check{font-size:14px;color:rgba(255,255,255,.15);flex-shrink:0}
    .pcm-story-pick.on .pcm-story-pick-check{color:#ff0050}
    .pcm-empty-stories{font-size:11px;color:#555;text-align:center;padding:16px 8px;border:1px dashed rgba(255,255,255,.08);border-radius:11px}

    .pcm-footer{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 4px;gap:10px}
    .pcm-audience{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:20px;padding:6px 12px;font-size:10px;font-weight:700;color:#aaa;flex-shrink:0}
    .pcm-post-btn{flex:1;background:#ff0050;color:#fff;border:none;padding:11px;border-radius:14px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 0 16px rgba(255,0,80,.25);transition:opacity .15s}
    .pcm-post-btn:active{opacity:.85}
    .pcm-post-btn:disabled{background:#1a1a1a;color:#444;box-shadow:none;cursor:not-allowed}

    .pcm-hint{font-size:10px;color:#4a4a4a;line-height:1.5}
  `;

  // ══════════════════════════════════════════════════════════════════════
  // Type definitions
  // ══════════════════════════════════════════════════════════════════════
  const TYPES = [
    { id: 'post',          icon: '📝', label: 'Post' },
    { id: 'motivation',    icon: '✨', label: 'Motivation' },
    { id: 'career-post',   icon: '💼', label: 'Career' },
    { id: 'chapter-drop',  icon: '📖', label: 'Chapter Drop' },
    { id: 'ama',           icon: '🎙️', label: 'AMA' },
    { id: 'quote',         icon: '💬', label: 'Quote' },
    { id: 'forum-poll',    icon: '📊', label: 'Poll' },
    { id: 'forum-review',  icon: '⭐', label: 'Review' },
  ];

  // ══════════════════════════════════════════════════════════════════════
  // State
  // ══════════════════════════════════════════════════════════════════════
  let _opts = {};
  let _activeType = 'post';
  let _imageDataUrl = '';       // post / motivation / career-post / new chapter cover
  let _chapterMode = 'existing'; // 'existing' | 'new'
  let _selectedStoryId = null;   // chapter-drop existing + review
  let _pollOptionCount = 2;

  // ══════════════════════════════════════════════════════════════════════
  // Utils
  // ══════════════════════════════════════════════════════════════════════
  function _esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function _toast(msg) { if (typeof window.toast === 'function') window.toast(msg); }
  function _stories() { return _opts.stories || []; }
  function _findStory(id) { return _stories().find(s => String(s.id) === String(id)); }
  function _val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

  function _fileToDataUrl(file, cb) {
    const reader = new FileReader();
    reader.onload = () => cb(reader.result);
    reader.readAsDataURL(file);
  }

  // ══════════════════════════════════════════════════════════════════════
  // Field builders (return HTML strings for #pcmFields)
  // ══════════════════════════════════════════════════════════════════════
  function _uploadBlock(fieldKey, label) {
    if (_imageDataUrl) {
      return `<div>
        <label class="pcm-lbl">${label}</label>
        <div class="pcm-preview-wrap">
          <img class="pcm-preview-img" src="${_imageDataUrl}"/>
          <button type="button" class="pcm-preview-remove" data-remove-image="1"><i class="fas fa-xmark"></i></button>
        </div>
      </div>`;
    }
    return `<div>
      <label class="pcm-lbl">${label}</label>
      <div class="pcm-upload">
        <i class="fas fa-image"></i>
        <span>Tap to upload a photo</span>
        <input type="file" accept="image/*" id="${fieldKey}"/>
      </div>
    </div>`;
  }

  function _genericPostFields(placeholderTitle, placeholderText) {
    return `
      <div>
        <label class="pcm-lbl">Title (optional)</label>
        <input class="pcm-inp" id="pcmTitle" placeholder="${placeholderTitle}"/>
      </div>
      <div>
        <label class="pcm-lbl">What's on your mind?</label>
        <textarea class="pcm-ta" id="pcmText" placeholder="${placeholderText}"></textarea>
      </div>
      ${_uploadBlock('pcmImageInput', 'Photo (optional)')}
    `;
  }

  function _amaFields() {
    return `
      <div>
        <label class="pcm-lbl">AMA Title</label>
        <input class="pcm-inp" id="pcmTitle" placeholder="Ask Me Anything 🎙" value="Ask ${_esc(_opts.author?.name || '')} Anything 🎙"/>
      </div>
      <div>
        <label class="pcm-lbl">What's it about?</label>
        <textarea class="pcm-ta" id="pcmText" placeholder="Writing process, series secrets, anything readers want to know…"></textarea>
      </div>
      <div class="pcm-switch-row">
        <div>
          <div class="pcm-switch-lbl">Go live now</div>
          <div class="pcm-switch-sub">Shows a LIVE badge and viewer count on the card</div>
        </div>
        <div class="pcm-switch on" id="pcmLiveSwitch"><div class="pcm-switch-knob"></div></div>
      </div>
    `;
  }

  function _quoteFields() {
    return `
      <div>
        <label class="pcm-lbl">Quote</label>
        <textarea class="pcm-ta pcm-quote-ta" id="pcmQuote" placeholder="Write the line you want to pull out…"></textarea>
      </div>
      <div>
        <label class="pcm-lbl">Caption / attribution (optional)</label>
        <input class="pcm-inp" id="pcmCaption" placeholder="— Chapter 3, Season 2"/>
      </div>
    `;
  }

  function _chapterDropFields() {
    const stories = _stories();
    const segHtml = `
      <div class="pcm-seg">
        <div class="pcm-seg-btn${_chapterMode === 'existing' ? ' on' : ''}" data-seg="existing">Existing Story</div>
        <div class="pcm-seg-btn${_chapterMode === 'new' ? ' on' : ''}" data-seg="new">New Story</div>
      </div>`;

    let pickerHtml = '';
    if (_chapterMode === 'existing') {
      pickerHtml = stories.length
        ? `<div class="pcm-story-list">${stories.map(s => `
            <div class="pcm-story-pick${_selectedStoryId === s.id ? ' on' : ''}" data-pick-story="${s.id}">
              <div class="pcm-story-pick-thumb" style="background-image:url('${s.cover || ''}')"></div>
              <div class="pcm-story-pick-body">
                <div class="pcm-story-pick-cat">${_esc(s.cat || '')}</div>
                <div class="pcm-story-pick-title">${_esc(s.title || '')}</div>
              </div>
              <i class="fas fa-check-circle pcm-story-pick-check"></i>
            </div>`).join('')}</div>`
        : `<div class="pcm-empty-stories">You don't have any stories yet — switch to "New Story" to start one.</div>`;
    } else {
      pickerHtml = `
        <div>
          <label class="pcm-lbl">Story Title</label>
          <input class="pcm-inp" id="pcmNewStoryTitle" placeholder="e.g. The Runaway Bride"/>
        </div>
        <div class="pcm-row2">
          <div>
            <label class="pcm-lbl">Category</label>
            <input class="pcm-inp" id="pcmNewStoryCat" placeholder="💔 Betrayal"/>
          </div>
          <div>
            <label class="pcm-lbl">Chapter Label</label>
            <input class="pcm-inp" id="pcmNewStoryCh" placeholder="S1 · Chapter 1"/>
          </div>
        </div>
        ${_uploadBlock('pcmImageInput', 'Cover Photo')}
      `;
    }

    return `
      ${segHtml}
      ${pickerHtml}
      <div>
        <label class="pcm-lbl">Teaser for your readers</label>
        <textarea class="pcm-ta" id="pcmText" placeholder="Tease the chapter — no spoilers…"></textarea>
      </div>
    `;
  }

  function _pollFields() {
    let optsHtml = '';
    for (let i = 0; i < _pollOptionCount; i++) {
      optsHtml += `<div class="pcm-poll-opt-row">
        <input class="pcm-inp" id="pcmPollOpt${i}" placeholder="Option ${i + 1}"/>
        ${_pollOptionCount > 2 ? `<button type="button" class="pcm-poll-remove" data-remove-opt="${i}"><i class="fas fa-xmark"></i></button>` : ''}
      </div>`;
    }
    return `
      <div>
        <label class="pcm-lbl">Title (optional)</label>
        <input class="pcm-inp" id="pcmTitle" placeholder="Give your poll a headline"/>
      </div>
      <div>
        <label class="pcm-lbl">Intro (optional)</label>
        <textarea class="pcm-ta" id="pcmText" placeholder="A little context for the poll…" style="min-height:56px"></textarea>
      </div>
      <div>
        <label class="pcm-lbl">Poll Question</label>
        <input class="pcm-inp" id="pcmPollQ" placeholder="What should happen next?"/>
      </div>
      <div>
        <label class="pcm-lbl">Options</label>
        <div class="pcm-poll-opts" id="pcmPollOpts">${optsHtml}</div>
        ${_pollOptionCount < 6 ? `<div class="pcm-poll-add" id="pcmPollAdd" style="margin-top:7px"><i class="fas fa-plus"></i> Add option</div>` : ''}
      </div>
    `;
  }

  function _reviewFields() {
    const stories = _stories();
    return `
      <div>
        <label class="pcm-lbl">Which story are you reviewing?</label>
        ${stories.length
          ? `<div class="pcm-story-list">${stories.map(s => `
              <div class="pcm-story-pick${_selectedStoryId === s.id ? ' on' : ''}" data-pick-story="${s.id}">
                <div class="pcm-story-pick-thumb" style="background-image:url('${s.cover || ''}')"></div>
                <div class="pcm-story-pick-body">
                  <div class="pcm-story-pick-cat">${_esc(s.cat || '')}</div>
                  <div class="pcm-story-pick-title">${_esc(s.title || '')}</div>
                </div>
                <i class="fas fa-check-circle pcm-story-pick-check"></i>
              </div>`).join('')}</div>`
          : `<div class="pcm-empty-stories">No stories available to review yet.</div>`
        }
      </div>
      <div>
        <label class="pcm-lbl">Review Title</label>
        <input class="pcm-inp" id="pcmTitle" placeholder="If you loved X, read this next"/>
      </div>
      <div>
        <label class="pcm-lbl">Your Review</label>
        <textarea class="pcm-ta" id="pcmText" placeholder="What worked, what stuck with you…"></textarea>
      </div>
    `;
  }

  // ══════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════
  function _renderTypeChips() {
    document.getElementById('pcmTypeRow').innerHTML = TYPES.map(t =>
      `<div class="pcm-type-chip${_activeType === t.id ? ' on' : ''}" data-type="${t.id}">${t.icon} ${t.label}</div>`
    ).join('');
  }

  function _renderFields() {
    const fields = document.getElementById('pcmFields');
    if (_activeType === 'post') fields.innerHTML = _genericPostFields('Give it a heading…', "What's the update?");
    else if (_activeType === 'motivation') fields.innerHTML = _genericPostFields('A line worth remembering…', 'Share something motivating…');
    else if (_activeType === 'career-post') fields.innerHTML = _genericPostFields('e.g. My boss promoted the intern over me', 'Tell the story…');
    else if (_activeType === 'chapter-drop') fields.innerHTML = _chapterDropFields();
    else if (_activeType === 'ama') fields.innerHTML = _amaFields();
    else if (_activeType === 'quote') fields.innerHTML = _quoteFields();
    else if (_activeType === 'forum-poll') fields.innerHTML = _pollFields();
    else if (_activeType === 'forum-review') fields.innerHTML = _reviewFields();
    _bindFieldEvents();
  }

  function _renderAuthor() {
    const a = _opts.author || {};
    document.getElementById('pcmAuthorRow').innerHTML = `
      <img class="pcm-author-av" src="${a.avatar || ''}"/>
      <div>
        <div class="pcm-author-name">${_esc(a.name || 'You')}</div>
        <div class="pcm-author-sub">Posting publicly</div>
      </div>
    `;
  }

  // ══════════════════════════════════════════════════════════════════════
  // Field-level events (rebound every _renderFields call)
  // ══════════════════════════════════════════════════════════════════════
  function _bindFieldEvents() {
    // Image upload (post/motivation/career-post + chapter-drop new-story cover)
    const fileInp = document.getElementById('pcmImageInput');
    if (fileInp) {
      fileInp.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        _fileToDataUrl(file, (dataUrl) => { _imageDataUrl = dataUrl; _renderFields(); });
      });
    }
    const removeBtn = document.querySelector('[data-remove-image]');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => { _imageDataUrl = ''; _renderFields(); });
    }

    // Chapter-drop segmented control
    document.querySelectorAll('[data-seg]').forEach(el => {
      el.addEventListener('click', () => {
        _chapterMode = el.dataset.seg;
        _imageDataUrl = '';
        _renderFields();
      });
    });

    // Story picker (chapter-drop existing + review)
    document.querySelectorAll('[data-pick-story]').forEach(el => {
      el.addEventListener('click', () => {
        _selectedStoryId = el.dataset.pickStory;
        _renderFields();
      });
    });

    // AMA live switch
    const liveSwitch = document.getElementById('pcmLiveSwitch');
    if (liveSwitch) {
      liveSwitch.addEventListener('click', () => liveSwitch.classList.toggle('on'));
    }

    // Poll add/remove option
    const addBtn = document.getElementById('pcmPollAdd');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (_pollOptionCount >= 6) return;
        _pollOptionCount++;
        _renderFields();
      });
    }
    document.querySelectorAll('[data-remove-opt]').forEach(el => {
      el.addEventListener('click', () => {
        if (_pollOptionCount <= 2) return;
        _pollOptionCount--;
        _renderFields();
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // Submit — builds a post object shaped for DroboardPostCard
  // ══════════════════════════════════════════════════════════════════════
  function _baseFields() {
    const a = _opts.author || {};
    return {
      id: 'p_' + Date.now(),
      name: a.name || 'You',
      avatar: a.avatar || '',
      avatarRing: a.avatarRing || 'ring-none',
      verified: !!a.verified,
      badge: a.badge || null,
      rank: a.rank || null,
      time: 'Just now',
      pinned: false,
      mine: true,
      likes: 0,
      liked: false,
      comments: 0,
    };
  }

  function _submit() {
    const base = _baseFields();
    let post = null;

    if (_activeType === 'post' || _activeType === 'motivation' || _activeType === 'career-post') {
      const text = _val('pcmText');
      if (!text) { _toast('✍️ Write something first!'); return; }
      post = Object.assign(base, {
        type: _activeType,
        title: _val('pcmTitle') || undefined,
        text,
        image: _imageDataUrl || undefined,
      });
    }

    else if (_activeType === 'ama') {
      const title = _val('pcmTitle');
      if (!title) { _toast('🎙 Give your AMA a title!'); return; }
      post = Object.assign(base, {
        type: 'ama',
        amaData: {
          isLive: document.getElementById('pcmLiveSwitch')?.classList.contains('on'),
          viewers: Math.floor(Math.random() * 400) + 50,
          title,
          meta: _val('pcmText') || '',
        },
      });
    }

    else if (_activeType === 'quote') {
      const quote = _val('pcmQuote');
      if (!quote) { _toast('💬 Write a quote first!'); return; }
      post = Object.assign(base, {
        type: 'quote',
        quote,
        caption: _val('pcmCaption') || undefined,
      });
    }

    else if (_activeType === 'chapter-drop') {
      const text = _val('pcmText');
      if (!text) { _toast('✍️ Add a teaser for readers!'); return; }
      let chapterRef;
      if (_chapterMode === 'existing') {
        const story = _findStory(_selectedStoryId);
        if (!story) { _toast('📖 Pick a story first!'); return; }
        chapterRef = { cat: story.cat || '', title: story.title || '', ch: story.ch || '', cover: story.cover || '' };
      } else {
        const title = _val('pcmNewStoryTitle');
        if (!title || !_imageDataUrl) { _toast('📖 Add a title and cover photo for the new story!'); return; }
        chapterRef = { cat: _val('pcmNewStoryCat') || 'New Story', title, ch: _val('pcmNewStoryCh') || 'Chapter 1', cover: _imageDataUrl };
      }
      post = Object.assign(base, { type: 'chapter-drop', text, chapterRef });
    }

    else if (_activeType === 'forum-poll') {
      const q = _val('pcmPollQ');
      const opts = [];
      for (let i = 0; i < _pollOptionCount; i++) {
        const t = _val('pcmPollOpt' + i);
        if (t) opts.push({ t, v: 0 });
      }
      if (!q || opts.length < 2) { _toast('📊 Add a question and at least 2 options!'); return; }
      post = Object.assign(base, {
        type: 'forum-poll',
        title: _val('pcmTitle') || undefined,
        text: _val('pcmText') || undefined,
        poll: { q, opts, total: 0, voted: -1 },
      });
    }

    else if (_activeType === 'forum-review') {
      const story = _findStory(_selectedStoryId);
      const text = _val('pcmText');
      if (!story) { _toast('⭐ Pick a story to review!'); return; }
      if (!text) { _toast('✍️ Write your review first!'); return; }
      post = Object.assign(base, {
        type: 'forum-review',
        title: _val('pcmTitle') || undefined,
        text,
        storyRef: { cat: story.cat || '', title: story.title || '', cover: story.cover || '', writer: story.writer || '' },
      });
    }

    if (!post) return;
    if (typeof _opts.onSubmit === 'function') _opts.onSubmit(post);
    _toast('✅ Post published!');
    close();
  }

  // ══════════════════════════════════════════════════════════════════════
  // Open / close
  // ══════════════════════════════════════════════════════════════════════
  function open(options) {
    _opts = options || {};
    _activeType = _opts.defaultType || 'post';
    _imageDataUrl = '';
    _chapterMode = 'existing';
    _selectedStoryId = null;
    _pollOptionCount = 2;

    _renderAuthor();
    _renderTypeChips();
    _renderFields();

    document.getElementById('pcmBg').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    document.getElementById('pcmBg').classList.remove('open');
    document.body.style.overflow = '';
  }

  // ══════════════════════════════════════════════════════════════════════
  // Inject + bind top-level events (once)
  // ══════════════════════════════════════════════════════════════════════
  function inject() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="pcm-bg" id="pcmBg">
        <div class="pcm-sheet">
          <div class="pcm-handle"></div>
          <div class="pcm-hdr">
            <h3><i class="fas fa-plus-circle" style="color:#ff0050;font-size:13px"></i> Create Post</h3>
            <button class="pcm-close" id="pcmClose">✕</button>
          </div>
          <div class="pcm-author-row" id="pcmAuthorRow"></div>
          <div class="pcm-type-row" id="pcmTypeRow"></div>
          <div class="pcm-body" id="pcmFields"></div>
          <div class="pcm-footer">
            <div class="pcm-audience"><i class="fas fa-globe-africa" style="color:#ff0050"></i> Everyone</div>
            <button class="pcm-post-btn" id="pcmSubmit">Post →</button>
          </div>
        </div>
      </div>
    `.trim();
    document.body.appendChild(wrap.firstElementChild);

    document.getElementById('pcmClose').addEventListener('click', close);
    document.getElementById('pcmBg').addEventListener('click', function (e) { if (e.target === this) close(); });
    document.getElementById('pcmSubmit').addEventListener('click', _submit);

    document.getElementById('pcmTypeRow').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-type]');
      if (!chip) return;
      _activeType = chip.dataset.type;
      _imageDataUrl = '';
      _chapterMode = 'existing';
      _selectedStoryId = null;
      _pollOptionCount = 2;
      _renderTypeChips();
      _renderFields();
    });
  }

  window.DroboardPostComposer = { open, close };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

})();