# Publish → deploy

Posts live in WordPress at **blog.wpaiscanner.com**; the site is a static build
that reads them through the REST API at build time. A new post is therefore
only live once the site rebuilds. This wires that up so publishing is enough.

```
Publish in WordPress
   └─ mu-plugin POSTs the Cloudflare Deploy Hook
        └─ Workers Builds runs `npm run build` on main
             └─ src/lib/wp.js pulls the posts
                  └─ deployed to wpaiscanner.com   (~1–2 min end to end)
```

The site runs on **Cloudflare Workers Builds** (Worker `wpaiscanner`, production
branch `main`), not Pages — the setup below is the Workers flavour.

## 1. Create the Deploy Hook

In the Cloudflare dashboard: **Workers & Pages → wpaiscanner → Settings →
Builds → Deploy Hooks → Create**.

- **Name:** `wordpress-publish` (the name shows up in build history, so you can
  tell hook-triggered builds from pushes)
- **Branch:** `main`

Copy the URL it gives you:

```
https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/<DEPLOY_HOOK_ID>
```

**Treat it as a secret.** No `Authorization` header is required — the id in the
URL *is* the credential, so anyone who has it can trigger builds. Keep it out of
this repository. If it leaks, delete the hook in the dashboard and create a new
one.

## 2. Point WordPress at it

Add the URL to `wp-config.php` on blog.wpaiscanner.com, above the
`/* That's all, stop editing! */` line:

```php
define( 'CRAWLWISE_DEPLOY_HOOK_URL', 'https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/<DEPLOY_HOOK_ID>' );
```

Then upload [`wordpress/crawlwise-deploy-hook.php`](wordpress/crawlwise-deploy-hook.php) to:

```
wp-content/mu-plugins/crawlwise-deploy-hook.php
```

Must-use plugins activate on upload — there is nothing to switch on, and nobody
can deactivate it by accident. Without the constant the plugin does nothing, so
it is safe to install first and add the URL after.

## 3. Check it

**Tools → Site deploy** in WordPress shows whether the constant is set, the
result of the last attempt, and a **Rebuild the site now** button. Click it,
then watch the build appear under **Settings → Builds** in Cloudflare.

## What triggers a build

| In WordPress                        | Rebuilds | Why                                   |
| ----------------------------------- | -------- | ------------------------------------- |
| Publish a post                      | yes      | new page, new listing entry           |
| Edit a published post               | yes      | content, title, excerpt, or slug moved |
| A scheduled post goes live          | yes      | same transition as publishing         |
| Unpublish, trash, or delete a post  | yes      | the page must come down               |
| Save a draft, autosave, revision    | no       | never reaches the published feed       |
| Comments, plugin or theme changes   | no       | the static site does not render them   |

Only the `post` type is watched. To include pages or a custom type, add it to
`CRAWLWISE_DEPLOY_POST_TYPES` at the top of the plugin.

## Notes

- **Bursts are fine.** Edits within one request fire a single build, and
  Cloudflare de-duplicates hook calls that arrive while a build is still queued.
  The limit is 10 builds per minute per Worker.
- **A failed build leaves the current site up.** Workers Builds only promotes a
  successful build, so a WordPress outage during a build cannot take the site
  down — `src/lib/wp.js` fails the build loudly instead of shipping an empty blog.
- **Slug changes leave the old URL 404ing.** WordPress keeps the old permalink
  working on its own domain; the static site does not. Add a redirect in
  `astro.config.mjs` when you rename a published post.
- **Optional safety net:** if a hook is ever missed, a scheduled build catches
  it. Either add a Cloudflare Cron Trigger that POSTs the hook, or a GitHub
  Actions cron with the URL stored as a repository secret.
