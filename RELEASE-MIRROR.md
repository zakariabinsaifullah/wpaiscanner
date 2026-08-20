# Download button → private-repo release mirror

The "Download the plugin" button on the Crawlwise homepage points at:

```
https://github.com/zakariabinsaifullah/wpaiscanner/releases/latest/download/aiscaner.zip
```

This is GitHub's **latest-release permalink**: it always resolves to the newest
release's `aiscaner.zip` asset, so the site never needs editing when a
new version ships. The URL lives in one place: `DOWNLOAD_URL` at the top of
`src/pages/index.astro`.

The plugin source lives in the **private** `zakariabinsaifullah/aiscaner` repo.
Release assets inherit repo visibility, so a private repo's asset can't be
downloaded anonymously. To keep the source private but the download public, the
`aiscaner` release workflow **mirrors** the built `aiscaner.zip` into a public
release on this (`wpaiscanner`) repo on every tag.

## One-time setup

1. **Create a token that can write releases here.**
   Create a **fine-grained personal access token** scoped to
   `zakariabinsaifullah/wpaiscanner` with **Repository permissions →
   Contents: Read and write**. (A classic PAT with the `repo` scope also works.)

2. **Store it as a secret in the private repo.**
   In `zakariabinsaifullah/aiscaner` → Settings → Secrets and variables →
   Actions → New repository secret:
   - Name: `WPAISCANNER_RELEASE_TOKEN`
   - Value: the token from step 1.

3. **Add the mirror step** to `.github/workflows/release.yml` in the `aiscaner`
   repo, immediately after the existing `Create Release` step:

   ```yaml
         - name: Mirror ZIP to public download repo
           uses: ncipollo/release-action@v1.14.0
           with:
             artifacts: ${{ env.SLUG }}.zip
             token: ${{ secrets.WPAISCANNER_RELEASE_TOKEN }}
             owner: zakariabinsaifullah
             repo: wpaiscanner
             allowUpdates: true
             makeLatest: true
             tag: ${{ github.ref_name }}
             name: AIScanner ${{ github.ref_name }}
             body: |
               Public download mirror of AIScanner ${{ github.ref_name }}.
               Grab `aiscaner.zip` below and upload it via
               Plugins → Add New → Upload Plugin in WordPress.
   ```

   The existing build already produces `${{ env.SLUG }}.zip` (i.e.
   `aiscaner.zip`), so this step just re-uploads that same artifact to a
   public release on `wpaiscanner` using the cross-repo token.

## Seeding the first release

The permalink 404s until at least one release with an `aiscaner.zip` asset
exists on `wpaiscanner`. Two ways to create it:

- **Automatic:** push the next version tag in `aiscaner` (e.g. `git tag 0.1.1
  && git push origin 0.1.1`). The mirror step runs and creates the public
  release.
- **Manual (one-off):** download `aiscaner.zip` from the current
  `aiscaner` `0.1.0` release, then in `wpaiscanner` → Releases → Draft a new
  release, tag `0.1.0`, attach `aiscaner.zip`, publish.

Once a release exists, the Download button works for everyone.
