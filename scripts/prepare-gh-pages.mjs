import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const publicDir = path.join(root, 'public');

if (!fs.existsSync(dist)) {
  console.error('dist/ not found. Run: npx expo export -p web');
  process.exit(1);
}

// Required for GitHub Pages — prevents Jekyll from stripping _expo folder
fs.writeFileSync(path.join(dist, '.nojekyll'), '');

// SPA fallback for GitHub Pages deep links
const indexHtml = path.join(dist, 'index.html');
if (fs.existsSync(indexHtml)) {
  fs.copyFileSync(indexHtml, path.join(dist, '404.html'));
}

// Copy PWA icons and manifest from public/
for (const file of ['manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png']) {
  const src = path.join(publicDir, file);
  const dest = path.join(dist, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

// Inject PWA meta tags into index.html
if (fs.existsSync(indexHtml)) {
  let html = fs.readFileSync(indexHtml, 'utf8');

  if (!html.includes('apple-mobile-web-app-capable')) {
    const pwaBlock = `
  <link rel="manifest" href="/AiSpark/manifest.json" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Spark" />
  <link rel="apple-touch-icon" href="/AiSpark/apple-touch-icon.png" />
`;
    html = html.replace('</head>', `${pwaBlock}</head>`);
  }

  fs.writeFileSync(indexHtml, html);
  fs.copyFileSync(indexHtml, path.join(dist, '404.html'));
}

console.log('GitHub Pages build prepared in dist/');
