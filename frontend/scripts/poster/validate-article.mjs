// Validates an auto-generated article before it is published to Sanity.
//
//   node scripts/poster/validate-article.mjs <path/to/article.md>
//
// Fails (exit 1, with a ::error:: annotation for GitHub Actions) on any
// problem; on success writes `slug=<slug>` to $GITHUB_OUTPUT if set.
import { appendFile } from 'node:fs/promises'

import { serialize } from 'next-mdx-remote/serialize'
import remarkGfm from 'remark-gfm'
import rehypePrism from '@mapbox/rehype-prism'

import { sanityClient } from '../lib/sanity.mjs'
import { REQUIRED_KEYS, parseArticle } from './lib.mjs'

const MIN_WORDS = 400
const MAX_WORDS = 1500

function fail(message) {
  console.error(`::error::${message}`)
  process.exit(1)
}

const file = process.argv[2]
if (!file) {
  fail('Usage: validate-article.mjs <file>')
}

const { meta, keys, body, slug } = await parseArticle(file)

// Frontmatter: exactly the four keys, all non-empty.
for (const key of REQUIRED_KEYS) {
  if (!meta[key]) fail(`Frontmatter is missing "${key}"`)
}
const extra = keys.filter((k) => !REQUIRED_KEYS.includes(k))
if (extra.length) fail(`Unexpected frontmatter keys: ${extra.join(', ')}`)
if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) {
  fail(`Date "${meta.date}" is not YYYY-MM-DD`)
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  fail(`Could not derive a clean slug from the title (got "${slug}")`)
}

// Body sanity checks (the poster is text + code only).
const words = body.split(/\s+/).filter(Boolean).length
if (words < MIN_WORDS || words > MAX_WORDS) {
  fail(`Body is ${words} words; expected ${MIN_WORDS}-${MAX_WORDS}`)
}
if (!/^## /m.test(body)) fail('Body has no "## " headings')
if (/<Image\b/.test(body)) fail('Body references <Image>; the poster is text-only')
if (/^(import|export)\s/m.test(body)) {
  fail('Body contains an import/export line')
}

// Uniqueness against what is already published.
const client = sanityClient()
const duplicates = await client.fetch(
  `count(*[_type == "post" && (slug.current == $slug || lower(title) == lower($title))])`,
  { slug, title: meta.title },
)
if (duplicates > 0) {
  fail(`A post with slug "${slug}" or the same title already exists`)
}

// Compile gate: identical options to src/pages/articles/[slug].tsx, so
// anything that would break the page breaks here instead.
try {
  await serialize(body, {
    blockJS: false,
    mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypePrism] },
  })
} catch (error) {
  fail(`Body does not compile as MDX: ${error?.message ?? error}`)
}

console.log(`OK  ${meta.date}  ${meta.title}  (${slug}, ${words} words)`)
if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `slug=${slug}\n`)
}
