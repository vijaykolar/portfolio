import { NextStudio } from 'next-sanity/studio'

import config from '../../../../sanity.config'

// Renders the embedded Sanity Studio at /studio (and /studio/*).
// Auth is Sanity's own login; the site's Pages Router is untouched.
export const dynamic = 'force-static'

export { metadata, viewport } from 'next-sanity/studio'

export default function StudioPage() {
  return <NextStudio config={config} />
}
