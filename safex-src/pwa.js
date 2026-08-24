/* ═══════════════════════════════════════════════════════════════
   Safex PWA Engine (v5) — shared by ALL pages
   - Install prompt (Android/Chrome) + iOS hint
   - Offline queue: Near Miss, Hazard, Grievance, UC/UA, Accident,
     Feedback, Suggestion, Speak Up, Training Request, Officer
     Live Reviews, Direct Injections — sab bina network ke save,
     network aate hi AUTO-SYNC Supabase me.
   - Amber offline banner + pending-sync badge
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var STORAGE_KEY = 'safex-offline-queue';
  var deferredInstallPrompt = null;

  /* ── tiny CSS for banner/badge (self-contained) ── */
  (function injectCss() {
    var style = document.createElement('style');
    style.textContent = '#offlineBanner{display:none!important}#offlineBanner.show{display:flex!important}#syncBadge{display:none!important}#syncBadge.show{display:inline-flex!important}';
    document.head.appendChild(style);
  })();

  /* ── 1. Service worker registration ── */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      try { navigator.serviceWorker.register('/sw.js').catch(function () {}); } catch (e) {}
    });
  }

  /* ── 2. Install prompt (Android/Chrome) + iOS hint ── */
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredInstallPrompt = e;
    var btn = document.getElementById('installAppBtn');
    if (btn) btn.classList.remove('hidden');
  });
  window.addEventListener('appinstalled', function () {
    deferredInstallPrompt = null;
    var btn = document.getElementById('installAppBtn');
    if (btn) btn.classList.add('hidden');
  });
  window.installSafexApp = function () {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then(function () {
        deferredInstallPrompt = null;
        var b = document.getElementById('installAppBtn');
        if (b) b.classList.add('hidden');
      });
    } else {
      var hint = document.getElementById('installHint');
      if (hint) hint.classList.remove('hidden');
    }
  };

  /* ── 3. Offline queue (localStorage) ── */
  function getQueue() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveQueue(q) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(q)); }
    catch (e) {
      // Storage full → strip photos, keep the report text
      var slim = q.map(function (it) {
        if (it.payload && it.payload.photo_base64) { it.payload.photo_base64 = ''; it.noPhoto = true; }
        return it;
      });
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(slim)); } catch (e2) {}
    }
  }
  function queueItem(item) {
    var q = getQueue();
    q.push(item);
    saveQueue(q);
    window.updateSyncBadge();
  }

  /* ── 4. Pending-sync badge (hamburger/header) ── */
  window.updateSyncBadge = function () {
    var n = getQueue().length;
    var badge = document.getElementById('syncBadge');
    if (badge) { badge.innerText = n; badge.classList.toggle('show', n > 0); }
  };

  /* ── 5. Offline banner toggle ── */
  function setOnlineUI(online) {
    var banner = document.getElementById('offlineBanner');
    if (banner) banner.classList.toggle('show', !online);
    if (online) window.flushOfflineQueue();
  }

  /* ── 6. OFFLINE-AWARE INSERT — core magic ──
     Online  → direct Supabase insert
     Offline → queue on device, auto-sync later
     Returns { offline: true | false }                       ── */
  window.offlineAwareInsert = async function (table, payload) {
    var item = { table: table, payload: payload, at: new Date().toISOString() };
    if (!navigator.onLine) { queueItem(item); return { offline: true }; }
    try {
      var res = await _supabase.from(table).insert([payload]);
      if (res.error) throw res.error;
      return { offline: false };
    } catch (err) {
      if (/fetch|network|failed to|Failed to/i.test(String((err && err.message) || ''))) {
        queueItem(item);
        return { offline: true };
      }
      throw err; // real DB validation error → show to user
    }
  };

  /* ── 7. AUTO-SYNC — flush queued reports when online ── */
  window.flushOfflineQueue = async function () {
    var q = getQueue();
    if (!q.length || !navigator.onLine || typeof _supabase === 'undefined') return;
    var remaining = [];
    for (var i = 0; i < q.length; i++) {
      try {
        var res = await _supabase.from(q[i].table).insert([q[i].payload]);
        if (res.error) remaining.push(q[i]);
      } catch (e) { remaining.push(q[i]); }
    }
    var syncedCount = q.length - remaining.length;
    saveQueue(remaining);
    window.updateSyncBadge();
    if (syncedCount > 0) {
      // Notify the page so it refreshes its lists
      window.dispatchEvent(new CustomEvent('safex-synced', { detail: { count: syncedCount } }));
    }
  };

  /* ── 8. Connectivity listeners ── */
  window.addEventListener('online', function () { setOnlineUI(true); });
  window.addEventListener('offline', function () { setOnlineUI(false); });

  /* ── 9. Boot ── */
  if (!navigator.onLine) setOnlineUI(false);
  window.updateSyncBadge();
  window.addEventListener('load', function () {
    if (navigator.onLine) window.flushOfflineQueue();
  });
  if (document.readyState === 'complete' && navigator.onLine) window.flushOfflineQueue();
})();
