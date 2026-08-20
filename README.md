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
├─ content/blog/     Blog posts (Markdown, content collections)
├─ layouts/Base.astro  Shell: fonts, SEO tags, JSON-LD, nav + footer
├─ pages/
│  ├─ index.astro    Home
│  ├─ docs.astro     Documentation
│  └─ blog/          Blog listing + post template
├─ styles/global.css Design tokens and shared primitives
└─ content.config.ts Blog collection schema
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

## Adding a blog post

Create a Markdown file in `src/content/blog/`:

```md
---
title: 'Your post title'
description: 'One-sentence summary used for SEO and the listing card.'
pubDate: 2026-08-20
category: Guide
readingTime: '5 min read'
---

Your content…
```

The slug comes from the filename. The listing page, the sitemap, and the
`BlogPosting` structured data all pick it up automatically — nothing else to edit.

## Deployment

`npm run build` emits a fully static site to `dist/`. Point your host at that
directory with `npm run build` as the build command (Netlify, Vercel, Cloudflare
Pages, and GitHub Pages all support this out of the box).

> **Note:** the site previously served hand-written HTML from the repository
> root. Now that it is an Astro project, the deploy target must be the generated
> `dist/` directory, not the repo root.

`sitemap-index.xml` is generated at build time by `@astrojs/sitemap`;
`public/robots.txt` points at it.
