const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const input = path.join(__dirname, '..', 'public', 'landing.png');
const output = path.join(__dirname, '..', 'public', 'landing.webp');

async function prepareLanding() {
  if (!fs.existsSync(input)) {
    throw new Error(`landing.png was not found at: ${input}`);
  }

  await sharp(input)
    .webp({
      quality: 84,
      effort: 6,
      smartSubsample: true,
    })
    .toFile(output);

  console.log('✓ landing.webp generated from landing.png');
}

prepareLanding().catch((error) => {
  console.error('✕ Failed to prepare landing image');
  console.error(error);
  process.exit(1);
});
