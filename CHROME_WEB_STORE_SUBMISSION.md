# Chrome Web Store Submission Guide

## 📦 Before Submitting

### 1. Create a ZIP Package
```bash
# From the project directory, create a zip file containing ONLY these files:
- manifest.json
- background.js
- popup.js, popup.html, popup.css
- content.js
- yad2-content.js
- yad2-post-content.js
- icons/ (folder with all icons)
```

**PowerShell Command:**
```powershell
Compress-Archive -Path manifest.json,background.js,popup.js,popup.html,popup.css,content.js,yad2-content.js,yad2-post-content.js,icons -DestinationPath yad2-extension-v2.0.0.zip
```

### 2. Verify Package Contents
- Open the ZIP and ensure no extra files (README, .git, etc.)
- Test the extension by loading it from the ZIP in Chrome

---

## 🚀 Submission Process

### Step 1: Chrome Web Store Developer Account
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with your Google account
3. **Pay one-time registration fee: $5 USD** (if not already paid)
4. Accept the Developer Agreement

### Step 2: Create New Item (First Time) or Update Existing

#### For NEW Extension:
1. Click **"New Item"** button
2. Upload your ZIP file (`yad2-extension-v2.0.0.zip`)
3. Wait for upload to complete

#### For EXISTING Extension (Update):
1. Find your extension in the dashboard
2. Click on it to open
3. Click **"Package"** tab on the left
4. Click **"Upload new package"**
5. Upload your new ZIP file

### Step 3: Fill Out Store Listing

#### **Product Details**
- **Extension Name**: `Yad2 Vehicle Price Extension`
- **Summary** (132 characters max):
  ```
  Auto-extracts vehicle data from Bidspirit & Yad2, calculates weighted prices instantly via Yad2 price calculator.
  ```
- **Description** (detailed, up to 16,000 characters):
  ```
  Yad2 Vehicle Price Extension helps you quickly get accurate vehicle price estimates by automatically extracting vehicle information and calculating weighted prices using Yad2's official price calculator.

  KEY FEATURES:
  
  ✅ Bidspirit Integration
  - Auto-extracts vehicle details (manufacturer, model, year, mileage, hands, vehicle number)
  - One-click button to open Yad2 calculator
  - Automatically fills calculator form with extracted data
  - Displays weighted price and price range
  
  ✅ Yad2 Listing Assistant
  - Detects Yad2 vehicle posts automatically
  - Extracts km and hand count from structured page data
  - Auto-clicks "למחירון" button for you
  - Fast-fill mode with accurate data extraction
  
  ✅ Smart Features
  - Intelligent tab reuse (switches to existing tab for same vehicle)
  - Supports 500+ vehicle models via built-in dictionary
  - Automatic scrolling to show weighted price results
  - Works seamlessly with both Bidspirit auctions and Yad2 listings
  
  HOW TO USE:
  
  From Bidspirit:
  1. Visit any Bidspirit vehicle page
  2. Click the extension icon
  3. Click "פתח מחשבון יד2"
  4. Extension automatically fills and calculates price
  
  From Yad2 Listings:
  1. Visit any Yad2 vehicle listing
  2. Click the extension icon
  3. Click "פתח מחשבון יד2"
  4. Extension clicks "למחירון" and fills data automatically
  
  PRIVACY:
  - No data collection
  - All processing happens locally
  - No external servers
  - No tracking or analytics
  
  Perfect for car buyers, dealers, and anyone looking to quickly assess vehicle values in the Israeli market.
  ```

- **Category**: `Productivity` or `Shopping`
- **Language**: `Hebrew` (primary) + `English` (secondary)

#### **Graphics Assets** (Required)

You need to create these images:

1. **Icon** (already have in `icons/` folder):
   - 128x128 pixels ✅ (you have this)

2. **Screenshots** (REQUIRED - at least 1, max 5):
   - **Size**: 1280x800 or 640x400 pixels
   - **Content**: Show the extension in action
   - Suggested screenshots:
     - Extension popup on Bidspirit page
     - Yad2 calculator being auto-filled
     - Extension popup on Yad2 listing page
     - Weighted price results displayed

3. **Promotional Tile** (Small - REQUIRED):
   - **Size**: 440x280 pixels
   - Show extension icon + name + tagline

4. **Marquee Promotional Tile** (Optional):
   - **Size**: 1400x560 pixels

#### **Additional Fields**
- **Official URL**: `https://github.com/Noam-Diamant/yad2-vehicle-extension`
- **Support Email**: Your email address (REQUIRED)
- **Privacy Policy**: Required if you collect any data (you don't, so you can say "This extension does not collect user data")

### Step 4: Privacy Settings

1. **Single Purpose**: 
   ```
   Automatically extracts vehicle information from Bidspirit and Yad2 pages and calculates weighted prices using Yad2's price calculator.
   ```

2. **Permission Justification**:
   - **activeTab**: Required to read vehicle information from Bidspirit and Yad2 pages
   - **storage**: Required to temporarily store vehicle data for transfer between pages
   - **Host permissions (bidspirit.com, yad2.co.il)**: Required to access and interact with vehicle listings and price calculator

3. **Data Usage**:
   - ✅ Check "This item does not collect user data"

### Step 5: Distribution Settings

- **Visibility**: Public or Unlisted (your choice)
- **Regions**: Select countries (recommend: Israel + worldwide)
- **Pricing**: Free

### Step 6: Submit for Review

1. Click **"Submit for Review"**
2. Chrome will review your extension (usually 1-3 business days)
3. You'll receive email notification when:
   - Review is complete
   - Extension is published
   - Any issues are found

---

## 📋 Review Checklist

Before submitting, ensure:
- ✅ Version is 2.0.0 in manifest.json
- ✅ All icons are present (16x16, 48x48, 128x128)
- ✅ Extension tested in Chrome with no errors
- ✅ All console.log statements cleaned up
- ✅ No sensitive information in code
- ✅ manifest.json is valid
- ✅ Description clearly explains permissions
- ✅ Screenshots are high quality
- ✅ Support email is valid

---

## ⚠️ Common Rejection Reasons

**Avoid these issues:**
1. Missing or unclear privacy policy
2. Excessive permissions without justification
3. Poor quality screenshots
4. Misleading description
5. Trademarked terms in name (be careful with "Yad2")
6. Code obfuscation or minification (use readable code)

---

## 🔄 After Approval

1. Extension will be live on Chrome Web Store
2. Users can install with one click
3. Auto-updates will be pushed when you upload new versions
4. Monitor reviews and respond to user feedback

---

## 📊 Update Process (For Future Versions)

1. Update version in `manifest.json` (e.g., 2.0.0 → 2.1.0)
2. Make your code changes
3. Create new ZIP package
4. Go to Developer Dashboard → Your Extension → Package
5. Upload new package
6. Submit for review
7. Usually approved within hours for updates (faster than initial submission)

---

## 💡 Tips

- **Screenshots**: Use Hebrew UI in screenshots since it's for Israeli market
- **Description**: Include both Hebrew and English for wider audience
- **Support**: Respond to user reviews quickly to maintain good ratings
- **Updates**: Release updates regularly to show active maintenance
- **Analytics**: Consider adding Google Analytics (with user permission) to track usage

---

## 🔗 Useful Links

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Chrome Extension Developer Policies](https://developer.chrome.com/docs/webstore/program-policies)
- [Publishing Guidelines](https://developer.chrome.com/docs/webstore/publish)
- [Best Practices](https://developer.chrome.com/docs/webstore/best_practices)

---

**Good luck with your submission! 🚀**

