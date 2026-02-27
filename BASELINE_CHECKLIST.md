# Day 1 Baseline Checklist (JSON Mainline)

## 1) Baseline freeze

- Backend mainline fixed to `server-json.js`.
- Frontend baseline pages:
  - `index.html`
  - `news.html`
  - `admin-login.html`
  - `admin-analytics.html`
  - `admin-ipban.html`

## 2) Page -> feature matrix

- `index.html`
  - keyword wall
  - daily news list
  - weekly news list
  - tools search
- `news.html`
  - keyword wall
  - timeline (`#timelineContainer`)
  - article list (`#articlesContainer`)
  - outline (`#outlineContainer`)
  - stats (`#statsContainer`)
  - region filters (`#allFilter`, `#chinaFilter`, `#globalFilter`)
- `admin-login.html`
  - JWT login
- `admin-analytics.html`
  - province stats/logs
- `admin-ipban.html`
  - banned IP management

## 3) High-risk module list

1. `server-json.js`
- Single large file with many responsibilities and endpoints.
- High regression risk during refactor.

2. `main.js`
- Large global-state frontend script.
- Strong coupling across news/timeline/filter/keyword modules.

3. `server-sync.sh`（旧 `fixed` 兼容脚本已删除）
- Uses `pkill + nohup`; weak process lifecycle and health control.

4. CDN-dependent frontend assets
- Tailwind/Alpine/Font Awesome via CDN can break local rendering under unstable network/proxy.

5. Runtime data in `data/`
- Mixed source of truth risk during refactor/testing.

## 4) Runtime checks

Run locally before each refactor day:

```bash
npm run start:legacy
curl -s http://127.0.0.1:3000/api/news | head
curl -s http://127.0.0.1:3000/api/news/dates | head
curl -s http://127.0.0.1:3000/api/keywords | head
curl -I http://127.0.0.1:3000/news.html
```

## 5) Execution record (this run)

- Static API scan: DONE
- Page-feature mapping: DONE
- Runtime checks (local terminal): PASS
  - `GET /api/news`: PASS (`200`, non-empty JSON list)
  - `GET /api/news/dates`: PASS (`200`, non-empty date list)
  - `GET /api/keywords`: PASS (`200`, non-empty keyword list)
  - `GET /news.html`: PASS (`HTTP/1.1 200 OK`)

Note:
- `npm run start:legacy` must be executed in project root:
  - `/Users/MarkHuang/ai-coming-website`
- Running `npm` in `~` will fail with `ENOENT` (`package.json` not found), but this does not affect API runtime if server is already running.
