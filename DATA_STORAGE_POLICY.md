# Data Storage Policy (JSON Mainline)

## 1) Daily News File Naming

- Canonical format: `news-YYYY-MM-DD.json`
- Applies to:
  - `data/`
  - `data/archive/daily/`
- Legacy `YYYY-MM-DD.json` files should be normalized by script and archived in operation logs.

## 2) Data Source Priority

For daily news reads:

1. `data/news.json` (current day live dataset)
2. `data/archive/daily/news-YYYY-MM-DD.json` (historical canonical archive)
3. `data/news-YYYY-MM-DD.json` (legacy/transition fallback)
4. `data/YYYY-MM-DD.json` (legacy fallback; to be removed after normalization)

## 3) Governance Scripts

- Dry run normalization: `npm run data:normalize:dry`
- Apply normalization: `npm run data:normalize:apply`
- Create snapshot backup: `npm run data:backup`
- Restore from snapshot: `npm run data:restore -- <snapshot-name-or-path>`

## 4) Safety Rules

- Always run `npm run data:backup` before any apply/restore operation.
- Keep operation logs under `logs/` for traceability.
- Prefer additive migration: normalize naming first, then remove legacy fallbacks in code.
