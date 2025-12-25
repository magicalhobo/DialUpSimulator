#!/bin/bash

# Script to create icons from the source logo.svg

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed. Install it with:"
    echo "  sudo apt-get install imagemagick"
    exit 1
fi

# Check if logo.svg exists
if [ ! -f "logo.svg" ]; then
    echo "Error: logo.svg not found in the current directory"
    echo ""
    echo "Please create a logo.svg file then run this script again."
    exit 1
fi

# Create icons directory if it doesn't exist
mkdir -p icons

# Resize logo.svg to create icons at different sizes
echo "Creating icons from logo.svg..."
for size in 16 48 128; do
    convert -background none logo.svg -filter point -resize ${size}x${size} icons/icon${size}.png
    if [ $? -eq 0 ]; then
        echo "✓ Created icons/icon${size}.png"
    else
        echo "✗ Failed to create icons/icon${size}.png"
        exit 1
    fi
done

echo ""
echo "✓ All icons created successfully!"
echo ""
echo "Icons generated:"
echo "  - icons/icon16.png  (16x16)"
echo "  - icons/icon48.png  (48x48)"
echo "  - icons/icon128.png (128x128)"
