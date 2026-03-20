# Homepage Footer And Hero Offset Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pin the homepage filing text to the viewport bottom and move the homepage hero prompt area upward by 30px.

**Architecture:** Make a focused homepage-only CSS update inside `index.html`, and keep a lightweight HTML structure test to lock the intended layout markers and desktop offsets.

**Tech Stack:** Static HTML, CSS, Node.js built-in test runner

---

## Chunk 1: Guardrails

### Task 1: Extend the homepage structure test

**Files:**
- Modify: `tests/index-layout.test.mjs`

- [ ] **Step 1: Add a failing assertion for the fixed minimal footer**
- [ ] **Step 2: Add a failing assertion for the updated hero top offset**
- [ ] **Step 3: Run `node --test tests/index-layout.test.mjs` and confirm failure before implementation**

## Chunk 2: Homepage CSS Update

### Task 2: Pin the footer to the viewport bottom

**Files:**
- Modify: `index.html`
- Test: `tests/index-layout.test.mjs`

- [ ] **Step 1: Add homepage-only fixed footer rules**
- [ ] **Step 2: Keep the备案文字 shallow and unobtrusive**
- [ ] **Step 3: Add enough bottom breathing room for the page**

### Task 3: Move the hero prompt area upward

**Files:**
- Modify: `index.html`
- Test: `tests/index-layout.test.mjs`

- [ ] **Step 1: Reduce the hero wrapper top spacing by 30px**
- [ ] **Step 2: Preserve the internal spacing between the prompt badge and input box**

## Chunk 3: Verification And Sync

### Task 4: Verify and deploy

**Files:**
- Modify: `index.html`
- Test: `tests/index-layout.test.mjs`

- [ ] **Step 1: Run `node --test tests/index-layout.test.mjs` and confirm all checks pass**
- [ ] **Step 2: Upload `index.html` to the server**
- [ ] **Step 3: Verify the server file and live homepage markup contain the new footer and hero offset markers**
