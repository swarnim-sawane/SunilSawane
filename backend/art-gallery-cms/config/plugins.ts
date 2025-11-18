module.exports = ({ env }) => ({
  // Temporarily disable email plugin
  /* 
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'smtp.gmail.com'),
        port: env('SMTP_PORT', 587),
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
      },
      settings: {
        defaultFrom: env('SMTP_DEFAULT_FROM', 'noreply@sunilsawaneart.com'),
        defaultReplyTo: env('SMTP_DEFAULT_REPLY_TO', 'contact@sunilsawaneart.com'),
      },
    },
  },
  */
});
