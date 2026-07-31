# Blog

A dependency-free static blog that reuses the site's design system. No build
step — each post is a plain `.html` file that links the shared `blog.css` and
`blog.js`, so it works on any static host exactly like the rest of the site.

```
blog/
├─ index.html      ← the post listing (edit this to add a card per post)
├─ blog.css        ← shared styles for the listing + all posts
├─ blog.js         ← shared theme toggle
├─ _TEMPLATE.html  ← copy this to start a new post
└─ <slug>.html     ← one file per post
```

## Add a new post — 4 steps

1. **Copy the template:** `cp _TEMPLATE.html my-post-slug.html`
   Use a lowercase, hyphenated slug — it becomes the URL
   (`https://wpaiscanner.com/blog/my-post-slug.html`).

2. **Fill it in:** replace every `{{PLACEHOLDER}}` (title, description, date,
   category, canonical/OG URLs) and write the body inside
   `<article class="post"> … </article>` using `<h2>`, `<h3>`, `<p>`, `<ul>`,
   `<blockquote>`, `<pre>`, and `<div class="callout">`. Delete the guidance
   comment at the top.

3. **Link it from the listing:** in `index.html`, add a `<a class="post-card">`
   block at the **top** of `.card-grid` (newest first), and add a matching
   `BlogPosting` entry to that page's JSON-LD `blogPost` array.

4. **List it in the sitemap:** add a `<url>` for the post to `/sitemap.xml`
   (repo root) so search engines discover it.

## Notes

- **SEO is built in.** Each post ships a canonical URL, robots meta, Open
  Graph / Twitter tags, and `BlogPosting` + `BreadcrumbList` structured data.
  Keep the canonical/OG URLs pointing at the real `wpaiscanner.com` path.
- **Social image.** Posts reuse the site's `/og-image.png`. To give a post its
  own share image, drop a 1200×630 PNG in the repo and point the four
  `og:image` / `twitter:image` URLs (and the JSON-LD `image`) at it.
- **Dates** use `YYYY-MM-DD` in the machine-readable spots (`<time datetime>`,
  `datePublished`) and a friendly form in the visible text.
