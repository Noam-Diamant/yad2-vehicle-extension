// Content script for Yad2 price calculator
(function() {
    'use strict';

    // Check if we're on Yad2 price calculator page
    function isYad2PriceCalculator() {
        return window.location.hostname.includes('yad2.co.il') && 
               window.location.pathname.includes('/price-list/sub-model/');
    }

    // Watch for price results to appear (using MutationObserver)
    function watchForPriceResults() {
        console.log('👀 Starting to watch for price results...');
        
        let hasExtracted = false;
        const observer = new MutationObserver((mutations) => {
            // Check if mutations contain price-related text
            for (const mutation of mutations) {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const targetText = mutation.target.textContent || '';
                    
                    // Check if we see price-related text
                    if ((targetText.includes('משוקלל') || targetText.includes('טווח') || targetText.includes('מחיר')) && 
                        /\d{2,3},\d{3}/.test(targetText)) {
                        
                        if (!hasExtracted) {
                            console.log('🎯 Price content detected in DOM mutation! Extracting...');
                            hasExtracted = true;
                            
                            // Wait a tiny bit for rendering to complete
                            setTimeout(() => {
                                extractPriceData();
                                // Disconnect observer after first successful extraction
                                observer.disconnect();
                                console.log('✅ Observer disconnected');
                            }, 500);
                        }
                        break;
                    }
                }
            }
        });
        
        // Start observing the entire body for changes
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            characterDataOldValue: false
        });
        
        // Stop observing after 10 seconds
        setTimeout(() => {
            observer.disconnect();
            console.log('⏰ Observer timeout reached, disconnected');
        }, 10000);
    }

    // Extract price data from Yad2 calculator
    function extractPriceData() {
        if (!isYad2PriceCalculator()) {
            return null;
        }

        console.log('🔍 Extracting price data from Yad2 calculator...');

        const priceData = {
            basePrice: null,
            weightedPrice: null,
            priceRange: null,
            source: 'yad2_calculator'
        };

        try {
            // Get all text content from the page
            const pageText = document.body.textContent;
            console.log('Page text length:', pageText.length);
            
            // Log sample of page text for debugging
            const sampleText = pageText.substring(0, 500);
            console.log('Page text sample:', sampleText);
            
            // Also try to find prices in specific elements (more reliable)
            const allElements = document.querySelectorAll('*');
            console.log('Searching through', allElements.length, 'elements for prices');
            
            // Log if we can see key Hebrew terms on the page
            const hasWeightedPrice = pageText.includes('משוקלל') || pageText.includes('מחיר משוקלל');
            const hasPriceRange = pageText.includes('טווח') || pageText.includes('מינימום');
            console.log('Page contains "משוקלל":', hasWeightedPrice);
            console.log('Page contains "טווח":', hasPriceRange);

            // Look for base price (מחיר בסיס)
            const basePricePatterns = [
                /מחיר\s*בסיס[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                /Base\s*Price[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                /₪\s*(\d{1,3}(?:,\d{3})*)\s*מחיר\s*בסיס/g
            ];

            for (const pattern of basePricePatterns) {
                const match = pageText.match(pattern);
                if (match && match[1]) {
                    priceData.basePrice = parseInt(match[1].replace(/,/g, ''));
                    console.log('Found base price:', priceData.basePrice);
                    break;
                }
            }

            // Look for weighted price (מחיר מחירון משוקלל) - this is the most important
            // First try to find it in specific elements (more reliable after calculation)
            const priceElements = document.querySelectorAll('div, span, p, h1, h2, h3, h4');
            for (const element of priceElements) {
                const text = element.textContent || '';
                // Look for "מחיר משוקלל" followed by a price
                if (text.includes('מחיר משוקלל') || text.includes('מחיר מחירון משוקלל')) {
                    const priceMatch = text.match(/₪?\s*(\d{1,3}(?:,\d{3})+)/);
                    if (priceMatch) {
                        const price = parseInt(priceMatch[1].replace(/,/g, ''));
                        if (price > 10000 && price < 1000000) {
                            priceData.weightedPrice = price;
                            console.log('✅ Found weighted price in element:', priceData.weightedPrice);
                            break;
                        }
                    }
                }
            }
            
            // Fallback to regex patterns
            if (!priceData.weightedPrice) {
                const weightedPricePatterns = [
                    /מחיר\s*מחירון\s*משוקלל[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                    /מחיר\s*משוקלל[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                    /Weighted\s*Price[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                    /₪\s*(\d{1,3}(?:,\d{3})*)\s*מחיר\s*משוקלל/g
                ];

                for (const pattern of weightedPricePatterns) {
                    const match = pageText.match(pattern);
                    if (match && match[1]) {
                        priceData.weightedPrice = parseInt(match[1].replace(/,/g, ''));
                        console.log('Found weighted price (regex):', priceData.weightedPrice);
                        break;
                    }
                }
            }

            // Look for price range (טווח מחירים)
            // First look in elements for "טווח"
            console.log('🔍 Looking for price range (טווח)...');
            for (const element of priceElements) {
                const text = element.textContent || '';
                if (text.includes('טווח') || text.includes('מינימום') || text.includes('מקסימום')) {
                    console.log(`Found element with range keyword: "${text.substring(0, 100)}"`);
                    // Look for two prices with a dash between them
                    const rangeMatch = text.match(/₪?\s*(\d{1,3}(?:,\d{3})+)\s*[-–]\s*₪?\s*(\d{1,3}(?:,\d{3})+)/);
                    if (rangeMatch) {
                        const minPrice = parseInt(rangeMatch[1].replace(/,/g, ''));
                        const maxPrice = parseInt(rangeMatch[2].replace(/,/g, ''));
                        console.log(`Range match found: ${minPrice} - ${maxPrice}`);
                        if (minPrice > 10000 && maxPrice > minPrice && maxPrice < 1000000) {
                            priceData.priceRange = { min: minPrice, max: maxPrice };
                            console.log('✅ Found price range in element:', priceData.priceRange);
                            break;
                        }
                    } else {
                        console.log('No range match in text');
                    }
                }
            }
            
            if (!priceData.priceRange) {
                console.log('❌ Price range not found in elements');
            }
            
            // Fallback to regex patterns
            if (!priceData.priceRange) {
                const rangePatterns = [
                    /טווח[^₪]*₪?\s*(\d{1,3}(?:,\d{3})+)\s*[-–]\s*₪?\s*(\d{1,3}(?:,\d{3})+)/g,
                    /מינימום[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)[^0-9]*מקסימום[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                    /מינ[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)[^0-9]*מקס[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                    /Min[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)[^0-9]*Max[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                    /₪\s*(\d{1,3}(?:,\d{3})*)\s*[-–]\s*₪\s*(\d{1,3}(?:,\d{3})*)/g
                ];

                for (const pattern of rangePatterns) {
                    const match = pageText.match(pattern);
                    if (match && match[1] && match[2]) {
                        const minPrice = parseInt(match[1].replace(/,/g, ''));
                        const maxPrice = parseInt(match[2].replace(/,/g, ''));
                        if (minPrice > 10000 && maxPrice > minPrice && maxPrice < 1000000) {
                            priceData.priceRange = { min: minPrice, max: maxPrice };
                            console.log('Found price range (regex):', priceData.priceRange);
                            break;
                        }
                    }
                }
            }

            // Fallback: Look for ANY reasonable car price on the page
            if (!priceData.basePrice && !priceData.weightedPrice && !priceData.priceRange) {
                console.log('No specific prices found, looking for any car prices...');
                
                // Look for elements that might contain prices
                const priceElements = document.querySelectorAll('div, span, p, td, th, h1, h2, h3, h4');
                const foundPrices = [];
                
                priceElements.forEach(element => {
                    const text = element.textContent || '';
                    if (text.length < 50) { // Avoid large blocks
                        const priceMatch = text.match(/₪?\s*(\d{1,3}(?:,\d{3})+)\s*₪?/);
                        if (priceMatch) {
                            const price = parseInt(priceMatch[1].replace(/,/g, ''));
                            if (price >= 20000 && price <= 500000) { // Reasonable car price range
                                foundPrices.push(price);
                                console.log(`Found potential price: ₪${price.toLocaleString()} in: "${text.trim().substring(0, 50)}"`);
                            }
                        }
                    }
                });
                
                if (foundPrices.length > 0) {
                    // Use the median price as the weighted price
                    foundPrices.sort((a, b) => a - b);
                    const medianPrice = foundPrices[Math.floor(foundPrices.length / 2)];
                    priceData.weightedPrice = medianPrice;
                    priceData.priceRange = {
                        min: Math.min(...foundPrices),
                        max: Math.max(...foundPrices)
                    };
                    console.log(`✅ Found ${foundPrices.length} prices, using median: ₪${medianPrice.toLocaleString()}`);
                }
            }
            
            // If we found any price data, send it to background
            if (priceData.basePrice || priceData.weightedPrice || priceData.priceRange) {
                console.log('📤 Sending price data to background:', {
                    basePrice: priceData.basePrice,
                    weightedPrice: priceData.weightedPrice,
                    priceRange: priceData.priceRange,
                    source: priceData.source
                });
                chrome.runtime.sendMessage({
                    type: 'YAD2_PRICE_DATA',
                    data: priceData
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error sending price data:', chrome.runtime.lastError);
                    } else {
                        console.log('✅ Price data sent successfully!', response);
                    }
                });
                return priceData;
            }

            console.log('❌ No price data found on Yad2 calculator page');
            return null;

        } catch (error) {
            console.error('Error extracting price data from Yad2:', error);
            return null;
        }
    }

    // Run extraction when page loads
    function runExtraction() {
        console.log('=== Yad2 Price Extractor Starting ===');
        console.log('Page URL:', window.location.href);
        
        if (isYad2PriceCalculator()) {
            console.log('On Yad2 price calculator page');
            // Don't wait - the MutationObserver will catch price changes
            // Only extract if prices are already visible
            setTimeout(() => {
                extractPriceData();
            }, 1000); // Reduced to 1s
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runExtraction);
    } else {
        runExtraction();
    }

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('📨 Received message:', request.type);
        if (request.type === 'FILL_CALCULATOR') {
            console.log('✅ FILL_CALCULATOR message received with data:', request.data);
            fillCalculator(request.data);
            sendResponse({ success: true });
            return true;
        }
    });

    // Click the "לשקלול מחיר" button to scroll to the form
    function clickScrollToFormButton() {
        try {
            console.log('🔽 Looking for "לשקלול מחיר" button to scroll to form...');
            
            // Look for buttons or links with "לשקלול מחיר" text
            const allButtons = document.querySelectorAll('button, a, [role="button"]');
            
            for (const button of allButtons) {
                const buttonText = (button.textContent || button.innerText || '').trim();
                
                // Look for EXACT "לשקלול מחיר" (the scroll button, not "שקלול מחיר")
                if (buttonText === 'לשקלול מחיר' || buttonText.includes('לשקלול מחיר')) {
                    console.log('🎯 Found scroll button! Clicking to scroll to form...');
                    
                    // Click the button
                    button.click();
                    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                    
                    if (button.tagName === 'A') {
                        button.dispatchEvent(new Event('click', { bubbles: true }));
                    }
                    
                    console.log('✅ Clicked "לשקלול מחיר" - page should scroll to form');
                    return true;
                }
            }
            
            console.log('⚠️ "לשקלול מחיר" scroll button not found');
            return false;
            
        } catch (error) {
            console.error('Error clicking scroll button:', error);
            return false;
        }
    }

    // Fill the calculator with vehicle data
    function fillCalculator(vehicleData) {
        try {
            console.log('Filling Yad2 calculator with:', vehicleData);
            
            // Wait minimal time for page to load (500ms)
            setTimeout(() => {
                // First, click "לשקלול מחיר" to scroll to the form
                clickScrollToFormButton();
                
                // Then fill the form after a short delay
                setTimeout(() => {
                    fillFormFields(vehicleData);
                }, 300);
            }, 500);
            
        } catch (error) {
            console.error('Error filling calculator:', error);
        }
    }

    // Fill form fields with vehicle data
    function fillFormFields(vehicleData) {
        try {
            console.log('=== FILLING FORM FIELDS ===');
            console.log('Vehicle data:', vehicleData);
            
            // Log all input fields on the page for debugging
            console.log('Finding all input fields on page...');
            const allInputs = document.querySelectorAll('input, select, textarea');
            console.log(`Found ${allInputs.length} form fields`);
            
            allInputs.forEach((input, index) => {
                const label = input.getAttribute('placeholder') || 
                             input.getAttribute('name') || 
                             input.getAttribute('id') || 
                             input.getAttribute('aria-label') || 
                             'unknown';
                const type = input.tagName.toLowerCase() + (input.type ? `[${input.type}]` : '');
                console.log(`Field ${index}: ${type} - "${label}"`);
            });
            
            // Try multiple methods to fill fields
            let mileageFilled = false;
            let handsFilled = false;
            
            // Fill mileage if available
            if (vehicleData.mileage) {
                console.log('Attempting to fill mileage:', vehicleData.mileage);
                mileageFilled = fillMileageField(vehicleData.mileage) ||
                               fillMileageFieldAlternative(vehicleData.mileage);
                console.log('Mileage filled:', mileageFilled);
            }
            
            // Fill number of hands if available
            if (vehicleData.handsCount) {
                console.log('Attempting to fill hands count:', vehicleData.handsCount);
                handsFilled = fillHandsField(vehicleData.handsCount) ||
                             fillHandsFieldAlternative(vehicleData.handsCount);
                console.log('Hands filled:', handsFilled);
            }
            
            // Fill ownership type if available
            if (vehicleData.ownership) {
                fillOwnershipField(vehicleData.ownership);
            }
            
            // Summary
            console.log('=== FILL SUMMARY ===');
            console.log('Mileage filled:', mileageFilled);
            console.log('Hands filled:', handsFilled);
            
            // Try to trigger the calculation (reduced to 500ms)
            setTimeout(() => {
                const calculated = triggerCalculation();
                if (calculated) {
                    // Wait for results to load, then extract price
                    console.log('⏳ Waiting for calculation results...');
                    
                    // Start observing for price results (this will trigger as soon as data appears)
                    watchForPriceResults();
                    
                    // Also try extraction after delays (fallback) - aggressive timing
                    setTimeout(() => {
                        console.log('🔍 Extracting price after 1.5 seconds...');
                        extractPriceData();
                    }, 1500);
                    
                    setTimeout(() => {
                        console.log('🔍 Extracting price after 3 seconds...');
                        extractPriceData();
                    }, 3000);
                }
            }, 500);
            
        } catch (error) {
            console.error('Error filling form fields:', error);
        }
    }

    // Fill mileage field
    function fillMileageField(mileage) {
        try {
            console.log('[Method 1] Filling mileage field with:', mileage);
            
            // Method 1: Look for input near "מספר ק"מ" or "ק"מ" text
            const searchTerms = ['מספר ק"מ', 'ק"מ', 'קילומטר', 'מד אוץ', 'km', 'mileage'];
            
            for (const term of searchTerms) {
                const allElements = document.querySelectorAll('*');
                for (const element of allElements) {
                    const text = element.textContent || '';
                    if (text.includes(term) && text.length < 100) { // Avoid matching large blocks
                        // Look for input in or near this element
                        const input = element.querySelector('input[type="text"], input[type="number"]') || 
                                    element.parentElement?.querySelector('input[type="text"], input[type="number"]') ||
                                    element.closest('div')?.querySelector('input[type="text"], input[type="number"]');
                        if (input) {
                            console.log(`Found mileage input near "${term}":`, input);
                            input.value = mileage;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                            input.dispatchEvent(new Event('blur', { bubbles: true }));
                            console.log('✅ Filled mileage:', mileage);
                            return true;
                        }
                    }
                }
            }
            
            console.log('❌ Mileage field not found (method 1)');
            return false;
        } catch (error) {
            console.error('Error filling mileage field:', error);
            return false;
        }
    }
    
    // Alternative method to fill mileage using placeholders and names
    function fillMileageFieldAlternative(mileage) {
        try {
            console.log('[Method 2] Trying alternative mileage fill:', mileage);
            
            // Try to find input[type="number"] with placeholder containing km text
            const allInputs = document.querySelectorAll('input[type="number"], input[type="text"]');
            console.log(`Checking ${allInputs.length} number/text inputs`);
            
            for (const input of allInputs) {
                const placeholder = input.getAttribute('placeholder') || '';
                console.log(`  Input placeholder: "${placeholder}"`);
                
                if (placeholder.includes('ק"מ') || placeholder.includes('ק״מ') || 
                    placeholder.includes('קילומטר') || placeholder.includes('km')) {
                    console.log(`Found mileage input with placeholder "${placeholder}":`, input);
                    
                    // Set value using multiple methods
                    input.value = mileage;
                    input.setAttribute('value', mileage);
                    
                    // Trigger events
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.dispatchEvent(new Event('blur', { bubbles: true }));
                    
                    // Also try setting via React if it exists
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    nativeInputValueSetter.call(input, mileage);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    console.log('✅ Filled mileage (alternative):', mileage);
                    return true;
                }
            }
            
            console.log('❌ Mileage field not found (method 2)');
            return false;
        } catch (error) {
            console.error('Error in alternative mileage fill:', error);
            return false;
        }
    }

    // Fill hands field
    function fillHandsField(handsCount) {
        try {
            console.log('[Method 1] Filling hands field with:', handsCount);
            
            // Look for select elements near "מספר בעלים", "יד", or "בעלות" text
            const searchTerms = ['מספר בעלים', 'בעלים', 'יד נוכחית', 'יד', 'בעלות', 'hands', 'owner'];
            
            for (const term of searchTerms) {
                const allElements = document.querySelectorAll('*');
                for (const element of allElements) {
                    const text = element.textContent || '';
                    if (text.includes(term) && text.length < 100) {
                        const select = element.querySelector('select') || 
                                     element.parentElement?.querySelector('select') ||
                                     element.closest('div')?.querySelector('select');
                        if (select) {
                            console.log(`Found hands select near "${term}":`, select);
                            const options = select.querySelectorAll('option');
                            console.log(`Select has ${options.length} options`);
                            
                            for (const option of options) {
                                const optionText = option.textContent || option.value;
                                console.log(`  Option: "${optionText}"`);
                                
                                if (optionText.includes(handsCount.toString()) || 
                                    optionText.includes(getHebrewHandsText(handsCount)) ||
                                    option.value === handsCount.toString()) {
                                    option.selected = true;
                                    select.value = option.value;
                                    select.dispatchEvent(new Event('change', { bubbles: true }));
                                    select.dispatchEvent(new Event('blur', { bubbles: true }));
                                    console.log('✅ Filled hands count:', handsCount);
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
            
            console.log('❌ Hands field not found (method 1)');
            return false;
        } catch (error) {
            console.error('Error filling hands field:', error);
            return false;
        }
    }
    
    // Alternative method to fill hands field
    function fillHandsFieldAlternative(handsCount) {
        try {
            console.log('[Method 2] Trying alternative hands fill:', handsCount);
            
            // Try all select elements on the page
            const allSelects = document.querySelectorAll('select');
            console.log(`Found ${allSelects.length} select elements`);
            
            for (const select of allSelects) {
                const options = select.querySelectorAll('option');
                for (const option of options) {
                    const optionText = option.textContent || option.value;
                    if (optionText.includes(handsCount.toString()) || 
                        optionText.includes(getHebrewHandsText(handsCount)) ||
                        option.value === handsCount.toString()) {
                        option.selected = true;
                        select.value = option.value;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        select.dispatchEvent(new Event('blur', { bubbles: true }));
                        console.log('✅ Filled hands count (alternative):', handsCount);
                        return true;
                    }
                }
            }
            
            console.log('❌ Hands field not found (method 2)');
            return false;
        } catch (error) {
            console.error('Error in alternative hands fill:', error);
            return false;
        }
    }

    // Fill ownership field
    function fillOwnershipField(ownership) {
        try {
            console.log('Filling ownership field with:', ownership);
            
            // Look for select elements near "בעלות נוכחית" text
            const allElements = document.querySelectorAll('*');
            for (const element of allElements) {
                if (element.textContent && element.textContent.includes('בעלות נוכחית')) {
                    const select = element.querySelector('select') || element.closest('div')?.querySelector('select');
                    if (select) {
                        const options = select.querySelectorAll('option');
                        for (const option of options) {
                            if (option.textContent.includes(ownership) || 
                                option.textContent.includes('פרטי')) {
                                option.selected = true;
                                select.dispatchEvent(new Event('change', { bubbles: true }));
                                console.log('Filled ownership:', ownership);
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        } catch (error) {
            console.error('Error filling ownership field:', error);
            return false;
        }
    }

    // Trigger calculation
    function triggerCalculation() {
        try {
            console.log('🔘 Attempting to trigger calculation...');
            
            // Method 1: Look for the ACTUAL calculate button (שקלול מחיר without ל prefix)
            const calculateButtons = document.querySelectorAll('button, input[type="submit"], a');
            console.log(`Found ${calculateButtons.length} potential buttons/links`);
            
            let bestButton = null;
            
            for (const button of calculateButtons) {
                const buttonText = (button.textContent || button.value || button.innerText || '').trim();
                console.log(`  Checking button: "${buttonText}"`);
                
                // Look for EXACT match "שקלול מחיר" (the actual calculate button)
                // NOT "לשקלול מחיר" (which just scrolls)
                if (buttonText === 'שקלול מחיר') {
                    console.log('🎯 Found EXACT calculate button! Text:', buttonText);
                    bestButton = button;
                    break; // This is the one we want!
                }
                
                // Fallback: any button with "שקלול" but prefer exact match
                if (!bestButton && buttonText.includes('שקלול') && !buttonText.includes('לשקלול')) {
                    console.log('🎯 Found potential calculate button:', buttonText);
                    bestButton = button;
                }
            }
            
            if (bestButton) {
                const buttonText = (bestButton.textContent || bestButton.value || '').trim();
                console.log('✅ Clicking button:', buttonText);
                
                // Try multiple click methods
                bestButton.click();
                bestButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                
                // If it's a link, try to trigger it
                if (bestButton.tagName === 'A') {
                    bestButton.dispatchEvent(new Event('click', { bubbles: true }));
                }
                
                console.log('✅ Clicked calculate button:', buttonText);
                return true;
            }
            
            // Method 2: Look for orange button (the calculate button is orange)
            console.log('Method 1 failed, trying to find orange button...');
            const allButtons = document.querySelectorAll('button');
            for (const button of allButtons) {
                const style = window.getComputedStyle(button);
                const bgColor = style.backgroundColor;
                // Orange color detection
                if (bgColor.includes('255') || style.background.includes('orange')) {
                    console.log('🎯 Found orange button!');
                    button.click();
                    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                    console.log('✅ Clicked orange button');
                    return true;
                }
            }
            
            console.log('❌ Calculate button not found');
            return false;
        } catch (error) {
            console.error('Error triggering calculation:', error);
            return false;
        }
    }

    // Get Hebrew text for hands count
    function getHebrewHandsText(count) {
        const hebrewHands = {
            1: 'ראשונה',
            2: 'שנייה', 
            3: 'שלישית',
            4: 'רביעית',
            5: 'חמישית',
            6: 'ששית',
            7: 'שביעית',
            8: 'שמינית',
            9: 'תשיעית',
            10: 'עשירית'
        };
        return hebrewHands[count] || count.toString();
    }

    // Re-run extraction if page content changes
    const observer = new MutationObserver((mutations) => {
        let shouldReExtract = false;
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                shouldReExtract = true;
            }
        });
        
        if (shouldReExtract && isYad2PriceCalculator()) {
            // Wait longer after content changes to allow for calculation
            setTimeout(() => {
                extractPriceData();
            }, 3000);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
