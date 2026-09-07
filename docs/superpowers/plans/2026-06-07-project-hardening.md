# Project Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the SunilSawane art gallery safer and cleaner for production by fixing payment/order trust boundaries, XSS-prone rendering, dependency/repo hygiene, script/config drift, and content model issues.

**Architecture:** Keep the frontend as static HTML/CSS/JS and Strapi as the CMS/API. Add small shared browser-safe frontend utility modules instead of a bundler. Move payment trust to Strapi custom routes/controllers that verify Razorpay signatures and calculate order totals from CMS artwork data.

**Tech Stack:** Static HTML, jQuery, Bootstrap, Strapi 5, Node/npm, Razorpay Checkout.

---

### Task 1: Frontend Safe Rendering And Config Cleanup

**Files:**
- Create: `frontend/js/dom-utils.js`
- Modify: `frontend/js/api.js`
- Modify: `frontend/js/shop.js`
- Modify: `frontend/js/gallery.js`
- Modify: `frontend/js/cart.js`
- Modify: `frontend/js/artwork-detail.js`
- Modify: `frontend/js/order-success.js`
- Modify: `frontend/js/checkout.js`
- Modify: `frontend/gallery.html`
- Modify: `frontend/shop.html`
- Modify: `frontend/checkout.html`
- Modify: `frontend/cart.html`
- Modify: `frontend/order-success.html`
- Modify: `frontend/artwork-detail.html`

- [ ] Add shared escaping/DOM helpers in `dom-utils.js`.
- [ ] Replace dynamic HTML interpolation with DOM construction or escaped values.
- [ ] Remove duplicate `gallery.js` load and shop stray backslash.
- [ ] Make `api.js` the single frontend API base source; preserve deployed Strapi URL while avoiding unused ES module config.
- [ ] Add frontend smoke checks for gallery, shop, cart, checkout, order success rendering.

### Task 2: Backend Payment And Order Hardening

**Files:**
- Modify: `backend/art-gallery-cms/package.json`
- Modify: `backend/art-gallery-cms/src/api/order/controllers/order.ts`
- Modify: `backend/art-gallery-cms/src/api/order/routes/order.ts`
- Modify: `backend/art-gallery-cms/src/api/order/content-types/order/schema.json`
- Modify: `frontend/js/checkout.js`
- Modify: `backend/art-gallery-cms/.env.example`

- [ ] Add Razorpay server SDK dependency.
- [ ] Add `POST /orders/create-razorpay-order` route that validates requested item IDs/quantities and calculates amount from Strapi artwork prices.
- [ ] Add `POST /orders/verify-payment` route that verifies Razorpay signature before creating confirmed Strapi order.
- [ ] Keep customer/order input validation explicit and reject malformed carts.
- [ ] Update checkout flow to call backend order creation, open Razorpay with server order id, then call backend verification.

### Task 3: Dependency And Repo Hygiene

**Files:**
- Modify: `.gitignore`
- Modify: `backend/art-gallery-cms/package.json`
- Modify: `backend/art-gallery-cms/package-lock.json`
- Delete from Git tracking: `backend/node_modules/**`
- Delete if obsolete: `backend/package.json`
- Delete if obsolete: `backend/package-lock.json`

- [ ] Add root ignores for `node_modules`, Strapi build/runtime folders, logs, and env files.
- [ ] Remove tracked legacy `backend/node_modules` from Git index.
- [ ] Remove obsolete root backend email package if no longer used.
- [ ] Upgrade Strapi/dependency versions enough to reduce critical/high audit issues without changing architecture.
- [ ] Run fresh audit and document remaining advisories.

### Task 4: Strapi Content Model Cleanup

**Files:**
- Modify: `backend/art-gallery-cms/src/api/artwork/content-types/artwork/schema.json`
- Modify: `backend/art-gallery-cms/src/api/category/content-types/category/schema.json`

- [ ] Change category/artwork relation from one-to-one to category has many artworks and artwork has one category.
- [ ] Keep public API field names compatible for existing frontend category lookup.
- [ ] Run Strapi build to verify schemas.

### Task 5: Verification And Obsidian Updates

**Files:**
- Modify: `C:\Users\ssawane\Documents\Personal\Obsidian\Personal Obsidian\04 Projects\SunilSawane Art Gallery\SunilSawane Art Gallery Board.md`

- [ ] Update board after each task moves to review/done.
- [ ] Run `npm run build` in `backend/art-gallery-cms`.
- [ ] Run `npm audit --omit=dev` in relevant package roots.
- [ ] Run local frontend server and browser smoke test gallery/shop/cart/checkout/order-success.
- [ ] Summarize remaining production setup requirements, especially Razorpay keys/webhooks and Strapi public permissions.
