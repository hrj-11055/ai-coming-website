#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SCAN_EXT = new Set([".js", ".html", ".css"]);

function walkFiles(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") {
      continue;
    }
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(abs, out);
      continue;
    }
    if (SCAN_EXT.has(path.extname(entry.name).toLowerCase())) {
      out.push(abs);
    }
  }
}

function collectLogoRefs(files) {
  const refs = new Map();
  const pattern = /["'](\/logos\/[^"'\s)]+)["']/g;
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(pattern)) {
      const ref = match[1];
      if (!refs.has(ref)) {
        refs.set(ref, []);
      }
      refs.get(ref).push(path.relative(ROOT, file));
    }
  }
  return refs;
}

function checkPathCaseSensitive(refPath) {
  const parts = refPath.replace(/^\//, "").split("/");
  let current = ROOT;
  for (const part of parts) {
    if (!fs.existsSync(current) || !fs.statSync(current).isDirectory()) {
      return { ok: false, type: "parent-missing", refPart: part };
    }
    const entries = fs.readdirSync(current);
    if (entries.includes(part)) {
      current = path.join(current, part);
      continue;
    }
    const caseInsensitive = entries.find(
      (name) => name.toLowerCase() === part.toLowerCase()
    );
    if (caseInsensitive) {
      return {
        ok: false,
        type: "case-mismatch",
        refPart: part,
        actualPart: caseInsensitive,
      };
    }
    return { ok: false, type: "missing", refPart: part };
  }
  return { ok: true };
}

function hasNonAscii(text) {
  return /[^\x00-\x7F]/.test(text);
}

function main() {
  const files = [];
  walkFiles(ROOT, files);
  const logoRefs = collectLogoRefs(files);

  const failures = [];
  for (const [ref, atFiles] of logoRefs.entries()) {
    const checked = checkPathCaseSensitive(ref);
    if (!checked.ok) {
      failures.push({ ref, atFiles, ...checked });
    }
  }

  // Only check naming quality for referenced logo assets.
  const namingWarnings = [];
  for (const ref of logoRefs.keys()) {
    const rel = ref.replace(/^\//, "");
    const base = path.basename(rel);
    const nfcBase = base.normalize("NFC");

    if (hasNonAscii(base)) {
      namingWarnings.push({ type: "non-ascii", file: rel });
    }
    if (/\s/.test(base)) {
      namingWarnings.push({ type: "space", file: rel });
    }
    if (/[A-Z]/.test(base)) {
      namingWarnings.push({ type: "uppercase", file: rel });
    }
    if (base !== nfcBase) {
      namingWarnings.push({ type: "non-nfc", file: rel });
    }
  }

  console.log(`Scanned files: ${files.length}`);
  console.log(`Logo refs: ${logoRefs.size}`);
  console.log(`Case/missing failures: ${failures.length}`);

  if (failures.length) {
    for (const item of failures) {
      const where = item.atFiles.slice(0, 3).join(", ");
      if (item.type === "case-mismatch") {
        console.log(
          `  [CASE] ${item.ref} :: "${item.refPart}" should be "${item.actualPart}" (at: ${where})`
        );
      } else {
        console.log(`  [MISS] ${item.ref} (at: ${where})`);
      }
    }
  }

  const groupedWarnings = {
    "non-ascii": [],
    space: [],
    uppercase: [],
    "non-nfc": [],
  };
  for (const warning of namingWarnings) {
    groupedWarnings[warning.type].push(warning.file);
  }

  console.log(`Naming warnings: ${namingWarnings.length}`);
  if (groupedWarnings["non-ascii"].length) {
    console.log(
      `  [WARN] Non-ASCII filenames: ${groupedWarnings["non-ascii"].length}`
    );
  }
  if (groupedWarnings.space.length) {
    console.log(`  [WARN] Filenames with spaces: ${groupedWarnings.space.length}`);
  }
  if (groupedWarnings.uppercase.length) {
    console.log(`  [WARN] Filenames with uppercase: ${groupedWarnings.uppercase.length}`);
  }
  if (groupedWarnings["non-nfc"].length) {
    console.log(
      `  [WARN] Non-NFC filenames: ${groupedWarnings["non-nfc"].length}`
    );
  }

  if (failures.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log("Asset path check passed.");
}

main();
