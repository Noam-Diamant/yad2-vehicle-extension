# Developer Guide - Yad2 Vehicle Price Extension

This guide contains technical documentation, publishing instructions, and maintenance information for developers.

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
├── icon16.png            # Extension icons (16x16, 48x48, 128x128)
├── icon48.png
├── icon128.png
├── README.md              # User-facing documentation
└── DEVELOPER.md          # This file!
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

---

## 📦 Publishing to Chrome Web Store

### Prerequisites

1. **Google Account** - You'll need a Google account
2. **Developer Fee** - One-time $5 registration fee
3. **High-quality assets** - Icons, screenshots, promotional images
4. **Privacy policy** - Not required for this extension (no data collection)

### Step 1: Prepare Your Extension Package

**Required files for the package:**
- `manifest.json`
- `background.js`
- `content.js`
- `yad2-content.js`
- `popup.html`
- `popup.js`
- `popup.css`
- `icon16.png`, `icon48.png`, `icon128.png`

**Remove before packaging:**
- `.git` folder
- `DEVELOPER.md` (keep README.md)
- `node_modules` (if any)
- `.DS_Store`, `Thumbs.db`
- Any test files or documentation

**Create ZIP file:**
```bash
# Zip the extension folder
zip -r yad2-vehicle-extension.zip yad2-vehicle-extension/
```

Or on Windows:
- Right-click the folder
- Select "Send to" → "Compressed (zipped) folder"

### Step 2: Register as Chrome Web Store Developer

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with your Google account
3. Accept the Developer Agreement
4. Pay the one-time $5 registration fee
5. Wait for account activation (usually instant)

### Step 3: Create Required Assets

#### Extension Icons (Required)
You need icons in these sizes:
- **16x16 px** - Toolbar icon (small)
- **48x48 px** - Extension management page
- **128x128 px** - Chrome Web Store listing

#### Store Listing Assets
- **Small tile icon**: 440x280 px (PNG)
- **Marquee promotional image**: 1400x560 px (PNG) - optional but recommended
- **Screenshots**: At least 1, up to 5 screenshots
  - Must be: **1280x800 px** or **640x400 px** (16:10 ratio)
  - Or: **800x1280 px** or **400x640 px** (10:16 ratio)
  - Format: JPEG or 24-bit PNG (no alpha)

#### Screenshot Tips
1. Show the popup with vehicle data
2. Show the Yad2 page being auto-filled
3. Show the calculated prices
4. Use clean, professional screenshots
5. Consider adding annotations/arrows to highlight features

#### Quick Screenshot Creation
1. **Use Chrome DevTools**: Press F12 → Device Toolbar (Ctrl+Shift+M)
2. **Set dimensions**: Enter exactly 1280x800
3. **Capture**: Windows (Win+Shift+S), Mac (Cmd+Shift+4)

#### Icon Creation Tools
- **Canva** (easiest) - https://www.canva.com
- **Figma** (professional) - https://www.figma.com
- **GIMP** (free Photoshop alternative)
- **Photopea** (free, web-based) - https://www.photopea.com

**Simple icon ideas:**
- Car icon 🚗 + calculator 🧮
- Yad2 colors (orange) + Bidspirit theme
- Israeli flag colors 🇮🇱
- Simple, recognizable design

### Step 4: Upload to Chrome Web Store

1. **Go to Developer Dashboard**
   - Visit: https://chrome.google.com/webstore/devconsole

2. **Click "New Item"**
   - Upload your `.zip` file
   - Wait for validation (instant)

3. **Fill in Store Listing**

#### Required Fields:

**Extension Name**: (max 45 characters)
```
Yad2 Vehicle Price Helper for Bidspirit
```

**Summary**: (max 132 characters)
```
Get real Yad2 prices for Bidspirit vehicles with one click. Auto-fills calculator, extracts weighted prices instantly.
```

**Detailed Description**:
```
Yad2 Vehicle Price Helper seamlessly integrates Yad2's official price calculator with Bidspirit vehicle listings.

✨ KEY FEATURES:
• One-click price lookup - No manual searching
• Auto-extracts vehicle data from Bidspirit pages
• Opens and auto-fills Yad2 calculator
• Gets real weighted prices (מחיר משוקלל) and price ranges
• Lightning fast - Results in 4-6 seconds
• Clean, modern Hebrew interface

🚀 HOW IT WORKS:
1. Browse any vehicle on Bidspirit
2. Click the extension icon
3. Press "פתח מחשבון יד2"
4. Watch the magic happen automatically!

🔒 PRIVACY:
• No data collection
• No external servers
• All processing happens locally
• Only accesses public data

Perfect for car buyers, dealers, and anyone shopping on Bidspirit who wants accurate Yad2 pricing instantly!
```

**Category**: "Shopping" or "Productivity"

**Language**: Hebrew (עברית) as primary, English as secondary

### Step 5: Privacy Settings

Navigate to the **"Privacy Practices"** tab and fill in:

#### Single Purpose Description:
```
תוסף זה עוזר למשתמשים לקבל הערכת מחיר מדויקת מיד2 בעת גלישה ברשימות רכב באתר Bidspirit.
```

(English: This extension helps users get accurate vehicle price estimates from Yad2 when browsing Bidspirit auction listings.)

#### Permission Justifications:

**`activeTab` Permission:**
```
התוסף משתמש בהרשאה זו כדי לחלץ את פרטי הרכב (יצרן, דגם, שנה, קילומטראז', יד) מעמוד ה-Bidspirit הפעיל כאשר המשתמש לוחץ על אייקון התוסף. אין שימוש בכרטיסייה אלא כשהמשתמש מפעיל את התוסף באופן אקטיבי.
```

(English: To extract vehicle data from the current Bidspirit page when the user clicks the extension icon.)

**`storage` Permission:**
```
התוסף שומר זמנית את פרטי הרכב שחולצו (יצרן, דגם, שנה וכו') במטמון המקומי של הדפדפן כדי להציג אותם בחלון הקופץ של התוסף. כל הנתונים נשמרים רק במחשב של המשתמש ולא נשלחים לשרתים חיצוניים.
```

(English: To temporarily store vehicle data for display in popup. All data stays on user's device.)

**`scripting` Permission:**
```
התוסף משתמש בהרשאה זו כדי לבצע אוטומציה בעמוד המחשבון של יד2 - למלא שדות טופס (קילומטר, יד), ללחוץ על כפתור החישוב, ולחלץ את תוצאות המחיר המחושבות. זה מאפשר למשתמש לקבל מחירים אמיתיים מיד2 בלי להזין ידנית.
```

(English: To interact with Yad2 calculator page - fill forms, click buttons, extract calculated prices.)

**Host Permissions (`*.bidspirit.com`, `*.yad2.co.il`):**
```
התוסף זקוק לגישה ל:
• *.bidspirit.com - כדי לחלץ פרטי רכב מעמודי המכירות הפומביות
• *.yad2.co.il - כדי לפתוח את עמוד המחשבון, למלא פרטים, ולחלץ את המחיר המחושב

כל הגישה היא רק לנתונים ציבוריים הזמינים באתרים אלו.
```

(English: To access Bidspirit for data extraction and Yad2 for price calculation. Only public data is accessed.)

**Remote Code Usage:**
Select: **"התוסף לא משתמש בקוד מרוחק"** (The extension does not use remote code)

#### Data Usage Certification:
- ✅ Select: "Does not collect user data"
- ✅ Check the box confirming compliance with program policies

### Step 6: Distribution Settings

- **Visibility**: Public (searchable in store) or Unlisted (direct link only)
- **Regions**: Select Israel (and other regions if desired)
- **Pricing**: Free

### Step 7: Account Settings

1. **Email Address**: Enter your contact email in the "Account" tab
2. **Email Verification**: Check your email and click the verification link
3. **Return to dashboard** after verification

### Step 8: Submit for Review

1. Review all information
2. Click **"שמירת טיוטה"** (Save Draft) to save your work
3. Once all requirements are met, click **"Submit for Review"**
4. Review typically takes **1-3 business days**
5. You'll receive an email when it's approved or if changes are needed

---

## 📊 Post-Publication

### What Happens Next

- **Automated checks** run immediately (manifest validation, malware scan)
- **Manual review** by Google (1-3 days typically)
- **Email notification** of approval or rejection
- If rejected, you can make changes and resubmit

### Common Rejection Reasons

- Misleading functionality description
- Insufficient screenshots/images
- Permissions not properly justified
- Privacy policy missing (if data is collected)
- **Trademark issues** (using Yad2/Bidspirit names - see below)

### Updating Your Extension

1. Make changes to your code
2. **Increment version number** in `manifest.json` (e.g., 1.0.0 → 1.0.1)
3. Create new ZIP file
4. Upload to Developer Dashboard
5. Submit updated version for review

### Monitoring Performance

- Check **weekly active users** in dashboard
- Read **user reviews** regularly
- **Respond to feedback** promptly
- Fix bugs and add features based on feedback

---

## ⚠️ Important Considerations

### Trademark & Branding

- **"Yad2" and "Bidspirit" are trademarked names**
- Consider renaming to: "Price Helper for Auto Auctions" or similar
- Add disclaimer: "Not affiliated with Yad2 or Bidspirit"
- Google may reject if they receive trademark complaints
- Alternative names:
  - "Auto Price Calculator Helper"
  - "Vehicle Price Lookup Extension"
  - "Car Auction Price Assistant"

### Terms of Service

- Ensure your extension doesn't violate Yad2 or Bidspirit ToS
- Consider adding rate limiting to avoid server overload
- Be respectful of their platforms
- Monitor for any cease-and-desist requests

### Maintenance

- **Monitor for website changes**: Yad2 or Bidspirit may update their structure
- **Update promptly** when changes occur
- **Respond to user feedback** quickly
- **Keep the extension secure** and up-to-date
- **Test regularly** on real Bidspirit pages

---

## 📊 Estimated Timeline & Costs

### Timeline

| Task | Time |
|------|------|
| Create icons & screenshots | 2-4 hours |
| Create developer account | 15 minutes |
| Fill listing details | 30-60 minutes |
| Review process | 1-3 business days |
| **Total** | **1-4 days** |

### Costs

- **Developer registration**: $5 (one-time, lifetime)
- **Maintenance**: Free (your time)
- **Optional**: Designer for professional assets ($20-100)

---

## 🔗 Helpful Resources

### Chrome Web Store
- [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Publishing Guide](https://developer.chrome.com/docs/webstore/publish/)
- [Program Policies](https://developer.chrome.com/docs/webstore/program-policies/)
- [Store Listing Guidelines](https://developer.chrome.com/docs/webstore/cws-dashboard-listing/)
- [Image Guidelines](https://developer.chrome.com/docs/webstore/images/)

### Chrome Extension Development
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Service Workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/)

### Design Tools
- [Canva](https://www.canva.com) - Easy icon & screenshot creation
- [Figma](https://www.figma.com) - Professional design tool
- [Photopea](https://www.photopea.com) - Free online Photoshop
- [GIMP](https://www.gimp.org) - Free Photoshop alternative

---

## 🐛 Debugging & Testing

### Console Logs

The extension logs extensively for debugging:

**Bidspirit page (content.js):**
- Vehicle data extraction
- MutationObserver triggers
- Message sending to background

**Yad2 page (yad2-content.js):**
- Form field detection
- Auto-scroll button clicks
- Calculate button clicks
- Price extraction attempts

**Background script:**
- Message handling
- Tab management
- Data storage

### Testing Checklist

- [ ] Extension installs without errors
- [ ] Icon appears in toolbar
- [ ] Popup opens on Bidspirit pages
- [ ] Vehicle data extracts correctly
- [ ] Button click opens Yad2 tab
- [ ] Form fields fill automatically
- [ ] Calculate button is clicked
- [ ] Prices are extracted correctly
- [ ] No duplicate tabs open
- [ ] No console errors

---

## 📝 Version History

### v1.0.0 (Current)
- Initial release
- User-initiated Yad2 opening
- Auto-scroll to form
- Intelligent form filling
- Real-time price extraction
- Performance optimizations (4-6s total time)

---

## 🤝 Contributing

If you want to contribute to development:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📧 Support

For technical issues or questions:
- Open a GitHub Issue
- Check console logs for errors
- Include browser version and error messages

---

**Good luck with publishing!** 🚀

---

*Last updated: November 2024*

