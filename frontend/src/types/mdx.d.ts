declare module '*.mdx' {
  import type { ComponentType, ReactNode } from 'react'

  export const meta: {
    title: string
    description: string
    author: string
    date: string
  }

  const MDXComponent: ComponentType<{
    isRssFeed?: boolean
    previousPathname?: string
  }>
  export default MDXComponent
}

declare module '@mapbox/rehype-prism' {
  import type { Plugin } from 'unified'
  const rehypePrism: Plugin
  export default rehypePrism
}
