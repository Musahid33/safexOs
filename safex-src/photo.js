/* ═══════════════════════════════════════════════════════════════
   Safex Photo Engine (v2)
   - Camera/Gallery chooser — cool compact modal
   - 12 MB upload → auto-compress WebP (100–300 KB)
   - FIX: apne hi hidden inputs ko intercept nahi karta (v1 ka loop bug)
   - iOS-safe: hidden inputs offscreen (display:none se iOS pe picker
     nahi khulta tha)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var MAX_MB = 12;
  var MAX_DIM = 1400;
  var TARGET_KB = 280;

  /* ── toast ── */
  var toastTimer = null;
  function toast(html, tone) {
    var t = document.getElementById('photoToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'photoToast';
      t.style.cssText = 'position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:400;background:#0f172a;border:1px solid #10b981;border-radius:12px;padding:10px 16px;color:#fff;font-size:12px;font-weight:700;box-shadow:0 14px 34px rgba(0,0,0,.55);max-width:92vw;text-align:center;display:none';
      document.body.appendChild(t);
    }
    t.style.borderColor = tone === 'err' ? '#f43f5e' : '#10b981';
    t.innerHTML = html;
    t.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.style.display = 'none'; }, 4500);
  }

  /* ── chooser modal — compact + cool icons ── */
  var sheet = null, galleryInput = null, targetInput = null;

  function injectCss() {
    if (document.getElementById('sx-photo-css')) return;
    var st = document.createElement('style');
    st.id = 'sx-photo-css';
    st.textContent = [
      '.sx-overlay{position:fixed;inset:0;background:rgba(2,6,23,.6);z-index:390;display:none}',
      '.sx-sheet{position:fixed;left:50%;bottom:18px;transform:translate(-50%,110%);transition:transform .22s cubic-bezier(.2,.8,.2,1);z-index:395;width:min(360px,calc(100vw - 32px));background:#0f172a;border:1px solid rgba(245,158,11,.45);border-radius:20px;padding:14px 14px 16px;box-shadow:0 24px 60px rgba(0,0,0,.6);display:none}',
      '.sx-sheet.show{display:block;transform:translate(-50%,0)}',
      '.sx-grabber{width:44px;height:4px;border-radius:99px;background:#334155;margin:0 auto 12px}',
      '.sx-title{margin:0;font-size:14px;font-weight:900;color:#fff;text-align:center}',
      '.sx-sub{margin:2px 0 12px;font-size:10px;color:#94a3b8;text-align:center}',
      '.sx-upload{display:flex;align-items:center;gap:12px;width:100%;background:#1e293b;border:1px solid #334155;border-radius:14px;padding:13px 14px;cursor:pointer;transition:border-color .15s, transform .15s;text-align:left}',
      '.sx-upload:active{transform:scale(.98)}',
      '.sx-upload:hover{border-color:#f59e0b}',
      '.sx-badge{width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 6px 16px rgba(0,0,0,.4);flex-shrink:0}',
      '.sx-badge svg{width:22px;height:22px}',
      '.sx-up{background:linear-gradient(135deg,#10b981,#047857)}',
      '.sx-upload b{font-size:13.5px;font-weight:800;color:#fff;display:block}',
      '.sx-upload small{font-size:10px;color:#94a3b8;display:block;margin-top:3px;line-height:1.3}',
      '.sx-cancel{width:100%;margin-top:12px;background:#334155;border:0;border-radius:12px;padding:11px;cursor:pointer;color:#e2e8f0;font-size:12px;font-weight:800}',
      '.sx-cancel:hover{background:#3f4c62}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function buildChooser() {
    if (sheet) return;
    injectCss();

    var overlay = document.createElement('div');
    overlay.className = 'sx-overlay';
    overlay.addEventListener('click', hideChooser);

    sheet = document.createElement('div');
    sheet.className = 'sx-sheet';
    var hindi = (window.safexLang && window.safexLang.get() === 'HI');
    sheet.innerHTML =
      '<div class="sx-grabber"></div>' +
      '<p class="sx-title">📸 ' + (hindi ? 'फोटो अपलोड करें' : 'Upload Photo') + '</p>' +
      '<p class="sx-sub">' + (hindi ? 'कैमरा या गैलरी से चुनें' : 'Choose from camera or gallery') + '</p>' +
      '<button type="button" data-opt="upload" class="sx-upload">' +
        '<span class="sx-badge sx-up"><i data-lucide="image-plus"></i></span>' +
        '<span><b>' + (hindi ? 'फोटो अपलोड करें' : 'Upload Photo') + '</b><small>' + (hindi ? 'कैमरा या गैलरी से · 12 MB तक · ऑटो-कंप्रेस' : 'From camera or gallery · up to 12 MB · auto-compress') + '</small></span>' +
      '</button>' +
      '<button type="button" data-opt="cancel" class="sx-cancel">' + (hindi ? 'रद्द करें' : 'Cancel') + '</button>';

    sheet.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-opt]');
      if (!btn) return;
      var opt = btn.getAttribute('data-opt');
      if (opt === 'cancel') { hideChooser(); return; }
      // ⚠️ file-picker ke liye user-gesture SYNC hona zaroori hai
      // (setTimeout se iOS/Safari picker block kar dete hain)
      var overlay = document.querySelector('.sx-overlay');
      if (overlay) overlay.style.display = 'none';
      sheet.classList.remove('show');
      sheet.style.display = 'none';
      if (opt === 'upload' && galleryInput) galleryInput.click();
    });

    function makeHiddenInput() {
      var inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*,.pdf,application/pdf';
      inp.setAttribute('data-sx-internal', '1');
      inp.setAttribute('tabindex', '-1');
      inp.setAttribute('aria-hidden', 'true');
      // iOS pe display:none se picker nahi khulta — offscreen rakhna zaroori hai
      inp.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;';
      inp.addEventListener('change', function () {
        handlePicked(inp.files[0]);
        inp.value = '';
      });
      return inp;
    }

    galleryInput = makeHiddenInput(false);

    document.body.appendChild(overlay);
    document.body.appendChild(sheet);
    document.body.appendChild(galleryInput);
  }

  function showChooser(input) {
    buildChooser();
    targetInput = input;
    document.querySelector('.sx-overlay').style.display = 'block';
    sheet.style.display = 'block';
    requestAnimationFrame(function () { sheet.classList.add('show'); });
    if (window.lucide) { try { lucide.createIcons(); } catch (e) {} }
  }
  function hideChooser() {
    var overlay = document.querySelector('.sx-overlay');
    if (overlay) overlay.style.display = 'none';
    if (sheet) {
      sheet.classList.remove('show');
      setTimeout(function () { sheet.style.display = 'none'; }, 240);
    }
  }

  /* ── compression ── */
  function readBitmap(file) {
    if (window.createImageBitmap) {
      try { return createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { /* fallthrough */ }
    }
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function (e) { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    });
  }

  async function compressImage(file) {
    var bmp = await readBitmap(file);
    var maxDim = Math.max(bmp.width, bmp.height);
    var scale = Math.min(1, MAX_DIM / maxDim);
    var quality = 0.74;
    for (var pass = 0; pass < 3; pass++) {
      var w = Math.max(1, Math.round(bmp.width * scale));
      var h = Math.max(1, Math.round(bmp.height * scale));
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
      var blob = await new Promise(function (res) { canvas.toBlob(res, 'image/webp', quality); });
      if (!blob) blob = await new Promise(function (res) { canvas.toBlob(res, 'image/jpeg', quality); });
      if (blob.size <= TARGET_KB * 1024 || pass === 2) {
        if (typeof bmp.close === 'function') { try { bmp.close(); } catch (e) {} }
        return blob;
      }
      scale *= 0.72;
      quality = Math.max(0.45, quality - 0.12);
    }
    return blob;
  }

  /* ── main handler ── */
  async function handlePicked(file) {
    if (!file || !targetInput) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast('❌ ' + (Math.round(file.size / 104857.6) / 10) + ' MB — photo is too large (max ' + MAX_MB + ' MB)', 'err');
      targetInput = null;
      return;
    }
    if (!/^image\//.test(file.type)) {
      setInputFiles(file);
      toast('✅ File attached');
      return;
    }
    var hindi = (window.safexLang && window.safexLang.get() === 'HI');
    try {
      var origKB = Math.round(file.size / 1024);
      var blob = await compressImage(file);
      var newFile = new File([blob], 'photo.webp', { type: blob.type || 'image/webp' });
      setInputFiles(newFile);
      var newKB = Math.round(blob.size / 1024);
      if (origKB > newKB * 1.2) {
        toast('✅ ' + (hindi ? 'फोटो कंप्रेस हो गई:' : 'Photo compressed:') + ' <b>' + fmtKB(origKB) + ' → ' + fmtKB(newKB) + '</b> (WebP)');
      } else {
        toast('✅ ' + (hindi ? 'फोटो तैयार है' : 'Photo ready') + ' (' + fmtKB(newKB) + ')');
      }
    } catch (e) {
      console.warn('Compress failed:', e);
      setInputFiles(file);
      toast('⚠️ ' + (hindi ? 'कंप्रेस नहीं हुआ, असली फोटो लग गई' : 'Compression skipped, original attached'));
    }
  }

  function fmtKB(b) { return b > 1024 ? (Math.round(b / 102.4) / 10) + ' MB' : b + ' KB'; }

  function setInputFiles(file) {
    try {
      var dt = new DataTransfer();
      dt.items.add(file);
      targetInput.files = dt.files;
    } catch (e) {
      var fr = new FileReader();
      fr.onload = function () { window.__SAFEX_LAST_PHOTO__ = fr.result; };
      fr.readAsDataURL(file);
    }
    targetInput.dispatchEvent(new Event('change', { bubbles: true }));
    targetInput = null;
  }

  /* ── attach (apne internal inputs skip) ── */
  function attach(input) {
    if (input.dataset.safexPhoto || input.hasAttribute('data-sx-internal')) return;
    input.dataset.safexPhoto = '1';
    input.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      showChooser(input);
    }, true);
  }

  function scan() {
    document.querySelectorAll('input[type="file"][accept*="image"]:not([data-sx-internal])').forEach(attach);
  }

  if (document.readyState !== 'loading') scan();
  else document.addEventListener('DOMContentLoaded', scan);
  var mo = new MutationObserver(scan);
  function watch() { mo.observe(document.body, { childList: true, subtree: true }); }
  if (document.body) watch();
  else document.addEventListener('DOMContentLoaded', watch);

  window.safexPhoto = { attach: attach, compress: compressImage, MAX_MB: MAX_MB };
})();
