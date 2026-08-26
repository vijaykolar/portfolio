# Project Memory — vijaykolar/portfolio

Context notes for the blog / CMS / auto-posting setup. Update this when the setup changes.

## Overview

Repo:
- `frontend/` — Next.js 15 (Pages Router) portfolio + blog. TypeScript, Tailwind, deployed on Vercel.
  (A former standalone `backend/` Express server was removed — all server logic, including the
  newsletter, now lives in Next.js API routes under `frontend/src/pages/api/`.)

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

## Automated poster (GitHub Actions)

`.github/workflows/auto-blog-post.yml` publishes one new article every 3 days.

- Cron `0 9 */3 * *` (09:00 UTC), plus `workflow_dispatch` so you can trigger a run by hand
  from the Actions tab.
- Requires one repo secret: **`ANTHROPIC_API_KEY`** (Settings -> Secrets and variables ->
  Actions). Optionally set a `NEXT_PUBLIC_SITE_URL` repo *variable*; the build falls back to
  `https://example.com` if absent (it only affects RSS/canonical URLs at build time).
- Claude only **authors** the `.mdx` file. The build gate, the commit and the push are plain
  workflow steps, so a bad run fails loudly in the Actions tab and publishes nothing.
- Guards between authoring and committing: exactly one new untracked article must exist, no
  tracked file may be modified, the title must parse out of the frontmatter, and `next build`
  is re-run independently of whatever Claude claimed.
- Pushes with the workflow's built-in `GITHUB_TOKEN` (`permissions: contents: write`), so there
  is no PAT or credential to configure. Vercel auto-deploys from `master`.
- Note: GitHub disables scheduled workflows in repos with no activity for 60 days. Its own
  commits count as activity, so this only matters if it is failing anyway.

### Why not the old claude.ai Routine

Superseded 2026-08-26. `trig_01HEBJGBSp1CBUs5qXsswYVZ` is now **disabled** (kept for reference).

From 2026-07-23 to 2026-08-26 it published **nothing** while reporting `SUCCEEDED` on every run.
Each run wrote the article, passed `next build`, committed locally, then failed `git push` with:

```
remote: access denied by the git proxy: vijaykolar/portfolio is not in this
session's authorized repository set, so the proxy will not inject a credential for it.
```

Its environment (`env_01JgECYCnnz9mkVX2EVGpfzs`) logged `env[info]: No sources configured`, and
~14 finished articles were written into ephemeral containers and discarded. The fix would have
been to add `vijaykolar/portfolio` as a write-access source on that environment via
claude.ai -> Settings -> Environments; that is not settable through the trigger API, which is
why the automation moved to GitHub Actions instead.

Lesson worth keeping: **a green run status is not proof of publication.** Verify the commit
landed on `origin/master`, not just that the job reported success.

## Newsletter (subscribe + notify)

Signups are stored as **SendGrid Marketing Contacts**; new posts are emailed to that
list via a SendGrid **Single Send**. All code is Next.js API routes (no separate server).

> NOTE: the old `backend/` Express server (removed) had `backend/.env` committed with a real
> `SENDGRID_API_KEY`. That key remains in git history — **rotate it in SendGrid**.

- `frontend/src/lib/sendgrid.ts` — `addContactToList`, `sendWelcomeEmail`, `sendNewsletter`
  (thin `fetch` wrappers over the SendGrid v3 API).
- `frontend/src/pages/api/subscribe.ts` — POST `{ email }` → add to list (+ best-effort welcome email).
- `frontend/src/pages/api/notify.ts` — POST `{ slug, title?, description? }`, protected by
  `Authorization: Bearer $NEWSLETTER_NOTIFY_SECRET`; sends the Single Send. If `title` is
  omitted it's looked up from the published `/rss/feed.json` by slug (avoids reading the
  content FS at runtime, which isn't reliable in serverless).
- Homepage `Newsletter` form (`frontend/src/pages/index.tsx`) now POSTs to `/api/subscribe`
  then redirects to `/thank-you` (was a no-op `action="/thank-you"` that saved nothing).
- The **auto-poster does NOT email subscribers.** The old Routine had a notify step; the
  GitHub Actions workflow that replaced it does not, because the SendGrid vars were never
  configured. To wire it up, add a final step to `.github/workflows/auto-blog-post.yml` that
  waits for the Vercel deploy and POSTs to `/api/notify`, with `NEXT_PUBLIC_SITE_URL` and
  `NEWSLETTER_NOTIFY_SECRET` as repo secrets.
- To send a newsletter for a **manual** post:
  `curl -X POST "$SITE/api/notify" -H "Authorization: Bearer $NEWSLETTER_NOTIFY_SECRET" -H 'Content-Type: application/json' -d '{"slug":"<slug>"}'`

## SendGrid setup (one-time)

Do these in the SendGrid dashboard (https://app.sendgrid.com). Each step ends with the
env var it produces — put those in Vercel → Project → Settings → Environment Variables
(and in `frontend/.env.local` if testing locally). UI labels drift over time; the API
`curl`s below are the reliable way to read the numeric IDs.

**0. (Strongly recommended first) Authenticate your sending domain.**
Settings → Sender Authentication → **Authenticate Your Domain**. Pick your DNS host, enter
your domain, and add the CNAME records it generates to DNS. This sets up SPF/DKIM so bulk
mail actually lands in inboxes. Without it, newsletters often go to spam. Not an env var,
but do it before you have real subscribers.

**1. API key** → `SENDGRID_API_KEY`
Settings → API Keys → **Create API Key** → **Restricted Access**. Grant:
- **Mail Send** → Full Access (welcome email)
- **Marketing** → Full Access (contacts + single sends)
Create, then **copy the key immediately** (shown once).

**2. Verified sender** → `SENDGRID_FROM_EMAIL` + `SENDGRID_SENDER_ID`
Marketing → Senders → **Create New Sender** (fill name, the from address, reply-to, address).
Verify it via the confirmation email.
- `SENDGRID_FROM_EMAIL` = that sender's from address.
- `SENDGRID_SENDER_ID` = its numeric id. Read it with:
  ```
  curl -s https://api.sendgrid.com/v3/marketing/senders \
    -H "Authorization: Bearer $SENDGRID_API_KEY" | jq '.results[] | {id, from: .from.email}'
  ```

**3. Contact list** → `SENDGRID_LIST_ID`
Marketing → Contacts → **Lists** → **Create List** (e.g. "Blog subscribers"). Get its id:
```
curl -s https://api.sendgrid.com/v3/marketing/lists \
  -H "Authorization: Bearer $SENDGRID_API_KEY" | jq '.result[] | {id, name}'
```
(This is the list `/api/subscribe` adds people to and `/api/notify` sends to.)

**4. Unsubscribe group** → `SENDGRID_UNSUBSCRIBE_GROUP_ID`
Settings → **Unsubscribe Groups** → **Create New Group** (e.g. name "Blog newsletter",
description "New post announcements"). Single Sends require this for CAN-SPAM/unsubscribe
compliance. Get its id:
```
curl -s https://api.sendgrid.com/v3/asm/groups \
  -H "Authorization: Bearer $SENDGRID_API_KEY" | jq '.[] | {id, name}'
```

**5. Notify secret** → `NEWSLETTER_NOTIFY_SECRET`
Generate any random string (`openssl rand -hex 32`). Set the SAME value in Vercel and in the
CCR automation environment so the auto-poster can authenticate to `/api/notify`.

**6. Also set** `NEXT_PUBLIC_SITE_URL` (deployed base URL, no trailing slash) in both Vercel
and the CCR environment.

**Verify end to end** (after deploying with the vars set):
- Subscribe: `curl -X POST "$SITE/api/subscribe" -H 'Content-Type: application/json' -d '{"email":"you@example.com"}'` → `{"ok":true}`, and the contact appears in the list.
- Notify: `curl -X POST "$SITE/api/notify" -H "Authorization: Bearer $NEWSLETTER_NOTIFY_SECRET" -H 'Content-Type: application/json' -d '{"slug":"what-is-semantic-html"}'` → `{"ok":true,...}` and the email arrives.

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
