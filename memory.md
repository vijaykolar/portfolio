# Project Memory — vijaykolar/portfolio

Context notes for the blog / CMS / auto-posting setup. Update this when the setup changes.

## Overview

Monorepo:
- `frontend/` — Next.js 15 (Pages Router) portfolio + blog. TypeScript, Tailwind, deployed on Vercel.
- `backend/` — small Express + SendGrid mailing-list endpoint (unrelated to the blog).

The blog uses **Keystatic** (free, MIT, git-based CMS) with articles stored as a **frontmatter MDX
content collection**. There is also an **automated poster** that publishes a new article every 3 days.

## Blog architecture

- Content lives at `frontend/src/content/articles/<slug>.mdx` — **flat files** (Keystatic's format
  when there are no entry-relative asset fields; images go to `public/` instead).
- Each file is YAML frontmatter (`title`, `author`, `date`, `description`) + MDX body.
- Article images: `frontend/public/images/articles/<slug>/...`, referenced by URL in the MDX.
- Rendered via a dynamic route `frontend/src/pages/articles/[slug].tsx` using `next-mdx-remote`
  (`serialize` in `getStaticProps` → `<MDXRemote>`), reusing `remark-gfm` + `@mapbox/rehype-prism`.
- The Keystatic admin UI + API are mounted via a **hybrid App Router** segment under
  `frontend/src/app/` (`/keystatic`, `/api/keystatic/*`) that coexists with the Pages Router site.
  Note: it must live in `src/app/` (not root `app/`) because the project uses `src/pages/`.

### Key files
- `frontend/keystatic.config.ts` — collection schema + storage mode.
- `frontend/src/lib/keystaticReader.ts` — `createReader(process.cwd(), config)` + helpers
  (`getArticleMetas`, `getArticleBySlug`, `getArticleSlugs`).
- `frontend/src/lib/getAllArticles.ts` — thin wrapper over the reader (used by listing pages).
- `frontend/src/pages/articles/[slug].tsx` — dynamic render route.
- `frontend/src/pages/articles/index.tsx`, `frontend/src/pages/index.tsx` — listings.
- `frontend/src/lib/generateRssFeed.tsx` — RSS built at production build; renders bodies with
  `MDXRemote` + `renderToStaticMarkup`, using absolute (`NEXT_PUBLIC_SITE_URL`) image URLs.
- `frontend/src/components/mdxComponents.tsx` — `Image` component for MDX bodies (next/image when
  width+height given, else a plain `<img>`).
- `frontend/src/app/…` — Keystatic admin/API (hybrid App Router).

## Adding / editing posts

- **Locally:** `cd frontend && npm run dev` → open `http://localhost:3000/keystatic` (local storage,
  no setup). Or edit `frontend/src/content/articles/*.mdx` directly.
- **From the deployed site:** requires GitHub storage mode (see env vars below).

## Automated poster (Routine)

- Trigger id: `trig_01HEBJGBSp1CBUs5qXsswYVZ` ("Auto blog post (every 3 days)").
- Cron: `0 9 */3 * *` (UTC). Fresh session per fire. Push notifications on.
- Behavior: pulls latest `master`, picks an un-covered software-engineering topic, writes a new
  `frontend/src/content/articles/<slug>.mdx`, runs `next build` to validate, then **commits directly
  to `master`** and pushes (Vercel auto-deploys).
- **Safeguard:** it does nothing unless `frontend/src/content/articles/` and
  `frontend/src/lib/keystaticReader.ts` exist on master (both now merged, so it will post).
- Manage via the claude-code-remote trigger tools (`update_trigger` / `delete_trigger` /
  `fire_trigger`) or the claude.ai Routines UI.

## Newsletter (subscribe + notify)

Signups are stored as **SendGrid Marketing Contacts**; new posts are emailed to that
list via a SendGrid **Single Send**. All code is Next.js API routes (no separate server;
the `backend/` Express app is superseded and unused).

- `frontend/src/lib/sendgrid.ts` — `addContactToList`, `sendWelcomeEmail`, `sendNewsletter`
  (thin `fetch` wrappers over the SendGrid v3 API).
- `frontend/src/pages/api/subscribe.ts` — POST `{ email }` → add to list (+ best-effort welcome email).
- `frontend/src/pages/api/notify.ts` — POST `{ slug, title?, description? }`, protected by
  `Authorization: Bearer $NEWSLETTER_NOTIFY_SECRET`; sends the Single Send. If `title` is
  omitted it's looked up from the published `/rss/feed.json` by slug (avoids reading the
  content FS at runtime, which isn't reliable in serverless).
- Homepage `Newsletter` form (`frontend/src/pages/index.tsx`) now POSTs to `/api/subscribe`
  then redirects to `/thank-you` (was a no-op `action="/thank-you"` that saved nothing).
- The **auto-poster** calls `/api/notify` after publishing (step 8 of its prompt), gated on
  `NEXT_PUBLIC_SITE_URL` + `NEWSLETTER_NOTIFY_SECRET` being set in the CCR environment.
- To send a newsletter for a **manual** post:
  `curl -X POST "$SITE/api/notify" -H "Authorization: Bearer $NEWSLETTER_NOTIFY_SECRET" -H 'Content-Type: application/json' -d '{"slug":"<slug>"}'`

## Environment variables

- `NEXT_PUBLIC_SITE_URL` — site base URL (RSS/canonical). Pre-existing.
- **Keystatic storage** defaults to **local** (builds with no secrets). To enable editing/publishing
  from the deployed `/keystatic`, set ALL of these in Vercel (and `.env.local` for local testing):
  - `NEXT_PUBLIC_KEYSTATIC_STORAGE=github`
  - `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET` (from a GitHub App installed on the repo)
  - `KEYSTATIC_SECRET` (`openssl rand -hex 32`)
  - GitHub App: callback `https://<domain>/api/keystatic/github/oauth/callback`, permissions
    Contents R/W + Metadata RO. Steps in `frontend/.env.example`.
- **Status:** the GitHub App is NOT yet set up (pending user action) — live `/keystatic` is read-only
  until it is; local editing works without it.
- **Newsletter (SendGrid)** — set on Vercel: `SENDGRID_API_KEY` (Mail Send + Marketing perms),
  `SENDGRID_LIST_ID`, `SENDGRID_FROM_EMAIL` (verified sender, welcome email), `SENDGRID_SENDER_ID`
  (numeric verified sender identity), `SENDGRID_UNSUBSCRIBE_GROUP_ID` (numeric suppression group),
  `NEWSLETTER_NOTIFY_SECRET` (protects /api/notify). For auto-notify, also set
  `NEXT_PUBLIC_SITE_URL` + `NEWSLETTER_NOTIFY_SECRET` in the CCR environment. See `frontend/.env.example`.
  **Status:** SendGrid vars NOT yet set (pending user action) — signup/notify return errors until configured.

## Gotchas / decisions (learned the hard way)

- **Flat files, not `<slug>/index.mdx`.** With no entry-relative asset fields Keystatic stores each
  entry as `<slug>.mdx`; a directory layout makes the reader return nothing.
- **Reader base = `process.cwd()`** (the `frontend/` app root) for both storage modes. `pathPrefix`
  only affects GitHub *commit* paths, not the local filesystem reader — do NOT add `../`.
- **`blockJS: false`** on `serialize` — next-mdx-remote v6 strips ALL JSX expression attributes
  (`width={705}`, `style={{…}}`) by default. Content is authored in this repo, so it's safe to allow
  them; `blockDangerousJS` stays on.
- **Storage gating uses a NEXT_PUBLIC flag**, not `NODE_ENV` — the flag must be readable on both the
  client admin UI and the server API so they agree on the mode; gating on server-only secrets desyncs
  them, and gating on `NODE_ENV` made production builds fail without the secrets.
- Two lockfiles (root stub + `frontend/`) trigger a benign Next "workspace root" warning; harmless
  because the reader uses `process.cwd()`.

## History
- PR #7 — Keystatic CMS + content migration (merged).
- PR #8 — default to local storage so builds never require secrets (merged).
- PR #9 — add memory.md (merged).
- Newsletter — subscribe/notify API routes + SendGrid storage + poster notify step.
