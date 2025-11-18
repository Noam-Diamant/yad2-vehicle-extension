# Yad2 Vehicle Price Extension 🚗

A Chrome extension that automatically extracts vehicle data from Bidspirit auctions and Yad2 listings, then fetches accurate price estimates from Yad2's price calculator.

## ✨ Features

### **Bidspirit Integration**
- Automatically extracts vehicle details (manufacturer, model, year, mileage, hands, vehicle number)
- One-click button to open Yad2 calculator
- Auto-fills calculator form with extracted data
- Calculates and displays weighted price

### **Yad2 Listing Assistant**
- Detects Yad2 vehicle posts automatically
- Extracts km and hand count from structured JSON data
- Auto-clicks "למחירון" button when you use the extension
- Fast-fill mode with accurate data extraction

### **Smart Features**
- Intelligent tab reuse (same vehicle → switches to existing tab, different vehicle → updates the tab)
- Smooth scrolling to weighted price after calculation
- Works with 500+ vehicle models via built-in dictionary
- Fallback to vehicle number search for models not in dictionary

## 🚀 Installation

### Manual Installation
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer Mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the extension folder
6. Done! The extension icon will appear in your toolbar

## 📖 How to Use

### From Bidspirit Auctions
1. Visit any Bidspirit vehicle page
2. Click the extension icon
3. Review extracted vehicle data
4. Click **"פתח מחשבון יד2"**
5. Extension automatically:
   - Opens Yad2 calculator (or switches to existing tab)
   - Fills in all details
   - Calculates weighted price
   - Scrolls to show the result

### From Yad2 Vehicle Listings
1. Visit any Yad2 vehicle listing page
2. Click the extension icon
3. Click **"פתח מחשבון יד2"**
4. Extension automatically:
   - Clicks the "למחירון" button for you
   - Fills km and hand count
   - Calculates and displays weighted price

## ⚙️ Customization

To adjust timing and scroll behavior, edit `yad2-content.js`:

```javascript
// Line 625: Initial wait before form fill (1000ms or 1500ms)
const initialWait = fastMode ? 1000 : 1500;

// Line 723: Scroll distance in pixels (default: 2800)
top: 2800,

// Line 726: Delay before scroll after clicking "שקלול מחיר" (default: 800ms)
}, 800);

// Line 742: Delay before clicking "שקלול מחיר" (default: 1000ms)
}, 1000);
```

## 🔒 Privacy

- **No data collection** - all processing happens locally in your browser
- **No external servers** - only communicates with Bidspirit and Yad2
- **No tracking** - no analytics or user tracking
- **Open source** - review the code yourself

## 📝 License

MIT License - free to use, modify, and distribute with attribution.

## 🙏 Acknowledgments

Built for the Israeli automotive community 🇮🇱

---

**Need help?** Open an issue on GitHub
