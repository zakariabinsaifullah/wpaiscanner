# AIScanner — Marketing & Docs Site

A modern, self-contained marketing and documentation website for the **AIScanner**
WordPress plugin.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Landing page — hero with a live score instrument, how-it-works, the five graded dimensions, the 0–5 scoring ladder, feature grid, the agent (MCP) spotlight, and the primary call-to-action. |
| `docs.html` | Documentation — installation, quick start, the rubric, dimensions & checks, fixes & reversibility, the MCP server, privacy, security, FAQ, and changelog. |

## Design

- **Concept:** an "instrument panel for the machine-readable web" — a diagnostic
  read on how AI agents see your site.
- **Palette:** teal-biased near-black ground, cool porcelain, **Signal Teal**
  (`#0FB5A1`) accent, **Beacon Amber** (`#F1A73A`) highlight.
- **Type:** system humanist sans for reading; system monospace as the character
  carrier for legends, score readouts, level badges, and code.
- **Themes:** light and dark, following the OS preference with a manual toggle
  (persisted to `localStorage`).
- **Motion:** an animated score gauge and scroll reveals, all disabled under
  `prefers-reduced-motion`.

## Deploying

Both pages are fully self-contained — no build step, no external requests, no
fonts or scripts to fetch. Host them anywhere static:

```bash
# preview locally
cd website
python3 -m http.server 8080
# open http://localhost:8080
```

Or drop the folder onto Netlify, Vercel, GitHub Pages, Cloudflare Pages, or any
static host.
