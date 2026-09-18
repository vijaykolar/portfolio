# Project Memory — vijaykolar/portfolio

Context notes for the blog / CMS / auto-posting setup. Update this when the setup changes.

## Overview

Repo:
- `frontend/` — Next.js 15 (Pages Router) portfolio + blog. TypeScript, Tailwind, deployed on Vercel.
  (A former standalone `backend/` Express server was removed — all server logic, including the
  newsletter, now lives in Next.js API routes under `frontend/src/pages/api/`.)

The blog content lives in **Sanity** (free plan, project `ax0g47x9`, dataset `production`). The
Sanity Studio is embedded in the app at `/studio`. Publishing a post in the Studio fires a webhook
that revalidates the live site within seconds — **no commit, build or deploy is needed**. There is
also an **automated poster** (GitHub Actions) that writes a new article into Sanity every 3 days.

History: the blog was previously Keystatic (git-based, `.mdx` files under `src/content/articles/`),
replaced by Sanity on 2026-09-18 so posting no longer depends on committing markdown files.

## Blog architecture

- **Content:** Sanity document type `post` with fields `title`, `slug`, `author`, `date`
  (`YYYY-MM-DD`), `description`, `body`. Schema: `frontend/src/sanity/schema/post.ts`.
- **Body format:** a **markdown text field** (`sanity-plugin-markdown`), NOT Portable Text. The site
  compiles it with `next-mdx-remote` (`remark-gfm` + `@mapbox/rehype-prism`, `blockJS: false`), so
  GFM plus the `<Image … />` JSX component render exactly as the old `.mdx` files did.
- **Images:** still static files at `frontend/public/images/articles/<slug>/…`, referenced from the
  body by absolute path (`/images/articles/<slug>/x.png`). Not stored in Sanity.
- **Rendering:** `frontend/src/pages/articles/[slug].tsx` — `getStaticPaths` with
  `fallback: 'blocking'` + `getStaticProps` with `revalidate: 3600`. Listing pages
  (`src/pages/index.tsx`, `src/pages/articles/index.tsx`) also `revalidate: 3600`.
- **Publish webhook:** `frontend/src/pages/api/revalidate.ts` verifies the Sanity signature
  (`@sanity/webhook`) and calls `res.revalidate` for `/`, `/articles`, `/articles/<slug>`.
- **Studio:** hybrid App Router segment `frontend/src/app/studio/[[...tool]]/page.tsx` mounting
  `NextStudio` with `frontend/sanity.config.ts`. Must live in `src/app/` (project uses `src/pages/`).
- **RSS:** served on demand by `src/pages/rss/feed.xml.tsx` and `feed.json.tsx`
  (`getServerSideProps`, edge-cached 10 min) using `src/lib/rss.tsx`. No files under `public/rss`.

### Key files
- `frontend/sanity.config.ts` — Studio config (`'use client'` at the top is required).
- `frontend/src/sanity/client.ts` — read client (`useCdn: false`, `perspective: 'published'`).
- `frontend/src/sanity/schema/post.ts` — the post schema.
- `frontend/src/lib/articles.ts` — GROQ reader: `getArticleMetas`, `getArticleBySlug`, `getArticleSlugs`.
  This is the single data seam; every page/feed/API route reads through it.
- `frontend/src/lib/getAllArticles.ts` — thin wrapper over the reader (used by listing pages).
- `frontend/src/pages/articles/[slug].tsx` — article page (ISR).
- `frontend/src/pages/api/revalidate.ts` — Sanity webhook target.
- `frontend/src/lib/rss.tsx` + `frontend/src/pages/rss/feed.{xml,json}.tsx` — feeds.
- `frontend/src/components/mdxComponents.tsx` — `Image` component for bodies (next/image when
  width+height given, else a plain `<img>`).
- `frontend/scripts/lib/sanity.mjs` — shared client/slug helpers for the Node scripts.
- `frontend/scripts/migrate-articles.mjs` — one-time `.mdx` → Sanity migration (delete after use).
- `frontend/scripts/poster/*.mjs` — auto-poster scripts (`list-posts`, `validate-article`, `publish-article`).

## Adding / editing posts

- Open `https://<site>/studio` (or `http://localhost:3000/studio` in dev), log in with the Sanity
  account, create a **Post**, click **Generate** next to Slug, write the body in markdown, **Publish**.
  The page is live within seconds; check `/articles/<slug>`.
- Images: commit the file under `frontend/public/images/articles/<slug>/` (that part still needs a
  deploy) and reference it with
  `<Image className="…" src="/images/articles/<slug>/pic.png" alt="…" width={705} height={400} />`.
- Unpublishing removes the post from the listings and the URL 404s on the next request.
- To email subscribers about a manual post, POST to `/api/notify` (see Newsletter).

## One-time Sanity setup (status as of 2026-09-18)

Done: project `ax0g47x9` created, dataset `production` is public (anonymous reads return 200).

Still to do (all in https://www.sanity.io/manage → project → API):
1. **CORS origins:** add `http://localhost:3000` and `https://<site-domain>` with **Allow
   credentials** ON. Without this the Studio at `/studio` cannot log in.
2. **Token:** create `github-actions-poster`, role **Editor** → `SANITY_API_WRITE_TOKEN`. Put it in
   the GitHub repo secret of the same name, and temporarily in `frontend/.env.local` to run the
   migration. **Never** on Vercel, never `NEXT_PUBLIC_`.
3. **Migration:** `cd frontend && node --env-file=.env.local scripts/migrate-articles.mjs` (pushes the
   6 old `.mdx` posts). Then delete `frontend/src/content/` and `frontend/scripts/migrate-articles.mjs`,
   and remove the token line from `.env.local`.
4. **Vercel env (all environments):** `NEXT_PUBLIC_SANITY_PROJECT_ID=ax0g47x9`,
   `NEXT_PUBLIC_SANITY_DATASET=production`, `SANITY_REVALIDATE_SECRET` (`openssl rand -hex 32`).
   Delete any `KEYSTATIC_*` / `NEXT_PUBLIC_KEYSTATIC_STORAGE` vars. Then deploy.
5. **Webhook** (after the deploy): name `vercel-revalidate`, URL `https://<site>/api/revalidate`,
   dataset `production`, trigger **create + update + delete**, filter `_type == "post"`, projection
   `{_type, "slug": slug.current}`, HTTP POST, **Include drafts OFF**, secret = the
   `SANITY_REVALIDATE_SECRET` value. The webhook's "Attempts" log is the place to debug publishing.
6. **GitHub Actions:** secret `SANITY_API_WRITE_TOKEN`; variables `SANITY_PROJECT_ID=ax0g47x9`,
   `SANITY_DATASET=production`, optionally `NEXT_PUBLIC_SITE_URL`.

## Automated poster (GitHub Actions)

`.github/workflows/auto-blog-post.yml` publishes one new article to Sanity every 3 days.

- Cron `0 9 */3 * *` (09:00 UTC), plus `workflow_dispatch` with a `dry_run` checkbox (write and
  validate only, no publish).
- Flow: `scripts/poster/list-posts.mjs` dumps existing titles → `anthropics/claude-code-action`
  (tools `Read,Write` only, no Bash) writes `article.md` at the repo root → a guard checks the
  working tree contains nothing but `?? article.md` → `scripts/poster/validate-article.mjs`
  (exact frontmatter keys, date format, 400–1500 words, headings, no images/JSX/imports, slug and
  title not already in Sanity, and the body **compiles with the same MDX options as the page**) →
  the article is uploaded as a run artifact → `scripts/poster/publish-article.mjs` creates the
  document with `SANITY_API_WRITE_TOKEN`.
- `permissions: contents: read`. The workflow never commits or pushes. Publishing fires the Sanity
  webhook, which revalidates the site, so no build runs in CI.
- `publish-article.mjs` uses `client.create` with a fixed `_id` (`post-<slug>`), so a re-run for the
  same slug fails instead of publishing twice.
- Verify a run by opening `/articles/<slug>` and the Sanity webhook attempts log — **a green run
  status is not proof of publication** (lesson from the old cloud Routine, below).
- GitHub disables scheduled workflows after 60 days with no repo activity. The poster no longer
  commits, so push something or run it by hand at least every couple of months.
- The poster does NOT email subscribers (SendGrid vars are not configured). To add it, append a step
  that POSTs `{ "slug": "<slug>" }` to `/api/notify` with `NEWSLETTER_NOTIFY_SECRET`.

### Why not the old claude.ai Routine

Superseded 2026-08-26. `trig_01HEBJGBSp1CBUs5qXsswYVZ` is now **disabled** (kept for reference).

From 2026-07-23 to 2026-08-26 it published **nothing** while reporting `SUCCEEDED` on every run.
Each run wrote the article, passed `next build`, committed locally, then failed `git push` with:

```
remote: access denied by the git proxy: vijaykolar/portfolio is not in this
session's authorized repository set, so the proxy will not inject a credential for it.
```

Its environment (`env_01JgECYCnnz9mkVX2EVGpfzs`) logged `env[info]: No sources configured`, and
~14 finished articles were written into ephemeral containers and discarded. Lesson worth keeping:
**a green run status is not proof of publication.**

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
  omitted it is looked up from Sanity by slug.
- Homepage `Newsletter` form (`frontend/src/pages/index.tsx`) POSTs to `/api/subscribe`
  then redirects to `/thank-you`.
- To send a newsletter for a post:
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
Generate any random string (`openssl rand -hex 32`). Set it in Vercel (and wherever the
caller of `/api/notify` runs).

**6. Also set** `NEXT_PUBLIC_SITE_URL` (deployed base URL, no trailing slash) in Vercel.

**Verify end to end** (after deploying with the vars set):
- Subscribe: `curl -X POST "$SITE/api/subscribe" -H 'Content-Type: application/json' -d '{"email":"you@example.com"}'` → `{"ok":true}`, and the contact appears in the list.
- Notify: `curl -X POST "$SITE/api/notify" -H "Authorization: Bearer $NEWSLETTER_NOTIFY_SECRET" -H 'Content-Type: application/json' -d '{"slug":"what-is-semantic-html"}'` → `{"ok":true,...}` and the email arrives.

## Environment variables

- `NEXT_PUBLIC_SITE_URL` — site base URL (RSS/canonical). Pre-existing.
- **Sanity (required for every build):** `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`.
  The build queries Sanity in `getStaticPaths`/`getStaticProps`; without them `src/sanity/client.ts`
  throws at import time with a clear message.
- **Sanity webhook:** `SANITY_REVALIDATE_SECRET` (Vercel + the webhook config).
- **Sanity write:** `SANITY_API_WRITE_TOKEN` — GitHub Actions secret + one-time local migration only.
- **GitHub Actions variables:** `SANITY_PROJECT_ID`, `SANITY_DATASET` (the scripts also accept the
  `NEXT_PUBLIC_` names, so `.env.local` works for running them locally).
- **Newsletter (SendGrid)** — set on Vercel: `SENDGRID_API_KEY` (Mail Send + Marketing perms),
  `SENDGRID_LIST_ID`, `SENDGRID_FROM_EMAIL`, `SENDGRID_SENDER_ID`, `SENDGRID_UNSUBSCRIBE_GROUP_ID`,
  `NEWSLETTER_NOTIFY_SECRET`. **Status:** NOT yet set — signup/notify return errors until configured.
- Removed 2026-09-18: `NEXT_PUBLIC_KEYSTATIC_STORAGE`, `KEYSTATIC_GITHUB_CLIENT_ID`,
  `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`. Delete them from Vercel if present.

## Gotchas / decisions (learned the hard way)

- **Version pins.** `sanity@^4.22`, `next-sanity@^11.6`, `sanity-plugin-markdown@^7`,
  `@sanity/client@^7`, `styled-components@^6`, `easymde@^2`. The next majors of all three Sanity
  packages require **React 19 + Next 16**; upgrade those first, then Sanity.
- **`npm install` of the Sanity packages exits 1 with no output on this Windows machine** when
  lifecycle scripts run inside the agent sandbox (esbuild/sharp postinstall). Workaround that worked:
  `npm install … --ignore-scripts` followed by `npm rebuild`. Plain terminals are unaffected.
- **`'use client'` must be the first line of `sanity.config.ts`.** The config holds functions and the
  Studio page is a server component; the directive turns the import into a client reference.
- **`/api/revalidate` is a Pages Router route** because `res.revalidate()` only exists there, and it
  verifies the signature with `@sanity/webhook` because `parseBody` from `next-sanity/webhook` only
  accepts App Router `NextRequest`. `bodyParser` is disabled so the HMAC is computed over the raw body.
- **CORS with credentials** must include the site origin (and localhost) or Studio login fails.
- **Webhook "Include drafts" must be OFF** so revalidation only fires on publish, and the projection
  must include `slug.current` (on delete, Sanity projects the pre-delete document so the slug is present).
- **`useCdn: false`** on the read client — the API CDN can lag a publish by seconds, which would make
  the webhook regenerate a stale page.
- **`fallback: 'blocking'` + `revalidate`** on the article page; a `notFound` result carries
  `revalidate: 60` so a 404 cached just before a publish expires quickly.
- **A bad body throws, on purpose.** `[slug].tsx` rethrows MDX compile errors instead of returning
  `notFound`, so ISR keeps serving the last good page and the failure shows as a 500 in the Sanity
  webhook attempts log. Studio-authored bodies are NOT compile-checked in the editor: a bare `<` or
  `{` outside code breaks the page. The auto-poster's validator does compile-check.
- **`blockJS: false`** on `serialize` — next-mdx-remote v6 strips ALL JSX expression attributes
  (`width={705}`, `style={{…}}`) by default. Content is authored by the site owner, so it's safe to
  allow them; `blockDangerousJS` stays on.
- **RSS is SSR with `s-maxage=600`**, so feeds can lag a publish by up to 10 minutes. Never add
  files under `public/rss/` again — a public file and a page at the same path is a Next build error.
- Two lockfiles (root stub + `frontend/`) trigger a benign Next "workspace root" warning; harmless.

## History
- PR #7 — Keystatic CMS + content migration (merged).
- PR #8 — default to local storage so builds never require secrets (merged).
- PR #9 — add memory.md (merged).
- Newsletter — subscribe/notify API routes + SendGrid storage.
- 2026-08-26 — auto-poster moved from the claude.ai Routine to GitHub Actions.
- 2026-09-18 — Keystatic + `.mdx` files replaced by Sanity (embedded Studio at `/studio`, publish
  webhook → ISR, dynamic RSS, auto-poster publishes via the Sanity API).
