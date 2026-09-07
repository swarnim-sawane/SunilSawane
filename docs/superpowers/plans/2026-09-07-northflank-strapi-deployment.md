# Northflank Strapi Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing Strapi 5 backend deployable on Northflank's free sandbox with PostgreSQL and durable Cloudinary media.

**Architecture:** Vercel continues serving the static frontend. Northflank runs a Node 22 Strapi container, a linked PostgreSQL addon stores content and orders, and Cloudinary stores uploaded artwork assets so the service filesystem remains disposable.

**Tech Stack:** Strapi 5.47.1, Node.js 22, PostgreSQL, Cloudinary, Docker, Northflank combined service

**Spec:** `docs/production-readiness.md`

**Current status (2026-09-07):** The Northflank project, GitHub integration, and free PostgreSQL 17 addon are provisioned. The blocked npm provider was replaced by a tested local adapter using Cloudinary's authenticated server-side HTTPS API. Cloudinary credentials, runtime secrets, service creation, migration, and live smoke testing remain.

## Global Constraints

- Never commit service credentials, database URLs, Razorpay secrets, or Cloudinary secrets.
- Local development must continue to use SQLite and Strapi's local upload provider by default.
- Production startup must fail closed when PostgreSQL, Cloudinary, payment, or Strapi secrets are missing.
- Use Strapi's unauthenticated `/_health` endpoint for platform health checks.
- Preserve the existing frontend and payment APIs.

---

### Task 1: Deployment Contract

**Files:**
- Create: `backend/art-gallery-cms/tests/northflank-deployment.test.js`
- Create: `backend/art-gallery-cms/Dockerfile`
- Create: `backend/art-gallery-cms/.dockerignore`
- Create: `backend/art-gallery-cms/src/providers/cloudinary-rest.js`
- Create: `backend/art-gallery-cms/tests/cloudinary-rest-provider.test.js`

**Interfaces:**
- Consumes: the existing `npm run build` and `npm run start` scripts
- Produces: a Node 22 image exposing port 1337 and checking `/_health`

- [x] Write tests that require the Docker build contract and durable Cloudinary upload behavior.
- [x] Run the targeted tests and confirm they fail because deployment files and the provider are absent.
- [x] Add the Docker files and the dependency-free Cloudinary REST provider.
- [x] Re-run the targeted tests and confirm they pass.

### Task 2: Durable Production Configuration

**Files:**
- Modify: `backend/art-gallery-cms/config/plugins.ts`
- Modify: `backend/art-gallery-cms/config/middlewares.ts`
- Modify: `backend/art-gallery-cms/src/utils/production-readiness.js`
- Modify: `backend/art-gallery-cms/.env.example`
- Modify: `backend/art-gallery-cms/tests/northflank-deployment.test.js`
- Modify: `backend/art-gallery-cms/tests/strapi-launch-readiness.test.js`

**Interfaces:**
- Consumes: `CLOUDINARY_ENABLED`, `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, and `CLOUDINARY_SECRET`
- Produces: local uploads in development and Cloudinary uploads in production

- [x] Extend failing tests to require Cloudinary configuration, CSP domains, and production validation.
- [x] Run the targeted tests and confirm the new assertions fail.
- [x] Implement conditional Cloudinary upload configuration and fail-closed production validation.
- [x] Re-run the targeted tests and confirm they pass.

### Task 3: Northflank Operations Runbook

**Files:**
- Create: `docs/northflank-deployment.md`
- Modify: `docs/production-readiness.md`
- Modify: `backend/art-gallery-cms/tests/northflank-deployment.test.js`

**Interfaces:**
- Consumes: Northflank `POSTGRES_URI`, runtime secrets, public port 1337, and a destination Strapi transfer token
- Produces: repeatable deployment, migration, rollback, and backup instructions

- [x] Add failing documentation assertions for service root, commands, secret aliases, health path, and Strapi data transfer.
- [x] Run the targeted test and confirm the documentation assertions fail.
- [x] Write the Northflank deployment and migration runbook with exact dashboard settings.
- [x] Re-run the targeted test and confirm it passes.

### Task 4: Release Verification

**Files:**
- Verify all files changed by Tasks 1-3

**Interfaces:**
- Consumes: the complete deployment package
- Produces: evidence that the repository remains locally runnable and production-buildable

- [x] Run `npm test` from the repository root.
- [x] Run `npx tsc --noEmit --incremental false --pretty false` in `backend/art-gallery-cms`.
- [x] Run `npm run build` in `backend/art-gallery-cms`.
- [x] Run `git diff --check` and inspect `git status --short`.
