# Northflank Deployment

This runbook deploys the Strapi Community backend without relying on the service filesystem. PostgreSQL stores catalogue and order data; Cloudinary stores artwork media.

## 1. Accounts and credentials

Create or confirm access to:

- Northflank with the GitHub repository connected.
- Cloudinary with a cloud name, API key, and API secret.
- Razorpay live-mode key id and secret.
- The production order notification inbox.

Do not put any credential in GitHub, the Dockerfile, frontend JavaScript, or a committed `.env` file.

## 2. Verify the media provider

The repository includes `src/providers/cloudinary-rest.js`, a dependency-free Strapi upload provider that uses Cloudinary's authenticated server-side HTTPS API. Verify its contract from `backend/art-gallery-cms`:

```powershell
node --test tests/cloudinary-rest-provider.test.js
```

The container intentionally uses `npm install --include=optional` with the committed lockfile. This preserves the optional native packages required by the Northflank Linux build; do not remove `--include=optional` without rerunning the deployment contract tests.

## 3. Create the Northflank project and database

1. Use the `Sunil Sawane Art Gallery` project in Europe West (London).
2. Use the PostgreSQL 17 addon named `art-gallery-postgres` on the free database plan.
3. Keep the database private to the Northflank project. External access is not required for Strapi.
4. Create a runtime secret group named `gallery-production`.
5. Link `gallery-postgres` to the secret group and expose its standard `POSTGRES_URI` value with the alias `DATABASE_URL`.
6. Apply the secret group to the Strapi service created in the next section.

Use the standard application connection string, not the PostgreSQL administrator connection string.

## 4. Create the Strapi combined service

Create a combined service named `gallery-cms` with these settings:

| Setting | Value |
| --- | --- |
| Repository | `swarnim-sawane/SunilSawane` |
| Branch | `strapi` |
| Build type | Dockerfile |
| Dockerfile path | `/backend/art-gallery-cms/Dockerfile` |
| Build context | `/backend/art-gallery-cms` |
| Public port | HTTP `1337` |
| Instances | `1` |

Enable continuous deployment only after the first migration and live smoke test succeed.

Add an HTTP readiness probe:

| Health setting | Value |
| --- | --- |
| Type | Readiness |
| Port | `1337` |
| Path | `/_health` |
| Initial delay | `90` seconds |
| Period | `30` seconds |
| Timeout | `5` seconds |
| Failure threshold | `3` |

## 5. Configure runtime secrets

Add these values to the `gallery-production` runtime secret group. Generate independent random values for every Strapi secret; do not reuse the examples from `.env.example`.

```dotenv
NODE_ENV=production
DEPLOYMENT_STAGE=staging
HOST=0.0.0.0
PORT=1337
PUBLIC_URL=https://gallery-cms--sunilsawane-gallery--YOUR_ACCOUNT.code.run
CORS_ORIGINS=https://sunilsawane.vercel.app
TRUST_PROXY=true

DATABASE_CLIENT=postgres
DATABASE_URL=${POSTGRES_URI}
DATABASE_SSL=false
DATABASE_POOL_MIN=0
DATABASE_POOL_MAX=5

APP_KEYS=GENERATED_KEY_ONE,GENERATED_KEY_TWO
API_TOKEN_SALT=GENERATED_API_TOKEN_SALT
ADMIN_JWT_SECRET=GENERATED_ADMIN_JWT_SECRET
TRANSFER_TOKEN_SALT=GENERATED_TRANSFER_TOKEN_SALT
JWT_SECRET=GENERATED_JWT_SECRET
ENCRYPTION_KEY=GENERATED_ENCRYPTION_KEY

CLOUDINARY_ENABLED=true
CLOUDINARY_NAME=YOUR_CLOUDINARY_CLOUD_NAME
CLOUDINARY_KEY=YOUR_CLOUDINARY_API_KEY
CLOUDINARY_SECRET=YOUR_CLOUDINARY_API_SECRET
CLOUDINARY_FOLDER=sunilsawane-artworks

RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_TEST_SECRET
RAZORPAY_WEBHOOK_SECRET=GENERATED_SEPARATE_WEBHOOK_SECRET
PAYMENT_RESERVATION_MINUTES=20
PAYMENT_MAX_RESERVED_ARTWORKS_PER_CLIENT=3
ORDER_NOTIFICATION_EMAIL=sunilsawaneart@gmail.com
ORDER_EMAIL_FROM=orders@YOUR_VERIFIED_DOMAIN
ORDER_REPLY_TO=sunilsawaneart@gmail.com
SMTP_HOST=YOUR_SMTP_HOST
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=YOUR_SMTP_USERNAME
SMTP_PASSWORD=YOUR_SMTP_PASSWORD
```

Keep `DEPLOYMENT_STAGE=staging` with `rzp_test_...` credentials on the Northflank Developer Sandbox. Change it to `live` only when moving to production-supported hosting and supplying Razorpay live credentials.

`DATABASE_URL=${POSTGRES_URI}` above describes the alias relationship. In Northflank, link `POSTGRES_URI` from the addon and alias it to `DATABASE_URL`; do not paste the literal `${POSTGRES_URI}` text as a secret value.

Generate each secret locally with Node 22:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Run that command separately for every secret.

In the Razorpay dashboard, create a webhook pointing to:

`https://YOUR_SERVICE_DOMAIN/api/orders/razorpay-webhook`

Use the same value for the dashboard webhook secret and `RAZORPAY_WEBHOOK_SECRET`. Subscribe to `payment.captured`, `payment.failed`, `order.paid`, and `refund.processed`. Configure test-mode and live-mode webhooks separately.

## 6. First deployment

Deploy the service and verify:

1. The build completes the locked `npm install --include=optional` step and `npm run build`.
2. The service log contains `Strapi started successfully`.
3. `https://YOUR_SERVICE_DOMAIN/_health` returns HTTP 204.
4. `https://YOUR_SERVICE_DOMAIN/admin` loads and allows creation of the first production administrator.

If startup fails with `Production readiness check failed`, correct every listed secret or provider setting instead of disabling the guard.

## 7. Transfer the catalogue and media

The destination database must be treated as empty because `strapi transfer --force` replaces destination content.

1. In the destination admin, open **Settings > Transfer Tokens**.
2. Create a short-lived **Push** token and copy it immediately.
3. Start the local Strapi instance containing the verified 41-artwork catalogue.
4. In a second terminal, run from `backend/art-gallery-cms`:

```powershell
npm run strapi transfer -- --to https://YOUR_SERVICE_DOMAIN/admin --to-token YOUR_TRANSFER_TOKEN --force
```

The transfer includes entities, relations, configuration, schemas, and assets. Admin users and API tokens are not transferred. Delete the transfer token after validation.

## 8. Validate production data

In the production admin:

1. Confirm there are 41 published artworks and all expected categories.
2. Open several portrait, landscape, and square artworks and verify their Cloudinary previews.
3. Run the public artwork API and confirm image URLs use `res.cloudinary.com`.
4. Configure Public role permissions exactly as documented in `docs/production-readiness.md`.
5. Run `npm run content:audit` against the production API with a read-only `STRAPI_API_TOKEN`.

## 9. Cut over the frontend

Update `frontend/js/config.js` so `remoteApiBaseUrl` points to:

```text
https://YOUR_SERVICE_DOMAIN/api
```

Redeploy Vercel, then verify gallery, shop, artwork details, cart, checkout, Razorpay success, receipt, and sold-out behavior from the public domain.

## 10. Backup and rollback

Before every schema or payment-flow deployment:

1. Create a Northflank PostgreSQL dump backup.
2. Record the currently deployed Git commit and service build id.
3. Export Strapi content periodically with `npm run strapi export` and store the encrypted archive outside the repository.

For an application rollback, redeploy the previous known-good Northflank build. If the release changed database schemas, restore the matching PostgreSQL backup before reopening checkout. Never roll application code backward across an incompatible database migration without restoring its paired backup.
