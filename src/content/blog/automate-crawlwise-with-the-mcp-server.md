---
title: 'Automate Crawlwise with the MCP server'
description: "Crawlwise ships an optional MCP server that exposes scan, fix, verify, and revert as tools an AI agent can call directly. Here's how to enable it safely."
pubDate: 2026-07-31
category: Guide
readingTime: '6 min read'
---

Running the scan → fix → verify loop by hand is fine for one site. But if you manage a dozen — or you'd rather have an AI assistant handle readiness the same way it handles the rest of your workflow — Crawlwise can hand the whole loop to an agent. It ships an optional **MCP server** that exposes its core actions as tools an AI agent can call directly.

> MCP (the Model Context Protocol) is a standard way for AI agents to call external tools. Crawlwise's server turns "scan, fix, verify" from clicks in the dashboard into functions your agent can invoke.

## What the agent can do

The server exposes four tools, mirroring exactly what you'd do in the dashboard:

- **`scan`** — fetch your pages over real HTTP and score them against the rubric.
- **`fix`** — apply a reversible, settings-only fix for a failing check.
- **`verify`** — re-scan to confirm the change moved the score.
- **`revert`** — undo a fix and restore the exact prior behavior.

Because these are the same operations the plugin performs internally, an agent driving them gets identical, non-destructive results — nothing about the loop changes just because a machine is calling it.

## It's off by default, and gated by a token

The MCP server does nothing until you turn it on, and it will not answer a single request without a bearer token that **you** generate. This is deliberate: an endpoint that can change your site's settings should never be open by default.

1. Go to **Crawlwise → Settings**, tick **Enable the MCP server**, and click **Save Changes**.
2. Copy the bearer token shown. It is stored hashed and cannot be displayed again — regenerate it if you lose it.
3. Register it with your agent.

Registering with a Claude-based agent looks like this:

```bash
# Register Crawlwise as an MCP server
$ claude mcp add --transport http crawlwise \
    https://your-site.com/wp-json/crawlwise/mcp \
    --header "Authorization: Bearer <token>"

✓ connected · tools: scan  fix  verify  revert
```

From here you can simply ask the agent to "scan the site, fix the two highest-value failing checks, and verify" — and it will call the tools in sequence, exactly as you would.

## The security model

An endpoint that can modify settings deserves a careful security design, and Crawlwise treats the token accordingly:

- The bearer token is stored as a **SHA-256 hash**. Its raw value is displayed exactly once, when generated, and cannot be recovered — regenerate it if lost.
- The token is **never included in a settings export**, and a settings import can never set or enable it. You can't accidentally leak or import your way into an open endpoint.
- Failed authentication attempts are **rate-limited per IP**, and cross-origin requests to the MCP endpoint are rejected.
- All dashboard REST routes require `manage_options`; per-entity routes additionally require `edit_post` for that specific post.

> Lost or leaked the token? Regenerate it from **Crawlwise → Settings**. The old value stops working immediately, since only its hash was ever stored.

## When automation earns its keep

Manual scanning is perfect for a single site you touch often. The MCP server pays off when readiness needs to be continuous or hands-off — a portfolio of client sites, a scheduled check an agent runs after each deploy, or simply folding "is my site still agent-readable?" into an assistant you already talk to every day.

The safety guarantees don't change either way. Every fix an agent applies is still settings-only and still reversible, so handing over the keys never means handing over the ability to break your theme or rewrite your content.
