import ReactDOMServer from 'react-dom/server'
import { Feed } from 'feed'
import { mkdir, writeFile } from 'fs/promises'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import remarkGfm from 'remark-gfm'
import rehypePrism from '@mapbox/rehype-prism'

import { getArticleBySlug, getArticleMetas } from './keystaticReader'

export async function generateRssFeed(): Promise<void> {
  const articles = await getArticleMetas()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const author = {
    name: 'Vijay Kolar',
    email: 'vijayikolar@gmail.com',
  }

  const feed = new Feed({
    title: author.name,
    description: 'Your blog description',
    author,
    id: siteUrl!,
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

  await mkdir('./public/rss', { recursive: true })
  await Promise.all([
    writeFile('./public/rss/feed.xml', feed.rss2(), 'utf8'),
    writeFile('./public/rss/feed.json', feed.json1(), 'utf8'),
  ])
}
