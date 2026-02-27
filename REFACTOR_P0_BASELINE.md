# Refactor P0 Baseline

## Branch and Commit Rules

- Branch naming: `codex/<topic>`
- Commit granularity: one logical change per commit
- Every commit must keep app runnable (`npm start`)
- Do not mix refactor-only and behavior changes in one commit

## Baseline Commands

```bash
npm start
```

## P0 Smoke Commands

```bash
npm run test:smoke:json
```

If server is not already running:

```bash
SMOKE_SPAWN_SERVER=1 SMOKE_PORT=3101 npm run test:smoke:json
```

## Coverage in Smoke

- `POST /api/auth/login` (invalid + valid credential path)
- `GET /api/news`
- `GET /api/settings`
- `GET /api/archive/dates` (auth)
- archive input validation (`type` and `date` traversal rejection)
