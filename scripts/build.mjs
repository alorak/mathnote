import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const outdir = new URL('../dist/', import.meta.url);
const assetsDir = new URL('../dist/assets/', import.meta.url);
const templateUrl = new URL('../index.html', import.meta.url);
const publicDir = new URL('../public/', import.meta.url);
const serviceWorkerTemplateUrl = new URL('../src/sw.js', import.meta.url);
const entryPoint = fileURLToPath(new URL('../src/app.js', import.meta.url));

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

await build({
  entryPoints: { app: entryPoint },
  bundle: true,
  outdir: fileURLToPath(outdir),
  entryNames: 'assets/[name]-[hash]',
  assetNames: 'assets/[name]-[hash]',
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  minify: false,
  sourcemap: false,
  legalComments: 'none',
  loader: {
    '.woff2': 'file',
    '.woff': 'file',
    '.ttf': 'file'
  }
});

const emittedAssets = await readdir(assetsDir);
const jsBundles = emittedAssets.filter(name => /^app-[A-Z0-9]+\.js$/i.test(name));
const cssBundles = emittedAssets.filter(name => /^app-[A-Z0-9]+\.css$/i.test(name));

if (jsBundles.length !== 1 || cssBundles.length !== 1) {
  throw new Error(
    `Expected one hashed JS and CSS entry bundle, found JS=${jsBundles.length}, CSS=${cssBundles.length}.`
  );
}

const appJsPath = `./assets/${jsBundles[0]}`;
const appCssPath = `./assets/${cssBundles[0]}`;

await cp(publicDir, outdir, { recursive: true });

let html = await readFile(templateUrl, 'utf8');
html = html.replace(
  '<!-- MATHNOTE_BUILD_CSS -->',
  `<link rel="stylesheet" href="${appCssPath}">`
);
html = html.replace(
  '<!-- MATHNOTE_BUILD_JS -->',
  `<script defer src="${appJsPath}"></script>`
);

if (html.includes('MATHNOTE_BUILD_')) {
  throw new Error('Build markers were not fully replaced.');
}

await writeFile(new URL('../dist/index.html', import.meta.url), html, 'utf8');
await writeFile(new URL('../dist/.nojekyll', import.meta.url), '', 'utf8');

async function collectFiles(dirUrl, rootUrl = dirUrl) {
  const entries = await readdir(dirUrl, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const childUrl = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dirUrl);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(childUrl, rootUrl));
      continue;
    }

    if (entry.name === 'sw.js' || entry.name === '.nojekyll') continue;

    files.push({
      url: childUrl,
      path: './' + relative(
        fileURLToPath(rootUrl),
        fileURLToPath(childUrl)
      ).replaceAll('\\\\', '/')
    });
  }

  return files;
}

const precacheFiles = (await collectFiles(outdir)).sort((a, b) => a.path.localeCompare(b.path));
const hash = createHash('sha256');

for (const file of precacheFiles) {
  hash.update(file.path);
  hash.update(await readFile(file.url));
}

const cacheName = 'mathnote-' + hash.digest('hex').slice(0, 12);
let serviceWorker = await readFile(serviceWorkerTemplateUrl, 'utf8');
serviceWorker = serviceWorker
  .replace('__CACHE_NAME__', cacheName)
  .replace('__PRECACHE_ASSETS__', JSON.stringify(precacheFiles.map(file => file.path), null, 2));

await writeFile(new URL('../dist/sw.js', import.meta.url), serviceWorker, 'utf8');

console.log(
  `MathNote offline/PWA bundle written to dist/ using ${appJsPath}, ${appCssPath} and cache ${cacheName}.`
);
