# Yad2 Car Price Helper

A Chrome extension that enhances the browsing experience on Bidspirit by displaying real-time car price information from Yad2's price calculator directly within the vehicle listing page.

## 🚗 What does this extension do?

- **Extracts vehicle data** from Bidspirit auction pages (manufacturer, model, year, mileage, hands count, condition)
- **Fetches real prices** from Yad2's official price calculator using web scraping
- **Calculates weighted prices** based on vehicle parameters (mileage, age, hands count, condition)
- **Displays accurate pricing** in a convenient popup interface
- **Supports multiple lookup methods** - by vehicle number or by vehicle details

## 🔧 How it works

1. **Data Extraction**: Automatically extracts vehicle information from Bidspirit pages
2. **Real Yad2 Integration**:
   - **Opens Yad2 Calculator**: Automatically opens the correct Yad2 price calculator page
   - **Fills Parameters**: Automatically fills in mileage, hands count, and other parameters
   - **Extracts Results**: Reads the actual calculated prices from Yad2's calculator
   - **Real-time Updates**: Shows the exact same prices that Yad2 calculates
3. **Fallback Methods**:
   - **By Vehicle Number**: Direct search using license plate number
   - **By Vehicle Details**: Manufacturer, model, year lookup
   - **Market Estimation**: Fallback using market data
4. **Display**: Shows the exact weighted price and range from Yad2's calculator

## 🔒 Legal & Transparency Notice

- This extension is **not affiliated with Yad2, Bidspirit, or any third-party organization**.
- All information displayed is **publicly available** on the respective websites.
- The extension **does not** collect, store, transmit, or redistribute personal data.
- Price calculations are based on **publicly available algorithms** and market data.
- Use of this extension falls under **fair personal use**, respecting site ownership and user privacy.

## 🛠 Installation (Local Development)

1. Clone or download this repository.
2. Open your browser and go to: `chrome://extensions/`.
3. Enable **Developer Mode** in the top-right corner.
4. Click **Load unpacked**.
5. Select the extension folder.

The extension will now be active when visiting car listing pages on Yad2.

## 🛠 Technical Details

### Files Structure
- `manifest.json` - Extension configuration and permissions
- `content.js` - Extracts vehicle data from Bidspirit pages
- `background.js` - Handles price fetching and calculations
- `popup.html` - User interface for displaying prices
- `popup-minimal.js` - Popup functionality and data display
- `popup.css` - Styling for the popup interface

### Key Features
- **Smart Data Extraction**: Uses regex patterns to extract vehicle details from Hebrew text
- **Fallback System**: Multiple fallback methods for finding sub-model IDs
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Caching**: Price data is cached for 30 minutes to improve performance
- **Real-time Updates**: Refresh button to get latest price data

### Supported Vehicle Data
- Manufacturer (יצרן)
- Model (דגם) 
- Year (שנה)
- Mileage (קילומטראז')
- Hands Count (יד נוכחית)
- Condition (מצב הרכב)
- Vehicle Number (מספר רכב)
- Engine Size (נפח מנוע)
- Trim Level (גימור)

## ⚠️ Known Limitations

- **CORS Restrictions**: Some requests may be blocked by browser security policies
- **Website Changes**: Yad2's website structure changes may require updates
- **Bot Detection**: Yad2 may implement bot detection that could affect functionality
- **Rate Limiting**: Too many requests may trigger rate limiting
- **Sub-Model IDs**: Some sub-model IDs may not exist or change over time
- **404 Errors**: If a sub-model ID is incorrect, the extension will fallback to the main price list page

## 🔧 Troubleshooting

### If you see a 404 error page:
1. The sub-model ID for your vehicle might be incorrect
2. The extension will automatically fallback to the main Yad2 price list page
3. You can manually search for your vehicle on the main page

### If prices seem incorrect:
1. Check the browser console for error messages
2. The extension uses multiple fallback methods
3. Prices are extracted from Yad2's actual calculator when possible
4. The extension now properly fills the Yad2 calculator form and extracts the real calculated prices
5. Make sure the Yad2 calculator page loads completely before checking prices
6. The extension now correctly identifies form fields by their Hebrew labels ("מספר ק"מ", "מספר בעלים", "בעלות נוכחית")
7. The extension now handles Content Security Policy (CSP) restrictions properly
8. If you see CSP errors, the extension has been updated to work within these restrictions
9. The extension uses only safe JavaScript patterns that don't require 'unsafe-eval'
10. All setTimeout calls use arrow functions instead of function references to avoid CSP issues
11. Added extensive debug logging to track price fetching and Yad2 calculator interaction
12. Fixed multiple extraction issue by adding extraction flag to prevent duplicate runs
13. Added callback logging to track message sending to background script
14. Added try-catch block and additional flags to prevent multiple message sending
15. Added initialization flag and fallback message sending without callback to avoid port issues
16. Added retry mechanism for background script communication and service worker keep-alive
17. Added PING mechanism to wake up background script and verify it's running

### If multiple tabs are opening:
1. The extension now checks for existing Yad2 tabs before opening new ones
2. Only one Yad2 tab should be opened at a time
3. If you see multiple tabs, close them and try again

### If the extension shows "לא זוהה" (Not identified):
1. The vehicle data extraction might have failed
2. Check if the Bidspirit page has the required information
3. Try refreshing the page and opening the extension again

## 💡 Contribution

Pull requests, improvements, and feature ideas are welcome!  
Feel free to open issues or suggest enhancements.

## 📜 License

This project is released under the **MIT License**, allowing free and open usage, modification, and distribution — as long as attribution is maintained.

