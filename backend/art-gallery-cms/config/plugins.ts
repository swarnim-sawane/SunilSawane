import { resolve } from 'node:path';

export default ({ env }) => {
  if (!env.bool('CLOUDINARY_ENABLED', false)) {
    return {};
  }

  return {
    upload: {
      config: {
        provider: resolve(process.cwd(), 'src', 'providers', 'cloudinary-rest'),
        providerOptions: {
          cloud_name: env('CLOUDINARY_NAME'),
          api_key: env('CLOUDINARY_KEY'),
          api_secret: env('CLOUDINARY_SECRET'),
        },
        actionOptions: {
          upload: {
            folder: env('CLOUDINARY_FOLDER', 'sunilsawane-artworks'),
          },
          uploadStream: {
            folder: env('CLOUDINARY_FOLDER', 'sunilsawane-artworks'),
          },
          delete: {},
        },
      },
    },
  };
};
