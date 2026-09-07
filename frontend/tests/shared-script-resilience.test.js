const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const frontendRoot = path.resolve(__dirname, '..');

function createJQueryStub() {
  const api = {
    ready(callback) {
      callback();
      return api;
    },
    fadeOut() { return api; },
    hcSticky() { return api; },
    click() { return api; },
    toggleClass() { return api; },
    focus() { return api; },
    each() { return api; },
    attr() { return ''; },
    find() { return api; },
    val() { return '0'; },
  };

  return function jqueryStub() {
    return api;
  };
}

test('shared script does not throw when optional Swiper library is absent', () => {
  const script = fs.readFileSync(path.join(frontendRoot, 'js', 'script.js'), 'utf8');
  const jqueryStub = createJQueryStub();
  const sandbox = {
    jQuery: jqueryStub,
    $: jqueryStub,
    jarallax() {},
    document: {
      querySelector() { return null; },
      querySelectorAll() { return []; },
      documentElement: {},
    },
    window: {
      requestAnimationFrame(callback) {
        callback();
      },
      addEventListener() {},
      matchMedia() {
        return { matches: false };
      },
      innerHeight: 900,
    },
  };

  assert.doesNotThrow(() => {
    vm.runInNewContext(script, sandbox, { filename: 'script.js' });
  });
});
