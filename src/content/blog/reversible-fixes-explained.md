---
title: 'Reversible by design: fixes that never touch your theme'
description: "Crawlwise fixes your site by writing plugin settings and nothing else — no theme edits, no rewritten posts. Here's why that makes every fix reversible."
pubDate: 2026-07-31
category: Concept
readingTime: '5 min read'
---

Most site-audit tools stop at the diagnosis: here's what's wrong, good luck. The ones that go further and actually change your site tend to do it destructively — rewriting excerpts, editing template files, leaving you unsure how to undo it. Crawlwise takes a different stance. It fixes what a machine can't read, but it does so in a way you can always take back.

> The whole design rests on one rule: every fix writes plugin settings and nothing else.

## Settings only — nothing else moves

When you apply a fix, Crawlwise does not edit your theme files and does not rewrite your posts. The change lives entirely in the plugin's own settings. That single constraint is what makes the next part possible.

## Genuinely reversible

Because state lives in settings, turning a fix off restores the **exact** prior behavior — there's no residue left behind in your content or templates. "Turn off" isn't a best-effort undo; it's a return to precisely how things were.

A good example is the meta-description fix. Rather than rewriting your post excerpts on disk, Crawlwise derives the meta description **at render time**. Your stored content is never altered, so disabling the fix simply stops the derivation — and your excerpts were never touched to begin with.

## Exports that refuse to clobber your files

The same non-destructive principle governs static export. Crawlwise will **refuse to overwrite a `robots.txt` or `llms.txt` it did not create**, so a file you maintain by hand is never silently replaced.

> Enabled static export and nothing happened? That's the safeguard working: it won't overwrite an existing `robots.txt` or `llms.txt`. Remove or rename the file if you want the plugin to manage it.

## It defers to the plugins you already run

Reversibility isn't only about undo — it's about not creating conflicts in the first place. If you run Yoast, Rank Math, or AIOSEO, Crawlwise detects them and **defers per feature**, so you never end up with two sitemaps, two meta descriptions, or two JSON-LD graphs fighting each other.

## Private by default

Non-destructive extends to your data, too. Crawlwise makes HTTP requests to **your own site only** — it sends nothing to any third party and has **no telemetry**. And everything it generates for machines (the `/llms.txt` file, the Markdown output, and the JSON-LD graph) is built exclusively from public content. Password-protected, private, draft, and per-entity excluded posts are never included.

## And clean uninstall

The principle even holds at the very end. Uninstalling removes the custom table, all options and transients, the scheduled re-scan, and any files the plugin exported. Nothing lingers.

Put together, these choices add up to a simple promise: you can try a fix, see the score move, and roll it back with zero collateral — because Crawlwise only ever touches its own settings, never your content.
