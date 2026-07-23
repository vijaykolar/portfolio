import type { NextApiRequest, NextApiResponse } from 'next'

import { addContactToList, sendWelcomeEmail } from '@/lib/sendgrid'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const email = String(req.body?.email ?? '')
    .trim()
    .toLowerCase()
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'A valid email address is required.' })
  }

  try {
    await addContactToList(email)
  } catch (error) {
    console.error('subscribe: failed to add contact', error)
    return res
      .status(500)
      .json({ error: 'Could not subscribe right now. Please try again later.' })
  }

  // Welcome email is best-effort — don't fail the signup if it bounces.
  try {
    await sendWelcomeEmail(email)
  } catch (error) {
    console.error('subscribe: welcome email failed', error)
  }

  return res.status(200).json({ ok: true })
}
