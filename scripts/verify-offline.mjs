import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = new URL('../dist/', import.meta.url);
const required = ['index.html', 'app.js', 'app.css'];

for (const name of required) {
  await readFile(new URL(name, root));
}

const textExtensions = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt']);
const violations = [];
let fontCount = 0;

async function walk(dirUrl) {
  const entries = await readdir(dirUrl, { withFileTypes: true });
  for (const entry of entries) {
    const child = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dirUrl);
    if (entry.isDirectory()) {
      await walk(child);
      continue;
    }

    const ext = extname(entry.name).toLowerCase();
    if (['.woff2', '.woff', '.ttf'].includes(ext)) fontCount++;
    if (!textExtensions.has(ext)) continue;

    const content = await readFile(child, 'utf8');
    const checks = [
      [/(?:src|href)\s*=\s*["']https?:\/\//i, 'remote src/href'],
      [/@import\s+(?:url\()?\s*["']?https?:\/\//i, 'remote CSS import'],
      [/url\(\s*["']?https?:\/\//i, 'remote CSS url'],
      [/\b(?:fetch|importScripts)\s*\(\s*["'`]https?:\/\//i, 'remote runtime request'],
      [/new\s+(?:WebSocket|EventSource)\s*\(\s*["'`]https?:\/\//i, 'remote live connection'],
      [/\bfrom\s*["']https?:\/\//i, 'remote module import']
    ];

    for (const [pattern, label] of checks) {
      if (pattern.test(content)) violations.push(`${entry.name}: ${label}`);
    }
  }
}

await walk(root);

const html = await readFile(new URL('index.html', root), 'utf8');
for (const forbidden of ['cdn.jsdelivr.net', 'esm.sh', 'type="module"', 'type="importmap"']) {
  if (html.includes(forbidden)) violations.push(`index.html: contains ${forbidden}`);
}

if (fontCount === 0) {
  violations.push('KaTeX fonts were not emitted into dist/.');
}

if (violations.length) {
  console.error('Offline verification failed:');
  for (const item of violations) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Offline verification passed. ${fontCount} local font asset(s) found and no remote runtime dependency detected.`);
