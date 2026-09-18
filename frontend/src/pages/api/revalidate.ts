import type { NextApiRequest, NextApiResponse } from 'next'
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook'

// Sanity → Vercel publish hook.
//
// Configured in sanity.io/manage → API → Webhooks with:
//   URL         https://<site>/api/revalidate
//   Trigger on  create, update, delete
//   Filter      _type == "post"
//   Projection  {_type, "slug": slug.current}
//   Secret      SANITY_REVALIDATE_SECRET
//   Drafts      off (fires only when the *published* document changes)
//
// This is a Pages Router route on purpose: `res.revalidate()` only exists
// here, and `parseBody` from next-sanity/webhook only accepts App Router
// requests, so the signature is checked with @sanity/webhook directly.

export const config = {
  api: { bodyParser: false }, // the HMAC is computed over the raw body
}

interface WebhookPayload {
  _type?: string
  slug?: string | null
}

async function readRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) {
    return res
      .status(500)
      .json({ error: 'SANITY_REVALIDATE_SECRET is not configured.' })
  }

  const signature = req.headers[SIGNATURE_HEADER_NAME]
  const rawBody = await readRawBody(req)
  if (
    typeof signature !== 'string' ||
    !(await isValidSignature(rawBody, signature, secret))
  ) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  let payload: WebhookPayload
  try {
    payload = JSON.parse(rawBody) as WebhookPayload
  } catch {
    return res.status(400).json({ error: 'Body is not valid JSON' })
  }

  if (payload._type !== 'post') {
    return res.status(200).json({ skipped: true, type: payload._type ?? null })
  }

  const paths = ['/', '/articles']
  if (payload.slug) {
    paths.push(`/articles/${payload.slug}`)
  }

  const failed: string[] = []
  for (const path of paths) {
    try {
      await res.revalidate(path)
    } catch (error) {
      console.error(`revalidate: failed for ${path}`, error)
      failed.push(path)
    }
  }

  return res
    .status(failed.length ? 500 : 200)
    .json({ revalidated: paths.filter((p) => !failed.includes(p)), failed })
}
