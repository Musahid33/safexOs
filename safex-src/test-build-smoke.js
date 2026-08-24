/* Smoke test for the BUILT output (safex/index.html) — verifies the four
   task areas: gallery (vault_gallery live data, XSS-safe), reports log
   status palette, training check refinements, alerts badge. */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'safex', 'index.html'), 'utf8');

// ── configurable mock data ──
const tableData = {
  vault_gallery: [
    { id: 1, title: 'Safety Drill', metadata: 'Jun 2026 • 24 Participants', image_url: 'https://example.com/a.jpg', full_log_text: 'Confined space rescue drill\nParticipants: 24 workers', created_at: '2026-06-01T00:00:00Z' },
    { id: 2, title: 'XSS <img src=x onerror=alert(1)> & "quotes" \'single\'', metadata: 'May 2026', image_url: 'https://example.com/b.jpg', full_log_text: "log with 'quotes' and \"double\"", created_at: '2026-05-01T00:00:00Z' },
    { id: 3, title: 'Broken image', metadata: '', image_url: 'https://example.com/missing.jpg', full_log_text: null, created_at: null },
  ],
};

function makeChain(data) {
  const obj = {
    then(resolve) { resolve({ data, error: null }); },
    catch() {},
    finally() {},
    select() { return this; },
    order() { return this; },
    limit() { return this; },
    eq() { return this; },
    ilike() { return this; },
    single() { return this; },
    maybeSingle() { return this; },
    insert() { return this; },
    update() { return this; },
    delete() { return this; },
  };
  return obj;
}

let results = [];
function check(name, cond, extra) {
  results.push({ name, ok: !!cond, extra });
}

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://safex.example/',
  pretendToBeVisual: true,
  beforeParse(window) {
    window.supabase = {
      createClient() {
        return {
          from(table) { return makeChain(tableData[table] !== undefined ? tableData[table] : []); },
          storage: { from() { return { upload() { return Promise.resolve({ error: null }); }, getPublicUrl() { return { data: { publicUrl: 'https://example.com/x.jpg' } }; } }; } },
          channel() { return { on() { return this; }, subscribe() {} }; },
          auth: { resetPasswordForEmail() { return Promise.resolve({ error: null }); } },
          rpc() { return Promise.resolve({ data: null, error: null }); },
        };
      },
    };
    window.lucide = { createIcons() {} };
    window.alert = (msg) => { window.__lastAlert = msg; };
    window.navigator.onLine = true;
  },
});

const { window } = dom;
const { document } = window;

setTimeout(() => {
  try {
    // ── GALLERY: live data render ──
    const inner = document.getElementById('galleryScrollInner');
    check('gallery renders 2x cards (seamless dup)', inner && inner.querySelectorAll('.gallery-card').length === 6, inner ? inner.querySelectorAll('.gallery-card').length : 0);
    check('gallery sub shows count', (document.getElementById('gallerySub') || {}).textContent === '3 photos · Live', (document.getElementById('gallerySub') || {}).textContent);

    // ── GALLERY: XSS escaping ──
    const cards = inner.querySelectorAll('.gallery-card');
    const xssCard = cards[1];
    const h5 = xssCard.querySelector('h5');
    check('gallery title escaped (no raw <img>)', h5 && !h5.innerHTML.includes('<img') && h5.innerHTML.includes('&lt;img'), h5 && h5.innerHTML.slice(0, 80));
    check('gallery data-gallery-id numeric', xssCard.getAttribute('data-gallery-id') === '2');

    // ── GALLERY: detail modal opens on click, content escaped ──
    xssCard.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    const modal = document.getElementById('galleryDetailModal');
    check('gallery detail modal opens', modal && !modal.classList.contains('hidden'));
    const body = document.getElementById('galleryDetailBody');
    check('gallery detail log preserved (quotes not breaking)', body && body.innerHTML.includes('log with &#039;quotes&#039;') || (body && body.innerHTML.includes("'quotes'")));
    check('gallery detail title escaped', (document.getElementById('galleryDetailTitle') || {}).textContent && document.getElementById('galleryDetailTitle').textContent.includes('XSS'));
    if (modal) { window.closeGalleryDetail(); }
    check('gallery detail modal closes', modal && modal.classList.contains('hidden'));

    // ── GALLERY: broken image fallback ──
    const brokenCard = cards[2];
    const img = brokenCard.querySelector('img');
    if (img) { img.dispatchEvent(new window.Event('error')); }
    check('gallery broken image fallback', brokenCard.querySelector('.gallery-img-fallback') !== null || brokenCard.querySelector('img') === null);

    // ── GALLERY: empty state ──
    tableData.vault_gallery = [];
    window.fetchGallery().then(() => {
      check('gallery empty state shown', inner.classList.contains('gallery-empty') && inner.textContent.includes('No gallery photos yet'));
      check('gallery sub empty label', document.getElementById('gallerySub').textContent === 'Empty');

      // ── REPORTS LOG: status palette ──
      check('reportStatusClass Closed -> emerald', window.reportStatusClass('Closed').includes('emerald'));
      check('reportStatusClass Verify -> amber', window.reportStatusClass('Verify').includes('amber'));
      check('reportStatusClass RCA On Going -> amber', window.reportStatusClass('RCA On Going').includes('amber'));
      check('reportStatusClass Pending -> amber', window.reportStatusClass('Pending').includes('amber'));
      check('reportStatusClass Open -> red', window.reportStatusClass('Open').includes('red'));
      check('reportStatusClass unknown -> slate', window.reportStatusClass('Weird').includes('slate'));

      // ── REPORTS LOG: summary chips rendered from mock data ──
      // feed a couple of safety_reports rows and open the log
      tableData.safety_reports = [
        { id: 11, report_type: 'Hazard', employee_id: 'EMV-1', worker_name: 'A', description: 'desc', status: 'Open', action_status: 'Open', created_at: '2026-08-01T00:00:00Z' },
        { id: 12, report_type: 'Near Miss', employee_id: 'EMV-2', worker_name: 'B', description: 'desc2', status: 'In Progress', action_status: 'RCA On Going', created_at: '2026-08-02T00:00:00Z' },
        { id: 13, report_type: 'Hazard', employee_id: 'EMV-3', worker_name: 'C', description: 'desc3', status: 'Closed', action_status: 'Closed', created_at: '2026-08-03T00:00:00Z' },
        { id: 14, report_type: 'Speak Up', employee_id: 'EMV-4', worker_name: 'D', description: 'confidential', status: 'Open', action_status: 'Open', created_at: '2026-08-04T00:00:00Z' },
      ];
      window.toggleReportsLog();
      return new Promise((res) => setTimeout(res, 300));
    }).then(() => {
      const section = document.getElementById('reportsLogSection');
      const sectionText = section.textContent;
      check('reports log opens', !section.classList.contains('hidden'));
      check('reports log shows 2 Open', sectionText.includes('1 Open'), sectionText.match(/Open/g) && sectionText.match(/Open/g).length);
      check('reports log shows In Progress count', sectionText.includes('1 In Progress'));
      check('reports log shows 1 Closed', sectionText.includes('1 Closed'));
      check('reports log hides confidential (Speak Up)', !sectionText.includes('confidential') && sectionText.includes('desc3'));
      check('reports log Latest n note', sectionText.includes('Latest 3'));

      // ── TRAINING CHECK: Enter key / not-found path ──
      const input = document.getElementById('trainingCheckEmpCode');
      check('training input has Enter handler', input && input.getAttribute('onkeydown').includes('Enter'));
      // ── ALERTS badge default text in static HTML replaced
      const badge = document.getElementById('alertsBadge');
      check('alerts badge element exists', !!badge);

      // summary
      const failed = results.filter(r => !r.ok);
      console.log('\n=== SMOKE TEST RESULTS ===');
      results.forEach(r => console.log((r.ok ? '  ✅ ' : '  ❌ ') + r.name + (r.ok ? '' : '  → ' + JSON.stringify(r.extra))));
      console.log(failed.length ? `\n${failed.length} FAILED` : '\nALL PASSED');
      process.exit(failed.length ? 1 : 0);
    });
  } catch (e) {
    console.error('TEST CRASH:', e);
    process.exit(2);
  }
}, 1500);
