# Yad2 Vehicle Price Extension for Bidspirit

A fast, user-friendly Chrome extension that seamlessly integrates Yad2's price calculator with Bidspirit vehicle pages. Extract vehicle data and get real Yad2 prices with just one click!

## 🚀 Features

### **Hybrid Smart Approach** 🧠
- ✅ **Popular models**: Fully automatic (4-6 seconds)
- ✅ **Other models**: Semi-automatic with vehicle number search (6-10 seconds)
- ✅ Built-in database of popular models (Kia, Toyota, Honda, Mazda, Skoda)
- ✅ Automatic fallback to vehicle number search for unlisted models

### **User-Initiated & Fast** ⚡
- ✅ No automatic tab opening - YOU control when to fetch prices
- ✅ Clean, modern popup interface showing vehicle details
- ✅ One-click button to open and auto-fill Yad2 calculator
- ✅ Double-click prevention to avoid multiple tabs
- ✅ Lightning-fast performance with optimized delays

### **Intelligent Automation**
- ✅ Automatically clicks "לשקלול מחיר" to scroll to form
- ✅ Accurately fills mileage and hands count fields
- ✅ Smart vehicle number typing (character by character simulation)
- ✅ Real-time price extraction using MutationObserver
- ✅ Multiple fallback methods for reliability

### **Smart Data Extraction**
- ✅ Extracts manufacturer, model, year, vehicle number from Bidspirit
- ✅ Detects mileage in various formats (123,456 ק"מ, 123456 km, etc)
- ✅ Parses hands count in Hebrew and numeric formats
- ✅ Handles edge cases with multiple fallback patterns

## 🚗 How It Works

The extension uses a smart hybrid approach for maximum speed and reliability:

### **Option 1: Popular Models (Fully Automatic)** ⚡
For popular vehicles in our database (Kia Picanto, Toyota Corolla, Honda Civic, Mazda 3, Skoda Octavia, and more):

1. **Browse Bidspirit**: Visit any vehicle page
2. **Auto-Extract**: Extension extracts vehicle data automatically
3. **Click Extension**: Click the extension icon
4. **One Button Click**: Press "פתח מחשבון יד2" button
5. **Fully Automatic** ✨:
   - Opens directly to the specific Yad2 model page
   - Clicks "לשקלול מחיר" to scroll to form
   - Fills all fields automatically (mileage, hands, etc)
   - Clicks "שקלול מחיר" to calculate
   - Extracts weighted price and range
6. **Done!** - Total time: 4-6 seconds

### **Option 2: All Other Models (Semi-Automatic)** 🔄
For vehicles not in our database:

1. **Browse Bidspirit**: Visit any vehicle page
2. **Auto-Extract**: Extension extracts vehicle data including vehicle number
3. **Click Extension**: Click the extension icon
4. **One Button Click**: Press "פתח מחשבון יד2" button
5. **Semi-Automatic Flow**:
   - Opens Yad2 main price list page
   - Clicks "דגם ספציפי" automatically
   - **Fills vehicle number automatically** (types character by character)
   - **👤 YOU click "המשך" button manually** (extension waits for you)
   - After redirect, continues automatically:
     - Clicks "לשקלול מחיר" to scroll to form
     - Fills all fields (mileage, hands, etc)
     - Clicks "שקלול מחיר" to calculate
     - Extracts weighted price and range
6. **Done!** - Total time: 6-10 seconds (including your manual click)

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

### For Popular Models (Fully Automatic)
1. Visit any Bidspirit vehicle page with a popular model (Kia Picanto, Toyota Corolla, etc)
2. Click the extension icon in your toolbar
3. Review the vehicle details in the popup
4. Click **"פתח מחשבון יד2"**
5. Sit back and watch - everything happens automatically!

### For Other Models (One Manual Click)
1. Visit any Bidspirit vehicle page
2. Click the extension icon in your toolbar
3. Review the vehicle details in the popup
4. Click **"פתח מחשבון יד2"**
5. Extension fills the vehicle number automatically
6. **Click "המשך" button when prompted** (only manual step!)
7. Rest is automatic - form fills and calculates

**Note**: The extension will clearly indicate in the console which mode it's using

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

### Popular Models (Fully Automatic)
| Stage | Time | Details |
|-------|------|---------|
| Data extraction | Instant | Runs automatically on page load |
| Button click → Direct URL | ~100ms | Opens specific model page |
| Page load + scroll | ~1s | DOM ready + "לשקלול מחיר" click |
| Form fill | ~500ms | Fill mileage + hands |
| Calculate + extract | ~2-3s | MutationObserver + fallbacks |
| **Total** | **~4-6s** | Fully automatic |

### Other Models (Semi-Automatic)
| Stage | Time | Details |
|-------|------|---------|
| Data extraction | Instant | Runs automatically on page load |
| Open main page | ~100ms | Opens Yad2 price list |
| Fill vehicle number | ~1s | Types character by character |
| **👤 User clicks המשך** | Variable | You click the button |
| Redirect to model page | ~1s | Yad2 processes and redirects |
| Form fill + calculate | ~3-4s | Auto-fills and extracts price |
| **Total** | **~6-10s** | Including your manual click |

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
