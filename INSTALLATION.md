# Installation Guide

## Quick Setup

1. **Download the Extension**
   - Make sure all files are in the `yad2-vehicle-extension` folder

2. **Open Chrome Extensions Page**
   - Open Chrome browser
   - Go to `chrome://extensions/`
   - Or click the three dots menu → More tools → Extensions

3. **Enable Developer Mode**
   - Toggle "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked" button
   - Select the `yad2-vehicle-extension` folder
   - The extension should now appear in your extensions list

5. **Pin the Extension (Optional)**
   - Click the puzzle piece icon in Chrome toolbar
   - Click the pin icon next to "Yad2 Vehicle Price Extension"

## Usage

1. Go to any Bidspirit vehicle page (e.g., `https://il.bidspirit.com/ui/lotPage/...`)
2. Click the extension icon in your toolbar
3. The popup will show vehicle details and Yad2 price information

## Troubleshooting

### Extension Not Working
- Make sure you're on a Bidspirit vehicle page (URL contains `/ui/lotPage/`)
- Try refreshing the page
- Check if the extension is enabled in `chrome://extensions/`

### No Price Data
- The extension currently uses mock data for demonstration
- Real Yad2 integration requires additional implementation
- You can still use the "Open Yad2" button to manually check prices

### Icons Not Showing
- Create PNG icon files (16x16, 48x48, 128x128 pixels) in the `icons/` folder
- Or the extension will use Chrome's default puzzle piece icon

## Development Mode

When developing:
- Make changes to the extension files
- Go to `chrome://extensions/`
- Click the refresh icon on the extension card
- Test your changes



