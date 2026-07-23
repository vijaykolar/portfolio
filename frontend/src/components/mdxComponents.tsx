import NextImage from 'next/image'
import type { CSSProperties } from 'react'

interface MDXImageProps {
  src?: string
  alt?: string
  width?: number | string
  height?: number | string
  className?: string
  style?: CSSProperties
}

// Renders `<Image>` used inside article bodies. When explicit dimensions are
// provided we use next/image for optimization; otherwise we fall back to a
// plain <img> (dimensions are required by next/image for non-imported sources).
function MDXImage({ src, alt = '', width, height, className, style }: MDXImageProps) {
  if (!src) {
    return null
  }
  const w = width !== undefined ? Number(width) : undefined
  const h = height !== undefined ? Number(height) : undefined
  if (w && h) {
    return (
      <NextImage
        src={src}
        alt={alt}
        width={w}
        height={h}
        className={className}
        style={style}
      />
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} style={style} />
}

export const mdxComponents = {
  Image: MDXImage,
}
