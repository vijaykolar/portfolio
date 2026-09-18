import type { GetServerSideProps } from 'next'

import { buildFeed } from '@/lib/rss'

// Serves /rss/feed.json (JSON Feed 1) on demand from Sanity. Cached at the
// edge for 10 minutes, so the feed can lag a publish by up to that long.
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const feed = await buildFeed()
  res.setHeader('Content-Type', 'application/feed+json; charset=utf-8')
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=600, stale-while-revalidate=86400',
  )
  res.write(feed.json1())
  res.end()
  return { props: {} }
}

export default function FeedJson() {
  return null
}
