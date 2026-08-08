import { copyFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const manifestSrc = path.join(root, 'manifest.json');
const backgroundSrc = path.join(root, 'backgroud.js');
const manifestDest = path.join(distDir, 'manifest.json');
const backgroundDest = path.join(distDir, 'background.js');

if (!existsSync(distDir)) {
  throw new Error('dist folder not found. Run vite build before preparing extension package.');
}

if (!existsSync(manifestSrc)) {
  throw new Error('manifest.json not found at project root.');
}

if (!existsSync(backgroundSrc)) {
  throw new Error('backgroud.js not found at project root.');
}

mkdirSync(distDir, { recursive: true });
copyFileSync(manifestSrc, manifestDest);
copyFileSync(backgroundSrc, backgroundDest);

console.log('Prepared Chrome extension artifacts in dist: manifest.json, background.js');
