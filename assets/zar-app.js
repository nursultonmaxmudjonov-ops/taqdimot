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
  var DEFAULT_BALANCE = 12480;
  var DEFAULT_TODAY = 540;
  var HISTORY_LIMIT = 50;

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
  }

  // Keep balance in sync across tabs/pages.
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_BALANCE || e.key === STORAGE_TODAY) renderBalances();
  });

  /* ---------------- Mobile drawer navigation ---------------- */
  function initDrawer() {
    var drawer = document.querySelector('[data-zar-drawer]');
    var overlay = document.querySelector('[data-zar-drawer-overlay]');
    if (!drawer || !overlay) return;

    function open() {
      drawer.classList.add('zar-drawer-open');
      overlay.classList.add('zar-drawer-open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      drawer.classList.remove('zar-drawer-open');
      overlay.classList.remove('zar-drawer-open');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-zar-drawer-open]').forEach(function (btn) {
      btn.addEventListener('click', open);
    });
    document.querySelectorAll('[data-zar-drawer-close]').forEach(function (btn) {
      btn.addEventListener('click', close);
    });
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderBalances();
    initDrawer();
  });

  window.ZarWallet = {
    getBalance: getBalance,
    getTodayEarned: getTodayEarned,
    getHistory: getHistory,
    addPoints: addPoints,
    pointsForDuration: pointsForDuration,
    formatBall: formatBall,
    renderBalances: renderBalances
  };
})(window, document);
