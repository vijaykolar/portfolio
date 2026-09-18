// Shared helpers for the Node scripts under frontend/scripts/ (run from the
// frontend/ directory so node_modules resolve).
import { createClient } from '@sanity/client'

export const API_VERSION = '2025-02-19'

export function sanityClient({ write = false } = {}) {
  const projectId =
    process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset =
    process.env.SANITY_DATASET ??
    process.env.NEXT_PUBLIC_SANITY_DATASET ??
    'production'
  const token = write ? process.env.SANITY_API_WRITE_TOKEN : undefined

  if (!projectId) {
    throw new Error(
      'SANITY_PROJECT_ID (or NEXT_PUBLIC_SANITY_PROJECT_ID) is not set',
    )
  }
  if (write && !token) {
    throw new Error('SANITY_API_WRITE_TOKEN is not set')
  }

  return createClient({
    projectId,
    dataset,
    apiVersion: API_VERSION,
    useCdn: false,
    perspective: 'published',
    token,
  })
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 96)
}

// Builds a published `post` document. A fixed `_id` (no `drafts.` prefix)
// means `create` refuses duplicates and `createOrReplace` is idempotent.
export function toPostDoc({ slug, title, author, date, description, body }) {
  return {
    _id: `post-${slug}`,
    _type: 'post',
    title,
    slug: { _type: 'slug', current: slug },
    author,
    date,
    description,
    body,
  }
}

// YAML parses unquoted dates as Date objects; normalise to YYYY-MM-DD.
export function normalizeDate(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  return String(value ?? '').trim()
}
