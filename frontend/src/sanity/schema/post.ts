import { defineField, defineType } from 'sanity'

// The blog post document. `body` is GitHub-flavoured markdown (with the small
// MDX extension of `<Image … />` JSX) rendered by next-mdx-remote on the site,
// so the Studio field is a plain markdown editor rather than Portable Text.
export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL path segment: /articles/<slug>. Generate it from the title.',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      initialValue: 'Vijay Kolar',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      options: { dateFormat: 'YYYY-MM-DD' },
      initialValue: () => new Date().toISOString().slice(0, 10),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'One or two sentences. Shown in listings, RSS and the newsletter.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'markdown',
      description:
        'GitHub-flavoured markdown. Fenced code blocks get syntax highlighting. ' +
        'Images: put files under frontend/public/images/articles/<slug>/ and use ' +
        '<Image className="…" src="/images/articles/<slug>/file.png" alt="…" width={705} height={400} />. ' +
        'Bare "<" or "{" outside code breaks rendering (the body is compiled as MDX).',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'date' },
  },
  orderings: [
    {
      name: 'dateDesc',
      title: 'Date (newest first)',
      by: [{ field: 'date', direction: 'desc' }],
    },
  ],
})
