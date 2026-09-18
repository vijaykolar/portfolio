import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from 'next'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import remarkGfm from 'remark-gfm'
import rehypePrism from '@mapbox/rehype-prism'

import { ArticleLayout } from '@/components/ArticleLayout'
import { mdxComponents } from '@/components/mdxComponents'
import { getArticleBySlug, getArticleSlugs } from '@/lib/articles'

type MDXSource = Awaited<ReturnType<typeof serialize>>

interface ArticlePageProps {
  meta: { title: string; description: string; date: string }
  mdxSource: MDXSource
  previousPathname?: string
}

export default function ArticlePage({
  meta,
  mdxSource,
  previousPathname,
}: InferGetStaticPropsType<typeof getStaticProps> & {
  previousPathname?: string
}) {
  return (
    <ArticleLayout meta={meta} previousPathname={previousPathname}>
      <MDXRemote {...mdxSource} components={mdxComponents} />
    </ArticleLayout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await getArticleSlugs()
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    // Posts published in Sanity after the last deploy are generated on first
    // request (and pre-warmed by /api/revalidate when the webhook fires).
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps<
  Omit<ArticlePageProps, 'previousPathname'>
> = async ({ params }) => {
  const slug = params?.slug as string
  const article = await getArticleBySlug(slug)
  if (!article) {
    // Short TTL so a 404 cached just before a publish expires quickly even if
    // the webhook misses.
    return { notFound: true, revalidate: 60 }
  }

  let mdxSource: MDXSource
  try {
    mdxSource = await serialize(article.body, {
      // Content is authored by the site owner (Studio / the scheduled poster),
      // so allow JSX expressions like `width={705}` and `style={{…}}` that
      // next-mdx-remote strips by default. `blockDangerousJS` stays on.
      blockJS: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypePrism],
      },
    })
  } catch (error) {
    // Rethrow rather than returning notFound: a throw during ISR regeneration
    // keeps serving the last good page and surfaces as a 500 in the Sanity
    // webhook attempt log, whereas notFound would replace a good page with 404.
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`MDX compile failed for article "${slug}": ${message}`)
  }

  return {
    props: {
      meta: {
        title: article.meta.title,
        description: article.meta.description,
        date: article.meta.date,
      },
      mdxSource,
    },
    // Safety net; the webhook normally revalidates within seconds of a publish.
    revalidate: 3600,
  }
}
