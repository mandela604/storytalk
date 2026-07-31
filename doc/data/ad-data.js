/**
 * ad-data.js — Sample ad data for DroboardAdCard (ad-card.js)
 * ─────────────────────────────────────────────
 * Load AFTER ad-card.js is defined but BEFORE you call DroboardAdCard.attach().
 * Four arrays, one per format:
 *   NATIVE_ADS      → DroboardAdCard.renderNative(ad)
 *   STORY_PROMO_ADS → DroboardAdCard.renderStoryPromo(ad)   (mode: 'author' | 'cover')
 *   FULLSCREEN_ADS  → DroboardAdCard.renderFullscreen(ad)
 *   BANNER_ADS      → DroboardAdCard.renderBanner(ad)
 *
 * ALL_ADS merges every array together — handy as the return value for
 * your attach() hook's getAds(), e.g.:
 *   DroboardAdCard.attach(feedArea, { getAds: () => ALL_ADS, ... });
 */

/* ── Type 1: Native ads (post-style, image/heading/body + like/comment/share) ── */
const NATIVE_ADS = [
  {
    id: 'na1',
    brand: 'PiggyVest',
    logo: 'https://i.pravatar.cc/100?img=23',
    heading: 'Save money. Build your future.',
    body: "Join over 4 million Nigerians who trust PiggyVest to save, invest, and reach their goals faster. Automate your savings, earn interest, and watch your money grow — no discipline required, we handle that part for you.",
    image: 'https://i.postimg.cc/RqtfSQJJ/wife3.jpg',
    likes: 1240,
    liked: false,
    comments: 186,
  },
  {
    id: 'na2',
    brand: 'Flutterwave',
    logo: 'https://i.pravatar.cc/100?img=10',
    heading: 'Send money across Africa, instantly.',
    body: "Zero hidden fees, real exchange rates, and transfers that actually arrive on time. Whether you're paying a vendor in Accra or sending rent money home, Flutterwave makes it feel like one country.",
    image: '',
    likes: 890,
    liked: false,
    comments: 94,
  },
  {
    id: 'na3',
    brand: 'Cowrywise',
    logo: 'https://i.pravatar.cc/100?img=35',
    heading: 'Invest in mutual funds from ₦100.',
    body: "You don't need to be rich to start investing — you need to start. Cowrywise lets you put small, consistent amounts into vetted mutual funds and watch compound interest do the heavy lifting over time.",
    image: 'https://i.postimg.cc/WF1j4Pnh/6.jpg',
    likes: 2103,
    liked: true,
    comments: 341,
  },
];

/* ── Type 2: Story promo ads (promotes a platform story) ── */
const STORY_PROMO_ADS = [
  {
    id: 'sp1',
    mode: 'author',
    authorAv: 'https://i.pravatar.cc/100?img=32',
    authorName: 'Ada_Writes',
    cover: 'https://i.postimg.cc/RqtfSQJJ/wife3.jpg',
    cat: '💔 Betrayal',
    title: '"I came home early and caught my husband kissing my late sister\'s photograph"',
    cta: 'Read Now',
  },
  {
    id: 'sp2',
    mode: 'cover',
    cover: 'https://i.postimg.cc/WF1j4Pnh/6.jpg',
    cat: '✨ Twist',
    title: '"I left the altar in my socked feet — and found my real life"',
    cta: 'Start Reading',
  },
  {
    id: 'sp3',
    mode: 'author',
    authorAv: 'https://i.pravatar.cc/100?img=22',
    authorName: 'Efe_O',
    cover: 'https://i.postimg.cc/N9jY0w4m/5.jpg',
    cat: '🌙 Elegy',
    title: '"The letter folded in his jacket pocket — he died before he could send it"',
    cta: 'Read Now',
  },
];

/* ── Type 3: Fullscreen snap ads (feed.html-style, full-height) ── */
const FULLSCREEN_ADS = [
  {
    id: 'fs1',
    bg: 'https://i.postimg.cc/vDn9YLx5/wife2.jpg',
    brand: 'PiggyVest',
    logo: 'https://i.pravatar.cc/100?img=23',
    headline: 'Your goals deserve a plan, not just a wish.',
    sub: 'Automate your savings and let PiggyVest do the discipline for you. Start with as little as ₦1,000.',
    cta: 'Start Saving',
    url: 'https://piggyvest.com',
  },
  {
    id: 'fs2',
    bg: 'https://i.postimg.cc/ftRZbhKx/3.jpg',
    brand: 'Cowrywise',
    logo: 'https://i.pravatar.cc/100?img=35',
    headline: 'Small amounts. Big futures.',
    sub: 'Invest from ₦100 in mutual funds built for people just starting out. No jargon, no minimums that lock you out.',
    cta: 'Invest Now',
    url: 'https://cowrywise.com',
  },
  {
    id: 'fs3',
    bg: 'https://i.postimg.cc/DJwFzKgd/4.jpg',
    brand: 'Flutterwave',
    logo: 'https://i.pravatar.cc/100?img=10',
    headline: 'Borders shouldn\'t slow down your money.',
    sub: 'Send and receive payments across Africa instantly, with real exchange rates and zero surprises.',
    cta: 'Send Money',
    url: 'https://flutterwave.com',
  },
];

/* ── Type 4: Banners (profile.html-style, small horizontal) ── */
const BANNER_ADS = [
  {
    id: 'bn1',
    logo: 'https://i.pravatar.cc/100?img=23',
    brand: 'PiggyVest',
    headline: 'Save money. Build your future.',
    sub: 'Join 4M+ Nigerians saving smarter.',
    cta: 'Start',
  },
  {
    id: 'bn2',
    logo: 'https://i.pravatar.cc/100?img=10',
    brand: 'Flutterwave',
    headline: 'Send money across Africa instantly',
    sub: 'Zero hidden fees. Trusted by 1M+.',
    cta: 'Go',
  },
  {
    id: 'bn3',
    logo: 'https://i.pravatar.cc/100?img=35',
    brand: 'Cowrywise',
    headline: 'Invest in mutual funds from ₦100',
    sub: 'Smart investing for every income.',
    cta: 'Invest',
  },
];

/* ── Combined pool — useful as a single getAds() source ── */
const ALL_ADS = [].concat(NATIVE_ADS, STORY_PROMO_ADS, FULLSCREEN_ADS, BANNER_ADS);