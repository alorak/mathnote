import { build } from 'esbuild';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const outdir = new URL('../dist/', import.meta.url);
const templateUrl = new URL('../index.html', import.meta.url);

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

await build({
  entryPoints: [new URL('../src/app.js', import.meta.url).pathname],
  bundle: true,
  outfile: new URL('../dist/app.js', import.meta.url).pathname,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  minify: false,
  sourcemap: false,
  legalComments: 'none',
  assetNames: 'assets/[name]-[hash]',
  loader: {
    '.woff2': 'file',
    '.woff': 'file',
    '.ttf': 'file'
  }
});

let html = await readFile(templateUrl, 'utf8');
html = html.replace(
  '<!-- MATHNOTE_BUILD_CSS -->',
  '<link rel="stylesheet" href="./app.css">'
);
html = html.replace(
  '<!-- MATHNOTE_BUILD_JS -->',
  '<script defer src="./app.js"><\/script>'
);

if (html.includes('MATHNOTE_BUILD_')) {
  throw new Error('Build markers were not fully replaced.');
}

await writeFile(new URL('../dist/index.html', import.meta.url), html, 'utf8');
console.log('MathNote offline bundle written to dist/.');
