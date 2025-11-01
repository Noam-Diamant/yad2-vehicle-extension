# Yad2 Vehicle Price Extension for Bidspirit

A fast, user-friendly Chrome extension that seamlessly integrates Yad2's price calculator with Bidspirit vehicle pages. Extract vehicle data and get real Yad2 prices with just one click!

## 🚀 What's New (Latest Version)

### **User-Initiated Price Lookup**
- ✅ No more automatic tab opening - Yad2 only opens when YOU click the button
- ✅ Clean, modern popup interface showing vehicle details
- ✅ One-click button to open and auto-fill Yad2 calculator
- ✅ Double-click prevention to avoid multiple tabs

### **Lightning-Fast Performance** ⚡
- ✅ Total processing time: **~4-6 seconds** (down from 20+ seconds!)
- ✅ Automatic scroll to form using "לשקלול מחיר" button
- ✅ Smart MutationObserver to detect prices instantly when they appear
- ✅ Optimized delays: 500ms page load → auto-scroll → 300ms → form fill → calculate
- ✅ Aggressive timing for maximum speed while maintaining reliability

### **Intelligent Form Filling**
- ✅ Automatically clicks "לשקלול מחיר" to scroll to the calculator form
- ✅ Accurately fills mileage (קילומטר) field with multiple fallback methods
- ✅ Correctly fills hands count (יד) using Hebrew ordinals detection
- ✅ Triggers calculation by clicking the correct "שקלול מחיר" button
- ✅ Real-time price extraction from dynamically loaded content

## 🚗 How It Works

1. **Browse Bidspirit**: Visit any vehicle page on Bidspirit
2. **Auto-Extract**: Extension automatically extracts vehicle data (manufacturer, model, year, mileage, hands)
3. **Click Extension**: Click the extension icon to see vehicle details
4. **One Button Click**: Press "פתח מחשבון יד2" button
5. **Auto-Magic** ✨:
   - Yad2 calculator page opens in new tab
   - "לשקלול מחיר" is clicked automatically to scroll to form
   - Mileage and hands fields are filled automatically
   - "שקלול מחיר" calculation button is clicked
   - Real weighted price and range are extracted
6. **View Results**: See actual Yad2 calculated prices on the calculator page

## 🎯 Key Features

### Smart Data Extraction
- Extracts manufacturer, model, year from Bidspirit pages
- Detects mileage in various formats (123,456 ק"מ, 123456 km, etc.)
- Parses hands count in Hebrew (ראשונה, שנייה, שלישית, etc.) and numeric formats
- Handles edge cases with multiple fallback patterns

### Real Yad2 Integration
- Opens the correct Yad2 calculator page for the specific vehicle model
- Automatically scrolls to the calculator form
- Fills form fields using multiple detection methods (placeholder, label, name, ID)
- Simulates real user interaction (input events, change events, blur events)
- Extracts actual calculated prices (מחיר משוקלל, טווח מחירים)

### User-Friendly Interface
- Clean, modern popup with orange gradient theme
- Shows all vehicle details at a glance
- Large, prominent action button
- Error states with helpful messages
- Smooth animations and transitions

### Performance Optimizations
- **MutationObserver**: Detects price results the moment they appear in DOM
- **Minimal delays**: Aggressive timing (500ms, 300ms intervals)
- **Smart debouncing**: Prevents duplicate extractions and tab openings
- **Cooldown system**: 10-second cooldown to prevent multiple Yad2 tabs
- **Result caching**: Stores vehicle data for instant popup display

## 🛠 Installation

### For Users (Local Development)
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer Mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `yad2-vehicle-extension` folder
6. The extension icon should appear in your toolbar!

### Using the Extension
1. Visit any Bidspirit vehicle page (e.g., `https://bidspirit.com/ui/lotPage/...`)
2. Click the extension icon in your toolbar
3. Review the vehicle details shown in the popup
4. Click the orange **"פתח מחשבון יד2"** button
5. Watch as Yad2 opens, scrolls, fills, and calculates automatically!

## 📁 Project Structure

```
yad2-vehicle-extension/
├── manifest.json           # Extension configuration (Manifest V3)
├── background.js          # Service worker - handles Yad2 tab opening & data storage
├── content.js             # Bidspirit page scraper - extracts vehicle data
├── yad2-content.js        # Yad2 page automation - fills forms & extracts prices
├── popup.html             # Popup interface structure
├── popup.js               # Popup logic - displays data & handles button clicks
├── popup.css              # Modern, clean styling
└── README.md              # This file!
```

## 🔧 Technical Implementation

### Data Extraction (`content.js`)
- Uses regex patterns to extract Hebrew text data
- Implements MutationObserver for SPA page changes
- Debouncing mechanism (5-second cooldown) to prevent excessive extractions
- Stores data in `chrome.storage.local` for popup access

### Background Service Worker (`background.js`)
- Handles `OPEN_YAD2_CALCULATOR` messages from popup
- Manages Yad2 tab lifecycle (opening, reusing, cooldown)
- Stores vehicle data and price data
- Prevents duplicate tab openings with triple-layer protection:
  1. Vehicle-level deduplication
  2. `yad2TabOpening` flag
  3. 10-second time-based cooldown

### Yad2 Automation (`yad2-content.js`)
- **Auto-scroll**: Clicks "לשקלול מחיר" button to scroll to form
- **Form filling**: Multiple detection methods for each field:
  - Searches by placeholder text
  - Searches by adjacent label text
  - Searches by input name/ID
  - Hebrew ordinal number parsing for hands count
- **Event simulation**: Dispatches `input`, `change`, and `blur` events
- **React-friendly**: Uses `nativeInputValueSetter` for React inputs
- **Button clicking**: Distinguishes between "לשקלול מחיר" (scroll) and "שקלול מחיר" (calculate)
- **Price extraction**: MutationObserver + timed fallbacks to catch dynamic content

### Popup Interface (`popup.js`, `popup.html`, `popup.css`)
- Simple, focused design with one clear action
- Shows vehicle details in an organized card layout
- Orange-themed design (Yad2 brand colors)
- Double-click prevention on action button
- Automatic popup close after opening Yad2

## 🎨 Supported Data Fields

| Field | Hebrew | Extraction Method |
|-------|--------|-------------------|
| Manufacturer | יצרן | URL parsing, page title |
| Model | דגם | URL parsing, page title |
| Year | שנת יצור | Regex patterns (2000-2025) |
| Mileage | קילומטראז' / מד אוץ | Multiple patterns with comma support |
| Hands Count | יד | Hebrew ordinals + numeric patterns |
| Condition | מצב | Hebrew condition terms |
| Vehicle Number | מספר רכב | Israeli license plate format |
| Engine Size | נפח מנוע | cc/liter patterns |

## ⚡ Performance Metrics

| Stage | Time | Details |
|-------|------|---------|
| Data extraction | Instant | Runs automatically on page load |
| Button click → Tab open | ~100ms | Chrome tab creation |
| Page load wait | 500ms | Minimal delay for DOM ready |
| Auto-scroll | ~100ms | "לשקלול מחיר" click |
| Scroll animation | 300ms | Smooth scroll to form |
| Form fill | ~500ms | Fill mileage + hands |
| Calculate click | Instant | "שקלול מחיר" button |
| Price detection | 1.5-3s | MutationObserver + fallbacks |
| **Total** | **~4-6s** | Complete end-to-end flow |

## ⚠️ Known Limitations & Troubleshooting

### Common Issues

**"לא נמצא דף רכב" (No vehicle page found)**
- Make sure you're on a Bidspirit vehicle page (`/ui/lotPage/`)
- Some Bidspirit pages may have different URL structures

**"לא ניתן לחלץ נתוני רכב" (Cannot extract vehicle data)**
- The page might not have the required vehicle information
- Try refreshing the Bidspirit page
- Check browser console for extraction logs

**Multiple Yad2 tabs opening**
- This should no longer happen with the latest version
- If it does, please report with console logs

**Form fields not filling**
- Yad2's website structure may have changed
- Check the Yad2 console for "FILLING FORM FIELDS" logs
- The extension has multiple fallback methods for field detection

**Prices not appearing**
- The MutationObserver should catch them automatically
- Check if "Page contains 'משוקלל'" shows true in logs
- Yad2 may have changed their calculator structure

### Technical Limitations

- **Website Changes**: Yad2 or Bidspirit updates may require extension updates
- **CAPTCHA**: Yad2 may show CAPTCHA for unusual traffic patterns (mitigated by user-initiated opening)
- **Sub-Model IDs**: Some vehicle models may not have calculator pages
- **Network Speed**: Slower connections may need slightly longer delays

## 🔒 Privacy & Legal

- **No data collection**: All processing happens locally in your browser
- **No external servers**: Extension communicates only with Bidspirit and Yad2
- **No tracking**: No analytics, no user tracking, no data storage outside your browser
- **Public data only**: Extension only accesses publicly available information
- **Fair use**: Designed for personal, non-commercial use
- **Not affiliated**: Independent project, not affiliated with Yad2 or Bidspirit

## 🤝 Contributing

Contributions are welcome! Please feel free to:
- Report bugs via GitHub Issues
- Suggest new features
- Submit pull requests
- Improve documentation

## 📜 License

MIT License - Feel free to use, modify, and distribute with attribution.

## 🙏 Acknowledgments

Built with care for the Israeli automotive community. Special thanks to:
- Chrome Extension API documentation
- Yad2 for their comprehensive price calculator
- Bidspirit for their auction platform

---

**Made with ❤️ for car buyers in Israel** 🇮🇱
