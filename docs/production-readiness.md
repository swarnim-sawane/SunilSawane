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
- Set the frontend API base URL to the deployed Strapi domain before publishing the static site.
- Set `PUBLIC_URL` on Strapi to the deployed backend URL so emails, admin links, and generated URLs resolve correctly.
- Set `CORS_ORIGINS` to the final frontend domain, for example the Vercel site URL.
- Set `ORDER_NOTIFICATION_EMAIL` to the artist/order inbox.
- Set `ORDER_EMAIL_FROM` to a verified sender address from the email provider.
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
- Confirm a paid order marks the artwork unavailable for purchase.

## Collector operations

- Confirm each artwork has final collector data: exact size, medium, year, price, availability, framing status, shipping note, and certificate/authenticity note.
- With Strapi running, audit incomplete artwork data through:
  `cd backend/art-gallery-cms && npm run content:audit`
- Confirm order success pages do not reveal private collector details to anyone without the receipt lookup token or order context.
- Confirm email notifications before relying on them operationally. The order flow now attempts artist and collector confirmation emails after successful payment verification; if email delivery fails, the order still remains confirmed and Strapi logs the email error.

## Final live-mode smoke test

Run one final live-mode smoke test before announcing sales publicly:

1. Point frontend config to production Strapi.
2. Set Razorpay live key id in frontend config or public environment.
3. Set `RAZORPAY_KEY_SECRET` in the backend deployment environment.
4. Confirm Public role permissions for the custom order endpoints.
5. Purchase one low-value test artwork or temporary test listing in live mode.
6. Verify Razorpay payment success, Strapi order creation, paid status, artwork availability update, receipt page, and order success page.
7. Remove or archive any temporary test listing before public launch.
