'use strict';

const { Blob } = require('node:buffer');

const API_ORIGIN = 'https://api.cloudinary.com/v1_1';

const normalizeFolder = (folder) =>
  String(folder || '')
    .split('/')
    .map((part) => part.trim().replace(/[^a-zA-Z0-9_-]/g, '-'))
    .filter(Boolean)
    .join('/');

const readStream = async (readable) => {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const parseResponse = async (response, operation) => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Cloudinary ${operation} failed: ${message}`);
  }
  return payload;
};

module.exports = {
  init({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret } = {}) {
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary configuration is incomplete.');
    }

    const authorization = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;
    const endpoint = (resourceType, action) =>
      `${API_ORIGIN}/${encodeURIComponent(cloudName)}/${resourceType}/${action}`;

    const request = async (resourceType, action, form, operation) => {
      const response = await fetch(endpoint(resourceType, action), {
        method: 'POST',
        headers: { Authorization: authorization },
        body: form,
      });
      return parseResponse(response, operation);
    };

    const uploadBuffer = async (file, buffer, options = {}) => {
      const folder = normalizeFolder(options.folder);
      const publicId = folder ? `${folder}/${file.hash}` : file.hash;
      const form = new FormData();
      form.append('file', new Blob([buffer], { type: file.mime }), `${file.hash}${file.ext || ''}`);
      form.append('public_id', publicId);
      form.append('overwrite', 'true');
      form.append('invalidate', 'true');

      const result = await request('auto', 'upload', form, 'upload');
      if (!result.secure_url || !result.public_id || !result.resource_type) {
        throw new Error('Cloudinary upload failed: response is missing asset metadata.');
      }

      file.url = result.secure_url;
      file.provider_metadata = {
        public_id: result.public_id,
        resource_type: result.resource_type,
      };
    };

    return {
      async upload(file, options) {
        if (!file.buffer) {
          throw new Error('Missing file buffer.');
        }
        await uploadBuffer(file, file.buffer, options);
      },

      async uploadStream(file, options) {
        if (!file.stream) {
          throw new Error('Missing file stream.');
        }
        await uploadBuffer(file, await readStream(file.stream), options);
      },

      async delete(file) {
        const publicId = file?.provider_metadata?.public_id;
        if (!publicId) {
          return;
        }

        const resourceType = file.provider_metadata.resource_type || 'image';
        const form = new FormData();
        form.append('public_id', publicId);
        form.append('invalidate', 'true');
        await request(resourceType, 'destroy', form, 'delete');
      },
    };
  },
};
