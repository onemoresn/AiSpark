import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const assets = path.join(root, 'assets');
const publicDir = path.join(root, 'public');
const source = path.join(assets, 'spark-robot-mascot.png');

async function main() {
  const sharp = (await import('sharp')).default;
  const sizes = [
    { file: 'icon.png', size: 1024, dir: assets },
    { file: 'favicon.png', size: 48, dir: assets },
    { file: 'splash-icon.png', size: 512, dir: assets },
    { file: 'android-icon-foreground.png', size: 432, dir: assets },
    { file: 'icon-192.png', size: 192, dir: publicDir },
    { file: 'icon-512.png', size: 512, dir: publicDir },
    { file: 'apple-touch-icon.png', size: 180, dir: publicDir },
  ];

  for (const { file, size, dir } of sizes) {
    const dest = path.join(dir, file);
    await sharp(source)
      .resize(size, size, { fit: 'contain', background: { r: 10, g: 10, b: 15, alpha: 1 } })
      .png()
      .toFile(dest);
    console.log(`Wrote ${dest}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
