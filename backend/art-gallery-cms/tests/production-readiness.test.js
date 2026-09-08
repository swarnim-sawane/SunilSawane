const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const backendRoot = path.join(repoRoot, 'backend', 'art-gallery-cms');
const readRepo = (file) => fs.readFileSync(path.join(repoRoot, file), 'utf8');
const readBackend = (file) => fs.readFileSync(path.join(backendRoot, file), 'utf8');

test('production deployment checklist documents payment and Strapi permissions', () => {
  const checklistPath = path.join(repoRoot, 'docs', 'production-readiness.md');
  assert.ok(fs.existsSync(checklistPath), 'docs/production-readiness.md should exist');

  const checklist = readRepo('docs/production-readiness.md');
  assert.match(checklist, /Razorpay live key id/i);
  assert.match(checklist, /RAZORPAY_KEY_SECRET/);
  assert.match(checklist, /Public role permissions/i);
  assert.match(checklist, /orders\/create-razorpay-order/);
  assert.match(checklist, /orders\/verify-payment/);
  assert.match(checklist, /orders\/receipt\/:orderNumber/);
  assert.match(checklist, /Node 22/i);
  assert.match(checklist, /DATABASE_CLIENT=postgres/i);
  assert.match(checklist, /final live-mode smoke test/i);
});

test('environment example captures required production settings without real secrets', () => {
  const envExample = readBackend('.env.example');

  assert.match(envExample, /NODE_ENV=development/);
  assert.match(envExample, /PUBLIC_URL=/);
  assert.match(envExample, /FRONTEND_URL=/);
  assert.match(envExample, /DATABASE_CLIENT=sqlite/);
  assert.match(envExample, /# Production database/);
  assert.match(envExample, /DATABASE_URL=/);
  assert.match(envExample, /RAZORPAY_KEY_ID=rzp_test_replace_me/);
  assert.match(envExample, /RAZORPAY_KEY_SECRET=replace_me/);
  assert.doesNotMatch(envExample, /rzp_live_[A-Za-z0-9]{8,}/);
});
