import type { NextApiRequest, NextApiResponse } from 'next'

import { getArticleBySlug } from '@/lib/articles'
import { sendNewsletter } from '@/lib/sendgrid'

/**
 * Emails the subscriber list about a newly published post.
 *
 * Auth: `Authorization: Bearer <NEWSLETTER_NOTIFY_SECRET>`.
 * Body: `{ slug, title?, description? }`. If title is omitted it is looked up
 * from Sanity by slug.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.NEWSLETTER_NOTIFY_SECRET
  if (!secret) {
    return res
      .status(500)
      .json({ error: 'NEWSLETTER_NOTIFY_SECRET is not configured.' })
  }
  if (req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')
  const slug = String(req.body?.slug ?? '').trim()
  if (!slug) {
    return res.status(400).json({ error: 'A `slug` is required.' })
  }

  let title = req.body?.title ? String(req.body.title) : ''
  let description = req.body?.description ? String(req.body.description) : ''
  if (!title) {
    const article = await getArticleBySlug(slug)
    if (!article) {
      return res.status(404).json({
        error:
          'Could not resolve the post. Pass `title` (and `description`) in the body, or ensure the slug exists as a published post.',
      })
    }
    title = article.meta.title
    description = description || article.meta.description
  }

  try {
    const id = await sendNewsletter({
      title,
      description,
      url: `${siteUrl}/articles/${slug}`,
    })
    return res.status(200).json({ ok: true, slug, singleSendId: id })
  } catch (error) {
    console.error('notify: send failed', error)
    return res.status(500).json({ error: 'Failed to send newsletter.' })
  }
}
