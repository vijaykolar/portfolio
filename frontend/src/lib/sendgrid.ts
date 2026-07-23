// Thin wrappers over the SendGrid v3 API (no SDK; uses global fetch).
//
// Required env vars:
//   SENDGRID_API_KEY               - API key with Mail Send + Marketing permissions
//   SENDGRID_LIST_ID               - Marketing contact list ID (where signups are stored / sent to)
// Optional (welcome email on signup):
//   SENDGRID_FROM_EMAIL            - a verified single-sender email
// Required for sendNewsletter (Single Send to the list):
//   SENDGRID_SENDER_ID             - numeric verified sender identity ID
//   SENDGRID_UNSUBSCRIBE_GROUP_ID  - numeric unsubscribe (suppression) group ID

const SENDGRID_API = 'https://api.sendgrid.com/v3'

function apiKey(): string {
  const key = process.env.SENDGRID_API_KEY
  if (!key) {
    throw new Error('SENDGRID_API_KEY is not set')
  }
  return key
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey()}`,
    'Content-Type': 'application/json',
  }
}

async function assertOk(res: Response, label: string): Promise<void> {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`SendGrid ${label} failed (${res.status}): ${text}`)
  }
}

/** Upsert a contact and (optionally) add them to the configured list. */
export async function addContactToList(email: string): Promise<void> {
  const body: Record<string, unknown> = { contacts: [{ email }] }
  const listId = process.env.SENDGRID_LIST_ID
  if (listId) {
    body.list_ids = [listId]
  }
  const res = await fetch(`${SENDGRID_API}/marketing/contacts`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  await assertOk(res, 'add-contact')
}

/** Optional transactional "thanks for subscribing" email. No-op if no sender set. */
export async function sendWelcomeEmail(email: string): Promise<void> {
  const from = process.env.SENDGRID_FROM_EMAIL
  if (!from) {
    return
  }
  const res = await fetch(`${SENDGRID_API}/mail/send`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: from, name: 'Vijay Kolar' },
      subject: 'Thanks for subscribing',
      content: [
        {
          type: 'text/plain',
          value:
            "Thanks for subscribing! I'll email you whenever I publish a new post.",
        },
        {
          type: 'text/html',
          value:
            "<p>Thanks for subscribing! I'll email you whenever I publish a new post.</p>",
        },
      ],
    }),
  })
  await assertOk(res, 'welcome-email')
}

export interface NewsletterPost {
  title: string
  description: string
  url: string
}

function newsletterHtml(post: NewsletterPost): string {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #18181b;">
    <h1 style="font-size: 22px; line-height: 1.3; margin: 0 0 12px;">${post.title}</h1>
    <p style="font-size: 15px; line-height: 1.6; color: #3f3f46; margin: 0 0 20px;">${post.description}</p>
    <p style="margin: 0 0 28px;">
      <a href="${post.url}" style="display: inline-block; background: #14b8a6; color: #fff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 10px 18px; border-radius: 8px;">Read the post</a>
    </p>
    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 0 0 16px;" />
    <p style="font-size: 12px; color: #a1a1aa; margin: 0;">
      You're receiving this because you subscribed to Vijay Kolar's blog.
      <a href="<%asm_group_unsubscribe_raw_url%>" style="color: #a1a1aa;">Unsubscribe</a>.
    </p>
  </div>`
}

/**
 * Create and immediately send a Single Send to the configured list, announcing
 * a new post. Single Send is used (rather than looping transactional emails) so
 * SendGrid handles list targeting and unsubscribe compliance.
 */
export async function sendNewsletter(post: NewsletterPost): Promise<string> {
  const listId = process.env.SENDGRID_LIST_ID
  const senderId = process.env.SENDGRID_SENDER_ID
  const groupId = process.env.SENDGRID_UNSUBSCRIBE_GROUP_ID
  if (!listId) throw new Error('SENDGRID_LIST_ID is not set')
  if (!senderId) throw new Error('SENDGRID_SENDER_ID is not set')
  if (!groupId) throw new Error('SENDGRID_UNSUBSCRIBE_GROUP_ID is not set')

  const plain = `${post.title}\n\n${post.description}\n\nRead it: ${post.url}\n\nUnsubscribe: <%asm_group_unsubscribe_raw_url%>`

  const createRes = await fetch(`${SENDGRID_API}/marketing/singlesends`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      name: `New post: ${post.title} — ${new Date().toISOString()}`.slice(0, 100),
      send_to: { list_ids: [listId] },
      email_config: {
        subject: `New post: ${post.title}`,
        html_content: newsletterHtml(post),
        plain_content: plain,
        sender_id: Number(senderId),
        suppression_group_id: Number(groupId),
      },
    }),
  })
  await assertOk(createRes, 'create-singlesend')
  const created = (await createRes.json()) as { id?: string }
  if (!created.id) {
    throw new Error('SendGrid create-singlesend returned no id')
  }

  const scheduleRes = await fetch(
    `${SENDGRID_API}/marketing/singlesends/${created.id}/schedule`,
    {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ send_at: 'now' }),
    },
  )
  await assertOk(scheduleRes, 'schedule-singlesend')
  return created.id
}
