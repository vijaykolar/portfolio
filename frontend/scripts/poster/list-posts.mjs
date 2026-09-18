// Prints every published post (newest first) so the auto-poster can avoid
// repeating a topic. Output: one `YYYY-MM-DD  Title  (slug)` line per post.
import { sanityClient } from '../lib/sanity.mjs'

const QUERY = `*[_type == "post" && defined(slug.current)]
  | order(date desc) { title, "slug": slug.current, date }`

const posts = await sanityClient().fetch(QUERY)
for (const post of posts) {
  console.log(`${post.date ?? '????-??-??'}  ${post.title}  (${post.slug})`)
}
console.error(`${posts.length} existing post(s)`)
