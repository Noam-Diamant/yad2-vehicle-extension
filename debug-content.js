// Debug script to test data extraction on Bidspirit pages
// Run this in the browser console to test the extraction logic

(function() {
    'use strict';

    console.log('=== Yad2 Extension Debug Script ===');
    console.log('Current URL:', window.location.href);
    console.log('Is Bidspirit page:', window.location.hostname.includes('bidspirit.com') && window.location.pathname.includes('/ui/lotPage/'));

    // Test the extraction function
    function debugExtractVehicleDetails() {
        const vehicleData = {
            vehicleNumber: null,
            manufacturer: null,
            model: null,
            year: null,
            trimLevel: null,
            mileage: null,
            engineSize: null,
            price: null,
            url: window.location.href
        };

        console.log('=== Testing Vehicle Data Extraction ===');

        // Test URL parsing
        const urlParts = window.location.pathname.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        console.log('URL parts:', urlParts);
        console.log('Last part:', lastPart);
        
        if (lastPart && lastPart !== '?lang=he') {
            const decodedPart = decodeURIComponent(lastPart);
            console.log('Decoded part:', decodedPart);
            const parts = decodedPart.split('-');
            console.log('Split parts:', parts);
            if (parts.length >= 2) {
                vehicleData.manufacturer = parts[0];
                vehicleData.model = parts[1];
                console.log('From URL - Manufacturer:', vehicleData.manufacturer, 'Model:', vehicleData.model);
            }
        }

        // Test vehicle number extraction
        const vehicleNumberMatch = document.body.textContent.match(/(\d{3}-\d{2}-\d{3})/);
        if (vehicleNumberMatch) {
            vehicleData.vehicleNumber = vehicleNumberMatch[1];
            console.log('Vehicle number found:', vehicleData.vehicleNumber);
        } else {
            console.log('No vehicle number found');
        }

        // Test year extraction
        const yearMatches = document.body.textContent.match(/\b(20\d{2})\b/g);
        console.log('All year matches:', yearMatches);
        if (yearMatches) {
            for (const yearStr of yearMatches) {
                const year = parseInt(yearStr);
                if (year >= 1990 && year <= new Date().getFullYear() + 1) {
                    vehicleData.year = year;
                    console.log('Valid year found:', vehicleData.year);
                    break;
                }
            }
        }

        // Test mileage extraction
        const mileagePatterns = [
            /(\d{1,3}(?:,\d{3})*)\s*ק"מ/g,
            /(\d{1,3}(?:,\d{3})*)\s*km/gi,
            /מד\s*אוץ[:\s]*(\d{1,3}(?:,\d{3})*)/g,
            /(\d{1,3}(?:,\d{3})*)\s*קילומטר/gi
        ];
        
        console.log('Testing mileage patterns...');
        for (let i = 0; i < mileagePatterns.length; i++) {
            const pattern = mileagePatterns[i];
            const match = document.body.textContent.match(pattern);
            console.log(`Pattern ${i + 1}:`, pattern, 'Match:', match);
            if (match) {
                const numberMatch = match[0].match(/(\d{1,3}(?:,\d{3})*)/);
                if (numberMatch) {
                    vehicleData.mileage = parseInt(numberMatch[1].replace(/,/g, ''));
                    console.log('Mileage found:', vehicleData.mileage);
                    break;
                }
            }
        }

        // Test engine size extraction
        const enginePatterns = [
            /(\d{1,4})\s*סמ"ק/g,
            /(\d{1,4})\s*cc/gi,
            /נפח\s*מנוע[:\s]*(\d{1,4})/g
        ];
        
        console.log('Testing engine patterns...');
        for (let i = 0; i < enginePatterns.length; i++) {
            const pattern = enginePatterns[i];
            const match = document.body.textContent.match(pattern);
            console.log(`Engine pattern ${i + 1}:`, pattern, 'Match:', match);
            if (match) {
                const numberMatch = match[0].match(/(\d{1,4})/);
                if (numberMatch) {
                    vehicleData.engineSize = parseInt(numberMatch[1]);
                    console.log('Engine size found:', vehicleData.engineSize);
                    break;
                }
            }
        }

        // Test trim level extraction
        const trimMatch = document.body.textContent.match(/גימור[:\s]*([A-Z0-9]+)/);
        if (trimMatch) {
            vehicleData.trimLevel = trimMatch[1];
            console.log('Trim level found:', vehicleData.trimLevel);
        }

        // Test structured data extraction
        console.log('Testing structured data extraction...');
        const tables = document.querySelectorAll('table, .table, [class*="table"]');
        console.log('Found tables:', tables.length);
        
        tables.forEach((table, index) => {
            console.log(`Table ${index + 1}:`, table);
            const rows = table.querySelectorAll('tr, .row, [class*="row"]');
            console.log(`  Rows in table ${index + 1}:`, rows.length);
            
            rows.forEach((row, rowIndex) => {
                const text = row.textContent;
                console.log(`  Row ${rowIndex + 1}:`, text);
            });
        });

        console.log('=== Final Extracted Data ===');
        console.log(vehicleData);
        
        return vehicleData;
    }

    // Run the debug extraction
    const extractedData = debugExtractVehicleDetails();
    
    // Test if data would be considered valid
    const hasRequiredData = extractedData && (extractedData.vehicleNumber || (extractedData.manufacturer && extractedData.model && extractedData.year));
    console.log('Has required data:', hasRequiredData);
    
    if (!hasRequiredData) {
        console.log('❌ Data extraction failed - not enough data found');
    } else {
        console.log('✅ Data extraction successful');
    }

    // Make the function available globally for manual testing
    window.debugVehicleExtraction = debugExtractVehicleDetails;

})();




