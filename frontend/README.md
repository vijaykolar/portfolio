# Portfolio built with Next.js, Tailwind CSS and Sanity

A Next.js (Pages Router) portfolio and blog styled with Tailwind CSS. Blog posts are managed in
[Sanity](https://www.sanity.io) through a Studio embedded in this app at `/studio`; publishing a
post makes it live within seconds via a webhook and on-demand revalidation, with no redeploy.

## Key features

* **Sanity CMS** — write posts in markdown at `/studio`. Fenced code blocks are syntax-highlighted
  and a small `<Image />` JSX component is available for pictures under `public/images/articles/`.
* **Publish = live** — a Sanity webhook hits `/api/revalidate`, which regenerates the home page, the
  article list and the article itself.
* **RSS / JSON feeds** at `/rss/feed.xml` and `/rss/feed.json`, generated on demand.
* **Newsletter** — `/api/subscribe` and `/api/notify` backed by SendGrid.
* **Auto-poster** — a GitHub Actions workflow publishes an AI-written article to Sanity every 3 days.

## Local development

```bash
cd frontend
cp .env.example .env.local   # fill in NEXT_PUBLIC_SANITY_PROJECT_ID at minimum
npm install
npm run dev                   # site at http://localhost:3000, Studio at /studio
```

See `../memory.md` for the full architecture, environment variables and one-time setup steps.
