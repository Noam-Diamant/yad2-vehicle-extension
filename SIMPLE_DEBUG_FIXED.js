// קובץ debug מתוקן - העתק והדבק ב-Console
// Fixed debug file - copy and paste in Console

console.log('=== Yad2 Extension Debug (Fixed) ===');
console.log('URL:', window.location.href);
console.log('Is Bidspirit:', window.location.hostname.includes('bidspirit.com'));
console.log('Is vehicle page:', window.location.pathname.includes('/ui/lotPage/'));

// נסה לחלץ נתונים ידנית (ללא chrome.storage)
function manualExtraction() {
    console.log('=== Manual Data Extraction ===');
    
    const extracted = {
        url: window.location.href,
        vehicleNumber: null,
        manufacturer: null,
        model: null,
        year: null,
        mileage: null,
        engine: null,
        trim: null
    };
    
    // בדוק URL
    const urlParts = window.location.pathname.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    console.log('Last URL part:', lastPart);
    
    if (lastPart && lastPart !== '?lang=he') {
        const decodedPart = decodeURIComponent(lastPart);
        console.log('Decoded:', decodedPart);
        const parts = decodedPart.split('-');
        console.log('Split parts:', parts);
        
        if (parts.length >= 2) {
            extracted.manufacturer = parts[0]; // קיה
            extracted.model = parts[1]; // פיקנטו
        }
    }
    
    // חפש מספר רכב
    const vehicleMatch = document.body.textContent.match(/(\d{3}-\d{2}-\d{3})/);
    console.log('Vehicle number match:', vehicleMatch);
    if (vehicleMatch) {
        extracted.vehicleNumber = vehicleMatch[1];
    }
    
    // חפש שנה
    const yearMatches = document.body.textContent.match(/\b(20\d{2})\b/g);
    console.log('Year matches:', yearMatches);
    if (yearMatches && yearMatches.length > 0) {
        extracted.year = parseInt(yearMatches[0]);
    }
    
    // חפש קילומטראז'
    const mileageMatch = document.body.textContent.match(/(\d{1,3}(?:,\d{3})*)\s*ק"מ/);
    console.log('Mileage match:', mileageMatch);
    if (mileageMatch) {
        extracted.mileage = parseInt(mileageMatch[1].replace(/,/g, ''));
    }
    
    // חפש נפח מנוע
    const engineMatch = document.body.textContent.match(/(\d{1,4})\s*סמ"ק/);
    console.log('Engine match:', engineMatch);
    if (engineMatch) {
        extracted.engine = parseInt(engineMatch[1]);
    }
    
    // חפש גימור
    const trimMatch = document.body.textContent.match(/גימור[:\s]*([A-Z0-9]+)/);
    console.log('Trim match:', trimMatch);
    if (trimMatch) {
        extracted.trim = trimMatch[1];
    }
    
    return extracted;
}

// הרץ את החילוץ
const extracted = manualExtraction();
console.log('=== EXTRACTED DATA ===');
console.log('Manufacturer:', extracted.manufacturer);
console.log('Model:', extracted.model);
console.log('Year:', extracted.year);
console.log('Vehicle Number:', extracted.vehicleNumber);
console.log('Mileage:', extracted.mileage);
console.log('Engine:', extracted.engine);
console.log('Trim:', extracted.trim);

console.log('=== Full Object ===');
console.log(extracted);

// בדוק אם יש מספיק נתונים
const hasEnoughData = extracted.vehicleNumber || (extracted.manufacturer && extracted.model && extracted.year);
console.log('Has enough data:', hasEnoughData);

if (hasEnoughData) {
    console.log('✅ SUCCESS: Data extraction working!');
} else {
    console.log('❌ PROBLEM: Not enough data extracted');
}

console.log('=== Next Steps ===');
console.log('1. If data extraction is working, the extension should work too');
console.log('2. Try clicking the extension icon now');
console.log('3. Check if the popup shows the extracted data');



