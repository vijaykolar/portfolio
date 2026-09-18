import { groq } from 'next-sanity'

import { client } from '@/sanity/client'

export interface ArticleMeta {
  title: string
  description: string
  author: string
  date: string
}

export interface ArticleWithSlug extends ArticleMeta {
  slug: string
}

// `coalesce` keeps every field a string so the results are JSON-serializable
// as Next.js page props (which reject `undefined`).
const META_PROJECTION = `
  "slug": slug.current,
  title,
  "description": coalesce(description, ""),
  "author": coalesce(author, ""),
  "date": coalesce(date, "")
`

const METAS_QUERY = groq`
  *[_type == "post" && defined(slug.current)]
    | order(date desc, _createdAt desc) { ${META_PROJECTION} }
`

const SLUGS_QUERY = groq`
  *[_type == "post" && defined(slug.current)].slug.current
`

const BY_SLUG_QUERY = groq`
  *[_type == "post" && slug.current == $slug][0] {
    ${META_PROJECTION},
    "body": coalesce(body, "")
  }
`

export async function getArticleMetas(): Promise<ArticleWithSlug[]> {
  return client.fetch<ArticleWithSlug[]>(METAS_QUERY)
}

export async function getArticleSlugs(): Promise<string[]> {
  return client.fetch<string[]>(SLUGS_QUERY)
}

export async function getArticleBySlug(
  slug: string,
): Promise<{ meta: ArticleWithSlug; body: string } | null> {
  const doc = await client.fetch<(ArticleWithSlug & { body: string }) | null>(
    BY_SLUG_QUERY,
    { slug },
  )
  if (!doc) {
    return null
  }
  const { body, ...meta } = doc
  return { meta, body }
}
