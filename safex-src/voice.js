/* ═══════════════════════════════════════════════════════════════
   Safex Voice Engine (v1) — 🎤 bol kar form bharo
   - Har field ke paas mic button → tap → bolo → text auto-fill
   - Naam bolo → EMP ID + Designation auto (DB lookup)
   - EMP ID bolo → normalize (EMP 001 → EMP001) + verify
   - Location/Department bolo → known places se smart-match
   - Description me severity keywords (गंभीर/high) → auto-select
   - Hindi (hi-IN) ya English (en-IN) — jo language active hai
   - Unsupported browser me mic buttons auto-hide (no error)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { document.documentElement.classList.add('no-vox'); return; }

  var KNOWN_LOCS = ['Blast Furnace', 'Rolling Mill', 'Assembly Line', 'Warehouse', 'Loading Bay',
    'Electrical Substation', 'Paint Shop', 'Admin Block', 'Scrap Yard', 'Melt Shop', 'Dock',
    'Transport Yard', 'Cold Storage', 'Site-1', 'Site-2', 'Site-3', 'Site-4', 'Site-5', 'Crusher', 'Mine Pit'];
  var KNOWN_DEPTS = ['Production', 'Maintenance', 'EHS', 'Safety', 'Warehouse', 'Quality', 'HR',
    'Logistics', 'Operations', 'Fabrication', 'Electrical', 'Mechanical', 'Mining', 'Housekeeping', 'Security'];

  /* ── toast ── */
  var toastTimer = null;
  function toast(html, tone) {
    var t = document.getElementById('voxToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'voxToast';
      t.style.cssText = 'position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:450;background:#0f172a;border:1px solid #f59e0b;border-radius:12px;padding:10px 16px;color:#fff;font-size:12px;font-weight:700;box-shadow:0 14px 34px rgba(0,0,0,.55);max-width:92vw;text-align:center;display:none';
      document.body.appendChild(t);
    }
    t.style.borderColor = tone === 'err' ? '#f43f5e' : '#f59e0b';
    t.innerHTML = html;
    t.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.style.display = 'none'; }, 4000);
  }

  /* ── CSS for mic buttons ── */
  function injectCss() {
    if (document.getElementById('sx-vox-css')) return;
    var st = document.createElement('style');
    st.id = 'sx-vox-css';
    st.textContent = [
      '.vox-btn{width:26px;height:26px;border-radius:9px;background:#0f172a;color:#f59e0b;display:inline-flex;align-items:center;justify-content:center;border:1px solid #334155;flex-shrink:0;cursor:pointer;transition:all .15s}',
      '.vox-btn svg{width:13px;height:13px}',
      '.vox-btn:hover{border-color:#f59e0b}',
      '.vox-btn:active{transform:scale(.92)}',
      '.vox-rec{background:#dc2626!important;border-color:#dc2626!important;color:#fff!important;animation:voxpulse 1s ease-in-out infinite}',
      '@keyframes voxpulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.5)}50%{box-shadow:0 0 0 7px rgba(220,38,38,0)}}',
      'html.no-vox .vox-btn{display:none!important}'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ── recognition state ── */
  var rec = null, currentField = null;

  function stopAll() {
    if (rec) { try { rec.stop(); } catch (e) {} }
    currentField = null;
    document.querySelectorAll('.vox-btn').forEach(function (b) { b.classList.remove('vox-rec'); });
  }

  function getField(id) { return document.getElementById(id); }

  function startVox(id) {
    if (!SR) return;
    if (currentField === id) { stopAll(); return; }   // same mic dabaya → stop
    var targetEl = getField(id);
    if (targetEl && targetEl.disabled) {
      toast((window.safexLang && window.safexLang.get() === 'HI') ? '🤫 एनोनिमस मोड चालू है — यह फ़ील्ड लॉक है' : '🤫 Anonymous mode is on — this field is locked');
      return;
    }
    stopAll();
    currentField = id;
    var btn = document.querySelector('[data-vox="' + id + '"]');
    if (btn) btn.classList.add('vox-rec');

    rec = new SR();
    rec.lang = (window.safexLang && window.safexLang.get() === 'HI') ? 'hi-IN' : 'en-IN';
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    var finalText = '';
    rec.onresult = function (e) {
      var interim = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      var el = getField(id);
      if (el) el.value = (finalText + interim).trim();
    };
    rec.onerror = function (e) {
      if (e.error === 'not-allowed') toast((window.safexLang && window.safexLang.get() === 'HI') ? '🎤 माइक की अनुमति चाहिए — ब्राउज़र सेटिंग्स में अनुमति दें' : '🎤 Microphone permission needed — please allow it in browser settings', 'err');
      else if (e.error === 'no-speech') toast((window.safexLang && window.safexLang.get() === 'HI') ? '🎤 आवाज़ नहीं सुनाई दी — फिर से कोशिश करें' : '🎤 No speech heard — please try again', 'err');
      else if (e.error !== 'aborted') toast('🎤 Voice error: ' + e.error, 'err');
      stopAll();
    };
    rec.onend = function () {
      var el = getField(id);
      var val = el ? el.value.trim() : finalText.trim();
      if (val) afterVox(id, val);
      stopAll();
    };
    try { rec.start(); } catch (e) { stopAll(); }
  }

  /* ── smart fill after speech ── */
  function afterVox(id, val) {
    if (id === 'reportWorkerName' && typeof triggerLiveNameLookup === 'function') {
      triggerLiveNameLookup(val);   // naam → EMP ID + Designation auto
    }
    if (id === 'reportEmpId') {
      var norm = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      var el = getField(id);
      if (el) el.value = norm;
      if (norm.length >= 3 && typeof triggerEmpIdLookup === 'function') triggerEmpIdLookup(norm);
    }
    if (id === 'reportLocation') {
      var m = matchKnown(val, KNOWN_LOCS);
      if (m) { var el = getField(id); if (el) el.value = m; }
    }
    if (id === 'reportDept') {
      var d = matchKnown(val, KNOWN_DEPTS);
      if (d) { var el = getField(id); if (el) el.value = d; }
    }
    if (id === 'reportDesc') parseSeverity(val);
  }

  function matchKnown(text, list) {
    var t = text.toLowerCase();
    for (var i = 0; i < list.length; i++) {
      if (t.indexOf(list[i].toLowerCase()) >= 0) return list[i];
    }
    return null;
  }

  /* ── severity keywords (description speech se) ── */
  function parseSeverity(text) {
    var sel = document.getElementById('reportSeverity');
    if (!sel) return;
    var t = text.toLowerCase();
    var v = null;
    if (/(high|critical|गंभीर|बड़ा|बहुत बड़ा|हाई|घातक|जानलेवा)/.test(t)) v = 'High';
    else if (/(medium|मध्यम|मीडियम|मध्य)/.test(t)) v = 'Medium';
    else if (/(low|minor|कम|मामूली|छोटा|लो)/.test(t)) v = 'Low';
    if (!v) return;
    var hit = Array.prototype.find.call(sel.options, function (o) { return o.value.toLowerCase() === v.toLowerCase(); });
    if (hit) sel.value = hit.value;
  }

  /* ── click delegation for [data-vox] buttons ── */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-vox]');
    if (b) { e.preventDefault(); e.stopPropagation(); startVox(b.getAttribute('data-vox')); }
  });

  injectCss();
  window.safexVoice = { start: startVox, stop: stopAll, supported: true };
})();
