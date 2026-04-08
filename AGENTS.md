# Repository Guidelines

## Project Structure & Module Organization
The active runtime is JSON-first. Start from `server-json.js`, which delegates to `server/runtime.js`. Backend routes, middleware, services, and utilities live under `server/`. Frontend page entrypoints live in `frontend/` with shared browser modules in `frontend/modules/`. Static pages such as `index.html`, `news.html`, `tools.html`, and `skills.html` stay at the repo root. JSON data, archives, and podcast metadata live in `data/`; operational scripts live in `scripts/`; regression tests live in `tests/`; active product docs are in `README.md`, `RUN_GUIDE.md`, `API_CONTRACT.md`, and `docs/PRODUCT.md`.

## Build, Test, and Development Commands
Use the toolchain pinned in `package.json` and `.nvmrc` (`node 22.22.0`, `npm 10.9.4`).

- `npm install`: install dependencies.
- `npm start`: run the default JSON runtime on `http://localhost:3000`.
- `npm run dev`: run the same runtime with `nodemon`.
- `npm run start:mysql`: start the optional MySQL branch.
- `node --test tests/*.test.mjs`: run the Node built-in regression suite.
- `npm run test:smoke:json`: smoke-test the JSON runtime.
- `npm run check:assets`: verify logo and asset paths.
- `npm run data:normalize:dry`: preview daily-file normalization before applying it.

## Coding Style & Naming Conventions
Match the existing code style: 4-space indentation, semicolons, and straightforward file-local helpers. Server code uses CommonJS (`require`), while frontend modules and tests use ES modules (`import`). Use `camelCase` for functions, `UPPER_SNAKE_CASE` for constants, and kebab-case for page and test filenames such as `podcast-routes.test.mjs`. Keep reusable UI logic in `frontend/modules/` and wire backend features through focused route/service files under `server/`.

## Testing Guidelines
Tests use `node:test` with `node:assert/strict`. Add or update a targeted `*.test.mjs` file in `tests/` for any route, page, or podcast workflow change. Run a single file with `node --test tests/podcast-routes.test.mjs`. If your change touches podcast generation or production alignment, also run `npm run test:smoke:json` and `npm run podcast:audit:server`, then note any unrelated baseline failures in your PR.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit style: `feat: ...`, `fix: ...`, and scoped forms like `feat(about): ...`. Keep subjects imperative and concise. PRs should summarize affected pages or APIs, list commands run, link the relevant issue, and include screenshots for visible HTML/CSS changes.

## Security & Configuration Tips
Copy `.env.example` to `.env` and never commit secrets. Treat the JSON runtime as the default path; MySQL is optional. This repo is developed on macOS but deployed to Linux, so keep shell scripts on LF line endings, respect case-sensitive paths, and avoid hard-coded macOS-only paths.

## Local-Server Alignment Workflow
This repository is developed locally on macOS, but the deployed Linux server remains a frequent comparison target and release target. Do not assume the local workspace and server are already aligned.

- Server host: `8.135.37.159`
- Server path: `/var/www/ai-coming-website`
- GitHub repo: `origin` (`https://github.com/hrj-11055/ai-coming-website.git`)

Default working rules:
- Use the local workspace as the implementation workspace, but check the server state whenever a task may depend on production drift, deployed files, or runtime-only changes.
- Before pulling from or resetting the server repo, inspect the server worktree first. If the server has newer or divergent code, reconcile that state before claiming local is canonical.
- After each completed requirement or feature, do not stop at local edits. The default completion flow is: local verification -> git commit -> push to GitHub -> sync/deploy to server -> server-side verification.
- Only skip GitHub push or server sync when the user explicitly says the change should remain local-only or draft-only.
- When syncing to server, avoid overwriting runtime data, logs, backups, `.env`, or other production-only artifacts unless the user explicitly asks for that.
