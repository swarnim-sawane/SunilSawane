const assert = require('node:assert/strict');
const test = require('node:test');

const provider = require('../src/providers/cloudinary-rest');

const credentials = {
  cloud_name: 'sunil-gallery',
  api_key: 'collector-key',
  api_secret: 'collector-secret',
};

test('uploads artwork buffers with server-side Basic authentication', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, options) => {
    assert.equal(url, 'https://api.cloudinary.com/v1_1/sunil-gallery/auto/upload');
    assert.equal(
      options.headers.Authorization,
      `Basic ${Buffer.from('collector-key:collector-secret').toString('base64')}`
    );
    assert.equal(options.body.get('public_id'), 'artworks/floral-guardian');
    assert.equal(options.body.get('overwrite'), 'true');
    assert.equal(options.body.get('invalidate'), 'true');

    return {
      ok: true,
      json: async () => ({
        secure_url: 'https://res.cloudinary.com/sunil-gallery/image/upload/floral-guardian.jpg',
        public_id: 'artworks/floral-guardian',
        resource_type: 'image',
      }),
    };
  };

  const file = {
    hash: 'floral-guardian',
    ext: '.jpg',
    mime: 'image/jpeg',
    name: 'Floral Guardian',
    buffer: Buffer.from('artwork'),
  };

  await provider.init(credentials).upload(file, { folder: 'artworks' });

  assert.equal(
    file.url,
    'https://res.cloudinary.com/sunil-gallery/image/upload/floral-guardian.jpg'
  );
  assert.deepEqual(file.provider_metadata, {
    public_id: 'artworks/floral-guardian',
    resource_type: 'image',
  });
});

test('deletes uploaded artwork using stored provider metadata', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, options) => {
    assert.equal(url, 'https://api.cloudinary.com/v1_1/sunil-gallery/image/destroy');
    assert.equal(options.body.get('public_id'), 'artworks/floral-guardian');
    assert.equal(options.body.get('invalidate'), 'true');
    return { ok: true, json: async () => ({ result: 'ok' }) };
  };

  const file = {
    provider_metadata: {
      public_id: 'artworks/floral-guardian',
      resource_type: 'image',
    },
  };

  await provider.init(credentials).delete(file);
});

test('rejects incomplete credentials without exposing the API secret', () => {
  assert.throws(
    () => provider.init({ ...credentials, api_key: '' }),
    /Cloudinary configuration is incomplete/
  );
});
