import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const manifestSrc = path.join(root, 'manifest.json');
const backgroundSrc = path.join(root, 'backgroud.js');
const manifestDest = path.join(distDir, 'manifest.json');
const backgroundDest = path.join(distDir, 'background.js');
const iconsSrcDir = path.join(root, 'public', 'icons');
const iconsDestDir = path.join(distDir, 'icons');

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
copyFileSync(backgroundSrc, backgroundDest);

const manifest = JSON.parse(readFileSync(manifestSrc, 'utf-8'));
const mapIconPath = (value) =>
  typeof value === 'string' ? value.replace(/^public\/icons\//, 'icons/') : value;

if (manifest.icons) {
  for (const key of Object.keys(manifest.icons)) {
    manifest.icons[key] = mapIconPath(manifest.icons[key]);
  }
}

if (manifest.action?.default_icon) {
  for (const key of Object.keys(manifest.action.default_icon)) {
    manifest.action.default_icon[key] = mapIconPath(manifest.action.default_icon[key]);
  }
}

writeFileSync(manifestDest, JSON.stringify(manifest, null, 2));

if (existsSync(iconsSrcDir)) {
  mkdirSync(iconsDestDir, { recursive: true });
  for (const fileName of readdirSync(iconsSrcDir)) {
    copyFileSync(path.join(iconsSrcDir, fileName), path.join(iconsDestDir, fileName));
  }
}

console.log('Prepared Chrome extension artifacts in dist: manifest.json, background.js, icons/*');
