// קובץ debug פשוט - העתק והדבק ב-Console
// Simple debug file - copy and paste in Console

console.log('=== Yad2 Extension Debug ===');
console.log('URL:', window.location.href);
console.log('Is Bidspirit:', window.location.hostname.includes('bidspirit.com'));
console.log('Is vehicle page:', window.location.pathname.includes('/ui/lotPage/'));

// בדוק אם יש נתונים ב-storage
chrome.storage.local.get(['currentVehicleData', 'timestamp'], function(result) {
    console.log('Storage data:', result);
    if (result.currentVehicleData) {
        console.log('Vehicle data found:', result.currentVehicleData);
    } else {
        console.log('No vehicle data in storage');
    }
});

// נסה לחלץ נתונים ידנית
function manualExtraction() {
    console.log('=== Manual Data Extraction ===');
    
    // בדוק URL
    const urlParts = window.location.pathname.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    console.log('Last URL part:', lastPart);
    
    if (lastPart && lastPart !== '?lang=he') {
        const decodedPart = decodeURIComponent(lastPart);
        console.log('Decoded:', decodedPart);
        const parts = decodedPart.split('-');
        console.log('Split parts:', parts);
    }
    
    // חפש מספר רכב
    const vehicleMatch = document.body.textContent.match(/(\d{3}-\d{2}-\d{3})/);
    console.log('Vehicle number match:', vehicleMatch);
    
    // חפש שנה
    const yearMatches = document.body.textContent.match(/\b(20\d{2})\b/g);
    console.log('Year matches:', yearMatches);
    
    // חפש קילומטראז'
    const mileageMatch = document.body.textContent.match(/(\d{1,3}(?:,\d{3})*)\s*ק"מ/);
    console.log('Mileage match:', mileageMatch);
    
    // חפש נפח מנוע
    const engineMatch = document.body.textContent.match(/(\d{1,4})\s*סמ"ק/);
    console.log('Engine match:', engineMatch);
    
    // חפש גימור
    const trimMatch = document.body.textContent.match(/גימור[:\s]*([A-Z0-9]+)/);
    console.log('Trim match:', trimMatch);
    
    return {
        url: window.location.href,
        vehicleNumber: vehicleMatch ? vehicleMatch[1] : null,
        year: yearMatches ? yearMatches[0] : null,
        mileage: mileageMatch ? mileageMatch[1] : null,
        engine: engineMatch ? engineMatch[1] : null,
        trim: trimMatch ? trimMatch[1] : null
    };
}

// הרץ את החילוץ
const extracted = manualExtraction();
console.log('Extracted data:', extracted);

// שמור ב-storage לבדיקה
chrome.storage.local.set({
    currentVehicleData: extracted,
    timestamp: Date.now()
}, function() {
    console.log('Data saved to storage');
});

console.log('=== Debug Complete ===');
console.log('Now try clicking the extension icon!');




