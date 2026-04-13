/**
 * One-time OG image generator for SkillForge.
 * Composites hero screenshot + brand text onto a 1280x640 canvas.
 * Run: node generate-og-image.mjs
 */
import sharp from 'sharp';

const WIDTH = 1280;
const HEIGHT = 640;
const BG_COLOR = '#09090b';
const BRAND_PURPLE = '#863bff';
const BRAND_CYAN = '#47bfff';

// Resize hero screenshot to fit the right side
const heroResized = await sharp('public/screenshots/hero-overview.png')
  .resize(780, 488, { fit: 'cover' })
  .png()
  .toBuffer();

// SVG overlay for text + brand elements on the left side
const textOverlay = Buffer.from(`
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${BRAND_PURPLE};stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:${BRAND_CYAN};stop-opacity:0.1" />
    </linearGradient>
  </defs>

  <!-- Subtle gradient accent on left -->
  <rect x="0" y="0" width="500" height="${HEIGHT}" fill="url(#grad)" />

  <!-- Brand icon placeholder (lightning bolt shape) -->
  <g transform="translate(60, 160) scale(1.8)">
    <path fill="${BRAND_PURPLE}" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
  </g>

  <!-- Title -->
  <text x="60" y="310" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="700" fill="white">
    SkillForge
  </text>

  <!-- Tagline -->
  <text x="60" y="360" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#a1a1aa">
    Visual Configuration Tool
  </text>
  <text x="60" y="392" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#a1a1aa">
    for OpenClaw Skills
  </text>

  <!-- Accent line -->
  <rect x="60" y="420" width="120" height="3" rx="1.5" fill="${BRAND_PURPLE}" />

  <!-- Platform tags -->
  <text x="60" y="470" font-family="system-ui, -apple-system, sans-serif" font-size="15" fill="#71717a">
    macOS  ·  Windows  ·  Linux
  </text>

  <!-- Right side: subtle border for screenshot area -->
  <rect x="459" y="75" width="782" height="490" rx="12" fill="none" stroke="#27272a" stroke-width="1" />
</svg>
`);

// Compose final image
await sharp({
  create: {
    width: WIDTH,
    height: HEIGHT,
    channels: 4,
    background: BG_COLOR,
  },
})
  .composite([
    // Hero screenshot on the right
    {
      input: heroResized,
      left: 460,
      top: 76,
    },
    // Text overlay on the left
    {
      input: textOverlay,
      left: 0,
      top: 0,
    },
  ])
  .png({ quality: 90 })
  .toFile('public/og-image.png');

console.log('OG image generated: public/og-image.png');

// Verify dimensions
const meta = await sharp('public/og-image.png').metadata();
console.log(`Dimensions: ${meta.width}x${meta.height}, Size: ${Math.round(meta.size / 1024)}KB`);
