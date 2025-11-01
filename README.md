# Yad2 Vehicle Price Extension for Bidspirit

A fast, user-friendly Chrome extension that seamlessly integrates Yad2's price calculator with Bidspirit vehicle pages. Extract vehicle data and get real Yad2 prices with just one click!

## 🚀 Features

### **User-Initiated Price Lookup**
- ✅ No automatic tab opening - Yad2 only opens when YOU click the button
- ✅ Clean, modern popup interface showing vehicle details
- ✅ One-click button to open and auto-fill Yad2 calculator
- ✅ Double-click prevention to avoid multiple tabs

### **Lightning-Fast Performance** ⚡
- ✅ Total processing time: **~4-6 seconds** (down from 20+ seconds!)
- ✅ Automatic scroll to form using "לשקלול מחיר" button
- ✅ Smart MutationObserver to detect prices instantly when they appear
- ✅ Optimized delays for maximum speed while maintaining reliability

### **Intelligent Form Filling**
- ✅ Automatically clicks "לשקלול מחיר" to scroll to the calculator form
- ✅ Accurately fills mileage (קילומטר) field with multiple fallback methods
- ✅ Correctly fills hands count (יד) using Hebrew ordinals detection
- ✅ Triggers calculation by clicking the correct "שקלול מחיר" button
- ✅ Real-time price extraction from dynamically loaded content

### **Smart Data Extraction**
- Extracts manufacturer, model, year from Bidspirit pages
- Detects mileage in various formats (123,456 ק"מ, 123456 km, etc.)
- Parses hands count in Hebrew (ראשונה, שנייה, שלישית, etc.) and numeric formats
- Handles edge cases with multiple fallback patterns

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

## 🛠 Installation

### From Chrome Web Store (Recommended)
*Coming soon!* Once published, you'll be able to install it directly from the Chrome Web Store with one click.

### Manual Installation (Developer Mode)
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer Mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `yad2-vehicle-extension` folder
6. The extension icon should appear in your toolbar!

## 📖 Usage

1. Visit any Bidspirit vehicle page (e.g., `https://bidspirit.com/ui/lotPage/...`)
2. Click the extension icon in your toolbar
3. Review the vehicle details shown in the popup
4. Click the orange **"פתח מחשבון יד2"** button
5. Watch as Yad2 opens, scrolls, fills, and calculates automatically!

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

## ⚡ Performance

| Stage | Time | Details |
|-------|------|---------|
| Data extraction | Instant | Runs automatically on page load |
| Button click → Tab open | ~100ms | Chrome tab creation |
| Page load + auto-scroll | ~600ms | Minimal delay for DOM ready + scroll |
| Form fill | ~500ms | Fill mileage + hands |
| Calculate + extract | ~1.5-3s | MutationObserver + fallbacks |
| **Total** | **~4-6s** | Complete end-to-end flow |

## ⚠️ Troubleshooting

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

For developers interested in publishing or maintaining this extension, see [DEVELOPER.md](DEVELOPER.md).

## 📜 License

MIT License - Feel free to use, modify, and distribute with attribution.

## 🙏 Acknowledgments

Built with care for the Israeli automotive community. Special thanks to:
- Chrome Extension API documentation
- Yad2 for their comprehensive price calculator
- Bidspirit for their auction platform

---

**Made with ❤️ for car buyers in Israel** 🇮🇱
