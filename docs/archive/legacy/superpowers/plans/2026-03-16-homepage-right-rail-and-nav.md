# Homepage Right Rail And Nav Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the homepage onboarding card into the right rail above the examples card, while keeping the main prompt area in place and aligning the homepage top navigation with the shared style used on the news and tools pages.

**Architecture:** Keep the homepage as a single static HTML entrypoint and make a focused layout change inside `index.html`. Introduce a right-rail wrapper for the two side cards, switch the homepage nav markup to the shared `nav-container` pattern, and protect the intended structure with a lightweight Node test that inspects the homepage HTML.

**Tech Stack:** Static HTML, CSS, Node.js built-in test runner

---

## Chunk 1: Layout Guardrail

### Task 1: Add a failing homepage structure test

**Files:**
- Create: `tests/index-layout.test.mjs`
- Test: `tests/index-layout.test.mjs`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run `node --test tests/index-layout.test.mjs` and confirm it fails for the current homepage structure**
- [ ] **Step 3: Keep the assertions focused on the right-rail wrapper order and shared nav container**

## Chunk 2: Homepage Layout Update

### Task 2: Move onboarding into the right rail above examples

**Files:**
- Modify: `index.html`
- Test: `tests/index-layout.test.mjs`

- [ ] **Step 1: Add a right-rail wrapper that contains onboarding first and examples second**
- [ ] **Step 2: Update desktop and mobile CSS so the main search area stays centered and the right rail stacks below on smaller screens**
- [ ] **Step 3: Keep the existing card visuals as intact as possible**

### Task 3: Align homepage nav with the shared nav style

**Files:**
- Modify: `index.html`
- Reference: `news.html`
- Reference: `tools.html`
- Test: `tests/index-layout.test.mjs`

- [ ] **Step 1: Replace the homepage-only top-right nav block with the shared `nav-container` structure**
- [ ] **Step 2: Reuse matching nav classes and active-state treatment for the homepage**
- [ ] **Step 3: Preserve homepage spacing so the hero area does not shift unexpectedly**

## Chunk 3: Verification

### Task 4: Verify structure and inspect diff

**Files:**
- Modify: `index.html`
- Test: `tests/index-layout.test.mjs`

- [ ] **Step 1: Run `node --test tests/index-layout.test.mjs` and confirm it passes**
- [ ] **Step 2: Review `git diff -- index.html tests/index-layout.test.mjs` for unintended changes**
