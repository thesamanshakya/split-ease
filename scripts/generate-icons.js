const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Source image
const sourceImage = path.join(__dirname, '../public/split-ease.jpg');

// Icon sizes to generate
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate icons for each size
async function generateIcons() {
  try {
    for (const size of sizes) {
      await sharp(sourceImage)
        .resize(size, size)
        .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));

    }
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
