# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI News Management System (AI资讯管理系统) - an enterprise-level content management platform for AI news, tools, and keyword clouds. The current active mainline is the JSON runtime; MySQL remains an optional migration path, not the default runtime.

**Current Version**: 0.2.0 (package.json)

**Tech Stack**: Node.js + Express + vanilla JavaScript (ES6+) + MySQL/JSON storage

## Important Notes

### CRITICAL: Linux Server Deployment (macOS Development)

**This project is developed on macOS but deployed to a Linux server. ALL code changes must be compatible with Linux.**

**Target Server**:
- Host: `8.135.37.159`
- Path: `/var/www/ai-coming-website`
- OS: Linux (Ubuntu/Debian)
- Sync Tool: Mutagen (configured in `mutagen.yml`)

**Linux Compatibility Checklist** (verify before syncing):
1. **File paths**: Use forward slashes `/`, never backslashes `\`
2. **Line endings**: Shell scripts must use LF, not CRLF (see below)
3. **Case sensitivity**: Linux is case-sensitive (`app.js` ≠ `App.js`)
4. **File permissions**: Executable scripts need `chmod +x`
5. **Node.js version**: Ensure compatibility with server's Node.js version
6. **Environment variables**: `.env` is excluded from sync, configure separately on server
7. **Absolute paths**: Avoid hardcoded macOS paths like `/Users/...`

**Sync Status**:
- Current: **NOT ACTIVE** (no sync session running)
- When ready to sync: `mutagen project start`
- Check sync status: `mutagen sync list`
- Pause sync before major changes: `mutagen project pause`

### Default Local -> GitHub -> Server Workflow

This is a local-first project, but the Linux server is a standing comparison target and the default release target. Do not treat local completion as final completion.

**Default rule**: after each completed requirement or feature, finish the full loop unless the user explicitly says "local only".

1. Implement and verify in the local workspace
2. Check whether the server has drift, newer code, or runtime-only changes that matter
3. Commit the completed change locally
4. Push the same completed change to GitHub
5. Sync or deploy the change to the Linux server
6. Verify the server version directly before claiming the task is done

**Operational expectations**:
- Frequently inspect the server when working on deployment-sensitive pages, podcast workflows, generated content, or anything the user says "server may be different" about
- Never assume the server can safely `git pull`; inspect `git status`, branch state, and runtime artifacts first
- If the server has newer or divergent code, reconcile that state before overwriting it
- Prefer syncing only the code/files relevant to the completed requirement instead of blindly overwriting runtime data
- Do not overwrite `.env`, runtime JSON data, generated audio, logs, backups, or other production-only artifacts unless the user explicitly asks
- A task is not considered fully complete by default until GitHub and the server both reflect the intended version

### Podcast Operations: Server First

For podcast-related work, the source of truth is the Linux server at `/var/www/ai-coming-website`, not the local macOS workspace.

- Canonical server files: `.env`, `server/services/news-podcast.js`, `server/services/podcast-script.js`, `config/podcast-script-system-prompt.md`, `scripts/smoke-json.js`
- Local copies are derived artifacts and may drift
- Verification priority:
  1. Server-side probes
  2. Live `GET /api/podcast/news/:date`
  3. Live `POST /api/podcast/news/:date/generate`
  4. Local tests and smoke

Run `npm run podcast:audit:server` before claiming the local workspace matches podcast production state.

### Podcast Long-Term Memory

The production podcast pipeline is now considered stable and should be preserved unless the user explicitly changes the architecture.

- Official daily input path: `/var/www/json/report/YYYY-MM-DD.json`
- Script generation model: `deepseek-chat`
- TTS model: `speech-2.8-turbo`
- TTS voice: `male-qn-jingying`
- Official TTS mode: MiniMax async `t2a_async_v2` with direct `text` input
- Podcast auto-generation is handled by a separate cron-driven scanner, not by embedding file watching inside the web process
- The scanner starts only after 09:05 Asia/Shanghai, checks `/var/www/json/report/YYYY-MM-DD.json`, skips `ready` and `pending`, and only auto-triggers once per unchanged daily report file
- The server must persist `tts_task_id`, `tts_file_id`, and `tts_status` in metadata
- Successful podcast output must be downloaded by the server, uploaded to OSS, and served to the website via `audio_url`
- Do not assume MiniMax returns a bare mp3; the download flow may require resolving a download URL and extracting audio from an archive
- `deepseek-reasoner` is not the default podcast script model for this project
- Token Plan is not the recommended long-podcast TTS path for this project because it previously hit 1000-character and rolling-quota limits
- Current safe timeout baseline for MiniMax async TTS is `600000ms`

Reference doc: `docs/PODCAST_GENERATION_PIPELINE.md`

### Line Ending Issues (Linux Deployment)

**Problem**: When creating shell scripts on macOS and deploying to Linux servers, you may encounter:
```
bad interpreter: /bin/bash^M: no such file or directory
```

**Cause**: Scripts created on macOS use CRLF (Windows-style) line endings instead of LF (Unix-style).

**Solution**: Always fix line endings before deploying to Linux:

```bash
# On Mac, before scripts sync to server:
for file in *.sh; do
    tr -d '\r' < "$file" > "${file}.tmp"
    mv "${file}.tmp" "$file"
    chmod +x "$file"
done

# Or on Linux server, after syncing:
for file in *.sh; do
    tr -d '\r' < "$file" > "${file}.tmp"
    mv "${file}.tmp" "$file"
    chmod +x "$file"
done
```

**Prevention**:
- When creating new scripts on Mac, always run the fix command before syncing
- Or use `dos2unix` if installed: `brew install dos2unix` then `dos2unix script.sh`

**Scripts that need fixing**: Any `.sh` files created on macOS before syncing to server.

## Quick Start Commands

```bash
# Primary development mode (JSON storage - no database required)
npm start                        # or ./run.sh
npm run dev                      # nodemon auto-reload (alias: start:dev)

# Optional MySQL mode
npm run start:mysql
npm run start:mysql:dev

# Database operations
npm run db:init                  # Initialize MySQL database from schema
npm run db:migrate               # Migrate JSON data to MySQL

# Testing
node --test tests/               # Run all mjs unit tests (Node built-in runner)
node --test tests/podcast-script.test.mjs  # Run single test file
npm run test:smoke:json          # Smoke test JSON runtime
npm run test:models              # Python model comparison tests
npm run test:prompt              # Prompt comparison test

# Data utilities
npm run data:backup              # Back up all JSON data files
npm run data:restore             # Restore from backup
npm run data:normalize:dry       # Preview daily-file normalization
npm run data:normalize:apply     # Apply daily-file normalization
npm run check:assets             # Verify logo paths

# Weekly keywords / podcast one-shot ops
npm run weekly:keywords:once
npm run podcast:autogen:once
```

**Default Access**: http://localhost:3000
**Default Admin**: admin / admin123456 (configured via .env)

## Architecture Overview

### Backend Layout

The repository contains two backend implementations, but only one is the active mainline:

1. **server-json.js** - Thin JSON entrypoint
   - Loads env and delegates startup to `server/runtime.js`
   - This is the default target for `npm start`

2. **server/runtime.js** - Active JSON runtime assembly
   - Builds the Express app, mounts routes, initializes JSON-backed data files
   - Starts schedulers, cache maintenance, and the HTTP listener

3. **server-mysql.js** - Optional migration/runtime branch
   - Uses MySQL database with connection pooling
   - Not the default runtime in the current repo state

### Frontend Architecture

HTML pages and their owning JS entrypoints:

| Page | JS entrypoint |
|------|--------------|
| `index.html` - landing, keyword cloud, news, tool search | `frontend/index-page.js` |
| `news.html` - news detail | `frontend/bootstrap.js` + `frontend/modules/` |
| `tools.html` - AI tools directory | `frontend/tools-page.js` |
| `skills.html` - AI skills catalog | `frontend/skills-page.js` |
| `skill-detail.html` - individual skill | `frontend/skill-detail-page.js` |
| `mcp-detail.html` - MCP server detail | `frontend/mcp-detail-page.js` |
| `about.html` - about / contact | (inline) |
| `practice.html` - AI consulting practice | (inline) |
| `admin-login.html` | (inline) |
| `admin-analytics.html` - geographic analytics | (inline) |
| `admin-ipban.html` - IP ban management | (inline) |

- **frontend/modules/visit-tracker.js** - client-side visit tracking (new; loaded by index/news pages)
- **styles.css** - Global styles
- **api.js** - API client wrapper

### Data Storage

**JSON Mode** (`data/` directory):
- `admins.json` - Admin accounts with bcrypt password hashes
- `keywords.json` - Keyword cloud data (text, weight, size)
- `news.json` - Daily news items
- `weekly-news.json` - Weekly news summaries
- `tools.json` - AI tools directory
- `tool-categories.json` - Tool categories
- `visit-logs.json` - Visitor tracking with IP geolocation
- `api-calls.json` - API call audit log
- `banned-ips.json` - IP ban list (managed via `admin-ipban.html`)
- `settings.json` - System configuration
- `podcasts/news/` - Per-date podcast metadata and audio references

**MySQL Mode**: See `database/schema.sql` for complete table definitions

## Key API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login (returns JWT token valid 24h)

### Content Management
- `GET /api/keywords` - Get keywords for word cloud
- `GET /api/news` - Get daily news (supports ?limit=20)
- `GET /api/weekly-news` - Get weekly news (supports ?category=技术)
- `GET /api/tools` - Get AI tools (supports ?search=, ?category=)

### Analytics (Requires Auth)
- `POST /api/visit/track` - Track visitor with IP geolocation
- `GET /api/visit/province-stats` - Get visitor statistics by province
- `GET /api/visit/logs` - Get detailed visit logs

### Admin APIs (JWT Required)
All POST/PUT/DELETE operations require `Authorization: Bearer <token>` header

## Core Frontend Modules

News-page modules (loaded via `frontend/bootstrap.js`):
1. `frontend/modules/news-page-init.js` - bootstrap and wiring
2. `frontend/modules/core-news.js` - core news-page behavior
3. `frontend/modules/compat-globals.js` - exposes legacy `window` handlers still needed by HTML
4. `frontend/modules/timeline-view.js`, `articles-view.js`, `outline-view.js`, `stats-view.js` - view renderers
5. `frontend/modules/history-controller.js`, `filters-controller.js`, `keywords-controller.js` - controllers
6. `frontend/modules/state.js` - shared state; `api-client.js` - API calls; `news-service.js` - data layer

## Important Development Patterns

### Backend Routes Overview

All routes are in `server/routes/` and wired in `server/runtime.js`:

| Route file | Mount prefix | Notes |
|------------|-------------|-------|
| `auth.js` | `/api/auth` | Login, JWT |
| `keywords.js` | `/api/keywords` | Keyword cloud CRUD |
| `news.js` | `/api/news` | Daily news CRUD |
| `tools.js` | `/api/tools` | AI tools CRUD |
| `visit.js` | `/api/visit` | Visitor tracking + province stats |
| `security.js` | `/api/security` | IP ban management |
| `podcast.js` | `/api/podcast` | Podcast generation pipeline |
| `reports.js` | `/api/reports` | Daily report ingestion |
| `ai.js` | `/api/ai` | AI proxy (SiliconFlow) |
| `stats.js` | `/api/stats` | Site statistics |
| `archive.js` | `/api/archive` | News archive management |
| `maintenance.js` | `/api/maintenance` | Admin maintenance ops |
| `settings.js` | `/api/settings` | Site settings |
| `template.js` | `/api/template` | Content templates |

### Adding New API Endpoints

In the current JSON mainline:
1. Add route files under `server/routes/`
2. Add business logic under `server/services/` when needed
3. Wire new runtime dependencies in `server/runtime.js`

### Data File Operations

```javascript
// Read data
const data = readData(NEWS_FILE);

// Write data
writeData(NEWS_FILE, data);

// Generate unique ID
const id = Date.now();
```

### Authentication Middleware

```javascript
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}
```

## Environment Configuration

Critical `.env` variables:
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - REQUIRED for authentication
- `DEFAULT_ADMIN_USERNAME` / `DEFAULT_ADMIN_PASSWORD` - Initial admin account
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - MySQL configuration
- `SILICONFLOW_API_KEY` - For AI features

## Deployment

### Production Server
- **Host**: `8.135.37.159`
- **Path**: `/var/www/ai-coming-website`
- **User**: `root`
- **OS**: Linux

### Mutagen Real-time Sync

**Configuration**: `mutagen.yml`
```bash
# Start sync (when ready)
mutagen project start

# Check sync status
mutagen sync list

# Pause sync
mutagen project pause

# Resume sync
mutagen project resume

# Terminate sync
mutagen project terminate
```

**Excluded from sync** (see `mutagen.yml`):
- `node_modules/`, `package-lock.json`
- `.env`, `.env.local`
- `logs/`, `*.log`
- `.DS_Store`, macOS files
- Test files, backups

**Server Requirements**:
- SSH access with key-based authentication
- Node.js 22.22.0 (pinned in `package.json` `engines` field)
- Project directory created on server

## File Naming Conventions

- Server files: `server-*.js`
- Frontend pages: `*.html`
- Data files: `*.json` in `data/` directory
- Archives: `data/archive/daily/` and `data/archive/weekly/`
- Scripts: `scripts/*.js`

## Testing

**Unit tests** (Node.js built-in runner, ES modules):
```bash
node --test tests/                                    # run all
node --test tests/podcast-script.test.mjs            # run single file
```
Test files live in `tests/*.mjs` and cover podcast pipeline components (script generation, alignment, routing, autogen).

**Smoke / integration**:
```bash
npm run test:smoke:json     # verifies JSON runtime starts and basic routes respond
npm run podcast:audit:server  # audits server-side podcast state
```

**Model / prompt comparison**:
```bash
npm run test:models         # Python: test_model_comparison.py
npm run test:prompt         # Node: scripts/prompt-comparison-test.js
```

## Common Issues

**Port already in use**:
```bash
lsof -i :3000
kill -9 <PID>
```

**MySQL connection failed**: Use the JSON mainline explicitly with `npm start`

**Missing data files**: The JSON runtime in `server/runtime.js` automatically creates required JSON files on first run.

**Daily Report Sync**: The automated daily report sync system (`历史同步执行脚本（已删除）`) requires the HTML converter regex to match the actual HTML structure. If conversion fails with "未找到任何文章", check that `scripts/html-to-json-converter.js` regex pattern matches the HTML format (`<div class="article">` vs `<section style="margin-bottom: 30px">`).

## Architecture Highlights

1. **Stateless frontend**: All data loaded via API calls
2. **Automatic visit tracking**: Every page load triggers geolocation tracking
3. **Dual storage modes**: Seamless switching between JSON and MySQL
4. **JWT-based auth**: Token-based authentication for admin operations
5. **Archive system**: Auto-archiving of old news to separate files
6. **IP geolocation**: Uses Taobao IP API for province detection (visit tracking)

## Key Data Structures

**Keyword Object**:
```json
{
  "id": 1707123456789,
  "text": "人工智能",
  "weight": 5,
  "size": "large",
  "created_at": "2025-02-05T10:30:00.000Z"
}
```

**News Object**:
```json
{
  "id": "daily_1707123456789",
  "title": "News title",
  "summary": "Summary text",
  "country": "china",
  "importance_score": 8,
  "created_at": "2025-02-05T10:30:00.000Z"
}
```

**Visit Log Object**:
```json
{
  "id": 1707123456789,
  "ip": "123.45.67.89",
  "province": "广东省",
  "country": "中国",
  "date": "2025-02-05T10:30:00.000Z"
}
```
