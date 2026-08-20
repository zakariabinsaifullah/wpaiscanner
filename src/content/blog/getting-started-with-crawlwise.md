---
title: 'Getting started with Crawlwise: scan, fix, verify'
description: 'Install Crawlwise, run your first scan, apply a reversible fix, and re-scan to prove the score moved — a five-minute walkthrough of the scan → fix → verify loop.'
pubDate: 2026-07-31
category: Guide
readingTime: '5 min read'
---

AI agents and crawlers are already reading the web on behalf of real users — summarizing pages, comparing products, and answering questions without anyone clicking through. The question is no longer *whether* a machine visits your WordPress site, but whether it can make sense of what it finds. Crawlwise measures exactly that, then helps you fix the gaps.

This walkthrough takes you through the full loop — **scan → fix → verify** — in about five minutes. If you haven't installed the plugin yet, grab it first.

> Download the latest build from the homepage, then install it via **Plugins → Add New → Upload Plugin**. Full steps live in the [documentation](/docs/#install).

## 1. Run your first scan

Open **Crawlwise** in the WordPress admin sidebar and click **Scan**. The plugin fetches your own pages over real HTTP — the same way an external agent would — and grades them against a fixed rubric across five dimensions.

You'll get a score out of 100 and a level, plus a per-check breakdown showing exactly which signals passed, which failed, and which couldn't be verified. Nothing is guessed: a check the plugin can't confirm is reported as informational rather than a misleading pass or fail.

## 2. Read the rubric

Each dimension groups a handful of concrete checks — things like a discoverable sitemap, machine-readable metadata, and clean structured data. The point isn't to chase a perfect score; it's to see where a machine reader stumbles today.

Skim the failing checks first. Most sites lose easy points on a couple of high-value signals, and those are the ones worth fixing immediately.

## 3. Apply a reversible fix

This is what sets Crawlwise apart from a stateless checker: it doesn't just report problems, it fixes them — safely. Every fix writes plugin settings and **nothing else**. No theme files are edited and no posts are rewritten, so turning a fix off restores the exact prior behavior.

Pick a failing check, click **Fix**, and confirm. Because the change lives entirely in settings, it's genuinely reversible at any time.

## 4. Verify the change

Click **Scan** again. The check you fixed should now pass and your score should move up. That re-scan is the whole point — it proves the change worked against your live site instead of asking you to take it on faith.

Repeat the loop a few times and you'll have walked your site from wherever it started to a level where agents can reliably read and act on it.

## Where to go next

- **Automate it.** Crawlwise ships an optional MCP server so an AI agent can call `scan`, `fix`, `verify`, and `revert` directly. See the [MCP guide](/docs/#mcp).
- **Understand the scoring.** The [rubric reference](/docs/#rubric) lists every dimension and check.
- **Stay private.** Crawlwise talks only to your own site, sends nothing to third parties, and has no telemetry.

That's the loop. Scan to see where you stand, fix what a machine can't read, and verify that the score actually moved.
