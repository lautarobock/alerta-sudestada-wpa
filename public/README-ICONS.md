# Generating PWA Icons

## Quick Start

1. Place your icon image in the `public` folder as `icon-source.png` (or `.jpg`, `.svg`, `.webp`)
2. Run the generation script:
   ```bash
   npm run generate-icons
   ```

This will create:
- `public/icon-192.png` (192x192 pixels)
- `public/icon-512.png` (512x512 pixels)

## Image Requirements

- **Format**: PNG, JPG, SVG, or WebP
- **Background**: Transparent (will be preserved)
- **Aspect Ratio**: Square (1:1) recommended for best results
- **Size**: At least 512x512 pixels (larger is better)

## Manual Alternative

If you prefer to create the icons manually:

1. Use an image editor (Photoshop, GIMP, Figma, etc.)
2. Create two versions:
   - 192x192 pixels → save as `public/icon-192.png`
   - 512x512 pixels → save as `public/icon-512.png`
3. Ensure the background is transparent
4. Make sure the icons are square and centered

## Notes

- The script uses `sharp` for image processing
- Transparent backgrounds are preserved
- Icons are automatically centered and scaled to fit
- The source image can be any size - it will be resized appropriately

