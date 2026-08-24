/* ═══════════════════════════════════════════════════════════
   SAFEX PRODUCTION BUILD (hardened)
   - Inline + external JS: terser (minify, obfuscate locals,
     strip comments, drop console/debug)
   - HTML: html-minifier-terser (collapse, strip comments)
   - Hashed filenames for external JS + icons (content hash)
   - Vendor CDN libs self-hosted under /assets/vendor/
   - Source maps: NEVER generated
   - Output written to /home/user/safex (deploy root)
   ═══════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { minify: minifyJs } = require('terser');
const { minify: minifyHtml } = require('html-minifier-terser');

// Script-relative paths so the build works from any clone/checkout
// (override with SAFEX_SRC / SAFEX_OUT if needed).
const SRC = process.env.SAFEX_SRC || path.resolve(__dirname);
const OUT = process.env.SAFEX_OUT || path.resolve(__dirname, '..', 'safex');

const JS_OPTS = {
  compress: { passes: 2, drop_console: true, drop_debugger: true, dead_code: true, unsafe: false },
  mangle: true, // locals + args only; top-level names survive (inline onclick handlers safe)
  format: { comments: false, ascii_only: true },
  sourceMap: false,
};
const HTML_OPTS = {
  collapseWhitespace: true,
  removeComments: true,
  minifyCSS: true,
  minifyJS: JS_OPTS,
  minifyURLs: false,
  removeAttributeQuotes: false,
  removeOptionalTags: false,
  removeEmptyAttributes: false,
  decodeEntities: false,
  sortAttributes: false,
  sortClassName: false,
};

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
const files = (dir) => fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isFile());

(async () => {
  fs.mkdirSync(path.join(OUT, 'assets', 'vendor'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'icons'), { recursive: true });

  /* ── 1. cache version bump ── */
  let swSrc = fs.readFileSync(path.join(SRC, 'sw.js'), 'utf-8');
  const m = swSrc.match(/'safex-v(\d+)'/);
  if (!m) throw new Error('CACHE version not found in sw.js');
  const ver = Number(m[1]) + 1;
  swSrc = swSrc.replace(/'safex-v\d+'/, `'safex-v${ver}'`);
  console.log('cache version -> safex-v' + ver);

  /* ── 2. icons → hashed names ── */
  const iconMap = {};
  for (const f of files(path.join(SRC, 'icons'))) {
    const buf = fs.readFileSync(path.join(SRC, 'icons', f));
    const h = sha(buf);
    const ext = path.extname(f);
    const stem = path.basename(f, ext);
    const outName = `${stem}-${h}${ext}`;
    fs.writeFileSync(path.join(OUT, 'icons', outName), buf);
    iconMap[f] = '/icons/' + outName;
  }
  console.log('icons hashed:', JSON.stringify(iconMap));

  /* ── 3. manifest.json → hashed icons ── */
  let manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.json'), 'utf-8'));
  manifest.icons = manifest.icons.map(ic => {
    const base = path.basename(ic.src);
    if (iconMap[base]) ic.src = iconMap[base];
    return ic;
  });
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest));
  console.log('manifest.json written (hashed icons)');

  /* ── 4. vendor libs → /assets/vendor/<name>-<hash>.js ── */
  const vendorMap = {};
  for (const f of files(path.join(SRC, 'vendor'))) {
    const buf = fs.readFileSync(path.join(SRC, 'vendor', f));
    const h = sha(buf);
    const stem = path.basename(f, '.js');
    const outName = `${stem}-${h}.js`;
    fs.writeFileSync(path.join(OUT, 'assets', 'vendor', outName), buf);
    vendorMap['/assets/vendor/' + f] = '/assets/vendor/' + outName;
  }
  console.log('vendor hashed:', JSON.stringify(vendorMap));

  /* ── 5. external app JS → /assets/<name>-<hash>.js (minified) ── */
  const appJs = ['i18n.js', 'lang.js', 'pwa.js', 'push.js', 'photo.js', 'voice.js'];
  const jsMap = {};
  for (const f of appJs) {
    const code = fs.readFileSync(path.join(SRC, f), 'utf-8');
    const out = await minifyJs(code, JS_OPTS);
    if (!out.code) throw new Error('minify failed: ' + f);
    const h = sha(Buffer.from(out.code, 'utf-8'));
    const stem = path.basename(f, '.js');
    const outName = `${stem}-${h}.js`;
    fs.writeFileSync(path.join(OUT, 'assets', outName), out.code);
    jsMap['/' + f] = '/assets/' + outName;
  }
  console.log('app js hashed:', JSON.stringify(jsMap));

  /* ── 6. sw.js → minified (keeps /sw.js path — SW scope requirement) ── */
  for (const [orig, hashed] of Object.entries(iconMap)) {
    swSrc = swSrc.split("'/icons/" + orig + "'").join("'" + hashed + "'");
  }
  const swOut = await minifyJs(swSrc, JS_OPTS);
  fs.writeFileSync(path.join(OUT, 'sw.js'), swOut.code);
  console.log('sw.js minified (', swOut.code.length, 'bytes )');

  /* ── 7. HTML pages: rewrite refs + minify ── */
  const pages = files(SRC).filter(f => f.endsWith('.html'));
  for (const p of pages) {
    let html = fs.readFileSync(path.join(SRC, p), 'utf-8');
    for (const [orig, hashed] of Object.entries(jsMap)) html = html.split('src="' + orig + '"').join('src="' + hashed + '"');
    for (const [orig, hashed] of Object.entries(vendorMap)) html = html.split('src="' + orig + '"').join('src="' + hashed + '"');
    for (const [orig, hashed] of Object.entries(iconMap)) html = html.split('"/icons/' + orig + '"').join('"' + hashed + '"');
    const out = await minifyHtml(html, HTML_OPTS);
    fs.writeFileSync(path.join(OUT, p), out);
    console.log(p, html.length, '->', out.length, 'bytes');
  }

  /* ── 8. vercel.json ── */
  fs.copyFileSync(path.join(SRC, 'vercel.json'), path.join(OUT, 'vercel.json'));

  /* ── 9. clean stale build artifacts in OUT (sw.js keep — SW scope requirement) ── */
  for (const f of files(OUT)) {
    if (f === 'sw.js') continue;
    if (/\.(js|css)$/.test(f)) fs.unlinkSync(path.join(OUT, f));
  }
  // old non-hashed icons remove
  for (const f of files(path.join(OUT, 'icons'))) {
    if (!/-[0-9a-f]{8}\./.test(f)) fs.unlinkSync(path.join(OUT, 'icons', f));
  }
  console.log('BUILD COMPLETE');
})().catch(e => { console.error('BUILD FAILED:', e); process.exit(1); });
