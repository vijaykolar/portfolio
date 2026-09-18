// Publishes a validated article to Sanity as a published `post` document.
//
//   SANITY_API_WRITE_TOKEN=… node scripts/poster/publish-article.mjs <file>
//
// Uses `create` with a fixed _id, so a re-run for the same slug fails loudly
// instead of publishing twice. Publishing fires the Sanity webhook, which
// revalidates the site — no build or deploy is needed.
import { sanityClient, toPostDoc } from '../lib/sanity.mjs'
import { parseArticle } from './lib.mjs'

const file = process.argv[2]
if (!file) {
  console.error('::error::Usage: publish-article.mjs <file>')
  process.exit(1)
}

const { meta, body, slug } = await parseArticle(file)
const client = sanityClient({ write: true })

try {
  const doc = await client.create(toPostDoc({ slug, ...meta, body }))
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')
  console.log(`Published ${doc._id}`)
  console.log(`  ${meta.title}`)
  if (siteUrl) console.log(`  ${siteUrl}/articles/${slug}`)
} catch (error) {
  console.error(`::error::Publish failed: ${error?.message ?? error}`)
  process.exit(1)
}
