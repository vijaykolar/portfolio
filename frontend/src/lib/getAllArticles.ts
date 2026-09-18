import { getArticleMetas } from './articles'
import type { ArticleMeta, ArticleWithSlug } from './articles'

export type { ArticleMeta, ArticleWithSlug }

// Backwards-compatible alias kept for existing imports.
export type Article = ArticleWithSlug

export async function getAllArticles(): Promise<ArticleWithSlug[]> {
  return getArticleMetas()
}
