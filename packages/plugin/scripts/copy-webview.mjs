/**
 * Copy webview assets (HTML, CSS, JS) to the dist folder.
 * This is run after TypeScript compilation to bundle the webview.
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, '..', 'src', 'webview');
const distDir = join(__dirname, '..', 'dist', 'webview');

// Ensure dist/webview directory exists
if (!existsSync(distDir)) {
  await mkdir(distDir, { recursive: true });
}

const files = ['index.html', 'index.css', 'index.js'];

for (const file of files) {
  const src = join(srcDir, file);
  const dest = join(distDir, file);
  if (existsSync(src)) {
    await copyFile(src, dest);
    console.log(`Copied ${file} -> dist/webview/`);
  } else {
    console.warn(`Warning: ${src} not found, skipping`);
  }
}

console.log('Webview assets copied to dist/webview/');
