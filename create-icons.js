#!/usr/bin/env node
/**
 * Generate extension icon PNGs from logo.svg using sharp.
 *
 * Usage:  node create-icons.js
 *
 * Produces:
 *   extension/icons/icon{16,48,128}.png
 *   extension/icons/icon{16,48,128}-disabled.png
 */

const sharp = require("sharp");
const path = require("path");

const SIZES = [16, 48, 128];
const SVG = path.join("logo.svg");
const OUT = path.join("extension", "icons");

async function main() {
  for (const size of SIZES) {
    const base = sharp(SVG).resize(size, size);

    await base.clone().png().toFile(path.join(OUT, `icon${size}.png`));
    console.log(`✓ icon${size}.png`);

    await base
      .clone()
      .grayscale()
      .modulate({ brightness: 0.5 })
      .png()
      .toFile(path.join(OUT, `icon${size}-disabled.png`));
    console.log(`✓ icon${size}-disabled.png`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
