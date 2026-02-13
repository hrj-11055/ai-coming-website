# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI News Management System (AI资讯管理系统) - an enterprise-level content management platform for AI news, tools, and keyword clouds. The system supports both JSON file storage (development) and MySQL database (production) modes.

**Current Version**: 2.0.0

**Tech Stack**: Node.js + Express + vanilla JavaScript (ES6+) + MySQL/JSON storage

## Important Notes

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

**Scripts that need fixing**:
- `sync-reports-to-website.sh`
- `setup-report-sync.sh`
- `sync-setup.sh`
- `test-sync.sh`
- Any other `.sh` files

## Quick Start Commands

```bash
# Primary development mode (JSON storage - no database required)
npm run start:legacy        # or ./run.sh
npm run start:dev           # Development with nodemon auto-reload

# Production mode (MySQL required)
npm start                   # Uses server-mysql.js
npm run start:prod          # Production environment

# Database operations
npm run db:init            # Initialize MySQL database from schema
npm run db:migrate         # Migrate JSON data to MySQL

# Testing
npm run test:models        # Run model comparison tests
```

**Default Access**: http://localhost:3000
**Default Admin**: admin / admin123456 (configured via .env)

## Architecture Overview

### Dual-Mode Backend System

The system supports two backend implementations:

1. **server-json.js** (2022 lines) - Primary development server
   - Uses JSON files in `data/` directory for storage
   - No database setup required
   - Auto-initializes all data files on first run
   - Primary server for development and quick testing

2. **server-mysql.js** (538 lines) - Production server
   - Uses MySQL database with connection pooling
   - Better performance for production
   - Requires database initialization via `database/schema.sql`

### Frontend Architecture

- **index.html** (37KB) - Main landing page with keyword cloud, news feeds, and tool search
- **news.html** (16KB) - News detail page
- **admin-login.html** (11KB) - Admin authentication
- **admin-analytics.html** (20KB) - Geographic analytics dashboard
- **main.js** (1500 lines) - Core frontend logic
- **styles.css** (12KB) - Global styles
- **api.js** (309 lines) - API client wrapper

### Data Storage

**JSON Mode** (`data/` directory):
- `admins.json` - Admin accounts with bcrypt password hashes
- `keywords.json` - Keyword cloud data (text, weight, size)
- `news.json` - Daily news items
- `weekly-news.json` - Weekly news summaries
- `tools.json` - AI tools directory
- `tool-categories.json` - Tool categories
- `visit-logs.json` - Visitor tracking with IP geolocation
- `settings.json` - System configuration

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

## Core Frontend Modules (main.js)

1. **Visit Tracking** (lines 1-25): Auto-tracks visitors on page load via `trackVisit()`
2. **Keyword Management** (lines 50-200): Initializes and renders dynamic word cloud
3. **News Loading** (lines 250-450): Loads and filters daily/weekly news
4. **Tool Search** (lines 750-950): AI tools search and filtering

## Important Development Patterns

### Adding New API Endpoints

In `server-json.js`:
1. Add route: `app.get('/api/new-endpoint', (req, res) => { ... })`
2. For protected routes, add `authenticateToken` middleware before the handler
3. Use `readData(filename)` and `writeData(filename, data)` helpers for JSON operations

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

**Mutagen Real-time Sync** (Recommended for Development):
```bash
# Setup Mutagen synchronization with cloud server
./sync-setup.sh
```

This will:
- Configure bidirectional sync between local and cloud server
- Automatically sync code changes to server
- Exclude node_modules, logs, and temporary files

**Server Requirements**:
- SSH access with key-based authentication
- Node.js 18+ installed on server
- Project directory created on server

## File Naming Conventions

- Server files: `server-*.js`
- Frontend pages: `*.html`
- Data files: `*.json` in `data/` directory
- Archives: `data/archive/daily/` and `data/archive/weekly/`
- Scripts: `scripts/*.js`

## Testing

Python-based model comparison testing:
```bash
npm run test:models
# Runs test_model_comparison.py to compare AI model responses
```

## Common Issues

**Port already in use**:
```bash
lsof -i :3000
kill -9 <PID>
```

**MySQL connection failed**: System will automatically fall back to JSON mode if MySQL is unavailable, or explicitly use `npm run start:legacy`

**Missing data files**: The `initDataFiles()` function in server-json.js automatically creates all required JSON files with proper structure on first run.

**Daily Report Sync**: The automated daily report sync system (`sync-reports-to-website.sh`) requires the HTML converter regex to match the actual HTML structure. If conversion fails with "未找到任何文章", check that `scripts/html-to-json-converter.js` regex pattern matches the HTML format (`<div class="article">` vs `<section style="margin-bottom: 30px">`).

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
