# Testing Instructions

## How to Test the Extension

### 1. Install the Updated Extension

1. Go to `chrome://extensions/`
2. Find your extension and click the refresh icon (🔄)
3. Or reload the extension folder if needed

### 2. Test on a Bidspirit Page

1. Go to the Kia Picanto page: `https://il.bidspirit.com/ui/lotPage/n-z-law/source/purchases/auction/62768/lot/19531/קיה-פיקנטו-מודל-2020-75-311-ק-מ?lang=he`
2. Click the extension icon
3. Check the popup for debug information

### 3. Debug Information

The popup now shows debug information that will help identify the issue:

- **URL**: Shows the current page URL
- **Data**: Shows what data was extracted (or null if none)

### 4. Browser Console Debugging

1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for messages starting with "Starting vehicle data extraction..."
4. Check for any error messages

### 5. Manual Debug Script

If the extension still doesn't work, you can run a manual debug script:

1. Open Developer Tools (F12)
2. Go to Console tab
3. Copy and paste the contents of `debug-content.js`
4. Press Enter to run it
5. Check the console output for detailed extraction information

### 6. Expected Data from Kia Picanto Page

Based on the image, the extension should extract:
- **Manufacturer**: קיה (from URL)
- **Model**: פיקנטו (from URL)
- **Year**: 2020 (from page content)
- **Vehicle Number**: 255-49-702 (from page content)
- **Mileage**: 75,311 (from "מד אוץ: 75,311 ק"מ")
- **Engine Size**: 1,248 (from "נפח מנוע: 1,248 סמ"ק")
- **Trim Level**: LX (from "גימור: LX")

### 7. Troubleshooting

If data extraction still fails:

1. **Check Console Logs**: Look for error messages
2. **Verify Page Structure**: Make sure the page has loaded completely
3. **Try Refresh**: Refresh the page and try again
4. **Check URL**: Make sure you're on a Bidspirit vehicle page

### 8. Report Results

Please report:
1. What debug information appears in the popup
2. Any console error messages
3. Whether the manual debug script works
4. What data (if any) was successfully extracted

## Expected Behavior

After the fix, the extension should:
1. ✅ Detect the Bidspirit page correctly
2. ✅ Extract vehicle data from the page
3. ✅ Show the data in the popup
4. ✅ Display mock price information (until Yad2 integration is complete)

## Next Steps

Once data extraction is working:
1. Test with other Bidspirit vehicle pages
2. Improve Yad2 price integration
3. Add more robust error handling
4. Optimize for different page layouts



