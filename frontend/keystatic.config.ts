import { config, fields, collection } from '@keystatic/core'

// Local storage in development (no GitHub App needed); GitHub storage in
// production so posts can be authored/published from the deployed /keystatic
// admin. `pathPrefix: 'frontend'` accounts for this app living in the
// `frontend/` subdirectory of the monorepo: collection `path`s stay relative
// to the app root, while GitHub commits land at `frontend/src/content/...`.
const storage =
  process.env.NODE_ENV === 'development'
    ? ({ kind: 'local' } as const)
    : ({
        kind: 'github',
        repo: { owner: 'vijaykolar', name: 'portfolio' },
        pathPrefix: 'frontend',
      } as const)

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
