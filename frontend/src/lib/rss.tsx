import ReactDOMServer from 'react-dom/server'
import { Feed } from 'feed'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import remarkGfm from 'remark-gfm'
import rehypePrism from '@mapbox/rehype-prism'

import { getArticleBySlug, getArticleMetas } from './articles'

// Builds the RSS / JSON feed from the current Sanity content. Served on demand
// by src/pages/rss/feed.xml.tsx and feed.json.tsx (content is no longer known
// at build time, so the feeds cannot be static files under public/).
export async function buildFeed(): Promise<Feed> {
  const articles = await getArticleMetas()
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')
  const author = {
    name: 'Vijay Kolar',
    email: 'vijayikolar@gmail.com',
  }

  const feed = new Feed({
    title: author.name,
    description: 'Your blog description',
    author,
    id: siteUrl,
    link: siteUrl,
    image: `${siteUrl}/favicon.ico`,
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    feedLinks: {
      rss2: `${siteUrl}/rss/feed.xml`,
      json: `${siteUrl}/rss/feed.json`,
    },
  })

  // RSS readers can't resolve relative URLs or run next/image, so render a
  // plain <img> with an absolute src.
  function RssImage({ src, alt = '' }: { src?: string; alt?: string }) {
    if (!src) {
      return null
    }
    const absolute = /^https?:\/\//.test(src) ? src : `${siteUrl}${src}`
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={absolute} alt={alt} />
  }
  const rssComponents = { Image: RssImage }

  for (const article of articles) {
    const url = `${siteUrl}/articles/${article.slug}`
    const full = await getArticleBySlug(article.slug)
    let html = ''
    if (full) {
      try {
        const mdxSource = await serialize(full.body, {
          blockJS: false,
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypePrism],
          },
        })
        html = ReactDOMServer.renderToStaticMarkup(
          <MDXRemote {...mdxSource} components={rssComponents} />,
        )
      } catch (error) {
        // One broken body must not take the whole feed down; the article page
        // itself will surface the error.
        console.error(`rss: failed to render "${article.slug}"`, error)
      }
    }

    feed.addItem({
      title: article.title,
      id: url,
      link: url,
      description: article.description,
      content: html,
      author: [author],
      contributor: [author],
      date: new Date(article.date),
    })
  }

  return feed
}
