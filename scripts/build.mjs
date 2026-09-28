import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const outdir = new URL('../dist/', import.meta.url);
const assetsDir = new URL('../dist/assets/', import.meta.url);
const templateUrl = new URL('../index.html', import.meta.url);
const publicDir = new URL('../public/', import.meta.url);
const serviceWorkerTemplateUrl = new URL('../src/sw.js', import.meta.url);
const entryPoint = fileURLToPath(new URL('../src/app.js', import.meta.url));

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
let crcTable = null;

function crc32(buffer) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let value = n;
      for (let k = 0; k < 8; k++) {
        value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
      }
      crcTable[n] = value >>> 0;
    }
  }

  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));

  return Buffer.concat([length, typeBytes, data, crc]);
}

function createAppIcon(size) {
  const rowSize = 1 + size * 4;
  const pixels = Buffer.alloc(rowSize * size);
  const pad = Math.floor(size / 8);
  const stroke = Math.max(4, Math.floor(size / 24));

  const isSigmaPixel = (x, y) => {
    const top = Math.floor(size * 0.29);
    const bottom = Math.floor(size * 0.71);
    const left = Math.floor(size * 0.31);
    const right = Math.floor(size * 0.69);
    const mid = Math.floor(size * 0.50);

    if (Math.abs(y - top) <= stroke && x >= left && x <= right) return true;
    if (Math.abs(y - bottom) <= stroke && x >= left && x <= right) return true;

    const upperProgress = (y - top) / Math.max(1, mid - top);
    const lowerProgress = (bottom - y) / Math.max(1, bottom - mid);

    if (y >= top && y <= mid) {
      const lineX = Math.round(left + upperProgress * (mid - left));
      if (Math.abs(x - lineX) <= stroke) return true;
    }
    if (y > mid && y <= bottom) {
      const lineX = Math.round(left + lowerProgress * (mid - left));
      if (Math.abs(x - lineX) <= stroke) return true;
    }
    return false;
  };

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowSize;
    pixels[rowOffset] = 0;

    for (let x = 0; x < size; x++) {
      const offset = rowOffset + 1 + x * 4;
      const insideCard = x >= pad && x < size - pad && y >= pad && y < size - pad;
      const sigma = insideCard && isSigmaPixel(x, y);
      const color = sigma || !insideCard
        ? [25, 113, 194, 255]
        : [255, 255, 255, 255];

      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = color[3];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(pixels, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

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

const iconsDir = new URL('../dist/icons/', import.meta.url);
await mkdir(iconsDir, { recursive: true });
await writeFile(new URL('icon-192.png', iconsDir), createAppIcon(192));
await writeFile(new URL('icon-512.png', iconsDir), createAppIcon(512));

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
