/**
 * data/profile-demo-seed.js — Demo seed only (window.ProfileDemoSeed)
 * ─────────────────────────────────────────────────────────────────
 * Delete this file (and its <script> tag) when going live.
 * profile-data.js only reads it when CONFIG.USE_DEMO is true.
 */
(function (global) {
  'use strict';

  const GENRES_ALL = [
    { id: 'romance', label: 'Romance' },
    { id: 'werewolf', label: 'Werewolf' },
    { id: 'mafia', label: 'Mafia' },
    { id: 'billionaire', label: 'Billionaire' },
    { id: 'fantasy', label: 'Fantasy' },
    { id: 'campus', label: 'Campus' },
    { id: 'thriller', label: 'Thriller' },
    { id: 'drama', label: 'Drama' },
    { id: 'betrayal', label: 'Betrayal' },
    { id: 'horror', label: 'Horror' },
    { id: 'mystery', label: 'Mystery' },
    { id: 'historical', label: 'Historical' },
  ];

  const COVERS = {
    c1: 'https://i.postimg.cc/vDn9YLx5/wife2.jpg',
    c2: 'https://i.postimg.cc/RqtfSQJJ/wife3.jpg',
    c3: 'https://i.postimg.cc/ftRZbhKx/3.jpg',
    c4: 'https://i.postimg.cc/DJwFzKgd/4.jpg',
    c5: 'https://i.postimg.cc/N9jY0w4m/5.jpg',
    c6: 'https://i.postimg.cc/WF1j4Pnh/6.jpg',
    c7: 'https://i.postimg.cc/xqmHfyNR/wolf2.jpg',
    c8: 'https://i.postimg.cc/fkdXzjS8/wolf.jpg',
  };

  const DEMO_PROFILES = {
    Ada_Writes: {
      handle: 'Ada_Writes',
      name: 'Ada Writes',
      avatar: 'https://i.pravatar.cc/200?img=32',
      cover: COVERS.c1,
      verified: true,
      isWriter: true,
      bio: 'Writing messy love, power, and the kind of endings that keep you up. Betrayal series updates every Friday.',
      genres: ['romance', 'betrayal', 'mafia', 'drama'],
      location: 'Lagos, Nigeria',
      joinedLabel: 'Joined March 2023',
      stats: {
        following: 128,
        followers: 48200,
        books: 3,
        reads: 1280000,
        likes: 214000,
        saved: 0,
        reactions: 0,
        comments: 0,
      },
      achievements: [
        { label: 'Top Romance 2025', cls: 'gold' },
        { label: '1M+ Reads', cls: 'red' },
        { label: 'Verified Writer', cls: 'blue' },
        { label: 'Weekly Streak', cls: 'purple' },
      ],
      books: [
        { id: 'b1', title: 'Season of Betrayal', cat: 'Romance · Drama', cover: COVERS.c1, reads: '820k', likes: '94k', rating: '4.9', chapters: 62 },
        { id: 'b2', title: 'Crowned in Sin', cat: 'Mafia', cover: COVERS.c2, reads: '310k', likes: '41k', rating: '4.7', chapters: 48 },
        { id: 'b3', title: 'Until You Regret', cat: 'Revenge · Romance', cover: COVERS.c4, reads: '150k', likes: '22k', rating: '4.8', chapters: 35 },
      ],
      library: [],
      collections: [
        { name: 'Slow Burn Favorites', count: 12, privacy: 'Public', covers: [COVERS.c3, COVERS.c5, COVERS.c6, COVERS.c7] },
        { name: 'Draft Moodboards', count: 4, privacy: 'Private', covers: [COVERS.c8, COVERS.c2, COVERS.c1, COVERS.c4] },
      ],
      following: [
        { name: 'Sarah_Odum', av: 'https://i.pravatar.cc/100?img=48', meta: 'Billionaire romance · 2.1M reads', following: true },
        { name: 'Bode_Ilo', av: 'https://i.pravatar.cc/100?img=12', meta: 'Campus comedies', following: true },
        { name: 'Luna_Grey', av: 'https://i.pravatar.cc/100?img=15', meta: 'Fantasy & fangs', following: false },
        { name: 'Zara_M', av: 'https://i.pravatar.cc/100?img=9', meta: 'Verified · Devil in a Suit', following: true },
      ],
      posts: [
        {
          id: 'pp1', type: 'chapter-drop', time: '2h', pinned: true, liked: false, likes: 1840, comments: 226, saved: false,
          text: 'Chapter 63 is live. She finally opens the letter.',
          chapterRef: { title: 'Season of Betrayal', ch: 'Chapter 63', cat: 'Romance · Drama', cover: COVERS.c1 },
        },
        {
          id: 'pp2', type: 'ama', time: 'Yesterday', pinned: false, liked: true, likes: 920, comments: 410, saved: false,
          amaData: { title: 'AMA: Writing the Betrayal ending', meta: 'Ask about plot twists, characters, and Friday drops.', viewers: 3200 },
        },
        {
          id: 'pp3', type: 'quote', time: '3d', pinned: false, liked: false, likes: 540, comments: 48, saved: false,
          quote: 'Love is not the opposite of power. It is the only thing that survives it.',
          caption: '— from Season of Betrayal, Ch. 41',
        },
        {
          id: 'pp4', type: 'post', time: '1w', pinned: false, liked: false, likes: 310, comments: 67, saved: false,
          text: 'For everyone asking: yes, Season 3 of the Betrayal series is coming. Dropping next Friday. Midnight. Set your alarms.',
        },
        {
          id: 'pp5', type: 'repost', time: '2w', pinned: false, liked: false, likes: 188, comments: 22, saved: false,
          note: 'If you like messy marriage plots, start here.',
          storyRef: { title: 'The Billionaire Never Forgets', cat: 'Billionaire', author: 'Sarah_Odum', cover: COVERS.c3 },
        },
      ],
      about: {
        favoriteGenres: ['romance', 'betrayal', 'mafia', 'drama'],
        extra: [
          { icon: 'fa-globe', label: 'Website', value: 'ada.writes' },
          { icon: 'fa-book', label: 'Currently writing', value: 'Season of Betrayal · S3' },
          { icon: 'fa-heart', label: 'Favorite trope', value: 'Enemies to lovers' },
        ],
      },
    },

    Sarah_Odum: {
      handle: 'Sarah_Odum',
      name: 'Sarah Odum',
      avatar: 'https://i.pravatar.cc/200?img=48',
      cover: COVERS.c3,
      verified: true,
      isWriter: true,
      bio: 'Billionaire romance. New chapters weekly. Soft on the outside, plot twist on the inside.',
      genres: ['billionaire', 'romance', 'drama'],
      location: 'Abuja, Nigeria',
      joinedLabel: 'Joined June 2022',
      stats: { following: 89, followers: 91000, books: 2, reads: 2100000, likes: 340000, saved: 0, reactions: 0, comments: 0 },
      achievements: [
        { label: '2M+ Reads', cls: 'gold' },
        { label: 'Verified Writer', cls: 'blue' },
      ],
      books: [
        { id: 'sb1', title: 'The Billionaire Never Forgets', cat: 'Billionaire', cover: COVERS.c3, reads: '1.4M', likes: '180k', rating: '4.8', chapters: 71 },
        { id: 'sb2', title: 'Contract of Hearts', cat: 'Romance', cover: COVERS.c5, reads: '620k', likes: '71k', rating: '4.6', chapters: 44 },
      ],
      library: [],
      collections: [
        { name: 'Boardroom Romance', count: 8, privacy: 'Public', covers: [COVERS.c3, COVERS.c5, COVERS.c6, COVERS.c1] },
      ],
      following: [
        { name: 'Ada_Writes', av: 'https://i.pravatar.cc/100?img=32', meta: 'Betrayal series', following: true },
      ],
      posts: [
        {
          id: 'sp1', type: 'chapter-drop', time: '5h', pinned: true, liked: false, likes: 2100, comments: 301, saved: false,
          text: 'New chapter is up — the contract gets real.',
          chapterRef: { title: 'The Billionaire Never Forgets', ch: 'Chapter 72', cat: 'Billionaire', cover: COVERS.c3 },
        },
        {
          id: 'sp2', type: 'post', time: '4d', pinned: false, liked: false, likes: 440, comments: 55, saved: false,
          text: 'Thank you for 2M reads. Next arc starts Monday.',
        },
      ],
      about: {
        favoriteGenres: ['billionaire', 'romance'],
        extra: [{ icon: 'fa-pen', label: 'Writing schedule', value: 'New chapter every Monday' }],
      },
    },

    You_Reader: {
      handle: 'You_Reader',
      name: 'Jordan Blake',
      avatar: 'https://i.pravatar.cc/200?img=11',
      cover: COVERS.c6,
      verified: false,
      isWriter: false,
      bio: 'Here for the plot twists. Currently drowning in campus romance and werewolf arcs.',
      genres: ['campus', 'werewolf', 'romance'],
      location: 'Ibadan, Nigeria',
      joinedLabel: 'Joined January 2025',
      stats: {
        following: 42,
        followers: 18,
        books: 0,
        reads: 0,
        likes: 0,
        saved: 14,
        reactions: 86,
        comments: 31,
      },
      achievements: [
        { label: 'Early Supporter', cls: 'green' },
        { label: '50 Reactions', cls: 'purple' },
      ],
      books: [],
      library: [
        { title: 'Season of Betrayal', cat: 'Romance', author: 'Ada_Writes', cover: COVERS.c1, ch: 'Ch. 40', badge: 'hot' },
        { title: 'Werewolf King, Human Queen', cat: 'Werewolf', author: 'Luna_Grey', cover: COVERS.c2, ch: 'Ch. 12', badge: 'new' },
        { title: 'Campus Chaos', cat: 'Campus', author: 'Bode_Ilo', cover: COVERS.c6, ch: 'Ch. 8', badge: '' },
      ],
      collections: [
        { name: 'Late Night Reads', count: 6, privacy: 'Private', covers: [COVERS.c1, COVERS.c2, COVERS.c6, COVERS.c7] },
      ],
      following: [
        { name: 'Ada_Writes', av: 'https://i.pravatar.cc/100?img=32', meta: 'Betrayal series · 1.2M reads', following: true },
        { name: 'Sarah_Odum', av: 'https://i.pravatar.cc/100?img=48', meta: 'Billionaire romance', following: true },
      ],
      posts: [
        {
          id: 'rp1', type: 'repost', time: '1d', pinned: false, liked: false, likes: 12, comments: 2, saved: false,
          note: 'This arc wrecked me.',
          storyRef: { title: 'Season of Betrayal', cat: 'Romance', author: 'Ada_Writes', cover: COVERS.c1 },
        },
        {
          id: 'rp2', type: 'quote', time: '5d', pinned: false, liked: true, likes: 28, comments: 4, saved: false,
          quote: 'Some books find you at the exact right chaos.',
          caption: '— after finishing Ch. 40',
        },
      ],
      about: {
        favoriteGenres: ['campus', 'werewolf', 'romance'],
        extra: [{ icon: 'fa-bookmark', label: 'Reading goal', value: '20 stories this year' }],
      },
    },
  };

  global.ProfileDemoSeed = {
    GENRES_ALL,
    COVERS,
    DEMO_PROFILES,
  };
})(window);
