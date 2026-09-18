'use client'

// Sanity Studio configuration, embedded in the Next.js app at /studio
// (see src/app/studio/[[...tool]]/page.tsx).
//
// The 'use client' directive is load-bearing: the config object contains
// functions, and marking this module as a client module lets it cross the
// React Server Components boundary as a client reference.

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { markdownSchema } from 'sanity-plugin-markdown'

import { schemaTypes } from './src/sanity/schema'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

export default defineConfig({
  name: 'default',
  title: 'Vijay Kolar — Blog',
  basePath: '/studio',
  projectId,
  dataset,
  plugins: [structureTool(), markdownSchema()],
  schema: { types: schemaTypes },
})
