const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const assetRoot = path.join(__dirname, '..', 'assets');
const expectedAssets = [
  { file: 'branding/adaptive-icon-foreground.png', width: 1024, height: 1024, transparent: true },
  { file: 'branding/app-icon.png', width: 1024, height: 1024, transparent: false },
  { file: 'branding/logo-mark.png', width: 512, height: 512, transparent: true },
  { file: 'branding/splash-icon.png', width: 512, height: 512, transparent: true },
  { file: 'ui/hero-light-mobile.png', width: 864, height: 1821, transparent: false },
  { file: 'ui/hero-light-wide.png', width: 1536, height: 1024, transparent: false },
];

function checkerboardLikelihood(data, channels) {
  const bins = new Map();
  let neutralOpaque = 0;
  const pixels = data.length / channels;
  for (let index = 0; index < data.length; index += channels) {
    const [red, green, blue] = [data[index], data[index + 1], data[index + 2]];
    const alpha = channels === 4 ? data[index + 3] : 255;
    if (alpha < 245 || Math.max(red, green, blue) - Math.min(red, green, blue) > 12) continue;
    const lightness = Math.round((red + green + blue) / 3);
    if (lightness < 120 || lightness > 250) continue;
    neutralOpaque += 1;
    const bin = Math.round(lightness / 8) * 8;
    bins.set(bin, (bins.get(bin) ?? 0) + 1);
  }
  const dominant = [...bins.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
  if (dominant.length < 2) return 0;
  const coverage = (dominant[0][1] + dominant[1][1]) / pixels;
  const separation = Math.abs(dominant[0][0] - dominant[1][0]);
  const neutralCoverage = neutralOpaque / pixels;
  return separation >= 8 && separation <= 48
    ? Math.min(1, coverage * 1.5 + neutralCoverage * 0.5)
    : 0;
}

async function inspect(expected) {
  const fullPath = path.join(assetRoot, expected.file);
  const issues = [];
  if (!fs.existsSync(fullPath)) {
    return { file: expected.file, size: 'missing', alpha: false, transparent: '0.0%', issues: ['missing'] };
  }

  const image = sharp(fullPath);
  const metadata = await image.metadata();
  const { data, info } = await image
    .clone()
    .resize({ width: 256, height: 256, fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let transparent = 0;
  for (let index = 3; index < data.length; index += info.channels) {
    if (data[index] === 0) transparent += 1;
  }
  const transparentRatio = transparent / (data.length / info.channels);
  const checkerScore = expected.transparent ? checkerboardLikelihood(data, info.channels) : 0;

  if (metadata.width !== expected.width || metadata.height !== expected.height) {
    issues.push(`expected ${expected.width}x${expected.height}`);
  }
  if (expected.transparent && (!metadata.hasAlpha || transparentRatio < 0.01)) {
    issues.push('expected transparent background');
  }
  if (!expected.transparent && transparentRatio > 0) issues.push('unexpected transparent pixels');
  if (checkerScore >= 0.55) issues.push('possible baked checkerboard');

  return {
    file: expected.file,
    size: `${metadata.width}x${metadata.height}`,
    alpha: Boolean(metadata.hasAlpha),
    transparent: `${(transparentRatio * 100).toFixed(1)}%`,
    issues,
  };
}

function pngFiles(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(prefix, entry.name);
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return pngFiles(fullPath, relative);
    return entry.isFile() && entry.name.endsWith('.png') ? [relative] : [];
  });
}

async function main() {
  const results = [];
  for (const asset of expectedAssets) results.push(await inspect(asset));
  const expected = new Set(expectedAssets.map(({ file }) => file));
  const unexpected = pngFiles(assetRoot).filter((file) => !expected.has(file));

  console.table(
    results.map(({ issues, ...result }) => ({ ...result, issues: issues.join(', ') || 'none' })),
  );
  const failures = results.filter(({ issues }) => issues.length);
  for (const file of unexpected) failures.push({ file, issues: ['undeclared/unused PNG'] });

  if (failures.length > 0) {
    for (const failure of failures) console.error(`${failure.file}: ${failure.issues.join(', ')}`);
    console.error(`Asset audit failed for ${failures.length} file(s).`);
    process.exitCode = 1;
    return;
  }

  console.log(`Asset audit passed: ${results.length} declared production PNG files.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
