const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Try multiple possible source image locations and formats
const possibleSources = [
  'icon-source.png',
  'icon-source.jpg',
  'icon-source.jpeg',
  'icon-source.svg',
  'icon-source.webp',
  'icon.png',
  'icon.jpg',
  'logo.png',
  'logo.svg',
];

// Output paths
const outputDir = path.join(__dirname, '../public');
const icon192 = path.join(outputDir, 'icon-192.png');
const icon512 = path.join(outputDir, 'icon-512.png');

function findSourceImage() {
  for (const source of possibleSources) {
    const fullPath = path.join(outputDir, source);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

async function generateIcons() {
  try {
    // Find source image
    const inputImage = findSourceImage();
    
    if (!inputImage) {
      console.error('❌ Source image not found!');
      console.log('\n📝 Please place your icon image in the public/ folder with one of these names:');
      possibleSources.forEach(name => console.log(`   - ${name}`));
      console.log('\n💡 Supported formats: PNG, JPG, SVG, WebP');
      console.log('   The image should have a transparent background.');
      process.exit(1);
    }

    console.log('🎨 Generating PWA icons...');
    console.log(`📥 Source: ${path.basename(inputImage)}`);

    // Get image metadata to check if it has transparency
    const metadata = await sharp(inputImage).metadata();
    const hasAlpha = metadata.hasAlpha;

    // Generate 192x192 icon
    const icon192Pipeline = sharp(inputImage).resize(192, 192, {
      fit: 'contain',
      background: hasAlpha ? { r: 0, g: 0, b: 0, alpha: 0 } : { r: 255, g: 255, b: 255, alpha: 1 }
    });

    if (hasAlpha) {
      await icon192Pipeline.png({ compressionLevel: 9 }).toFile(icon192);
    } else {
      await icon192Pipeline.png().toFile(icon192);
    }
    console.log(`✅ Created: icon-192.png (192x192)`);

    // Generate 512x512 icon
    const icon512Pipeline = sharp(inputImage).resize(512, 512, {
      fit: 'contain',
      background: hasAlpha ? { r: 0, g: 0, b: 0, alpha: 0 } : { r: 255, g: 255, b: 255, alpha: 1 }
    });

    if (hasAlpha) {
      await icon512Pipeline.png({ compressionLevel: 9 }).toFile(icon512);
    } else {
      await icon512Pipeline.png().toFile(icon512);
    }
    console.log(`✅ Created: icon-512.png (512x512)`);

    console.log('\n✨ Icons generated successfully!');
    console.log('📱 Your PWA is ready to be installed.');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();

