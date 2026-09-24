const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const SUPPORTED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
]);

async function convertImages() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    throw new Error(`Public directory not found: ${PUBLIC_DIR}`);
  }

  const files = fs.readdirSync(PUBLIC_DIR);

  const imageFiles = files.filter((file) => {
    const extension = path.extname(file).toLowerCase();

    return SUPPORTED_EXTENSIONS.has(extension);
  });

  if (imageFiles.length === 0) {
    console.log('No PNG/JPG images found in public/.');
    return;
  }

  console.log(`Preparing ${imageFiles.length} image(s)...`);

  await Promise.all(
    imageFiles.map(async (file) => {
      const inputPath = path.join(PUBLIC_DIR, file);

      const outputName =
        path.basename(file, path.extname(file)) + '.webp';

      const outputPath = path.join(PUBLIC_DIR, outputName);

      await sharp(inputPath)
        .webp({
          quality: 84,
          effort: 6,
          smartSubsample: true,
        })
        .toFile(outputPath);

      console.log(`✓ ${file} → ${outputName}`);
    })
  );

  console.log('All images converted to WebP.');
}

convertImages().catch((error) => {
  console.error('Image conversion failed.');
  console.error(error);
  process.exit(1);
});
