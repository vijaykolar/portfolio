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
import { getArticleBySlug, getArticleSlugs } from '@/lib/keystaticReader'

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
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps<
  Omit<ArticlePageProps, 'previousPathname'>
> = async ({ params }) => {
  const slug = params?.slug as string
  const article = await getArticleBySlug(slug)
  if (!article) {
    return { notFound: true }
  }

  const mdxSource = await serialize(article.body, {
    // Content is authored in this repo (via Keystatic / the scheduled poster),
    // so allow JSX expressions like `width={705}` and `style={{…}}` that
    // next-mdx-remote strips by default. `blockDangerousJS` stays on.
    blockJS: false,
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypePrism],
    },
  })

  return {
    props: {
      meta: {
        title: article.meta.title,
        description: article.meta.description,
        date: article.meta.date,
      },
      mdxSource,
    },
  }
}
