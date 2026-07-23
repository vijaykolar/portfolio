import type { NextApiRequest, NextApiResponse } from 'next'

import { sendNewsletter } from '@/lib/sendgrid'

interface FeedItem {
  title?: string
  summary?: string
  url?: string
}

// Look up a post's title/description from the published JSON feed by slug.
// Avoids reading the content filesystem at runtime (not reliable in serverless).
async function postFromFeed(
  siteUrl: string,
  slug: string,
): Promise<{ title: string; description: string } | null> {
  try {
    const res = await fetch(`${siteUrl}/rss/feed.json`)
    if (!res.ok) return null
    const feed = (await res.json()) as { items?: FeedItem[] }
    const match = (feed.items ?? []).find((item) =>
      (item.url ?? '').replace(/\/$/, '').endsWith(`/articles/${slug}`),
    )
    if (!match) return null
    return { title: match.title ?? slug, description: match.summary ?? '' }
  } catch {
    return null
  }
}

/**
 * Emails the subscriber list about a newly published post.
 *
 * Auth: `Authorization: Bearer <NEWSLETTER_NOTIFY_SECRET>`.
 * Body: `{ slug, title?, description? }`. If title is omitted it is looked up
 * from the published feed by slug.
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
    const fromFeed = await postFromFeed(siteUrl, slug)
    if (!fromFeed) {
      return res.status(404).json({
        error:
          'Could not resolve the post. Pass `title` (and `description`) in the body, or ensure the slug exists in the published feed.',
      })
    }
    title = fromFeed.title
    description = description || fromFeed.description
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
