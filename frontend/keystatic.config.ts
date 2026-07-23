import { config, fields, collection } from '@keystatic/core'

// Storage defaults to `local` (filesystem) so the site always builds without
// any secrets. Opt into GitHub storage — which lets you author/publish from
// the deployed /keystatic admin — by setting NEXT_PUBLIC_KEYSTATIC_STORAGE=github
// AND the three KEYSTATIC_GITHUB_* / KEYSTATIC_SECRET vars (see .env.example).
// The flag is NEXT_PUBLIC so the client admin UI and server API agree on the mode.
// `pathPrefix: 'frontend'` accounts for this app living in the `frontend/`
// subdirectory of the monorepo: collection `path`s stay relative to the app
// root, while GitHub commits land at `frontend/src/content/...`.
const storage =
  process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === 'github'
    ? ({
        kind: 'github',
        repo: { owner: 'vijaykolar', name: 'portfolio' },
        pathPrefix: 'frontend',
      } as const)
    : ({ kind: 'local' } as const)

export default config({
  storage,
  collections: {
    articles: collection({
      label: 'Articles',
      slugField: 'title',
      path: 'src/content/articles/*',
      format: { contentField: 'content', data: 'yaml' },
      entryLayout: 'content',
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({
          name: { label: 'Title' },
          slug: {
            description: 'The URL segment for this article (under /articles).',
          },
        }),
        author: fields.text({
          label: 'Author',
          defaultValue: 'Vijay Kolar',
        }),
        date: fields.date({
          label: 'Date',
          defaultValue: { kind: 'today' },
        }),
        description: fields.text({
          label: 'Description',
          multiline: true,
        }),
        content: fields.mdx({
          label: 'Body',
          extension: 'mdx',
          options: {
            image: {
              directory: 'public/images/articles',
              publicPath: '/images/articles/',
            },
          },
        }),
      },
    }),
  },
})
