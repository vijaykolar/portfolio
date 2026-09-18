// One-time migration: pushes every src/content/articles/*.mdx into Sanity as a
// published `post` document. Idempotent (createOrReplace keyed on the slug).
//
//   cd frontend && node --env-file=.env.local scripts/migrate-articles.mjs
//
// Needs NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and
// SANITY_API_WRITE_TOKEN in .env.local (remove the token afterwards).
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import matter from 'gray-matter'

import { normalizeDate, sanityClient, toPostDoc } from './lib/sanity.mjs'

const ARTICLES_DIR = path.resolve('src/content/articles')

async function main() {
  const client = sanityClient({ write: true })
  const files = (await readdir(ARTICLES_DIR)).filter((f) => f.endsWith('.mdx'))
  if (files.length === 0) {
    throw new Error(`No .mdx files found in ${ARTICLES_DIR}`)
  }

  for (const file of files) {
    const slug = file.replace(/\.mdx$/, '')
    const raw = await readFile(path.join(ARTICLES_DIR, file), 'utf8')
    const { data, content } = matter(raw)

    const doc = toPostDoc({
      slug,
      title: String(data.title ?? '').trim(),
      author: String(data.author ?? 'Vijay Kolar').trim(),
      date: normalizeDate(data.date),
      description: String(data.description ?? '').trim(),
      body: content.trim() + '\n',
    })

    for (const key of ['title', 'date', 'description', 'body']) {
      if (!doc[key]) {
        throw new Error(`${file}: missing ${key}`)
      }
    }

    const result = await client.createOrReplace(doc)
    console.log(`upserted ${result._id}  (${doc.date})  ${doc.title}`)
  }

  console.log(`\nMigrated ${files.length} article(s).`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
