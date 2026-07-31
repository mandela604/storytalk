/**
 * marketing-data.js — Data layer for Marketing & Growth pages.
 * ──────────────────────────────────────────────────────────────
 * Every function tries the real backend first and falls back to
 * demo data. Set window.DROBOARD_API_BASE to switch to production.
 */
(function () {
  'use strict';
  if (window.__marketingData) return;
  window.__marketingData = true;

  const API_BASE = window.DROBOARD_API_BASE || '/api/marketing';
  const TIMEOUT_MS = 2500;

  async function callBackend(path, opts) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(API_BASE + path, Object.assign({ signal: controller.signal }, opts || {}));
      clearTimeout(timer);
      if (!res.ok) throw new Error('Bad response: ' + res.status);
      return res.status === 204 ? null : await res.json();
    } catch (e) { clearTimeout(timer); throw e; }
  }
  function delay(ms) { return new Promise(r => setTimeout(r, ms || 200 + Math.random() * 200)); }
  function uid(prefix) { return prefix + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(); }

  const DEMO = {
    /* ── Dashboard ── */
    dashboard: {
      activeCampaigns: 4,
      livePromotions: 6,
      sponsoredPlacementsLive: 3,
      homepageBannersLive: 2,
      avgEngagementRate: '6.8%',
      emailsSentThisMonth: '182K',
      upcomingEventsCount: 2,

      quickActions: [
        { label: 'Launch New Promotion',      icon: 'fa-bullhorn', cls: 'accent', href: 'promotions.html' },
        { label: 'Schedule Homepage Banner',  icon: 'fa-image',    cls: 'blue',   href: 'homepage-banners.html' },
        { label: 'Create Email Campaign',     icon: 'fa-envelope', cls: 'purple', href: 'email-campaigns.html' },
        { label: 'Set Up New Contest',        icon: 'fa-gift',     cls: 'green',  href: 'events-contests.html' },
      ],

      upcomingEvents: [
        { name:'Summer Romance Writing Contest', type:'Contest', date:'Starts Aug 1, 2026', detail:'$5,000 prize · 214 entries so far' },
        { name:'Reader Appreciation Week', type:'Event', date:'Starts Aug 15, 2026', detail:'Platform-wide reading challenge' },
      ],

      analyticsSnapshot: { impressions:'3.4M', clicks:'218K', ctr:'6.4%', conversions:'12.8K', revenueLift:'+14%' },

      recentActivity: [
        { icon:'fa-bullhorn', color:'accent', text:'<b>Summer Romance Push</b> crossed 480K impressions', time:'1h ago' },
        { icon:'fa-image',    color:'blue',   text:'Homepage banner for <b>New Author Spotlight</b> went live', time:'3h ago' },
        { icon:'fa-envelope', color:'purple', text:'<b>Back-to-School Reader Drive</b> email sequence scheduled', time:'5h ago' },
        { icon:'fa-gift',     color:'green',  text:'<b>Summer Romance Writing Contest</b> passed 200 entries', time:'8h ago' },
        { icon:'fa-star',     color:'amber',  text:'Sponsored placement renewed for <b>Werewolf Week</b>', time:'1d ago' },
        { icon:'fa-chart-line', color:'blue', text:'Weekly marketing report generated — CTR up 1.2pt', time:'1d ago' },
      ],
    },

    /* ── Campaigns (full record, used by campaigns.html) ── */
    campaigns: [
      { id:'CMP-001', name:'Summer Romance Push', type:'Genre Push', channel:'Homepage + Email', status:'live',
        startDate:'2026-07-01', endDate:'2026-08-05', budget:12000, spent:8400,
        impressions:1240000, clicks:89000, reach:482000, ctr:7.2, conversions:3400,
        owner:'Tari Benson', description:'Cross-channel push spotlighting top-rated romance & betrayal titles ahead of the August reading slump, pairing a homepage takeover with a 3-part email sequence.' },
      { id:'CMP-002', name:'New Author Spotlight', type:'Spotlight', channel:'Homepage Banner', status:'live',
        startDate:'2026-07-10', endDate:'2026-08-02', budget:5000, spent:3100,
        impressions:540000, clicks:29000, reach:210000, ctr:5.4, conversions:980,
        owner:'Tari Benson', description:'Rotating homepage banner introducing five debut authors to boost discovery and first-chapter reads.' },
      { id:'CMP-003', name:'Back-to-School Reader Drive', type:'Acquisition', channel:'Email + Social', status:'scheduled',
        startDate:'2026-08-10', endDate:'2026-09-05', budget:9000, spent:0,
        impressions:0, clicks:0, reach:0, ctr:0, conversions:0,
        owner:'Priya Nandan', description:'Acquisition push targeting students returning to routine, offering a free premium month via social ads and a welcome-back email flow.' },
      { id:'CMP-004', name:'Werewolf Week', type:'Genre Push', channel:'Sponsored Placement', status:'live',
        startDate:'2026-07-20', endDate:'2026-07-31', budget:7000, spent:6800,
        impressions:860000, clicks:52000, reach:315000, ctr:6.1, conversions:2100,
        owner:'Kene Adeyemi', description:'Week-long sponsored carousel placement surfacing werewolf & fantasy titles across the discover feed.' },
      { id:'CMP-005', name:"Editor's Choice Autumn Preview", type:'Spotlight', channel:'Email', status:'draft',
        startDate:'', endDate:'', budget:4000, spent:0,
        impressions:0, clicks:0, reach:0, ctr:0, conversions:0,
        owner:'Tari Benson', description:'Early preview email teasing autumn editor picks — not yet scheduled, pending final title list from Senior Editors.' },
      { id:'CMP-006', name:'Mafia & Urban Flash Sale', type:'Genre Push', channel:'Homepage + Sponsored Placement', status:'ended',
        startDate:'2026-06-01', endDate:'2026-06-14', budget:6000, spent:5950,
        impressions:710000, clicks:41000, reach:265000, ctr:5.8, conversions:1740,
        owner:'Kene Adeyemi', description:'Two-week flash promotion on mafia & urban titles, wrapped with a strong CTR and 1,740 subscription conversions.' },
      { id:'CMP-007', name:'Reader Loyalty Rewards Teaser', type:'Retention', channel:'Email', status:'paused',
        startDate:'2026-07-05', endDate:'2026-08-20', budget:3000, spent:900,
        impressions:120000, clicks:6400, reach:58000, ctr:5.3, conversions:410,
        owner:'Priya Nandan', description:'Teaser sequence for the upcoming loyalty points program — paused mid-flight while reward tiers are finalized.' },
      { id:'CMP-008', name:'Historical Romance Binge Week', type:'Genre Push', channel:'Homepage + Email', status:'scheduled',
        startDate:'2026-08-18', endDate:'2026-08-25', budget:5500, spent:0,
        impressions:0, clicks:0, reach:0, ctr:0, conversions:0,
        owner:'Tari Benson', description:'Homepage and email push around completed historical & regency series, timed to late-August binge-reading behavior.' },
    ],
  };

  window.MarketingData = {
    async getDashboard() {
      try { return await callBackend('/dashboard'); }
      catch (e) { await delay(); return JSON.parse(JSON.stringify(DEMO.dashboard)); }
    },

    /* ── Campaigns: full CRUD ── */
    async getCampaigns() {
      try {
        const data = await callBackend('/campaigns');
        return Array.isArray(data) ? data : data.campaigns;
      } catch (e) {
        await delay();
        return JSON.parse(JSON.stringify(DEMO.campaigns));
      }
    },

    async createCampaign(payload) {
      try {
        return await callBackend('/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } catch (e) {
        await delay();
        const record = Object.assign({
          id: uid('CMP'), spent: 0, impressions: 0, clicks: 0, reach: 0, ctr: 0, conversions: 0,
        }, payload);
        DEMO.campaigns.unshift(record);
        return JSON.parse(JSON.stringify(record));
      }
    },

    async updateCampaign(id, payload) {
      try {
        return await callBackend('/campaigns/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } catch (e) {
        await delay();
        const idx = DEMO.campaigns.findIndex(c => c.id === id);
        if (idx === -1) throw new Error('Campaign not found');
        DEMO.campaigns[idx] = Object.assign({}, DEMO.campaigns[idx], payload);
        return JSON.parse(JSON.stringify(DEMO.campaigns[idx]));
      }
    },

    async deleteCampaign(id) {
      try {
        return await callBackend('/campaigns/' + id, { method: 'DELETE' });
      } catch (e) {
        await delay();
        const idx = DEMO.campaigns.findIndex(c => c.id === id);
        if (idx === -1) throw new Error('Campaign not found');
        DEMO.campaigns.splice(idx, 1);
        return { id, deleted: true };
      }
    },
  };
})();