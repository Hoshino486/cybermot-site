// Build favicon PNGs from the site avatar so the browser tab shows the same art.
// Usage: node scripts/build-favicons.mjs
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'public', 'images', 'avatar.jpg');
const OUT = path.join(ROOT, 'public', 'icons');

const require = createRequire(import.meta.url);
const sharp = require('sharp');

await mkdir(OUT, { recursive: true });

const sizes = [
  { file: 'icon-32.png', size: 32 },
  { file: 'icon-64.png', size: 64 },
  { file: 'icon-180.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
];

for (const { file, size } of sizes) {
  const buffer = await sharp(SOURCE)
    .resize(size, size, { fit: 'cover', position: 'attention' })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await sharp(buffer).toFile(path.join(OUT, file));
  console.log(`${file.padEnd(14)} ${size}×${size}  ${(buffer.length / 1024).toFixed(1)}KB`);
}
