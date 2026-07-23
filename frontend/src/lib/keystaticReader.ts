import { createReader } from '@keystatic/core/reader'

import keystaticConfig from '../../keystatic.config'

// The local (filesystem) reader. At build/dev time `process.cwd()` is the
// `frontend/` app root, and the collection `path` in keystatic.config.ts is
// relative to it (`src/content/articles/*`), so entries resolve correctly.
export const reader = createReader(process.cwd(), keystaticConfig)

export interface ArticleMeta {
  title: string
  description: string
  author: string
  date: string
}

export interface ArticleWithSlug extends ArticleMeta {
  slug: string
}

function toMeta(entry: {
  title: string
  description: string
  author: string
  date: string | null
}): ArticleMeta {
  return {
    title: entry.title,
    description: entry.description,
    author: entry.author,
    date: entry.date ?? '',
  }
}

export async function getArticleBySlug(
  slug: string,
): Promise<{ meta: ArticleWithSlug; body: string } | null> {
  const entry = await reader.collections.articles.read(slug)
  if (!entry) {
    return null
  }
  const body = await entry.content()
  return {
    meta: { slug, ...toMeta(entry) },
    body,
  }
}

export async function getArticleSlugs(): Promise<string[]> {
  return reader.collections.articles.list()
}

export async function getArticleMetas(): Promise<ArticleWithSlug[]> {
  const entries = await reader.collections.articles.all()
  return entries
    .map(({ slug, entry }) => ({ slug, ...toMeta(entry) }))
    .sort((a, z) => new Date(z.date).getTime() - new Date(a.date).getTime())
}
