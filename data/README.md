# Download data

Automated download history for the plugin ZIP, produced by
[`.github/workflows/track-downloads.yml`](../.github/workflows/track-downloads.yml).

## Why this exists

GitHub counts every download of a release asset and exposes the running total
as `download_count` on its REST API. But it only ever reports the **current**
value — there is no history, and **no event or webhook fires per download**.
So a scheduled job snapshots the number once a day and commits it here,
gradually building a time series.

## Files

**`downloads.csv`** — one row per day, appended by the daily job:

```
date,total_downloads,daily_change
2026-08-01,17,
2026-08-02,24,7
```

- `date` — UTC date of the snapshot (`YYYY-MM-DD`)
- `total_downloads` — cumulative total across every release asset
- `daily_change` — increase since the previous row (blank on the first row)

Open it in any spreadsheet to chart downloads over time.

**`downloads.json`** — the latest snapshot, with a per-release and per-asset
breakdown so you can see which version people are actually downloading.

## How it runs

- **Schedule:** daily at 03:17 UTC, plus a manual **Run workflow** button on the
  Actions tab.
- **Idempotent:** re-running on the same day replaces that day's row instead of
  adding a duplicate, and the job skips the commit entirely when nothing changed.
- **No secrets needed** — it uses the built-in `GITHUB_TOKEN`.

## Notes

- The counter is per release asset, so the total sums across all releases. It
  counts downloads of the ZIP attached to a **release** — not clones, and not
  traffic to the site.
- GitHub's own counter is what's being read; it can't be reset or backdated, so
  the history starts from the first snapshot (the total at that moment is the
  all-time figure, it just isn't broken down by day before then).
- Scheduled workflows only run from the repository's **default branch**, so this
  job starts running once the branch is merged into `main`.
- To track a different asset type, change `ASSET_PATTERN` in the workflow
  (currently `.zip`).
