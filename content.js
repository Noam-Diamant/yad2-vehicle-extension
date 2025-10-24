// Content script for Bidspirit pages
(function() {
    'use strict';

    // Check if we're on a Bidspirit vehicle page
    function isBidspiritVehiclePage() {
        return window.location.hostname.includes('bidspirit.com') && 
               window.location.pathname.includes('/ui/lotPage/');
    }

    // Extract vehicle details from the page
    function extractVehicleDetails() {
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

        try {
            console.log('Starting vehicle data extraction...');
            
            // Extract manufacturer and model from URL or page title
            const urlParts = window.location.pathname.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            if (lastPart && lastPart !== '?lang=he') {
                const decodedPart = decodeURIComponent(lastPart);
                const parts = decodedPart.split('-');
                if (parts.length >= 2) {
                    vehicleData.manufacturer = parts[0]; // קיה
                    vehicleData.model = parts[1]; // פיקנטו
                }
            }

            // Extract vehicle number (מספר רכב) - look for license plate pattern
            const vehicleNumberMatch = document.body.textContent.match(/(\d{3}-\d{2}-\d{3})/);
            if (vehicleNumberMatch) {
                vehicleData.vehicleNumber = vehicleNumberMatch[1];
            }

            // Extract year (שנת יצור) - look for year in various contexts
            const yearMatches = document.body.textContent.match(/\b(20\d{2})\b/g);
            if (yearMatches) {
                // Find the most likely year (prefer 2020 over 2025)
                const validYears = yearMatches
                    .map(str => parseInt(str))
                    .filter(year => year >= 1990 && year <= new Date().getFullYear() + 1)
                    .sort((a, b) => a - b); // Sort ascending to get older years first
                
                if (validYears.length > 0) {
                    vehicleData.year = validYears[0]; // Take the first (oldest) valid year
                }
            }

            // Extract mileage (מד אוץ/קילומטראז') - look for km patterns
            const mileagePatterns = [
                /(\d{1,3}(?:,\d{3})*)\s*ק"מ/g,
                /(\d{1,3}(?:,\d{3})*)\s*km/gi,
                /מד\s*אוץ[:\s]*(\d{1,3}(?:,\d{3})*)/g,
                /(\d{1,3}(?:,\d{3})*)\s*קילומטר/gi
            ];
            
            for (const pattern of mileagePatterns) {
                const match = document.body.textContent.match(pattern);
                if (match) {
                    const numberMatch = match[0].match(/(\d{1,3}(?:,\d{3})*)/);
                    if (numberMatch) {
                        vehicleData.mileage = parseInt(numberMatch[1].replace(/,/g, ''));
                        break;
                    }
                }
            }

            // Extract engine size (נפח מנוע) - look for cc patterns
            const enginePatterns = [
                /(\d{1,3}(?:,\d{3})*)\s*סמ"ק/g,  // Support comma-separated numbers
                /(\d{1,3}(?:,\d{3})*)\s*cc/gi,
                /נפח\s*מנוע[:\s]*(\d{1,3}(?:,\d{3})*)/g
            ];
            
            for (const pattern of enginePatterns) {
                const match = document.body.textContent.match(pattern);
                if (match) {
                    const numberMatch = match[0].match(/(\d{1,3}(?:,\d{3})*)/);
                    if (numberMatch) {
                        vehicleData.engineSize = parseInt(numberMatch[1].replace(/,/g, ''));
                        break;
                    }
                }
            }

            // Extract trim level (גימור)
            const trimMatch = document.body.textContent.match(/גימור[:\s]*([A-Z0-9]+)/);
            if (trimMatch) {
                vehicleData.trimLevel = trimMatch[1];
            }

            // Extract price - look for price patterns
            const pricePatterns = [
                /(\d{1,3}(?:,\d{3})*)\s*₪/g,
                /(\d{1,3}(?:,\d{3})*)\s*שקל/g,
                /(\d{1,3}(?:,\d{3})*)\s*NIS/gi
            ];
            
            for (const pattern of pricePatterns) {
                const match = document.body.textContent.match(pattern);
                if (match) {
                    const numberMatch = match[0].match(/(\d{1,3}(?:,\d{3})*)/);
                    if (numberMatch) {
                        vehicleData.price = parseInt(numberMatch[1].replace(/,/g, ''));
                        break;
                    }
                }
            }

            // Try to extract from structured data if available
            const tables = document.querySelectorAll('table, .table, [class*="table"]');
            tables.forEach(table => {
                const rows = table.querySelectorAll('tr, .row, [class*="row"]');
                rows.forEach(row => {
                    const text = row.textContent;
                    
                    // Look for year
                    if (text.includes('שנת') && !vehicleData.year) {
                        const yearMatch = text.match(/(\d{4})/);
                        if (yearMatch) {
                            const year = parseInt(yearMatch[1]);
                            if (year >= 1990 && year <= new Date().getFullYear() + 1) {
                                vehicleData.year = year;
                            }
                        }
                    }
                    
                    // Look for mileage
                    if ((text.includes('מד אוץ') || text.includes('קילומטר')) && !vehicleData.mileage) {
                        const mileageMatch = text.match(/(\d{1,3}(?:,\d{3})*)/);
                        if (mileageMatch) {
                            vehicleData.mileage = parseInt(mileageMatch[1].replace(/,/g, ''));
                        }
                    }
                    
                    // Look for vehicle number
                    if (text.includes('מספר רכב') && !vehicleData.vehicleNumber) {
                        const vehicleMatch = text.match(/(\d{3}-\d{2}-\d{3})/);
                        if (vehicleMatch) {
                            vehicleData.vehicleNumber = vehicleMatch[1];
                        }
                    }
                });
            });

            console.log('Extracted vehicle data:', vehicleData);

        } catch (error) {
            console.error('Error extracting vehicle details:', error);
        }

        return vehicleData;
    }

    // Send vehicle data to background script
    function sendVehicleData() {
        if (!isBidspiritVehiclePage()) {
            console.log('Not on a Bidspirit vehicle page');
            return;
        }

        console.log('Extracting vehicle data from Bidspirit page...');
        const vehicleData = extractVehicleDetails();
        
        // Store data for popup to access
        chrome.storage.local.set({ 
            currentVehicleData: vehicleData,
            timestamp: Date.now()
        });

        // Send message to background script
        chrome.runtime.sendMessage({
            type: 'VEHICLE_DATA_EXTRACTED',
            data: vehicleData
        });

        console.log('Vehicle data sent to background script:', vehicleData);
    }

    // Run extraction when page loads
    function runExtraction() {
        console.log('=== Yad2 Extension Starting ===');
        console.log('Page URL:', window.location.href);
        console.log('Page ready state:', document.readyState);
        
        // Wait a bit for page to fully load
        setTimeout(() => {
            console.log('Running vehicle data extraction...');
            sendVehicleData();
        }, 2000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runExtraction);
    } else {
        runExtraction();
    }

    // Re-run extraction if page content changes (for SPA navigation)
    const observer = new MutationObserver((mutations) => {
        let shouldReExtract = false;
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                shouldReExtract = true;
            }
        });
        
        if (shouldReExtract) {
            setTimeout(sendVehicleData, 1000); // Delay to let content load
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'REQUEST_VEHICLE_DATA') {
            sendVehicleData();
            sendResponse({ success: true });
        }
    });

})();
