import { createClient } from 'next-sanity'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
export const apiVersion = '2025-02-19'

if (!projectId) {
  throw new Error(
    'NEXT_PUBLIC_SANITY_PROJECT_ID is not set. Copy .env.example to .env.local and fill it in.',
  )
}

// Read-only client used by getStaticProps / getServerSideProps / API routes.
// `useCdn: false` so builds and on-demand revalidation always see the document
// that was just published (the API CDN can lag by a few seconds).
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'published',
})
