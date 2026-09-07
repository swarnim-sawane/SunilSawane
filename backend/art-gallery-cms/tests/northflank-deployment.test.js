const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const backendRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(backendRoot, file), 'utf8');

test('Northflank deployment uses a reproducible Node 22 container', () => {
  const dockerfile = read('Dockerfile');
  const dockerignore = read('.dockerignore');

  assert.match(dockerfile, /FROM node:22-bookworm-slim/);
  assert.match(dockerfile, /npm ci/);
  assert.match(dockerfile, /npm run build/);
  assert.match(dockerfile, /EXPOSE 1337/);
  assert.match(dockerfile, /\/_health/);
  assert.match(dockerfile, /npm.*run.*start/);

  assert.match(dockerignore, /^\.env$/m);
  assert.match(dockerignore, /^node_modules$/m);
  assert.match(dockerignore, /^\.tmp$/m);
  assert.match(dockerignore, /^public\/uploads\/\*$/m);
});

test('production uploads are backed by the local Cloudinary REST provider', () => {
  const plugins = read('config/plugins.ts');
  const middlewares = read('config/middlewares.ts');
  const provider = read('src/providers/cloudinary-rest.js');

  assert.match(plugins, /CLOUDINARY_ENABLED/);
  assert.match(plugins, /cloudinary-rest/);
  assert.match(plugins, /CLOUDINARY_NAME/);
  assert.match(plugins, /CLOUDINARY_KEY/);
  assert.match(plugins, /CLOUDINARY_SECRET/);
  assert.match(provider, /api\.cloudinary\.com/);
  assert.match(provider, /Basic/);
  assert.match(provider, /uploadStream/);
  assert.match(provider, /delete/);
  assert.match(middlewares, /res\.cloudinary\.com/);
});

test('Northflank runbook defines service, database, health, secrets, and migration', () => {
  const runbook = fs.readFileSync(
    path.resolve(backendRoot, '..', '..', 'docs', 'northflank-deployment.md'),
    'utf8'
  );

  assert.match(runbook, /backend\/art-gallery-cms/);
  assert.match(runbook, /POSTGRES_URI/);
  assert.match(runbook, /DATABASE_URL/);
  assert.match(runbook, /\/_health/);
  assert.match(runbook, /CLOUDINARY_NAME/);
  assert.match(runbook, /RAZORPAY_KEY_SECRET/);
  assert.match(runbook, /strapi transfer/);
  assert.match(runbook, /rollback/i);
});
