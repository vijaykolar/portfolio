import glob from 'fast-glob'
import * as path from 'path'
import type { ComponentType } from 'react'

export interface ArticleMeta {
  title: string
  description: string
  author: string
  date: string
}

export interface Article extends ArticleMeta {
  slug: string
  component: ComponentType<{ isRssFeed?: boolean; previousPathname?: string }>
}

async function importArticle(articleFilename: string): Promise<Article> {
  const { meta, default: component } = await import(
    `../pages/articles/${articleFilename}`
  )
  return {
    slug: articleFilename.replace(/(\/index)?\.mdx$/, ''),
    ...meta,
    component,
  }
}

export async function getAllArticles(): Promise<Article[]> {
  const articleFilenames = await glob(['*.mdx', '*/index.mdx'], {
    cwd: path.join(process.cwd(), 'src/pages/articles'),
  })

  const articles = await Promise.all(articleFilenames.map(importArticle))

  return articles.sort((a, z) => new Date(z.date).getTime() - new Date(a.date).getTime())
}
