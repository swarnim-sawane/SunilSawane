const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..', '..');
const packagePath = path.join(repoRoot, 'package.json');
const launcherPath = path.join(repoRoot, 'scripts', 'dev.ps1');

test('root npm dev command launches backend and frontend services', () => {
  assert.ok(fs.existsSync(packagePath), 'root package.json should exist');
  assert.ok(fs.existsSync(launcherPath), 'scripts/dev.ps1 should exist');

  const rootPackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  assert.equal(
    rootPackage.scripts?.dev,
    'powershell -ExecutionPolicy Bypass -File ./scripts/dev.ps1',
  );

  const launcher = fs.readFileSync(launcherPath, 'utf8');
  assert.match(launcher, /backend[\\/]art-gallery-cms/);
  assert.match(launcher, /strapi develop/);
  assert.match(launcher, /frontend/);
  assert.match(launcher, /http\.server/);
  assert.match(launcher, /8765/);
  assert.match(launcher, /1337/);
  assert.match(launcher, /Stop-Process/);
});
