/* ═══════════════════════════════════════════════════════════════
   Safex Push Engine (v1) — 🔔 browser notifications
   - Header bell button se ON/OFF (preference saved)
   - Permission: bell click pe manga jata hai (user gesture safe)
   - Realtime events jab app background me ho → phone notification
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var LS = 'safex-push';

  function isOn() {
    try { return localStorage.getItem(LS) !== 'off'; } catch (e) { return true; }
  }

  /* ── tiny toast (both pages) ── */
  var toastTimer = null;
  function sxToast(msg) {
    var t = document.getElementById('pushToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'pushToast';
      t.style.cssText = 'position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:460;background:#0f172a;border:1px solid #10b981;border-radius:12px;padding:10px 16px;color:#fff;font-size:12px;font-weight:700;box-shadow:0 14px 34px rgba(0,0,0,.55);max-width:92vw;text-align:center;display:none';
      document.body.appendChild(t);
    }
    t.innerHTML = msg;
    t.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.style.display = 'none'; }, 3500);
  }

  window.safexPush = {
    supported: ('Notification' in window),
    isOn: isOn,
    setOn: function (on) { try { localStorage.setItem(LS, on ? 'on' : 'off'); } catch (e) {} },
    notify: function (title, body) {
      if (!isOn()) return;
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;
      try {
        new Notification(title, {
          body: body || '',
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: 'safex-' + Date.now()
        });
      } catch (e) {}
    }
  };

  window.sxToast = sxToast;

  /* ── bell icon state ── */
  window.updatePushIcon = function () {
    var btn = document.getElementById('pushBtn');
    if (!btn) return;
    var on = ('Notification' in window) && isOn() && Notification.permission === 'granted';
    btn.innerHTML = on
      ? '<i data-lucide="bell-ring" class="w-4 h-4 text-emerald-400"></i>'
      : '<i data-lucide="bell" class="w-4 h-4 text-slate-400"></i>';
    if (window.lucide) { try { lucide.createIcons(); } catch (e) {} }
  };

  /* ── bell click ── */
  window.togglePush = function () {
    if (!('Notification' in window)) {
      sxToast('🔔 Push notifications are not supported in this browser');
      return;
    }
    if (Notification.permission === 'granted') {
      var next = !isOn();
      window.safexPush.setOn(next);
      sxToast(next ? '🔔 Alerts ON — you will now receive notifications' : '🔕 Alerts OFF');
      window.updatePushIcon();
    } else if (Notification.permission === 'denied') {
      sxToast('❌ Permission denied — please allow Notifications in browser settings');
    } else {
      Notification.requestPermission().then(function (p) {
        if (p === 'granted') {
          window.safexPush.setOn(true);
          sxToast('✅ Alerts turned ON');
        } else {
          sxToast('❌ Permission was not granted');
        }
        window.updatePushIcon();
      });
    }
  };

  if (document.readyState !== 'loading') window.updatePushIcon();
  else document.addEventListener('DOMContentLoaded', function () { window.updatePushIcon(); });
})();
