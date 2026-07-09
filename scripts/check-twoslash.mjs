#!/usr/bin/env node
/**
 * Guards the committed twoslash inline caches in docs/src/pages.
 *
 * vocs.config.ts sets `twoslash: { throws: false, inlineCache: true }`. A cache
 * miss therefore does NOT fail the build — the snippet just renders without
 * annotations. Nothing else in the repo notices. This script is the gate.
 *
 * For each ```<lang> twoslash fence carrying a `// @twoslash-cache:` comment we
 * recompute the hash the same way vocs does and compare:
 *
 *   inline-cache.ts:224  strips the cache-comment line before hashing
 *   inline-cache.ts:122  cacheHash = sha256(`${lang}:${code}`)
 *
 * The hash covers only lang + code, never the file path, so a fence may be moved
 * verbatim between pages and stay valid. Editing a single byte inside the fence
 * invalidates it and must be followed by a docs rebuild.
 */

import crypto from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const PAGES_DIR = path.resolve(import.meta.dirname, '../docs/src/pages');

// Matches vocs' CODE_INLINE_CACHE_REGEX: the comment owns its whole line,
// trailing newline included.
const CACHE_COMMENT = /^[ \t]*\/\/ @twoslash-cache: (.*)\r?\n/m;

function cacheHash(code, lang) {
  return crypto
    .createHash('sha256')
    .update(`${lang ?? ''}:${code}`)
    .digest('hex');
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith('.mdx')) yield full;
  }
}

/** Fenced blocks whose info string contains `twoslash`, with 1-based line numbers. */
function* fences(source) {
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const open = /^```(\S+)([^\n]*)$/.exec(lines[i]);
    if (!open || !open[2].includes('twoslash')) continue;
    const close = lines.indexOf('```', i + 1);
    if (close === -1) continue;
    yield { lang: open[1], line: i + 1, body: lines.slice(i + 1, close).join('\n') };
    i = close;
  }
}

let checked = 0;
const failures = [];

for await (const file of walk(PAGES_DIR)) {
  const source = await readFile(file, 'utf8');
  const rel = path.relative(process.cwd(), file);

  for (const fence of fences(source)) {
    const where = `${rel}:${fence.line}`;
    const match = CACHE_COMMENT.exec(`${fence.body}\n`);

    if (!match) {
      failures.push(`${where}  twoslash fence has no @twoslash-cache comment`);
      continue;
    }

    // vocs hashes the fence body with the cache-comment line removed.
    const code = `${fence.body}\n`.replace(CACHE_COMMENT, '').replace(/\n$/, '');
    const actual = cacheHash(code, fence.lang);

    let payload;
    try {
      payload = JSON.parse(match[1]);
    } catch {
      failures.push(`${where}  cache comment is not valid JSON`);
      continue;
    }

    checked++;
    if (payload.hash !== actual) {
      failures.push(
        `${where}  hash mismatch\n    stored   ${payload.hash}\n    computed ${actual}\n` +
          `    → the fence was edited. Rebuild docs to regenerate its cache.`
      );
    }
    if (typeof payload.data !== 'string' || payload.data.length === 0) {
      failures.push(`${where}  cache payload has no data`);
    }
  }
}

if (failures.length > 0) {
  console.error(`✗ twoslash cache check failed (${checked} fences checked)\n`);
  for (const failure of failures) console.error(`  ${failure}\n`);
  process.exit(1);
}

console.log(`✓ twoslash cache check passed — ${checked} fences verified`);
