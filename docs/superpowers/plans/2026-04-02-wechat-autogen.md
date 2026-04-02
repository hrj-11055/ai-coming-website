# WeChat Autogen Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a server-side WeChat draft automation that only processes the current Shanghai business date, converts the day's JSON report into polished Markdown, builds a podcast article from the day's ready podcast metadata, and uploads either or both to the WeChat Official Account draft box through the API.

**Architecture:** Keep the WeChat workflow parallel to the existing podcast autogen pattern. Add focused services for content generation and API publishing, then orchestrate them with a `run-wechat-autogen-once.js` script that scans only the current date, computes per-content fingerprints, records state, and skips missing or stale inputs without ever falling back to older dates.

**Tech Stack:** Node.js 22, CommonJS server/services, `node:test`, `node:assert/strict`, cron shell wrappers, existing `.env` configuration pattern, built-in `fetch`.

---

## Chunk 1: Content Builders

### Task 1: Add failing tests for current-date article builders

**Files:**
- Create: `tests/wechat-content.test.mjs`
- Reference: `docs/superpowers/specs/2026-04-02-wechat-autogen-design.md`

- [ ] **Step 1: Write the failing test for report JSON -> Markdown title and sections**

```js
test('buildNewsMarkdown renders fixed title and structured sections for today report json', () => {
    const markdown = buildNewsMarkdown({
        date: '2026-04-02',
        report: {
            report_title: '全球AI日报 | 2026-04-02',
            articles: [
                {
                    title: 'OpenAI launches new agent tooling',
                    source_name: 'TechCrunch',
                    category: 'Agents',
                    importance_score: 5,
                    key_point: 'Teams can orchestrate more workflows.',
                    summary: 'Developers can now ship more reliable agent products.',
                    source_url: 'https://example.com/a'
                }
            ]
        }
    });

    assert.match(markdown, /^# 04月02日AI资讯早报/m);
    assert.match(markdown, /## 今日看点/);
    assert.match(markdown, /## 1\\. OpenAI launches new agent tooling/);
    assert.match(markdown, /- 来源：TechCrunch/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/wechat-content.test.mjs`
Expected: FAIL because `server/services/wechat-content.js` does not exist yet.

- [ ] **Step 3: Write the failing test for podcast metadata -> Markdown output**

```js
test('buildPodcastMarkdown renders fixed title, podcast marker, summary, wechat copy, and audio link', () => {
    const markdown = buildPodcastMarkdown({
        date: '2026-04-02',
        metadata: {
            status: 'ready',
            summary: '今天整理 12 条 AI 快讯。',
            script_markdown: '## 开场钩子\n今天我们来看三件大事。',
            wechat_copy: '转发文案',
            audio_url: '/api/podcast/news/2026-04-02/audio'
        },
        siteBaseUrl: 'https://ai-coming.example.com'
    });

    assert.match(markdown, /^# 04月02日AI资讯早报/m);
    assert.match(markdown, /播客版/);
    assert.match(markdown, /今天整理 12 条 AI 快讯。/);
    assert.match(markdown, /转发文案/);
    assert.match(markdown, /https:\\/\\/ai-coming\\.example\\.com\\/api\\/podcast\\/news\\/2026-04-02\\/audio/);
});
```

- [ ] **Step 4: Run the test to verify it fails for the expected reason**

Run: `node --test tests/wechat-content.test.mjs`
Expected: FAIL because content builder exports are still missing.

- [ ] **Step 5: Implement the minimal content builder service**

**Files:**
- Create: `server/services/wechat-content.js`

Implementation scope:
- Export `formatWechatTitle(date)`
- Export `buildNewsMarkdown({ date, report })`
- Export `buildPodcastMarkdown({ date, metadata, siteBaseUrl })`
- Keep logic focused on formatting only
- Do not add file I/O in this module

- [ ] **Step 6: Run the content builder test to verify it passes**

Run: `node --test tests/wechat-content.test.mjs`
Expected: PASS.

### Task 2: Add failing tests for digest and fingerprint helpers

**Files:**
- Modify: `tests/wechat-content.test.mjs`
- Modify: `server/services/wechat-content.js`

- [ ] **Step 1: Write the failing test for digest truncation and fixed-date title formatting**

```js
test('buildNewsDigest truncates long text and formatWechatTitle keeps mm月dd日 format', () => {
    assert.equal(formatWechatTitle('2026-11-09'), '11月09日AI资讯早报');
    const digest = buildWechatDigest('这是一段很长的摘要'.repeat(30));
    assert.ok(digest.length <= 120);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/wechat-content.test.mjs`
Expected: FAIL because helper exports are missing.

- [ ] **Step 3: Implement minimal helpers**

Implementation scope:
- Export `buildWechatDigest(text)`
- Keep truncation deterministic and suitable for WeChat digest length

- [ ] **Step 4: Re-run the test to verify it passes**

Run: `node --test tests/wechat-content.test.mjs`
Expected: PASS.

## Chunk 2: Publisher Service

### Task 3: Add failing publisher tests with fetch stubs

**Files:**
- Create: `tests/wechat-publisher.test.mjs`

- [ ] **Step 1: Write the failing test for access token retrieval**

```js
test('fetchAccessToken returns token from wechat api response', async () => {
    const fetchCalls = [];
    const token = await fetchAccessToken({
        appId: 'id',
        appSecret: 'secret',
        fetchImpl: async (url) => {
            fetchCalls.push(url);
            return {
                ok: true,
                json: async () => ({ access_token: 'token-123' })
            };
        }
    });

    assert.equal(token, 'token-123');
    assert.equal(fetchCalls.length, 1);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/wechat-publisher.test.mjs`
Expected: FAIL because `server/services/wechat-publisher.js` does not exist yet.

- [ ] **Step 3: Add failing test for draft payload creation**

```js
test('publishDraft sends fixed title and thumb media id to draft add api', async () => {
    let requestBody = null;

    const result = await publishDraft({
        accessToken: 'token-123',
        article: {
            title: '04月02日AI资讯早报',
            author: 'AIcoming',
            digest: '摘要',
            content: '<p>日报版</p>',
            thumbMediaId: 'thumb-1'
        },
        fetchImpl: async (_url, options) => {
            requestBody = JSON.parse(options.body);
            return {
                ok: true,
                json: async () => ({ media_id: 'draft-1' })
            };
        }
    });

    assert.equal(result.media_id, 'draft-1');
    assert.equal(requestBody.articles[0].title, '04月02日AI资讯早报');
    assert.equal(requestBody.articles[0].thumb_media_id, 'thumb-1');
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `node --test tests/wechat-publisher.test.mjs`
Expected: FAIL because publisher exports are missing.

- [ ] **Step 5: Implement the minimal publisher service**

**Files:**
- Create: `server/services/wechat-publisher.js`

Implementation scope:
- Export `fetchAccessToken`
- Export `uploadImage`
- Export `publishDraft`
- Export a small `createWechatPublisher` wrapper
- Read config from injected args or process env, but keep functions testable

- [ ] **Step 6: Run publisher tests to verify they pass**

Run: `node --test tests/wechat-publisher.test.mjs`
Expected: PASS.

## Chunk 3: Automation Script

### Task 4: Add failing orchestration tests for current-date-only behavior

**Files:**
- Create: `tests/wechat-autogen.test.mjs`

- [ ] **Step 1: Write the failing test for skipping when today report JSON is missing**

```js
test('runWechatAutogenOnce skips report upload when today report json is missing', async () => {
    const result = await runWechatAutogenOnce({
        now: new Date('2026-04-02T02:00:00.000Z'),
        reportDir: '/tmp/empty-report-dir',
        podcastMetadataDir: '/tmp/empty-podcast-dir',
        stateFile: '/tmp/wechat-state.json',
        publisher: { publishMarkdownDraft: async () => { throw new Error('should not run'); } }
    });

    assert.equal(result.date, '2026-04-02');
    assert.equal(result.report.action, 'skip');
    assert.equal(result.report.reason, 'report_missing_today');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/wechat-autogen.test.mjs`
Expected: FAIL because `scripts/run-wechat-autogen-once.js` does not exist yet.

- [ ] **Step 3: Add failing test for podcast ready upload and no old-date fallback**

```js
test('runWechatAutogenOnce uploads only todays ready podcast and never falls back to older metadata', async () => {
    const calls = [];
    const result = await runWechatAutogenOnce({
        now: new Date('2026-04-02T02:00:00.000Z'),
        reportDir: '/tmp/report-dir',
        podcastMetadataDir: '/tmp/podcast-dir',
        stateFile: '/tmp/wechat-state.json',
        publisher: {
            publishMarkdownDraft: async (payload) => {
                calls.push(payload.kind);
                return { mediaId: `${payload.kind}-draft` };
            }
        }
    });

    assert.deepEqual(calls, ['podcast']);
    assert.equal(result.podcast.action, 'uploaded');
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `node --test tests/wechat-autogen.test.mjs`
Expected: FAIL because orchestration logic is not implemented.

- [ ] **Step 5: Implement the minimal automation script**

**Files:**
- Create: `scripts/run-wechat-autogen-once.js`

Implementation scope:
- Mirror podcast autogen structure and exports
- Compute Shanghai date
- Scan only the current date
- Build news markdown if today's JSON exists
- Build podcast markdown only if today's metadata exists and `status === 'ready'`
- Compute per-kind fingerprints
- Record state in `data/wechat-autogen-state.json`
- Inject publisher for tests

- [ ] **Step 6: Run orchestration tests to verify they pass**

Run: `node --test tests/wechat-autogen.test.mjs`
Expected: PASS.

### Task 5: Add shell wrappers and environment wiring

**Files:**
- Create: `scripts/run-wechat-autogen-once.sh`
- Create: `scripts/setup-wechat-autogen-cron.sh`
- Modify: `package.json`
- Modify: `.env.example`

- [ ] **Step 1: Write the failing test or assertion for env mapping helper if needed**

If config logic is extracted to a helper module, add a small test in `tests/wechat-autogen.test.mjs` for default env parsing.

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `node --test tests/wechat-autogen.test.mjs`
Expected: FAIL only if new helper coverage was added.

- [ ] **Step 3: Add minimal shell and package wiring**

Implementation scope:
- Add npm scripts:
  - `wechat:autogen:once`
  - `wechat:autogen:once:linux`
  - `wechat:autogen:cron:install`
- Add `.env.example` entries for:
  - `WECHAT_APP_ID`
  - `WECHAT_APP_SECRET`
  - `WECHAT_AUTOGEN_TIMEZONE`
  - `WECHAT_AUTOGEN_START_HOUR`
  - `WECHAT_AUTOGEN_START_MINUTE`
  - `WECHAT_AUTOGEN_STATE_FILE`
  - `WECHAT_AUTOGEN_REPORT_DIR`
  - `WECHAT_AUTOGEN_STAGING_DIR`
  - `WECHAT_AUTOGEN_DEFAULT_AUTHOR`
  - `WECHAT_AUTOGEN_DEFAULT_COVER_IMAGE`
  - `WECHAT_AUTOGEN_SITE_BASE_URL`
  - `WECHAT_AUTOGEN_ENABLED_TYPES`

- [ ] **Step 4: Re-run the targeted tests**

Run: `node --test tests/wechat-autogen.test.mjs`
Expected: PASS.

## Chunk 4: Documentation and Regression Verification

### Task 6: Update docs for operators

**Files:**
- Modify: `README.md`
- Modify: `docs/PRODUCT.md`
- Create or Modify: `docs/WECHAT_AUTOGEN.md` (only if the flow needs its own operator doc; otherwise keep docs minimal)

- [ ] **Step 1: Add the failing doc-oriented assertion only if an existing doc test covers automation scripts**

If no doc tests exist, skip creating artificial tests.

- [ ] **Step 2: Update docs minimally**

Document:
- current-date-only behavior
- required env vars
- cover image requirement
- report JSON source
- WeChat draft-box target

- [ ] **Step 3: Run the targeted automated tests**

Run: `node --test tests/wechat-content.test.mjs tests/wechat-publisher.test.mjs tests/wechat-autogen.test.mjs`
Expected: PASS.

### Task 7: Full verification pass before completion

**Files:**
- Modify: any touched files from prior tasks

- [ ] **Step 1: Run all new targeted tests together**

Run: `node --test tests/wechat-content.test.mjs tests/wechat-publisher.test.mjs tests/wechat-autogen.test.mjs`
Expected: PASS.

- [ ] **Step 2: Run broader regression checks relevant to this repo**

Run: `node --test tests/*.test.mjs`
Expected: PASS or surface unrelated baseline failures explicitly.

- [ ] **Step 3: Run JSON runtime smoke test**

Run: `npm run test:smoke:json`
Expected: PASS, or document unrelated pre-existing failures if any.

- [ ] **Step 4: Review the diff for requirements coverage**

Check:
- no old-date fallback
- report JSON -> Markdown staging exists
- podcast and markdown are independently published
- title format is fixed to `MM月DD日AI资讯早报`
- WeChat draft upload uses cover image and API

- [ ] **Step 5: Commit in focused slices**

Suggested commit sequence:
- `feat(wechat): add content builders for daily report and podcast drafts`
- `feat(wechat): add wechat publisher and autogen script`
- `docs(wechat): document draft automation configuration`

## Notes For Execution

- Follow TDD strictly: no production code before the failing test is observed.
- Keep WeChat credentials out of logs and out of committed files.
- Do not assume old report or podcast files are acceptable substitutes.
- Prefer focused helpers over one large automation file.

Plan complete and saved to `docs/superpowers/plans/2026-04-02-wechat-autogen.md`. Because the spec is already approved, execution should proceed immediately in this session using the plan.
