/*
 * ZAR — shared app shell script.
 * Loaded by every page: handles the wallet balance (localStorage-backed),
 * the mobile drawer navigation, and the reward-per-duration formula used
 * when a user finishes watching an ad video.
 */
(function (window, document) {
  'use strict';

  var STORAGE_BALANCE = 'zar_wallet_balance';
  var STORAGE_HISTORY = 'zar_wallet_history';
  var STORAGE_TODAY = 'zar_wallet_today';
  var STORAGE_PROFILE = 'zar_profile';
  var DEFAULT_BALANCE = 12480;
  var DEFAULT_TODAY = 540;
  var HISTORY_LIMIT = 50;
  var SOM_PER_BALL = 10;

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function formatBall(n) {
    n = Math.max(0, Math.round(n || 0));
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function readJSON(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* storage unavailable — fail silently */ }
  }

  function getBalance() {
    return readJSON(STORAGE_BALANCE, DEFAULT_BALANCE);
  }

  function getTodayEarned() {
    var rec = readJSON(STORAGE_TODAY, null);
    if (!rec || rec.day !== todayKey()) {
      rec = { day: todayKey(), amount: DEFAULT_TODAY };
      writeJSON(STORAGE_TODAY, rec);
    }
    return rec.amount;
  }

  function getHistory() {
    return readJSON(STORAGE_HISTORY, []);
  }

  function broadcastChange() {
    document.dispatchEvent(new CustomEvent('zar:balance-changed', {
      detail: { balance: getBalance(), today: getTodayEarned() }
    }));
    renderBalances();
  }

  /**
   * Credits points to the wallet (e.g. after a fully-watched ad) and
   * persists a short history entry for it.
   */
  function addPoints(amount, meta) {
    amount = Math.round(amount || 0);
    if (amount <= 0) return getBalance();

    var balance = getBalance() + amount;
    writeJSON(STORAGE_BALANCE, balance);

    var today = readJSON(STORAGE_TODAY, { day: todayKey(), amount: DEFAULT_TODAY });
    if (today.day !== todayKey()) today = { day: todayKey(), amount: 0 };
    today.amount += amount;
    writeJSON(STORAGE_TODAY, today);

    var history = getHistory();
    history.unshift({
      amount: amount,
      label: (meta && meta.label) || 'Video mukofoti',
      type: (meta && meta.type) || 'video',
      at: Date.now()
    });
    if (history.length > HISTORY_LIMIT) history.length = HISTORY_LIMIT;
    writeJSON(STORAGE_HISTORY, history);

    broadcastChange();
    return balance;
  }

  /**
   * Debits points from the wallet (e.g. converting ball to so'm). Returns
   * false without changing anything if the balance is insufficient.
   */
  function spendPoints(amount, meta) {
    amount = Math.round(amount || 0);
    if (amount <= 0) return true;
    var balance = getBalance();
    if (amount > balance) return false;

    balance -= amount;
    writeJSON(STORAGE_BALANCE, balance);

    var history = getHistory();
    history.unshift({
      amount: -amount,
      label: (meta && meta.label) || 'Yechib olish',
      type: (meta && meta.type) || 'withdraw',
      at: Date.now()
    });
    if (history.length > HISTORY_LIMIT) history.length = HISTORY_LIMIT;
    writeJSON(STORAGE_HISTORY, history);

    broadcastChange();
    return true;
  }

  /**
   * Reward formula: longer ads pay out more, with a sane floor/ceiling
   * so a 5s teaser and a 3-minute clip both feel fair.
   *   ~30s  -> ~10 ball
   *   ~60s  -> ~16 ball
   *   ~180s -> ~40 ball
   */
  function pointsForDuration(seconds) {
    seconds = Number(seconds) || 0;
    if (seconds <= 0) return 8;
    var pts = Math.round((seconds / 60) * 12) + 4;
    return Math.min(180, Math.max(6, pts));
  }

  function renderBalances() {
    var balance = getBalance();
    var today = getTodayEarned();
    document.querySelectorAll('[data-zar-balance]').forEach(function (el) {
      el.textContent = formatBall(balance);
    });
    document.querySelectorAll('[data-zar-today]').forEach(function (el) {
      el.textContent = '+' + formatBall(today) + ' ball';
    });
    document.querySelectorAll('[data-zar-som]').forEach(function (el) {
      el.textContent = '≈ ' + formatBall(balance * SOM_PER_BALL) + ' so‘m';
    });
  }

  // Keep balance in sync across tabs/pages.
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_BALANCE || e.key === STORAGE_TODAY) renderBalances();
    if (e.key === STORAGE_PROFILE) renderProfileEls();
  });

  /* ---------------- Profile (name + photo, shared by profil.html & sozlamalar.html) ---------------- */
  function getProfile() {
    return readJSON(STORAGE_PROFILE, null);
  }

  function hasProfile() {
    var p = getProfile();
    return !!(p && p.name && p.name.trim());
  }

  function slugify(name) {
    var s = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 16);
    return s || 'mehmon';
  }

  function initialOf(name) {
    var n = (name || '').trim();
    return n ? n.charAt(0).toUpperCase() : 'Z';
  }

  function generateProfileId() {
    return 'ZR-' + Math.floor(100000 + Math.random() * 900000);
  }

  /** Shallow-merges into the stored profile so partial edits (e.g. only a new photo) don't erase the rest. */
  function saveProfile(partial) {
    var prev = getProfile() || {};
    var next = Object.assign({ name: '', avatar: '' }, prev, partial || {});
    if (!next.id) next.id = generateProfileId();
    writeJSON(STORAGE_PROFILE, next);
    renderProfileEls();
    document.dispatchEvent(new CustomEvent('zar:profile-changed', { detail: next }));
    return next;
  }

  function renderProfileEls() {
    var p = getProfile() || { name: '', avatar: '' };
    var displayName = p.name && p.name.trim() ? p.name.trim() : 'Mehmon';
    var handle = slugify(p.name);

    document.querySelectorAll('[data-zar-name]').forEach(function (el) { el.textContent = displayName; });
    document.querySelectorAll('[data-zar-handle]').forEach(function (el) { el.textContent = '@' + handle; });
    document.querySelectorAll('[data-zar-invite]').forEach(function (el) { el.textContent = 'zar.uz/r/' + handle; });
    document.querySelectorAll('[data-zar-id]').forEach(function (el) { el.textContent = p.id || '—'; });
    document.querySelectorAll('[data-zar-avatar]').forEach(function (el) {
      if (p.avatar) {
        el.style.backgroundImage = 'url(' + p.avatar + ')';
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.textContent = '';
      } else {
        el.style.backgroundImage = '';
        el.textContent = initialOf(displayName);
      }
    });
  }

  /* ---------------- Settings (notifications/PIN/language/theme) ----------------
     Only 'uz' + 'dark' are actually implemented today; other options are kept
     selectable (and remembered) but surface an honest "coming soon" toast
     instead of silently doing nothing. */
  var STORAGE_SETTINGS = 'zar_settings';
  var DEFAULT_SETTINGS = { pushNotify: true, smsNotify: false, pinSecurity: true, language: 'uz', theme: 'dark' };
  var IMPLEMENTED_LANGUAGES = ['uz'];
  var IMPLEMENTED_THEMES = ['dark'];

  function getSettings() {
    return Object.assign({}, DEFAULT_SETTINGS, readJSON(STORAGE_SETTINGS, {}));
  }

  function setSetting(key, value) {
    var next = getSettings();
    next[key] = value;
    writeJSON(STORAGE_SETTINGS, next);
    document.dispatchEvent(new CustomEvent('zar:settings-changed', { detail: next }));
    return next;
  }

  /* ---------------- Reel like/save state (shared by the dashboard reel + fullscreen modal) ----------------
     Keyed by video id rather than array index so state survives the reel list being reordered. */
  var STORAGE_REEL_LIKES = 'zar_reel_likes';
  var STORAGE_REEL_SAVES = 'zar_reel_saves';

  function getReelFlags(key) { return readJSON(key, {}); }
  function setReelFlag(key, id, on) {
    var map = getReelFlags(key);
    if (on) map[id] = true; else delete map[id];
    writeJSON(key, map);
  }

  /* ---------------- Shared nav shell (sidebar / mobile topbar / bottom tabbar) ----------------
     Every page renders identical nav markup; keeping one template here means a
     nav change (new item, icon tweak, label fix) only has to happen once. */
  var NAV_ITEMS = [
    { key: 'asosiy', target: 'index', label: 'Asosiy', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>' },
    { key: 'qidiruv', target: 'qidiruv', label: 'Qidiruv', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>' },
    { key: 'hamyon', target: 'hamyon', label: 'Hamyon', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7a2 2 0 012-2h11a2 2 0 012 2v1h1a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 13h2"/>' },
    { key: 'bildirishnoma', target: 'bildirishnomalar', label: 'Bildirishnoma', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>' },
    { key: 'profil', target: 'profil', label: 'Profil', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>' },
    { key: 'sozlamalar', target: 'sozlamalar', label: 'Sozlamalar', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>' }
  ];

  function navHref(target, inPages) {
    if (target === 'index') return inPages ? '../index.html' : './index.html';
    return inPages ? './' + target + '.html' : './pages/' + target + '.html';
  }

  function renderIcon(pathMarkup) {
    return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">' + pathMarkup + '</svg>';
  }

  function sidebarHtml(active, inPages) {
    var links = NAV_ITEMS.map(function (item) {
      var isActive = item.key === active;
      return '<a href="' + navHref(item.target, inPages) + '" class="zar-nav-link' + (isActive ? ' active' : '') + '">' +
        renderIcon(item.icon) + item.label + '</a>';
    }).join('');
    return '' +
      '<div class="px-8 mb-10">' +
      '<h1 class="text-gold font-bold text-3xl tracking-wide">ZAR</h1>' +
      '<p class="text-white/30 text-[10px] tracking-[0.2em] uppercase mt-1">Private member</p>' +
      '</div>' +
      '<nav class="flex-1 px-4 space-y-1">' + links + '</nav>' +
      '<div class="px-6">' +
      '<div class="zar-balance-card">' +
      '<p class="label">Hisobingiz</p>' +
      '<p class="value"><span data-zar-balance>0</span> <span class="unit">ball</span></p>' +
      '</div></div>';
  }

  function topbarHtml(title) {
    return '<span class="font-semibold text-[15px]">' + title + '</span>' +
      '<span class="text-gold text-[13px] font-bold"><span data-zar-balance>0</span></span>';
  }

  function tabbarHtml(active, inPages) {
    var tabs = NAV_ITEMS.map(function (item) {
      var isActive = item.key === active;
      return '<a href="' + navHref(item.target, inPages) + '" class="zar-tab' + (isActive ? ' active' : '') + '" aria-label="' + item.label + '">' +
        '<span class="zar-tab-icon">' + renderIcon(item.icon) + '</span></a>';
    }).join('');
    return '<span class="zar-tab-indicator" data-zar-tab-indicator></span>' + tabs;
  }

  /**
   * Mounts the sidebar / mobile topbar / bottom tabbar into their placeholder
   * elements. Must be called after zar-app.js loads but while the placeholder
   * elements already exist in the DOM (i.e. from an inline <script> below
   * them) — it runs synchronously so there's no flash of missing nav, and
   * finishes before the DOMContentLoaded-deferred renderBalances()/initTabbar()
   * below run.
   */
  function mountNav(opts) {
    opts = opts || {};
    var active = opts.active;
    var title = opts.title || '';
    var inPages = /\/pages\//.test(window.location.pathname);

    var sidebar = document.querySelector('[data-zar-sidebar]');
    if (sidebar) sidebar.innerHTML = sidebarHtml(active, inPages);

    var topbar = document.querySelector('[data-zar-topbar]');
    if (topbar) topbar.innerHTML = topbarHtml(title);

    var tabbar = document.querySelector('[data-zar-tabbar]');
    if (tabbar) tabbar.innerHTML = tabbarHtml(active, inPages);
  }

  /* ---------------- Toast (reward confirmations, save confirmations, etc.) ---------------- */
  var uiToastTimer = null;
  function showToast(msg) {
    var el = document.querySelector('.zar-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'zar-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('zar-toast-show');
    clearTimeout(uiToastTimer);
    uiToastTimer = setTimeout(function () { el.classList.remove('zar-toast-show'); }, 2200);
  }

  /* ---------------- Mobile bottom tab bar ----------------
     Always-visible navigation (no hamburger/drawer): a sliding pill
     tracks the active tab, and each tap gets a small spring-style pop. */
  function initTabbar() {
    var bar = document.querySelector('[data-zar-tabbar]');
    if (!bar) return;
    var indicator = bar.querySelector('[data-zar-tab-indicator]');
    var tabs = Array.prototype.slice.call(bar.querySelectorAll('.zar-tab'));

    function positionIndicator() {
      var active = bar.querySelector('.zar-tab.active');
      if (!active || !indicator) return;
      var barRect = bar.getBoundingClientRect();
      var tabRect = active.getBoundingClientRect();
      var center = (tabRect.left - barRect.left) + tabRect.width / 2;
      indicator.style.opacity = '1';
      indicator.style.transform = 'translateX(' + (center - indicator.offsetWidth / 2) + 'px)';
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tab.classList.remove('zar-tab-pop');
        // Force reflow so the animation can restart on repeated taps of the same tab.
        void tab.offsetWidth;
        tab.classList.add('zar-tab-pop');
      });
    });

    positionIndicator();
    window.addEventListener('resize', positionIndicator);
    // Fonts/icons can shift layout slightly after first paint.
    setTimeout(positionIndicator, 60);
  }

  /* Makes every `role="button"` element (used on the <div onclick> controls
     scattered through the app — reel actions, chips, cards, etc.) keyboard
     operable without having to wire a keydown handler on each one by hand. */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target.closest && e.target.closest('[role="button"]');
    if (!el) return;
    e.preventDefault();
    el.click();
  });

  document.addEventListener('DOMContentLoaded', function () {
    renderBalances();
    renderProfileEls();
    initTabbar();
  });

  window.ZarWallet = {
    getBalance: getBalance,
    getTodayEarned: getTodayEarned,
    getHistory: getHistory,
    addPoints: addPoints,
    spendPoints: spendPoints,
    pointsForDuration: pointsForDuration,
    formatBall: formatBall,
    renderBalances: renderBalances,
    somPerBall: SOM_PER_BALL
  };

  window.ZarProfile = {
    getProfile: getProfile,
    hasProfile: hasProfile,
    saveProfile: saveProfile,
    renderProfileEls: renderProfileEls,
    slugify: slugify,
    initialOf: initialOf
  };

  window.ZarUI = {
    toast: showToast
  };

  window.ZarNav = {
    mount: mountNav
  };

  window.ZarSettings = {
    getSettings: getSettings,
    setSetting: setSetting,
    isLanguageLive: function (code) { return IMPLEMENTED_LANGUAGES.indexOf(code) !== -1; },
    isThemeLive: function (code) { return IMPLEMENTED_THEMES.indexOf(code) !== -1; }
  };

  window.ZarReels = {
    isLiked: function (id) { return !!getReelFlags(STORAGE_REEL_LIKES)[id]; },
    setLiked: function (id, on) { setReelFlag(STORAGE_REEL_LIKES, id, on); },
    isSaved: function (id) { return !!getReelFlags(STORAGE_REEL_SAVES)[id]; },
    setSaved: function (id, on) { setReelFlag(STORAGE_REEL_SAVES, id, on); }
  };
})(window, document);
