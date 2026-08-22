# Crawlwise — marketing site

The site for **Crawlwise**, the readiness dashboard for the machine-readable web —
a WordPress plugin that scans, fixes, and verifies your site for AI agents.

Built with [Astro](https://astro.build). Static output, no server required.

## Commands

| Command           | Action                                        |
| ----------------- | --------------------------------------------- |
| `npm install`     | Install dependencies                          |
| `npm run dev`     | Local dev server at `localhost:4321`          |
| `npm run build`   | Build the production site to `./dist/`        |
| `npm run preview` | Preview the built site locally                |

## Project structure

```
src/
├─ components/       Icon, Nav, Footer
├─ layouts/Base.astro  Shell: fonts, SEO tags, JSON-LD, nav + footer
├─ lib/wp.js         WordPress REST client (blog posts, build time)
├─ pages/
│  ├─ index.astro    Home
│  ├─ docs.astro     Documentation
│  └─ blog/          Blog listing + post template
└─ styles/global.css Design tokens and shared primitives
public/              Static assets served as-is (og-image.png, robots.txt)
data/                Automated plugin-download history (see data/README.md)
```

## Design system

Tokens live at the top of `src/styles/global.css` and are transcribed from the
Crawlwise design file:

- **Surfaces** `#FAF9F7` page · `#FFFFFF` panels · `#F1EFEB` fills · `#E4E1DB` borders
- **Text** `#14161A` headings · `#585E66` body · `#71777E` mono/muted
- **Brand** `#8F5400` accent · `#FFF8EC` on-accent · `#EFDCAE` soft accent
- **Semantics** `#12855A` pass · `#C33A26` fail
- **Type** Archivo (headings) · Inter (body) · JetBrains Mono (labels, code)

Layout is a 1160px content column inside 140px gutters at 1440px, expressed
responsively as `width: min(100% - 48px, 1160px)`.

## The blog

Posts are written in WordPress at **blog.wpaiscanner.com** and pulled through
the REST API by `src/lib/wp.js` **at build time**. The published pages are still
plain static HTML — nothing calls WordPress in the browser, and the site keeps
serving normally if the CMS is down.

To publish: write the post in WordPress and hit Publish. A deploy hook rebuilds
the site automatically — see [`deploy/README.md`](deploy/README.md) for the
wiring. A post that exists in WordPress but not in the last build is not live.

Everything else is derived from the API response — no front matter to keep in
sync:

| Field on the page  | Source in WordPress                                  |
| ------------------ | ---------------------------------------------------- |
| URL slug           | the post slug                                        |
| Card summary + SEO | the excerpt (manual, or WordPress's auto-excerpt)     |
| Tag on the card    | the first category assigned to the post               |
| Reading time       | computed from the body at 200 words per minute        |
| Hero / OG image    | the featured image, falling back to `/og-image.png`   |

The listing page, the sitemap, and the `BlogPosting` structured data all follow
automatically.

Point the build at a different WordPress install with the `WP_API_URL`
environment variable (defaults to `https://blog.wpaiscanner.com/wp-json/wp/v2`).

If a post is unreachable at build time the build **fails loudly** rather than
quietly shipping a blog with posts missing.

## Deployment

`npm run build` emits a fully static site to `dist/`. Production is Cloudflare
**Workers Builds** (Worker `wpaiscanner`), which builds and deploys every push
to `main`, plus any post published in WordPress — see
[`deploy/README.md`](deploy/README.md). Any other host works the same way: point
it at `dist/` with `npm run build` as the build command.

> **Note:** the site previously served hand-written HTML from the repository
> root. Now that it is an Astro project, the deploy target must be the generated
> `dist/` directory, not the repo root.

`sitemap-index.xml` is generated at build time by `@astrojs/sitemap`;
`public/robots.txt` points at it.
