/**
 * Record how many times the plugin ZIP has been downloaded.
 *
 * GitHub counts every download of a release asset and exposes the running
 * total as `download_count` on the REST API — but only as a *current* value,
 * never as history. This script snapshots that value on a schedule and appends
 * it to data/downloads.csv, so the repo slowly accumulates a time series.
 *
 * Run:  node .github/scripts/track-downloads.mjs
 * Env:  GITHUB_REPOSITORY  owner/repo to read releases from (required)
 *       GITHUB_TOKEN       optional; raises the API rate limit
 *       ASSET_PATTERN      optional substring filter, e.g. ".zip" (default: all)
 *       DATA_DIR           optional output dir (default: "data")
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CSV_HEADER = 'date,total_downloads,daily_change';

/** Fetch every release, following pagination. */
export async function fetchReleases(repo, token) {
  const releases = [];
  for (let page = 1; page <= 20; page++) {
    const url = `https://api.github.com/repos/${repo}/releases?per_page=100&page=${page}`;
    const headers = {
      accept: 'application/vnd.github+json',
      'user-agent': 'aiscanner-download-tracker',
    };
    if (token) headers.authorization = `Bearer ${token}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    const batch = await res.json();
    releases.push(...batch);
    if (batch.length < 100) break;
  }
  return releases;
}

/**
 * Total the download counts across every release asset.
 * Returns the grand total plus a per-release / per-asset breakdown.
 */
export function aggregate(releases, assetPattern = '') {
  let total = 0;
  const byRelease = [];
  for (const rel of releases) {
    const assets = (rel.assets || []).filter(
      (a) => !assetPattern || a.name.includes(assetPattern)
    );
    if (!assets.length) continue;
    const relTotal = assets.reduce((n, a) => n + (a.download_count || 0), 0);
    total += relTotal;
    byRelease.push({
      tag: rel.tag_name,
      published_at: rel.published_at,
      downloads: relTotal,
      assets: assets.map((a) => ({ name: a.name, downloads: a.download_count || 0 })),
    });
  }
  return { total, byRelease };
}

/**
 * Append today's total to the CSV, or replace today's row if the job already
 * ran today — so re-runs and manual triggers never double-count a day.
 */
export function upsertCsvRow(csv, date, total) {
  const lines = (csv || '').trim().split('\n').filter(Boolean);
  const rows = lines[0] === CSV_HEADER ? lines.slice(1) : lines;

  const kept = rows.filter((r) => r.split(',')[0] !== date);
  const prev = kept.length ? kept[kept.length - 1] : null;
  const prevTotal = prev ? Number(prev.split(',')[1]) : null;
  const change = prevTotal === null ? '' : String(total - prevTotal);

  kept.push(`${date},${total},${change}`);
  return `${CSV_HEADER}\n${kept.join('\n')}\n`;
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) throw new Error('GITHUB_REPOSITORY is required (owner/repo)');
  const dataDir = process.env.DATA_DIR || 'data';
  const pattern = process.env.ASSET_PATTERN || '';

  const releases = await fetchReleases(repo, process.env.GITHUB_TOKEN);
  const { total, byRelease } = aggregate(releases, pattern);
  const date = new Date().toISOString().slice(0, 10);

  mkdirSync(dataDir, { recursive: true });

  const csvPath = join(dataDir, 'downloads.csv');
  const existing = existsSync(csvPath) ? readFileSync(csvPath, 'utf8') : '';
  writeFileSync(csvPath, upsertCsvRow(existing, date, total));

  // Deterministic for a given day's data (date, not timestamp) so that a
  // re-run with no new downloads produces an identical file — that is what
  // lets the workflow skip an empty commit.
  const jsonPath = join(dataDir, 'downloads.json');
  writeFileSync(
    jsonPath,
    JSON.stringify({ repo, checked_on: date, total, releases: byRelease }, null, 2) + '\n'
  );

  console.log(`${repo}: ${total} total downloads across ${byRelease.length} release(s)`);
  if (!releases.length) {
    console.log('No releases found yet — logging 0 so the history starts from today.');
  }
}

// Only run when executed directly, so the helpers above stay unit-testable.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
