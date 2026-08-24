/* ═══════════════════════════════════════════════════════════════
   Safex Language Engine (v5) — GLOBAL tri-language switcher
   English → हिन्दी → ଓଡ଼ିଆ (dropdown select)
   ─────────────────────────────────────────────────────────────
   • GLOBAL SYNC: language localStorage 'safex-lang' me save hoti hai
     → front page, officer page, CSMS, profile — SAB pages same
     language yaad rakhte hain jab tak user khud change na kare
   • Boot pe saved language apply hoti hai
   • Cross-tab sync bhi (storage event)
   • Dictionary: i18n.js common.hi/common.or + page __SX_DICT__/_OR__
   • Dynamic content bhi translate (MutationObserver)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var LS = 'safex-lang';
  var LANGS = ['EN', 'HI', 'OR'];
  var NAMES = (window.SAFEX_I18N && window.SAFEX_I18N.names) || { EN: 'English', HI: 'हिन्दी', OR: 'ଓଡ଼ିଆ' };
  var applyTimer = null;

  // GLOBAL: saved language (agar hai) boot pe yaad rakho, warna English
  var memLang = 'EN';
  try {
    var _saved = localStorage.getItem(LS);
    if (_saved) memLang = norm(String(_saved).toUpperCase());
  } catch (e) {}

  function norm(v) {
    v = String(v || '').toUpperCase();
    return LANGS.indexOf(v) >= 0 ? v : 'EN';
  }
  function current() { return memLang; }
  function nextOf(l) {
    var i = LANGS.indexOf(l);
    return LANGS[(i + 1) % LANGS.length];
  }

  function getDicts() {
    var common = (window.SAFEX_I18N && window.SAFEX_I18N.common) || {};
    var hi = {}, or = {};
    Object.keys(common.hi || {}).forEach(function (k) { hi[k] = common.hi[k]; });
    Object.keys(common.or || {}).forEach(function (k) { or[k] = common.or[k]; });
    var page = window.__SX_DICT__ || {};
    Object.keys(page).forEach(function (k) { hi[k] = page[k]; });         // page hi wins
    var pageOr = window.__SX_DICT_OR__ || {};
    Object.keys(pageOr).forEach(function (k) { or[k] = pageOr[k]; });     // page odia wins
    return { HI: hi, OR: or };
  }

  function applyAll() {
    var lang = current();
    var dicts = getDicts();
    var map = {}, rev = {};

    if (lang === 'EN') {
      // Hindi/Odia → English reverse map
      ['HI', 'OR'].forEach(function (L) {
        var d = dicts[L];
        Object.keys(d).forEach(function (en) { rev[d[en]] = en; });
      });
    } else {
      map = dicts[lang];
    }

    // ── Static text nodes translate ──
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var p = node.parentElement;
      if (!p) return;
      if (['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION'].indexOf(p.tagName) >= 0) return;
      var k = node.textContent.trim();
      if (!k) return;
      if (lang === 'EN') {
        if (rev[k] !== undefined) node.textContent = rev[k];
      } else {
        if (map[k] !== undefined) node.textContent = map[k];
      }
    });

    // ── Toggle buttons: CURRENT language ka naam dikhao (selector style) ──
    var curName = NAMES[lang] || 'English';
    document.querySelectorAll('[data-langbtn]').forEach(function (b) {
      b.textContent = curName;
    });

    window.dispatchEvent(new CustomEvent('safex-lang-applied', { detail: { lang: lang } }));
  }

  window.safexLang = {
    get: current,
    next: function () { return nextOf(current()); },
    toggle: function () {
      memLang = nextOf(current());
      try { localStorage.setItem(LS, memLang); } catch (e) {}
      applyAll();
    },
    set: function (l) {
      memLang = norm(l);
      try { localStorage.setItem(LS, memLang); } catch (e) {}
      applyAll();
    },
    refresh: function () { applyAll(); }
  };

  /* ══════ 🌐 LANGUAGE DROPDOWN (v45) — [data-langbtn] click pe 3 options ══════ */
  var dd = null;
  function buildDropdown() {
    if (dd) return;
    dd = document.createElement('div');
    dd.className = 'sx-lang-dd';
    dd.style.cssText = 'position:fixed;z-index:9999;background:#0f172a;border:1px solid #334155;border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.55);padding:6px;display:none;min-width:150px';
    LANGS.forEach(function (code) {
      var item = document.createElement('button');
      item.type = 'button';
      item.style.cssText = 'display:flex;width:100%;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:8px;background:transparent;border:0;color:#e2e8f0;font-size:13px;font-weight:700;cursor:pointer;text-align:left;transition:background .15s';
      item.onmouseenter = function () { item.style.background = '#1e293b'; };
      item.onmouseleave = function () { item.style.background = 'transparent'; };
      item.innerHTML = '<span>' + (NAMES[code] || code) + '</span><span class="sx-ck" style="color:#f59e0b;font-weight:900;display:none">✓</span>';
      item.addEventListener('click', function () {
        window.safexLang.set(code);
        hideDropdown();
      });
      dd.appendChild(item);
    });
    document.body.appendChild(dd);
    document.addEventListener('click', function (e) {
      if (dd && !dd.contains(e.target) && !e.target.closest('[data-langbtn]')) hideDropdown();
    });
  }
  function showDropdown(btn) {
    buildDropdown();
    var r = btn.getBoundingClientRect();
    dd.style.display = 'block';
    var w = dd.offsetWidth || 150;
    var left = Math.min(r.left, window.innerWidth - w - 8);
    var top = r.bottom + 6;
    if (top + 140 > window.innerHeight) top = r.top - 140 - 6;
    dd.style.left = Math.max(8, left) + 'px';
    dd.style.top = top + 'px';
    var lang = current();
    var checks = dd.querySelectorAll('.sx-ck');
    LANGS.forEach(function (code, i) { checks[i].style.display = code === lang ? 'inline' : 'none'; });
  }
  function hideDropdown() { if (dd) dd.style.display = 'none'; }

  // [data-langbtn] pe click → dropdown kholo (capture se inline onclick bypass)
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-langbtn]');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      showDropdown(btn);
    }
  }, true);

  // 🌐 GLOBAL SYNC — dusre tab/page me language badli toh yahan bhi turant apply
  window.addEventListener('storage', function (e) {
    if (e.key === LS) {
      memLang = norm(e.newValue);
      applyAll();
    }
  });

  if (document.readyState !== 'loading') applyAll();
  else document.addEventListener('DOMContentLoaded', applyAll);

  // Dynamic content (fetch/render) ke baad naye text nodes bhi translate
  var mo = new MutationObserver(function () {
    clearTimeout(applyTimer);
    applyTimer = setTimeout(applyAll, 350);
  });
  function watch() { mo.observe(document.body, { childList: true, subtree: true, characterData: true }); }
  if (document.body) watch();
  else document.addEventListener('DOMContentLoaded', watch);
})();
