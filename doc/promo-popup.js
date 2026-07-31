(function () {
  'use strict';

  /* ─── CONFIG ─────────────────────────────────────────────── */
  const SLIDE_DURATION = 5000; // ms per slide before auto-advancing
  const AUTO_OPEN_DELAY = 8000; // ms after page load before popup appears (0 = immediate)

  const SLIDES = [
    {
      bg: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=700&q=70',
      gradient: 'linear-gradient(135deg,#1a0010,#2d0030)',
      badgeBg: '#ff0050',
      badgeColor: '#fff',
      badgeText: '🔥 Hot This Week',
      catColor: 'rgba(255,130,160,.9)',
      catText: '✨ Twist',
      title: 'The Runaway Bride — I left at the altar in my socked feet',
      avatar: 'https://i.pravatar.cc/100?img=53',
      avatarBorder: '',
      author: '@Ifeanyi_Story',
      likes: '❤️ 45k likes',
      excerpt: 'Four hundred guests. A dress that cost a fortune. And a pastor who said "speak now or forever hold your peace." I opened my mouth.',
      btnBg: '#ff0050',
      btnColor: '#fff',
      accentColor: '#ff0050',
      storySlug: 'the-runaway-bride',
    },
    {
      bg: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&q=70',
      gradient: 'linear-gradient(135deg,#001020,#001a30)',
      badgeBg: '#3b0764',
      badgeColor: '#d8b4fe',
      badgeText: '📖 New Chapter',
      catColor: '#60a5fa',
      catText: '💔 Betrayal',
      title: 'I came home early and caught my husband kissing my late sister\'s photograph',
      avatar: 'https://i.pravatar.cc/100?img=32',
      avatarBorder: '1.5px solid #60a5fa',
      author: '@Ada_Writes',
      likes: '❤️ 24.3k likes',
      excerpt: 'I opened the front door quietly. A surprise dinner was my plan. But there was a sound from the sitting room — low, like a sob and a prayer.',
      btnBg: '#60a5fa',
      btnColor: '#000',
      accentColor: '#60a5fa',
      storySlug: 'husband-sisters-photograph',
    },
    {
      bg: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=700&q=70',
      gradient: 'linear-gradient(135deg,#001a10,#002a18)',
      badgeBg: 'rgba(74,222,128,.12)',
      badgeColor: '#4ade80',
      badgeBorder: '1px solid rgba(74,222,128,.35)',
      badgeText: '📈 Trending',
      catColor: '#4ade80',
      catText: '👑 Family',
      title: 'My grandmother\'s will revealed I wasn\'t her blood — but she left everything to me',
      avatar: 'https://i.pravatar.cc/100?img=47',
      avatarBorder: '1.5px solid #4ade80',
      author: '@Chiamaka_N',
      likes: '❤️ 31k likes',
      excerpt: 'The lawyer said: "Miss Obi was adopted at eleven days old." The room went very quiet. The kind that isn\'t the absence of sound…',
      btnBg: '#4ade80',
      btnColor: '#000',
      accentColor: '#4ade80',
      storySlug: 'grandmothers-will',
    },
  ];

  /* ─── STYLES ──────────────────────────────────────────────── */
  const css = `
.drb-overlay{position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;animation:drbOverlayIn .3s ease}
@keyframes drbOverlayIn{from{opacity:0}to{opacity:1}}
.drb-overlay.drb-hiding{animation:drbOverlayOut .3s ease forwards}
@keyframes drbOverlayOut{from{opacity:1}to{opacity:0}}
.drb-card{width:100%;max-width:390px;background:#0a0a0d;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.1);position:relative;animation:drbCardIn .35s cubic-bezier(.34,1.56,.64,1);box-shadow:0 24px 60px rgba(0,0,0,.9);font-family:'DM Sans',sans-serif}
@keyframes drbCardIn{from{opacity:0;transform:scale(.88) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
.drb-card.drb-hiding{animation:drbCardOut .28s ease forwards}
@keyframes drbCardOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.92)}}
.drb-close{position:absolute;top:11px;right:11px;z-index:20;width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.65);border:1px solid rgba(255,255,255,.22);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;line-height:1;transition:.15s;font-family:inherit}
.drb-close:hover{background:rgba(255,0,80,.3);border-color:#ff0050}
.drb-viewport{overflow:hidden;width:100%}
.drb-track{display:flex;transition:transform .42s cubic-bezier(.4,0,.2,1)}
.drb-slide{flex:0 0 100%;position:relative}
.drb-cover{height:195px;position:relative;overflow:hidden}
.drb-cover-bg{position:absolute;inset:0;background-size:cover;background-position:center 30%;opacity:.22}
.drb-cover-grad{position:absolute;inset:0;background:linear-gradient(0deg,#0a0a0d 0%,rgba(0,0,0,.18) 100%)}
.drb-badge{position:absolute;top:13px;left:13px;font-size:9px;font-weight:800;padding:3px 10px;border-radius:20px;letter-spacing:.06em;text-transform:uppercase;font-family:inherit}
.drb-cover-body{position:absolute;bottom:13px;left:13px;right:44px}
.drb-cat{font-size:10px;font-weight:700;margin-bottom:4px}
.drb-title{font-size:15px;font-weight:700;color:#fff;line-height:1.3;text-shadow:0 2px 12px rgba(0,0,0,.8)}
.drb-pb-wrap{position:absolute;bottom:0;left:0;right:0;height:2px;background:rgba(255,255,255,.1);z-index:10}
.drb-pb-fill{height:100%;width:0%}
.drb-body{padding:12px 14px 14px}
.drb-author-row{display:flex;align-items:center;gap:8px;margin-bottom:9px}
.drb-author-row img{width:26px;height:26px;border-radius:50%;object-fit:cover}
.drb-author{font-size:11px;color:#ccc}
.drb-likes{margin-left:auto;font-size:10px;color:#888}
.drb-excerpt{font-size:12px;color:#aaa;line-height:1.55;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.drb-read-btn{width:100%;border:none;padding:10px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;letter-spacing:.02em;transition:.15s}
.drb-read-btn:active{transform:scale(.97)}
.drb-read-btn:disabled{opacity:.7;cursor:not-allowed}
.drb-footer{padding:10px 14px 13px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,.07)}
.drb-dots{display:flex;gap:5px;align-items:center}
.drb-dot{height:4px;border-radius:2px;cursor:pointer;transition:width .35s,background .35s;background:rgba(255,255,255,.25);width:6px;border:none;padding:0}
.drb-dot.drb-active{width:20px}
.drb-footer-right{display:flex;align-items:center;gap:7px}
.drb-countdown{display:flex;align-items:center;gap:4px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:4px 10px}
.drb-countdown-label{font-size:9px;color:#888;font-family:inherit}
.drb-countdown-num{font-size:13px;font-weight:800;color:#fff;font-family:monospace;min-width:12px;text-align:center}
.drb-pause{width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#aaa;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;transition:.15s;font-family:inherit}
.drb-pause:hover{background:rgba(255,255,255,.12);color:#fff}
.drb-reopen{position:fixed;bottom:20px;right:20px;z-index:8999;background:#ff0050;color:#fff;border:none;padding:10px 18px;border-radius:24px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 4px 20px rgba(255,0,80,.4);display:none;animation:drbFadeUp .3s ease}
@keyframes drbFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.drb-reopen:active{transform:scale(.96)}
`;

  /* ─── BUILD HTML ──────────────────────────────────────────── */
  function buildHTML() {
    const slidesHTML = SLIDES.map((s, i) => `
      <div class="drb-slide">
        <div class="drb-cover" style="background:${s.gradient}">
          <div class="drb-cover-bg" style="background-image:url('${s.bg}')"></div>
          <div class="drb-cover-grad"></div>
          <div class="drb-badge" style="background:${s.badgeBg};color:${s.badgeColor};${s.badgeBorder ? 'border:' + s.badgeBorder : ''}">${s.badgeText}</div>
          <div class="drb-cover-body">
            <div class="drb-cat" style="color:${s.catColor}">${s.catText}</div>
            <div class="drb-title">${s.title}</div>
          </div>
          <div class="drb-pb-wrap"><div class="drb-pb-fill" id="drb-pb-${i}" style="background:${s.accentColor}"></div></div>
        </div>
        <div class="drb-body">
          <div class="drb-author-row">
            <img src="${s.avatar}" loading="lazy" alt="${s.author}" style="${s.avatarBorder ? 'border:' + s.avatarBorder : ''}">
            <span class="drb-author">${s.author}</span>
            <span class="drb-likes">${s.likes}</span>
          </div>
          <div class="drb-excerpt">${s.excerpt}</div>
          <button class="drb-read-btn" style="background:${s.btnBg};color:${s.btnColor}" data-slug="${s.storySlug}" data-index="${i}">Read Now →</button>
        </div>
      </div>`).join('');

    const dotsHTML = SLIDES.map((s, i) =>
      `<button class="drb-dot${i === 0 ? ' drb-active' : ''}" data-i="${i}" aria-label="Go to slide ${i + 1}"></button>`
    ).join('');

    return `
      <div class="drb-overlay" id="drb-overlay" role="dialog" aria-modal="true" aria-label="Featured stories">
        <div class="drb-card" id="drb-card">
          <button class="drb-close" id="drb-close" aria-label="Close">&#x2715;</button>
          <div class="drb-viewport">
            <div class="drb-track" id="drb-track">${slidesHTML}</div>
          </div>
          <div class="drb-footer">
            <div class="drb-dots" id="drb-dots">${dotsHTML}</div>
            <div class="drb-footer-right">
              <div class="drb-countdown">
                <span class="drb-countdown-label">Next in</span>
                <span class="drb-countdown-num" id="drb-timer">5</span>
                <span class="drb-countdown-label">s</span>
              </div>
              <button class="drb-pause" id="drb-pause" aria-label="Pause auto-slide">⏸</button>
            </div>
          </div>
        </div>
      </div>
      <button class="drb-reopen" id="drb-reopen">📖 Featured Stories</button>`;
  }

  /* ─── INJECT STYLES + HTML ────────────────────────────────── */
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const wrapper = document.createElement('div');
  wrapper.innerHTML = buildHTML();
  document.body.appendChild(wrapper);

  /* ─── ELEMENT REFS ────────────────────────────────────────── */
  const overlay   = document.getElementById('drb-overlay');
  const card      = document.getElementById('drb-card');
  const track     = document.getElementById('drb-track');
  const timerEl   = document.getElementById('drb-timer');
  const pauseBtn  = document.getElementById('drb-pause');
  const closeBtn  = document.getElementById('drb-close');
  const reopenBtn = document.getElementById('drb-reopen');
  const dotEls    = document.querySelectorAll('.drb-dot');
  const pbEls     = SLIDES.map((_, i) => document.getElementById('drb-pb-' + i));

  /* ─── STATE ───────────────────────────────────────────────── */
  let current  = 0;
  let paused   = false;
  let timeLeft = SLIDE_DURATION / 1000;
  let countdownInterval = null;
  let progressRAF       = null;
  let progressElapsed   = 0;
  let progressStart     = null;

  /* ─── GO TO SLIDE ─────────────────────────────────────────── */
  function goTo(n) {
    current = ((n % SLIDES.length) + SLIDES.length) % SLIDES.length;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';

    dotEls.forEach((d, i) => {
      const isActive = i === current;
      d.classList.toggle('drb-active', isActive);
      d.style.background = isActive ? SLIDES[current].accentColor : 'rgba(255,255,255,0.25)';
    });

    pbEls.forEach((pb, i) => {
      pb.style.transition = 'none';
      pb.style.width = i < current ? '100%' : '0%';
    });
  }

  function userGoTo(n) {
    goTo(n);
    restartTimers();
  }

  function next() {
    goTo(current + 1);
    restartTimers();
  }

  /* ─── COUNTDOWN ───────────────────────────────────────────── */
  function startCountdown() {
    clearInterval(countdownInterval);
    timeLeft = Math.ceil(SLIDE_DURATION / 1000);
    timerEl.textContent = timeLeft;
    countdownInterval = setInterval(() => {
      if (paused) return;
      timeLeft = Math.max(0, timeLeft - 1);
      timerEl.textContent = timeLeft;
      if (timeLeft <= 0) clearInterval(countdownInterval);
    }, 1000);
  }

  /* ─── PROGRESS BAR ────────────────────────────────────────── */
  function startProgress() {
    cancelAnimationFrame(progressRAF);
    progressElapsed = 0;
    progressStart   = null;
    const pb = pbEls[current];
    pb.style.transition = 'none';
    pb.style.width = '0%';

    function tick(ts) {
      if (!progressStart) progressStart = ts;
      if (!paused) progressElapsed += ts - progressStart;
      progressStart = ts;
      const pct = Math.min(100, (progressElapsed / SLIDE_DURATION) * 100);
      pb.style.width = pct + '%';
      if (pct >= 100) { next(); return; }
      progressRAF = requestAnimationFrame(tick);
    }
    progressRAF = requestAnimationFrame(tick);
  }

  function restartTimers() {
    cancelAnimationFrame(progressRAF);
    clearInterval(countdownInterval);
    startCountdown();
    startProgress();
  }

  /* ─── PAUSE / RESUME ──────────────────────────────────────── */
  function togglePause() {
    paused = !paused;
    pauseBtn.textContent = paused ? '▶' : '⏸';
    pauseBtn.setAttribute('aria-label', paused ? 'Resume auto-slide' : 'Pause auto-slide');

    if (!paused) {
      const pb = pbEls[current];
      progressElapsed = (parseFloat(pb.style.width) / 100) * SLIDE_DURATION;
      progressStart = null;
      cancelAnimationFrame(progressRAF);

      function tick(ts) {
        if (!progressStart) progressStart = ts;
        progressElapsed += ts - progressStart;
        progressStart = ts;
        const pct = Math.min(100, (progressElapsed / SLIDE_DURATION) * 100);
        pb.style.width = pct + '%';
        timeLeft = Math.ceil(((100 - pct) / 100) * (SLIDE_DURATION / 1000));
        timerEl.textContent = Math.max(0, timeLeft);
        if (pct >= 100) { next(); return; }
        progressRAF = requestAnimationFrame(tick);
      }
      progressRAF = requestAnimationFrame(tick);
    }
  }

  /* ─── OPEN / CLOSE ────────────────────────────────────────── */
  function open() {
    overlay.style.display = 'flex';
    reopenBtn.style.display = 'none';
    paused = false;
    pauseBtn.textContent = '⏸';
    goTo(0);
    restartTimers();
  }

  function close() {
    cancelAnimationFrame(progressRAF);
    clearInterval(countdownInterval);
    overlay.classList.add('drb-hiding');
    card.classList.add('drb-hiding');
    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.classList.remove('drb-hiding');
      card.classList.remove('drb-hiding');
      reopenBtn.style.display = 'block';
    }, 300);
  }

  /* ─── READ BUTTON ─────────────────────────────────────────── */
  function handleRead(btn) {
    const slug = btn.dataset.slug;
    const original = btn.textContent;
    btn.textContent = 'Opening…';
    btn.disabled = true;

    // Dispatch a custom event so your app can wire its own router
    document.dispatchEvent(new CustomEvent('drb:read', { detail: { slug } }));

    // Default fallback: navigate to /story/<slug>
    // Remove or override this if you handle the event above
    setTimeout(() => {
      if (window.location.pathname !== '/story/' + slug) {
        window.location.href = '/story/' + slug;
      } else {
        btn.textContent = original;
        btn.disabled = false;
      }
    }, 800);
  }

  /* ─── EVENTS ──────────────────────────────────────────────── */
  closeBtn.addEventListener('click', close);
  reopenBtn.addEventListener('click', open);
  pauseBtn.addEventListener('click', togglePause);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  dotEls.forEach(d => d.addEventListener('click', () => userGoTo(+d.dataset.i)));

  track.querySelectorAll('.drb-read-btn').forEach(btn =>
    btn.addEventListener('click', () => handleRead(btn))
  );

  // Touch / swipe
  let touchX = 0;
  track.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) userGoTo(dx < 0 ? current + 1 : current - 1);
  }, { passive: true });

  // Mouse drag (desktop)
  let mouseX = 0, dragging = false;
  track.addEventListener('mousedown', e => { mouseX = e.clientX; dragging = true; });
  track.addEventListener('mouseup', e => {
    if (!dragging) return;
    dragging = false;
    const dx = e.clientX - mouseX;
    if (Math.abs(dx) > 40) userGoTo(dx < 0 ? current + 1 : current - 1);
  });
  track.addEventListener('mouseleave', () => { dragging = false; });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (overlay.style.display === 'none') return;
    if (e.key === 'ArrowRight') userGoTo(current + 1);
    if (e.key === 'ArrowLeft')  userGoTo(current - 1);
    if (e.key === 'Escape')     close();
    if (e.key === ' ')          { e.preventDefault(); togglePause(); }
  });

  /* ─── INIT ────────────────────────────────────────────────── */
  overlay.style.display = 'none'; // hide until auto-open fires

  if (AUTO_OPEN_DELAY > 0) {
    setTimeout(open, AUTO_OPEN_DELAY);
  } else {
    open();
  }

  /* ─── PUBLIC API (optional) ───────────────────────────────── */
  window.DroboardPopup = { open, close, goTo: userGoTo, togglePause };

  /*
  ─── USAGE ────────────────────────────────────────────────────
  Drop this one line in your page, before </body>:

    <script src="/promo-popup.js"></script>

  Customise behaviour at the top of the file:
    SLIDE_DURATION   — ms each slide stays before advancing
    AUTO_OPEN_DELAY  — ms after page load before popup opens (0 = instant)
    SLIDES           — array of story objects (add/remove/edit freely)

  Listen for the read button in your router:
    document.addEventListener('drb:read', e => {
      const { slug } = e.detail;   // e.g. "the-runaway-bride"
      myRouter.push('/story/' + slug);
    });

  Control the popup from anywhere in your app:
    DroboardPopup.open()
    DroboardPopup.close()
    DroboardPopup.goTo(1)
    DroboardPopup.togglePause()
  ──────────────────────────────────────────────────────────────
  */

}());