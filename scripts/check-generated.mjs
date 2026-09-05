// Rebuild in a temporary directory; never rewrite tracked output during verification.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = mkdtempSync(join(tmpdir(), 'safex-rebuild-'));
function manifest(dir, prefix = '') {
  const files = {};
  for (const entry of readdirSync(join(dir, prefix), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'deploy.log') continue;
    const path = join(prefix, entry.name);
    if (entry.isDirectory()) Object.assign(files, manifest(dir, path));
    else if (entry.isFile()) files[path] = createHash('sha256').update(readFileSync(join(dir, path))).digest('hex');
    else throw new Error(`Unexpected artifact: ${path}`);
  }
  return files;
}
try {
  const build = spawnSync(process.execPath, ['safex-src/build.js'], { cwd: root, env: { ...process.env, SAFEX_OUT: temp }, stdio: 'inherit' });
  assert.equal(build.status, 0, 'Isolated Safex build failed');
  const expected = manifest(temp);
  assert.deepEqual(manifest(join(root, 'safex')), expected, 'Generated safex/ is stale. Run npm run build and include its changes.');
  console.log(`Verified ${Object.keys(expected).length} reproducible Safex artifacts.`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
