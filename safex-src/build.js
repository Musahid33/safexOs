/* ═══════════════════════════════════════════════════════════
   SAFEX PRODUCTION BUILD (hardened)
   - Inline + external JS: terser (minify, obfuscate locals,
     strip comments, drop console/debug)
     → then javascript-obfuscator (hex identifiers + base64
       string arrays — "secret code" output)
   - Every page gets an injected anti-inspection layer:
     right-click / drag / select blocking, Ctrl+U / F12 /
     Ctrl+Shift+I/J/C/K shortcuts blocked, DevTools-open warning
   - HTML: html-minifier-terser (collapse, strip comments)
   - Hashed filenames for external JS + icons (content hash)
   - Vendor CDN libs self-hosted under /assets/vendor/
   - Source maps: NEVER generated
   - Deterministic: obfuscator uses a fixed seed, so identical
     source always yields byte-identical output
   - Output written to ../safex (deploy root; SAFEX_OUT override)
   ═══════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { minify: minifyJs } = require('terser');
const { minify: minifyHtml } = require('html-minifier-terser');
const JavaScriptObfuscator = require('javascript-obfuscator');

// Script-relative paths so the build works from any clone/checkout
// (override with SAFEX_SRC / SAFEX_OUT if needed).
const SRC = process.env.SAFEX_SRC || path.resolve(__dirname);
const OUT = process.env.SAFEX_OUT || path.resolve(__dirname, '..', 'safex');
if ([path.resolve(SRC), path.resolve(__dirname, '..'), path.parse(path.resolve(OUT)).root].includes(path.resolve(OUT))) {
  throw new Error('SAFEX_OUT must be a dedicated build directory, not the source or repository root');
}

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

/* ── "Secret code" pass: terser → javascript-obfuscator ─────────
   Conservative settings (no control-flow flattening / dead-code
   injection) so low-end phones stay fast. Fixed seed ⇒ deterministic
   byte-identical rebuilds. renameGlobals=false keeps top-level names
   that inline onclick handlers and cross-file code depend on. */
const OBF_OPTS = {
  compact: true,
  controlFlowFlattening: false,
  controlFlowFlatteningThreshold: 0,
  deadCodeInjection: false,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayThreshold: 0.8,
  splitStrings: false,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false, // terser already dropped console.*
  target: 'browser',
  seed: 24082501,
};

async function harden(code, label) {
  try {
    const out = JavaScriptObfuscator.obfuscate(code, OBF_OPTS).getObfuscatedCode();
    if (out && out.length > 0) return out;
    throw new Error('empty obfuscation output');
  } catch (e) {
    // Never break the build over obfuscation — fall back to terser output.
    console.warn(`  ⚠ obfuscation skipped for ${label}: ${e.message}`);
    return code;
  }
}

/* ── Anti-inspection layer (injected into <head> of every page) ──
   Blocks: right-click / long-press menu, image drag, text selection
   (inputs keep selection), Ctrl/Cmd+U (view source), Ctrl/Cmd+S
   (save page), Ctrl/Cmd+P (print), F12, Ctrl/Cmd+Shift+I/J/C/K
   (DevTools), and shows a warning overlay when DevTools is detected
   as open. NOTE: this deters casual viewing — anyone with dev-tools
   knowledge can still fetch the JS directly; no real secrets are
   shipped in the frontend, so nothing sensitive is exposed. */
const PROTECT_CSS =
  '*{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}' +
  'input,textarea,[contenteditable="true"]{-webkit-user-select:text;-moz-user-select:text;-ms-user-select:text;user-select:text}' +
  'img{-webkit-user-drag:none;user-drag:none}';

const PROTECT_JS = `
(function () {
  "use strict";
  var block = function (e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };
  document.addEventListener("contextmenu", block);
  document.addEventListener("dragstart", block);
  document.addEventListener("selectstart", function (e) {
    var t = e.target;
    if (t && t.closest && t.closest('input,textarea,[contenteditable="true"]')) return;
    block(e);
  });
  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toUpperCase();
    if (k === "F12") return block(e);
    if (e.ctrlKey && !e.altKey) {
      if (k === "U" || k === "S" || k === "P") return block(e);
      if (e.shiftKey && (k === "I" || k === "J" || k === "C" || k === "K")) return block(e);
    }
    if (e.metaKey && !e.ctrlKey) {
      if (k === "U" || k === "S" || k === "P") return block(e);
      if (e.altKey && (k === "I" || k === "J" || k === "C")) return block(e);
    }
  });
  var timer = null;
  function watch() {
    // Frame geometry is not evidence of DevTools; embedded previews have a smaller viewport.
    if (window.self !== window.top) return;
    var dw = window.outerWidth - window.innerWidth;
    var dh = window.outerHeight - window.innerHeight;
    if (dw > 240 || dh > 170) {
      if (!timer) {
        timer = setTimeout(function () {
          timer = null;
          var d = document.createElement("div");
          d.style.cssText =
            "position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483647;background:#020617;" +
            "color:#fbbf24;display:flex;align-items:center;justify-content:center;" +
            "font:16px/1.6 system-ui,sans-serif;text-align:center;padding:24px";
          d.textContent = "\\u26a0\\ufe0f Developer tools are disabled on this portal. Close DevTools and refresh the page.";
          document.body.appendChild(d);
        }, 1500);
      }
    } else {
      clearTimeout(timer);
      timer = null;
    }
  }
  window.addEventListener("resize", watch);
  setInterval(watch, 2000);
})();
`;

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
const files = (dir) => fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isFile());

(async () => {
  fs.mkdirSync(path.join(OUT, 'assets', 'vendor'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'icons'), { recursive: true });

  /* ── 1. explicit release version (reproducible; never mutate source) ── */
  let swSrc = fs.readFileSync(path.join(SRC, 'sw.js'), 'utf-8');
  const m = swSrc.match(/'safex-v(\d+)'/);
  if (!m) throw new Error('CACHE version not found in sw.js');
  const ver = Number(m[1]);
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

  /* ── 5. external app JS → /assets/<name>-<hash>.js (minified + hardened) ── */
  const protectJs = await harden(PROTECT_JS, 'protect layer');
  const protectBlock = '<style>' + PROTECT_CSS + '</style><script>' + protectJs + '</script>';
  const appJs = ['i18n.js', 'lang.js', 'pwa.js', 'push.js', 'photo.js', 'voice.js'];
  const jsMap = {};
  for (const f of appJs) {
    const code = fs.readFileSync(path.join(SRC, f), 'utf-8');
    const out = await minifyJs(code, JS_OPTS);
    if (!out.code) throw new Error('minify failed: ' + f);
    const hardened = await harden(out.code, f);
    const h = sha(Buffer.from(hardened, 'utf-8'));
    const stem = path.basename(f, '.js');
    const outName = `${stem}-${h}.js`;
    fs.writeFileSync(path.join(OUT, 'assets', outName), hardened);
    jsMap['/' + f] = '/assets/' + outName;
  }
  console.log('app js hashed:', JSON.stringify(jsMap));

  /* ── 6. sw.js → minified + hardened (keeps /sw.js path — SW scope requirement) ── */
  for (const [orig, hashed] of Object.entries(iconMap)) {
    swSrc = swSrc.split("'/icons/" + orig + "'").join("'" + hashed + "'");
  }
  const swOut = await minifyJs(swSrc, JS_OPTS);
  const swHard = await harden(swOut.code, 'sw.js');
  fs.writeFileSync(path.join(OUT, 'sw.js'), swHard);
  console.log('sw.js hardened (', swHard.length, 'bytes )');

  /* ── 7. HTML pages: rewrite refs + minify + inject anti-inspection layer ── */
  const pages = files(SRC).filter(f => f.endsWith('.html'));
  for (const p of pages) {
    let html = fs.readFileSync(path.join(SRC, p), 'utf-8');
    for (const [orig, hashed] of Object.entries(jsMap)) html = html.split('src="' + orig + '"').join('src="' + hashed + '"');
    for (const [orig, hashed] of Object.entries(vendorMap)) html = html.split('src="' + orig + '"').join('src="' + hashed + '"');
    for (const [orig, hashed] of Object.entries(iconMap)) html = html.split('"/icons/' + orig + '"').join('"' + hashed + '"');
    let out = await minifyHtml(html, HTML_OPTS);
    if (out.indexOf('<head>') === -1) throw new Error('no <head> in ' + p);
    out = out.replace('<head>', '<head>' + protectBlock);
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
  // stale hashed app assets (content changed → new hash → old file must go)
  const keepApp = new Set(Object.values(jsMap).map(p => path.basename(p)));
  for (const f of files(path.join(OUT, 'assets'))) {
    if (!keepApp.has(f)) fs.unlinkSync(path.join(OUT, 'assets', f));
  }
  // stale vendor assets
  const keepVendor = new Set(Object.values(vendorMap).map(p => path.basename(p)));
  for (const f of files(path.join(OUT, 'assets', 'vendor'))) {
    if (!keepVendor.has(f)) fs.unlinkSync(path.join(OUT, 'assets', 'vendor', f));
  }
  // old non-hashed icons remove
  for (const f of files(path.join(OUT, 'icons'))) {
    if (!/-[0-9a-f]{8}\./.test(f)) fs.unlinkSync(path.join(OUT, 'icons', f));
  }
  console.log('BUILD COMPLETE');
})().catch(e => { console.error('BUILD FAILED:', e); process.exit(1); });
