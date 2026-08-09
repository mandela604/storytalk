/**
 * services/profile-data.js — Demo Profile API (window.ProfileData)
 * ───────────────────────────────────────────────────────────────
 * DEMO ONLY. UI calls these methods and only renders.
 * Reads/writes in-memory store from data/profile-demo-seed.js.
 *
 * When going live: delete seed + this file, write a new profile-data.js
 * that hits the real API with the SAME function names and return shapes.
 *
 * Scripts:
 *   services/auth-session.js
 *   data/profile-demo-seed.js
 *   services/profile-data.js
 */
(function (global) {
  'use strict';

  const seed = global.ProfileDemoSeed;
  if (!seed || !seed.DEMO_PROFILES) {
    console.error('[ProfileData] Load data/profile-demo-seed.js first');
  }

  const GENRES_ALL = (seed && seed.GENRES_ALL) || [];
  const COVERS = (seed && seed.COVERS) || {};
  const STORE = seed ? JSON.parse(JSON.stringify(seed.DEMO_PROFILES)) : {};

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function normalizeHandle(handle) {
    return (handle || '').replace(/^@/, '');
  }

  function genreLabel(id) {
    return (GENRES_ALL.find(g => g.id === id) || {}).label || id;
  }

  function requireProfile(key) {
    const p = STORE[key];
    if (!p) throw new Error('Profile not found');
    return p;
  }

  function findPost(profile, postId) {
    const post = (profile.posts || []).find(x => x.id === postId);
    if (!post) throw new Error('Post not found');
    return post;
  }

  async function getCurrentUserHandle() {
    if (global.AuthSession && AuthSession.getCurrentUserHandle) {
      return AuthSession.getCurrentUserHandle();
    }
    return 'Ada_Writes';
  }

  async function getProfile(handle) {
    const key = normalizeHandle(handle);
    await delay(180);
    return STORE[key] ? clone(STORE[key]) : null;
  }

  async function updateProfile(handle, patch) {
    const key = normalizeHandle(handle);
    const allowed = ['name', 'bio', 'location', 'avatar', 'cover', 'about'];
    const safe = {};
    allowed.forEach(k => {
      if (patch && patch[k] !== undefined) safe[k] = patch[k];
    });
    await delay(250);
    const base = requireProfile(key);
    if (safe.about !== undefined) {
      base.about = { ...(base.about || {}), ...(safe.about || {}) };
      if (Array.isArray(safe.about.favoriteGenres)) {
        base.genres = safe.about.favoriteGenres.slice();
      }
      delete safe.about;
    }
    Object.assign(base, safe);
    return clone(base);
  }

  async function updateGenres(handle, genreIds) {
    const key = normalizeHandle(handle);
    const ids = Array.isArray(genreIds) ? genreIds.filter(Boolean) : [];
    await delay(200);
    const base = requireProfile(key);
    base.genres = ids.slice();
    base.about = base.about || {};
    base.about.favoriteGenres = ids.slice();
    return clone(base);
  }

  async function followUser(handle, targetHandle) {
    const key = normalizeHandle(handle);
    const target = normalizeHandle(targetHandle);
    await delay(200);
    const base = requireProfile(key);
    base.following = base.following || [];
    let row = base.following.find(f => f.name === target);
    if (row) row.following = true;
    else {
      base.following.push({
        name: target,
        av: 'https://i.pravatar.cc/100?u=' + encodeURIComponent(target),
        meta: 'On Droboard',
        following: true,
      });
    }
    base.stats = base.stats || {};
    base.stats.following = base.following.filter(f => f.following).length;
    return clone(base);
  }

  async function unfollowUser(handle, targetHandle) {
    const key = normalizeHandle(handle);
    const target = normalizeHandle(targetHandle);
    await delay(200);
    const base = requireProfile(key);
    base.following = base.following || [];
    const row = base.following.find(f => f.name === target);
    if (row) row.following = false;
    base.stats = base.stats || {};
    base.stats.following = base.following.filter(f => f.following).length;
    return clone(base);
  }

  async function createPost(handle, payload) {
    const key = normalizeHandle(handle);
    const {
      type = 'post', text = '', quote = '', caption = '', note = '',
      chapterRef = null, storyRef = null, amaData = null, pinned = false,
    } = payload || {};
    await delay(300);
    const base = requireProfile(key);
    base.posts = base.posts || [];
    const post = {
      id: 'p_' + Date.now(), type, time: 'Just now', pinned: !!pinned,
      liked: false, likes: 0, comments: 0, saved: false,
      text, quote, caption, note, chapterRef, storyRef, amaData,
    };
    if (pinned) base.posts.forEach(p => { p.pinned = false; });
    base.posts.unshift(post);
    return clone(base);
  }

  async function pinPost(handle, postId, pinned) {
    if (pinned === undefined) pinned = true;
    const key = normalizeHandle(handle);
    await delay(200);
    const base = requireProfile(key);
    const post = findPost(base, postId);
    if (pinned) (base.posts || []).forEach(p => { p.pinned = false; });
    post.pinned = !!pinned;
    if (post.pinned) base.posts = [post].concat(base.posts.filter(p => p.id !== postId));
    return clone(base);
  }

  async function likePost(handle, postId) {
    const key = normalizeHandle(handle);
    await delay(120);
    const base = requireProfile(key);
    const post = findPost(base, postId);
    if (!post.liked) { post.liked = true; post.likes = (post.likes || 0) + 1; }
    return clone(base);
  }

  async function unlikePost(handle, postId) {
    const key = normalizeHandle(handle);
    await delay(120);
    const base = requireProfile(key);
    const post = findPost(base, postId);
    if (post.liked) { post.liked = false; post.likes = Math.max(0, (post.likes || 0) - 1); }
    return clone(base);
  }

  async function savePost(handle, postId, saved) {
    if (saved === undefined) saved = true;
    const key = normalizeHandle(handle);
    await delay(120);
    const base = requireProfile(key);
    const post = findPost(base, postId);
    post.saved = !!saved;
    base.stats = base.stats || {};
    if (saved) base.stats.saved = (base.stats.saved || 0) + 1;
    else base.stats.saved = Math.max(0, (base.stats.saved || 0) - 1);
    return clone(base);
  }

  async function deletePost(handle, postId) {
    const key = normalizeHandle(handle);
    await delay(200);
    const base = requireProfile(key);
    base.posts = (base.posts || []).filter(p => p.id !== postId);
    return clone(base);
  }

  async function becomeWriter(handle, payload) {
    const key = normalizeHandle(handle);
    const firstBookTitle = (payload && payload.firstBookTitle) || 'Untitled';
    const genre = payload && payload.genre;
    await delay(400);
    const base = requireProfile(key);
    base.isWriter = true;
    base.verified = true;
    base.stats = base.stats || {};
    base.stats.books = (base.stats.books || 0) + 1;
    base.books = base.books || [];
    base.books.unshift({
      id: 'new_' + Date.now(),
      title: firstBookTitle,
      cat: genreLabel(genre) || 'Story',
      cover: COVERS.c5 || '',
      reads: '0',
      likes: '0',
      rating: '—',
      chapters: 1,
    });
    base.achievements = base.achievements || [];
    if (!base.achievements.some(a => a.label === 'Verified Writer')) {
      base.achievements.unshift({ label: 'Verified Writer', cls: 'blue' });
    }
    return clone(base);
  }

  global.ProfileData = {
    GENRES_ALL: GENRES_ALL,
    getCurrentUserHandle: getCurrentUserHandle,
    getProfile: getProfile,
    updateProfile: updateProfile,
    updateGenres: updateGenres,
    followUser: followUser,
    unfollowUser: unfollowUser,
    createPost: createPost,
    pinPost: pinPost,
    likePost: likePost,
    unlikePost: unlikePost,
    savePost: savePost,
    deletePost: deletePost,
    becomeWriter: becomeWriter,
  };
})(window);
