# Gallery Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the Gallery page into a premium curated viewing experience that keeps the current hero, shows full artworks without cropping, and reveals descriptions without adding an extra click.

**Architecture:** Keep the static HTML/CSS/jQuery structure already used by the site. Replace the old gallery card rendering and filter styling with gallery-scoped classes so the shop and legacy product-card styles do not leak into the Gallery page.

**Tech Stack:** Static HTML, CSS, Bootstrap grid, jQuery, Node test runner for source-level UI regression tests, Browser plugin for rendered QA.

---

### Task 1: Gallery UI Regression Test

**Files:**
- Create: `frontend/tests/premium-gallery-ui.test.js`
- Read: `frontend/gallery.html`
- Read: `frontend/js/gallery.js`
- Read: `frontend/style.css`

- [ ] **Step 1: Write the failing test**

Create a Node test that asserts the Gallery page has a scoped `gallery-page` body, quiet filter dock, gallery-specific card classes, full-artwork image treatment, caption teaser reveal, and no legacy `text-box` / `box-slide` overlay usage in `frontend/js/gallery.js`.

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
& 'C:\Users\ssawane\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test frontend\tests\premium-gallery-ui.test.js
```

Expected: FAIL because the current gallery still uses old filter markup, `product-card`, `text-box`, `box-slide`, and cropped `object-fit: cover` images.

### Task 2: Gallery Markup And Rendering

**Files:**
- Modify: `frontend/gallery.html`
- Modify: `frontend/js/gallery.js`

- [ ] **Step 1: Update `gallery.html`**

Add `gallery-page` to the body, add cache-busting query strings to `style.css` and `js/gallery.js`, keep the hero, and replace the visible filter block with a quiet `gallery-filter-dock` containing a visually hidden label, `gallery-filter-rail`, category buttons, and a small result count.

- [ ] **Step 2: Update `gallery.js`**

Render cards with `gallery-artwork-item`, `gallery-artwork-card`, `gallery-card-surface`, `gallery-art-frame`, `gallery-art-image`, `gallery-card-caption`, `gallery-description-teaser`, and `gallery-view-link`. Use `object-fit: contain` through CSS instead of fixed inline `height: 300px; object-fit: cover;`.

- [ ] **Step 3: Run the test**

Run:

```powershell
& 'C:\Users\ssawane\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test frontend\tests\premium-gallery-ui.test.js
```

Expected: PASS after CSS is added in Task 3.

### Task 3: Gallery CSS And Responsive UX

**Files:**
- Modify: `frontend/style.css`

- [ ] **Step 1: Add gallery-scoped CSS**

Add a final Gallery refinement section after the existing shop overrides. Include a glass header for `.gallery-page #header`, quieter hero sizing, seamless page background, text-led category filters, generous grid gaps, theme-colored hairline card boundaries, full-artwork frames, pointer/focus states, and reduced-motion support.

- [ ] **Step 2: Add description reveal behavior**

On desktop, keep `.gallery-description-teaser` visually quiet by default and reveal it on `.gallery-artwork-card:hover` and `.gallery-artwork-card:focus-within`. On mobile, make the teaser visible and line-clamped by default so touch users do not lose description access.

- [ ] **Step 3: Validate source and rendered page**

Run:

```powershell
& 'C:\Users\ssawane\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check frontend\js\gallery.js
& 'C:\Users\ssawane\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test frontend\tests\premium-shop-ui.test.js
git diff --check -- frontend\gallery.html frontend\style.css frontend\js\gallery.js frontend\tests\premium-gallery-ui.test.js
```

Expected: JS syntax passes, the existing shop UI regression stays green, and whitespace checks show no new issues in the touched Gallery files.

### Task 4: Browser QA

**Files:**
- Verify rendered route: `http://127.0.0.1:8765/gallery.html`

- [ ] **Step 1: Load the Gallery page in the in-app Browser**

Expected: Page title and URL identify the Gallery page, the page is not blank, and the framework error overlay is absent.

- [ ] **Step 2: Check UI behavior**

Expected: 41 artworks render, filters sit below the header, first artwork image uses `object-fit: contain`, desktop description teaser reveals on hover/focus, mobile teaser is visible by default, and there are no relevant console errors.

- [ ] **Step 3: Update the Obsidian board**

Move the Gallery refinement item from In Progress to Done with the current IST timestamp.
