// Parsing shared by validate-article.mjs and publish-article.mjs.
import { readFile } from 'node:fs/promises'

import matter from 'gray-matter'

import { normalizeDate, slugify } from '../lib/sanity.mjs'

export const REQUIRED_KEYS = ['title', 'author', 'date', 'description']

export async function parseArticle(file) {
  const raw = await readFile(file, 'utf8')
  const { data, content } = matter(raw)

  const meta = {
    title: String(data.title ?? '').trim(),
    author: String(data.author ?? '').trim(),
    date: normalizeDate(data.date),
    description: String(data.description ?? '').trim(),
  }

  return {
    meta,
    keys: Object.keys(data),
    body: content.trim() + '\n',
    slug: slugify(meta.title),
  }
}
