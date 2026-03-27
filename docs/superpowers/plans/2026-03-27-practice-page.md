# Practice Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new `/practice.html` long-form marketing page for "AI 产品与企业转型咨询", wire it into site navigation, and present enterprise training photos as formal case evidence.

**Architecture:** Add one standalone static HTML page that follows the site's existing Tailwind/CDN + inline-style pattern, reuses the shared navigation conventions already present on `about.html`, and stores exported training images under a dedicated public asset directory. Keep the implementation focused on content, layout, navigation, and contact CTA without introducing new backend behavior.

**Tech Stack:** Static HTML, Tailwind CDN, Alpine.js CDN, existing site CSS, local image assets extracted from the provided `.docx`

---

## Chunk 1: Asset Preparation And File Map

### Task 1: Map touched files

**Files:**
- Create: `practice.html`
- Create: `pic/practice/` (exported training images)
- Modify: `index.html`
- Modify: `news.html`
- Modify: `tools.html`
- Modify: `skills.html`
- Modify: `skill-detail.html`
- Modify: `mcp-detail.html`
- Modify: `about.html`
- Modify: `README.md`

- [ ] **Step 1: Confirm the page name and URL in the existing spec**

Read: `docs/superpowers/specs/2026-03-27-ai-product-enterprise-enablement-page-design.md`
Expected: URL is `/practice.html` and nav label is `转型实践`

- [ ] **Step 2: Inspect current navigation patterns**

Read: `about.html`, `index.html`, `news.html`, `tools.html`, `skills.html`, `skill-detail.html`, `mcp-detail.html`
Expected: Existing pages use similar nav blocks that can be updated consistently

- [ ] **Step 3: Inventory extracted training images**

Run: `find /tmp/yuanshuo-training-docx/word/media -maxdepth 1 -type f | sort`
Expected: Multiple `jpeg/png` assets available for selection

## Chunk 2: Prepare Public Assets

### Task 2: Select and copy a minimal image set

**Files:**
- Create: `pic/practice/<selected-images>`

- [ ] **Step 1: Inspect image dimensions and choose 3-4 formal photos**

Run: `sips -g pixelWidth -g pixelHeight /tmp/yuanshuo-training-docx/word/media/*`
Expected: Identify landscape-oriented or crop-friendly images with formal training context

- [ ] **Step 2: Copy chosen images into a dedicated public folder**

Run: `mkdir -p pic/practice && cp ... pic/practice/`
Expected: `pic/practice/` contains only the selected assets for the practice page

- [ ] **Step 3: Use stable, descriptive filenames**

Example names:
- `enterprise-training-main.jpg`
- `public-sector-training.jpg`
- `ai-enablement-workshop.jpg`

Expected: Filenames are readable and suitable for long-term maintenance

## Chunk 3: Build The Page

### Task 3: Create `practice.html`

**Files:**
- Create: `practice.html`

- [ ] **Step 1: Start from the visual and structural conventions of `about.html`**

Reference:
- `about.html`

Expected: Reuse the site's premium typography, navigation treatment, spacing scale, and reveal patterns where appropriate

- [ ] **Step 2: Implement the long-form page sections from the approved spec**

Sections to include:
- Hero
- Core value summary
- AI product practice
- Product method breakdown
- Transition section
- Enterprise enablement overview
- Business scenario cards
- Enablement highlights
- Formal case section with photos
- Trust/backing section
- Collaboration models
- CTA/footer close

Expected: The page matches the approved "双主线实践页" structure

- [ ] **Step 3: Present enterprise photos as formal case evidence**

Expected:
- No photo wall
- No event recap layout
- At least one large case block plus supporting image cards

- [ ] **Step 4: Add clear CTA hooks**

Expected: CTA language focuses on enterprise enablement and business growth, not generic "about us" copy

## Chunk 4: Navigation Integration

### Task 4: Add the new page into the site nav

**Files:**
- Modify: `index.html`
- Modify: `news.html`
- Modify: `tools.html`
- Modify: `skills.html`
- Modify: `skill-detail.html`
- Modify: `mcp-detail.html`
- Modify: `about.html`

- [ ] **Step 1: Insert `转型实践` into desktop navigation**

Expected: New nav item links to `practice.html`

- [ ] **Step 2: Insert `转型实践` into mobile navigation**

Expected: Mobile menus stay consistent with desktop

- [ ] **Step 3: Mark the nav item active in `practice.html`**

Expected: Active state follows existing page conventions

## Chunk 5: Content And Documentation Updates

### Task 5: Update project docs minimally

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add the new public page to the user-facing page list**

Expected: `README.md` mentions `/practice.html`

- [ ] **Step 2: Keep documentation concise**

Expected: No broad doc refactor, only the new page entry needed for discoverability

## Chunk 6: Verification

### Task 6: Verify the page locally

**Files:**
- Test: `practice.html` and updated navigation pages

- [ ] **Step 1: Run a quick static/server smoke check**

Run: `npm start`
Expected: Server starts without syntax or asset path errors

- [ ] **Step 2: Open the page and confirm layout/content**

Check:
- `http://localhost:3000/practice.html`

Expected:
- Images load
- Navigation renders
- Sections appear in the right order
- CTA text is present

- [ ] **Step 3: Spot-check nav links on existing pages**

Check:
- `index.html`
- `news.html`
- `tools.html`
- `skills.html`
- `about.html`

Expected: `转型实践` appears consistently and links correctly

- [ ] **Step 4: Review final diff**

Run: `git diff --stat`
Expected: Changes are limited to the new page, its assets, nav updates, README, and planning docs

- [ ] **Step 5: Commit in a focused change set**

```bash
git add practice.html pic/practice README.md index.html news.html tools.html skills.html skill-detail.html mcp-detail.html about.html docs/superpowers/specs/2026-03-27-ai-product-enterprise-enablement-page-design.md docs/superpowers/plans/2026-03-27-practice-page.md
git commit -m "feat: add AI product and enterprise enablement practice page"
```

## Execution Notes

- Do not bundle unrelated workspace changes into the practice page commit.
- Treat existing modified files unrelated to this feature as out-of-scope unless they must be updated for nav consistency.
- If any training photo includes sensitive logos, audience faces, or restricted venue details, prefer a safer crop or choose a different image.

Plan complete and saved to `docs/superpowers/plans/2026-03-27-practice-page.md`. Ready to execute.
