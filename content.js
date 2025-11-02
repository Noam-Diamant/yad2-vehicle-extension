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
            handsCount: null,
            condition: null,
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

            // Extract vehicle number (מספר רכב) - look in structured data FIRST
            console.log('🔍 Step 1: Searching for vehicle number in tables...');
            
            // First, try to find in table rows (most reliable)
            const tables = document.querySelectorAll('table, .table, [class*="table"]');
            for (const table of tables) {
                const rows = table.querySelectorAll('tr, .row, [class*="row"]');
                for (const row of rows) {
                    const text = row.textContent || '';
                    
                    // Look for "מספר רכב" row
                    if (text.includes('מספר רכב') || text.includes('מספר  רכב')) {
                        // Try format with dashes first (XX-XXX-XX)
                        let vehicleMatch = text.match(/(\d{2,3}-\d{2,3}-\d{2,3})/);
                        if (vehicleMatch) {
                            // Convert to 8-digit format by removing dashes
                            vehicleData.vehicleNumber = vehicleMatch[1].replace(/-/g, '');
                            console.log('✅ Found vehicle number in table row (with dashes):', vehicleMatch[1], '→', vehicleData.vehicleNumber);
                            break;
                        }
                        // Try 7-8 digit format
                        vehicleMatch = text.match(/(\d{7,8})/);
                        if (vehicleMatch) {
                            vehicleData.vehicleNumber = vehicleMatch[1];
                            console.log('✅ Found vehicle number in table row (no dashes):', vehicleData.vehicleNumber);
                            break;
                        }
                    }
                }
                if (vehicleData.vehicleNumber) break;
            }
            
            // If still not found, try contextual patterns in full page text
            if (!vehicleData.vehicleNumber) {
                console.log('⚠️ Step 2: Not found in tables, trying contextual patterns...');
                const contextualVehicleNumberPatterns = [
                    /מספר\s*רכב[:\s]*(\d{2,3}-\d{2,3}-\d{2,3})/gi,
                    /מספר\s*רכב[:\s]*(\d{7,8})/gi,
                    /רכב\s*מספר[:\s]*(\d{2,3}-\d{2,3}-\d{2,3})/gi,
                    /רכב\s*מספר[:\s]*(\d{7,8})/gi,
                ];
                
                for (const pattern of contextualVehicleNumberPatterns) {
                    const match = document.body.textContent.match(pattern);
                    if (match && match[1]) {
                        vehicleData.vehicleNumber = match[1].replace(/-/g, '');
                        console.log('✅ Found vehicle number (contextual):', match[1], '→', vehicleData.vehicleNumber);
                        break;
                    }
                }
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

            // Extract number of hands (יד נוכחית)
            const handsPatterns = [
                /יד\s*נוכחית[:\s]*([ראשונה|שנייה|שלישית|רביעית|חמישית|ששית|שביעית|שמינית|תשיעית|עשירית]+)/g,
                /([ראשונה|שנייה|שלישית|רביעית|חמישית|ששית|שביעית|שמינית|תשיעית|עשירית]+)\s*יד/g,
                /יד\s*([1-9]|10)/g
            ];
            
            for (const pattern of handsPatterns) {
                const match = document.body.textContent.match(pattern);
                if (match) {
                    const handsText = match[1] || match[0];
                    vehicleData.handsCount = parseHandsCount(handsText);
                    if (vehicleData.handsCount) {
                        console.log('Found hands count:', vehicleData.handsCount);
                        break;
                    }
                }
            }

            // Extract vehicle condition (מצב הרכב)
            const conditionPatterns = [
                /מצב\s*הרכב[:\s]*([^,\n]+)/g,
                /מצב[:\s]*([^,\n]+)/g,
                /([מצוין|טוב|בינוני|לא טוב|רע|משופץ|מקורי]+)/g
            ];
            
            for (const pattern of conditionPatterns) {
                const match = document.body.textContent.match(pattern);
                if (match && match[1]) {
                    const conditionText = match[1].trim();
                    if (isValidCondition(conditionText)) {
                        vehicleData.condition = conditionText;
                        console.log('Found condition:', vehicleData.condition);
                        break;
                    }
                }
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

            // Try to extract other data from structured data if available
            const allTables = document.querySelectorAll('table, .table, [class*="table"]');
            allTables.forEach(table => {
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
                    
                    // Vehicle number is now extracted above, no need to do it here
                });
            });

            console.log('Extracted vehicle data:', vehicleData);

        } catch (error) {
            console.error('Error extracting vehicle details:', error);
        }

        return vehicleData;
    }

    // Parse hands count from Hebrew text
    function parseHandsCount(handsText) {
        if (!handsText) return null;
        
        const text = handsText.toString().toLowerCase().trim();
        
        // Hebrew ordinal numbers
        const hebrewOrdinals = {
            'ראשונה': 1, 'שנייה': 2, 'שלישית': 3, 'רביעית': 4, 'חמישית': 5,
            'ששית': 6, 'שביעית': 7, 'שמינית': 8, 'תשיעית': 9, 'עשירית': 10
        };
        
        // Check for Hebrew ordinals
        for (const [hebrew, number] of Object.entries(hebrewOrdinals)) {
            if (text.includes(hebrew)) {
                return number;
            }
        }
        
        // Check for numeric values
        const numericMatch = text.match(/(\d+)/);
        if (numericMatch) {
            const num = parseInt(numericMatch[1]);
            return (num >= 1 && num <= 10) ? num : null;
        }
        
        return null;
    }

    // Check if condition text is valid
    function isValidCondition(conditionText) {
        if (!conditionText) return false;
        
        const validConditions = [
            'מצוין', 'מצוין מאוד', 'טוב', 'טוב מאוד', 'בינוני', 
            'לא טוב', 'רע', 'משופץ', 'מקורי', 'חדש'
        ];
        
        const text = conditionText.toLowerCase().trim();
        return validConditions.some(condition => text.includes(condition.toLowerCase()));
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

        // Send message to background script with retry mechanism
        sendMessageWithRetry(vehicleData, 0);

        console.log('Vehicle data sent to background script:', vehicleData);
    }

    // Flag to prevent multiple extractions
    let extractionRunning = false;
    let extractionCompleted = false;
    let messageSent = false;
    let isInitialized = false;

    // Send message to background with retry mechanism
    function sendMessageWithRetry(vehicleData, retryCount) {
        const maxRetries = 3;
        
        console.log(`Sending message to background script (attempt ${retryCount + 1}/${maxRetries + 1})...`);
        
        // First, try to wake up the background script
        if (retryCount === 0) {
            console.log('Attempting to wake up background script...');
            chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('Background script not responding to ping:', chrome.runtime.lastError);
                } else {
                    console.log('Background script responded to ping');
                }
            });
        }
        
        try {
            chrome.runtime.sendMessage({
                type: 'VEHICLE_DATA_EXTRACTED',
                data: vehicleData
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error sending message to background:', chrome.runtime.lastError);
                    
                    if (retryCount < maxRetries) {
                        console.log(`Retrying in 1 second... (${retryCount + 1}/${maxRetries})`);
                        setTimeout(() => {
                            sendMessageWithRetry(vehicleData, retryCount + 1);
                        }, 1000);
                    } else {
                        console.error('Max retries reached, giving up');
                    }
                } else {
                    console.log('Message sent successfully to background');
                    console.log('Background script response:', response);
                }
            });
        } catch (error) {
            console.error('Exception sending message to background:', error);
            
            if (retryCount < maxRetries) {
                console.log(`Retrying in 1 second... (${retryCount + 1}/${maxRetries})`);
                setTimeout(() => {
                    sendMessageWithRetry(vehicleData, retryCount + 1);
                }, 1000);
            } else {
                console.error('Max retries reached, giving up');
            }
        }
    }

    // Run extraction when page loads
    function runExtraction() {
        if (isInitialized) {
            console.log('Extension already initialized, skipping...');
            return;
        }
        
        if (extractionRunning || extractionCompleted || messageSent) {
            console.log('Extraction already running, completed, or message sent, skipping...');
            return;
        }
        
        isInitialized = true;
        extractionRunning = true;
        console.log('=== Yad2 Extension Starting ===');
        console.log('Page URL:', window.location.href);
        console.log('Page ready state:', document.readyState);
        
        // Wait a bit for page to fully load
        setTimeout(() => {
            console.log('Running vehicle data extraction...');
            sendVehicleData();
            extractionRunning = false;
            extractionCompleted = true;
            messageSent = true;
        }, 2000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runExtraction);
    } else {
        runExtraction();
    }

    // Re-run extraction if page content changes (for SPA navigation)
    // Use a debounce mechanism to prevent excessive extractions
    let extractionTimeout = null;
    let lastExtractionTime = 0;
    const EXTRACTION_COOLDOWN = 5000; // 5 seconds cooldown between extractions
    
    const observer = new MutationObserver((mutations) => {
        // Only trigger if significant content was added
        const hasSignificantChange = mutations.some(mutation => {
            return mutation.type === 'childList' && 
                   mutation.addedNodes.length > 0 &&
                   Array.from(mutation.addedNodes).some(node => 
                       node.nodeType === Node.ELEMENT_NODE && 
                       (node.classList?.contains('lot') || node.tagName === 'TABLE')
                   );
        });
        
        if (hasSignificantChange) {
            const now = Date.now();
            if (now - lastExtractionTime < EXTRACTION_COOLDOWN) {
                console.log('Extraction cooldown active, skipping...');
                return;
            }
            
            // Clear any pending extraction
            if (extractionTimeout) {
                clearTimeout(extractionTimeout);
            }
            
            // Schedule extraction with debounce
            extractionTimeout = setTimeout(() => {
                console.log('Re-extracting due to content changes...');
                lastExtractionTime = Date.now();
                sendVehicleData();
            }, 2000); // Wait 2 seconds for content to stabilize
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
