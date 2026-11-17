const path = require('node:path');
const sharp = require('sharp');

const outputDir = path.join(__dirname, '..', 'assets', 'branding');
const red = '#A51616';
const gold = '#CFA15A';
const goldLight = '#E7D3A0';
const ivory = '#FFF8EA';

function svg(width, height, content, definitions = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${definitions}</defs>${content}</svg>`;
}

function tunduk(cx, cy, radius, primary = gold, secondary = ivory) {
  const rays = Array.from({ length: 8 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 8 - Math.PI / 2;
    const x1 = cx + Math.cos(angle) * radius * 0.54;
    const y1 = cy + Math.sin(angle) * radius * 0.54;
    const x2 = cx + Math.cos(angle) * radius * 0.88;
    const y2 = cy + Math.sin(angle) * radius * 0.88;
    return `<path d="M ${x1} ${y1} L ${x2} ${y2}"/>`;
  }).join('');
  return `
    <g fill="none" stroke="${primary}" stroke-width="${Math.max(8, radius * 0.075)}" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="${cx}" cy="${cy}" r="${radius}" stroke="${secondary}"/>
      <circle cx="${cx}" cy="${cy}" r="${radius * 0.44}"/>
      <path d="M ${cx - radius * 0.44} ${cy} Q ${cx} ${cy - radius * 0.34} ${cx + radius * 0.44} ${cy}"/>
      <path d="M ${cx - radius * 0.44} ${cy} Q ${cx} ${cy + radius * 0.34} ${cx + radius * 0.44} ${cy}"/>
      ${rays}
    </g>
  `;
}

function ornamentFrame(size) {
  const inset = size * 0.095;
  const bend = size * 0.18;
  return `
    <path d="M ${inset} ${bend} V ${inset} H ${bend}" fill="none" stroke="${gold}" stroke-width="${size * 0.018}" stroke-linecap="round"/>
    <path d="M ${size - inset} ${size - bend} V ${size - inset} H ${size - bend}" fill="none" stroke="${gold}" stroke-width="${size * 0.018}" stroke-linecap="round"/>
    <circle cx="${inset}" cy="${inset}" r="${size * 0.016}" fill="${ivory}"/>
    <circle cx="${size - inset}" cy="${size - inset}" r="${size * 0.016}" fill="${ivory}"/>
  `;
}

async function render(name, width, height, content, definitions = '') {
  const target = path.join(outputDir, name);
  await sharp(Buffer.from(svg(width, height, content, definitions)))
    .png({ compressionLevel: 9, palette: false })
    .toFile(target);
  console.log(`${name}: ${width}x${height}`);
}

async function main() {
  const gradient = '<radialGradient id="redGlow" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#C52A24"/><stop offset="0.58" stop-color="#A51616"/><stop offset="1" stop-color="#6B0C0C"/></radialGradient>';
  await render(
    'app-icon.png',
    1024,
    1024,
    `
      <rect width="1024" height="1024" fill="url(#redGlow)"/>
      <circle cx="512" cy="512" r="346" fill="none" stroke="${gold}" stroke-width="12" opacity="0.45"/>
      <circle cx="512" cy="512" r="300" fill="rgba(107,12,12,0.24)" stroke="${goldLight}" stroke-width="4"/>
      ${tunduk(512, 512, 226)}
      ${ornamentFrame(1024)}
    `,
    gradient,
  );

  await render(
    'adaptive-icon-foreground.png',
    1024,
    1024,
    `
      <circle cx="512" cy="512" r="290" fill="rgba(255,248,234,0.08)" stroke="${gold}" stroke-width="12"/>
      ${tunduk(512, 512, 218, goldLight, ivory)}
    `,
  );

  const mark = `
    <circle cx="256" cy="256" r="194" fill="${red}"/>
    <circle cx="256" cy="256" r="176" fill="none" stroke="${gold}" stroke-width="10"/>
    ${tunduk(256, 256, 126, goldLight, ivory)}
  `;
  await render('logo-mark.png', 512, 512, mark);
  await render(
    'splash-icon.png',
    512,
    512,
    `${mark}<circle cx="256" cy="256" r="218" fill="none" stroke="${gold}" stroke-width="4" opacity="0.5"/>`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
