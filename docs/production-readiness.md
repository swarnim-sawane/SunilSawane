# Production Readiness

Use this checklist before switching the shop from local testing to real collector orders.

## Runtime and install

- Run the Strapi backend on Node 22. The current Strapi version supports Node 22, and native modules such as `better-sqlite3` must be installed under the same Node version used to run the server.
- Reinstall backend dependencies after changing Node versions:
  `cd backend/art-gallery-cms && npm install`
- Start from a clean build on the deployment host:
  `npm run build && npm run start`
- For Northflank, follow `docs/northflank-deployment.md`; its container, PostgreSQL addon, health check, migration, and rollback settings are the production source of truth.

## Environment variables

- Use test Razorpay keys only in local development.
- Use the Razorpay live key id only after the frontend and backend are pointed at the production Strapi URL.
- Set `RAZORPAY_KEY_SECRET` only in the backend deployment environment. Never expose it in frontend JavaScript, static HTML, or committed files.
- Set a separate `RAZORPAY_WEBHOOK_SECRET` and configure Razorpay to deliver signed events to `/api/orders/razorpay-webhook`.
- Set `PAYMENT_RESERVATION_MINUTES=20` unless a deliberately tested checkout window is required.
- Set `PAYMENT_MAX_RESERVED_ARTWORKS_PER_CLIENT=3` to limit how many unpaid originals one client can hold at once.
- Set `TRUST_PROXY=true` on Northflank so checkout limits use the client IP supplied by its load balancer rather than one shared proxy address. Do not expose Strapi directly while this is enabled.
- Set the frontend API base URL to the deployed Strapi domain before publishing the static site.
- Set `PUBLIC_URL` on Strapi to the deployed backend URL so emails, admin links, and generated URLs resolve correctly.
- Set `FRONTEND_URL` to the deployed gallery origin. Order-email receipt buttons use this URL to open the themed `order-success.html` view instead of exposing the JSON API response.
- Set `CORS_ORIGINS` to the final frontend domain, for example the Vercel site URL.
- Set `ORDER_NOTIFICATION_EMAIL` to the artist/order inbox.
- Set `ORDER_EMAIL_FROM` to a verified sender address from the email provider.
- Before setting `DEPLOYMENT_STAGE=live`, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USERNAME`, and `SMTP_PASSWORD`; order email is sent directly through this authenticated SMTP connection. Test-mode staging may run without SMTP while email delivery is being configured.
- Set `CLOUDINARY_ENABLED=true` and provide `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, and `CLOUDINARY_SECRET` so uploaded artwork is durable outside the service container.
- Before deploy, run:
  `cd backend/art-gallery-cms && npm run production:check`

## Database

- Development can use SQLite through:
  `DATABASE_CLIENT=sqlite`
- Production should use PostgreSQL through:
  `DATABASE_CLIENT=postgres`
- Provide `DATABASE_URL` from the production database provider.
- Enable SSL if the database provider requires it.
- Back up the production database before schema changes, content import, or payment-flow changes.
- Keep the `pg` dependency installed for PostgreSQL deployments.

## Strapi permissions

In Strapi admin, verify Public role permissions for the custom order endpoints:

- `orders/create-razorpay-order`
- `orders/verify-payment`
- `orders/release-reservation`
- `orders/razorpay-webhook`
- `orders/receipt/:orderNumber`

Only expose the minimum routes required by the shop. Do not grant broad public create/update/delete access to artwork, category, or order content types.

Recommended Public permissions:

- Artwork: `find` and `findOne`
- Category: `find` and `findOne`
- Order: no default CRUD permissions
- Custom order routes: create Razorpay order, verify payment, and public receipt

## Razorpay checkout

- Confirm the backend creates Razorpay orders using the server-side `RAZORPAY_KEY_SECRET`.
- Confirm the frontend receives only the Razorpay order id, key id, amount, currency, and public checkout metadata.
- Confirm payment verification uses Razorpay signature verification on the backend before marking an order paid.
- Confirm the server fetches the payment from Razorpay and validates `captured`, order id, amount, and currency before marking an order paid.
- Confirm stock is reserved atomically before Razorpay opens, released after an unpaid dismissal/expiry, and remains unavailable after confirmation.
- Confirm an `authorized` Razorpay payment keeps its reservation until capture or failure settles.
- Configure the signed Razorpay webhook for `payment.captured`, `payment.failed`, `order.paid`, and `refund.processed`. Confirm duplicate deliveries remain idempotent.

## Collector operations

- Confirm each artwork has final collector data: exact size, medium, year, price, availability, framing status, shipping note, and certificate/authenticity note.
- With Strapi running, audit incomplete artwork data through:
  `cd backend/art-gallery-cms && npm run content:audit`
- Confirm order success pages do not reveal private collector details to anyone without the receipt lookup token or order context.
- Confirm email notifications before relying on them operationally. Artist and collector deliveries are tracked separately and retried in the background; email failure never reverses a confirmed payment.

## Final live-mode smoke test

Run one final live-mode smoke test before announcing sales publicly:

1. Point frontend config to production Strapi.
2. Set Razorpay live key id in frontend config or public environment.
3. Set `RAZORPAY_KEY_SECRET` in the backend deployment environment.
4. Set `RAZORPAY_WEBHOOK_SECRET`, add the production webhook in Razorpay, and use Razorpay's webhook test action.
5. Confirm Public role permissions for the custom order endpoints.
6. Send SMTP test mail to both the artist inbox and a collector address.
7. Purchase one low-value test artwork or temporary test listing in live mode.
8. Verify Razorpay payment success, Strapi order creation, paid status, artwork availability update, receipt page, both emails, and order success page.
9. Confirm a dismissed unpaid checkout releases the artwork and a duplicate webhook does not duplicate the order.
10. Remove or archive any temporary test listing before public launch.
