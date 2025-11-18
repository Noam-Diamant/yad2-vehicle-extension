(function() {
    'use strict';

    const LISTING_PATH_TOKEN = '/vehicles/item/';
    const STORAGE_KEY = 'yad2ListingSnapshot';
    const OBSERVER_DEBOUNCE = 400;
    const DATA_REFRESH_INTERVAL = 30 * 1000; // 30 seconds
    const NEXT_DATA_ID = '__NEXT_DATA__';

    if (!isYad2VehicleListing()) {
        return;
    }

    console.log('🚗 Yad2 listing helper loaded');

    let latestExtraction = null;
    let observerTimer = null;
    let lastManualSave = 0;
    let autoClickTriggered = false;
    let nextDataCache = null;

    function isYad2VehicleListing() {
        return window.location.hostname.includes('yad2.co.il') &&
               window.location.pathname.includes(LISTING_PATH_TOKEN);
    }

    function scheduleExtraction(reason = 'dom-change') {
        if (observerTimer) {
            clearTimeout(observerTimer);
        }
        observerTimer = setTimeout(() => {
            observerTimer = null;
            const extracted = extractListingData();
            if (!extracted) {
                return;
            }
            latestExtraction = extracted;

            const now = Date.now();
            if (now - lastManualSave > DATA_REFRESH_INTERVAL) {
                persistListingSnapshot(extracted, reason);
            }
        }, OBSERVER_DEBOUNCE);
    }

    function persistListingSnapshot(data, reason) {
        if (!data || (!data.mileage && !data.handsCount)) {
            return;
        }

        const snapshot = {
            mileage: data.mileage || null,
            handsCount: data.handsCount || null,
            listingTitle: data.listingTitle || null,
            manufacturer: data.manufacturer || null,
            model: data.model || null,
            year: data.year || null,
            listingUrl: window.location.href,
            capturedAt: Date.now(),
            reason
        };

        chrome.storage.local.set({ [STORAGE_KEY]: snapshot }, () => {
            if (chrome.runtime.lastError) {
                console.warn('Failed to store listing snapshot', chrome.runtime.lastError);
            } else {
                console.log('💾 Stored listing snapshot for מחירון autofill', snapshot);
            }
        });
    }

    function extractListingData() {
        try {
            const structured = extractStructuredListingData();
            const mileage = structured?.mileage ?? extractMileage();
            const handsCount = structured?.handsCount ?? extractHandsCount();
            const listingTitle = structured?.title ||
                document.querySelector('h1,h2,[data-testid="item-title"]')?.textContent?.trim() || '';

            if (!mileage && !handsCount) {
                return null;
            }

            return {
                mileage,
                handsCount,
                listingTitle,
                manufacturer: structured?.manufacturer || null,
                model: structured?.model || null,
                year: structured?.year || null,
                handText: structured?.handText || null,
                source: 'yad2_listing'
            };
        } catch (error) {
            console.error('Error extracting listing data:', error);
            return null;
        }
    }

    function extractStructuredListingData() {
        try {
            console.log('🔍 Attempting structured data extraction...');
            const nextData = loadNextData();
            if (!nextData) {
                console.log('❌ __NEXT_DATA__ not found');
                return null;
            }

            console.log('✅ __NEXT_DATA__ found:', nextData);
            console.log('   Type:', typeof nextData);
            console.log('   Is element?:', nextData instanceof Element);
            console.log('   Has props?:', !!nextData.props);

            const pageProps = nextData.props?.pageProps;
            console.log('   pageProps:', pageProps);
            
            const dehydratedQueries = pageProps?.dehydratedState?.queries || [];
            console.log('📊 Found', dehydratedQueries.length, 'queries in dehydrated state');

            const listingQuery = dehydratedQueries.find((query) => {
                const key = query.queryKey || [];
                return key.includes('vehicles') && key.includes('item');
            });

            if (!listingQuery) {
                console.log('❌ No vehicles/item query found in dehydrated state');
                return null;
            }

            console.log('✅ Found listing query:', listingQuery);

            const listingData = listingQuery?.state?.data;
            if (!listingData) {
                console.log('❌ No data in listing query state');
                return null;
            }

            console.log('✅ Listing data found:', listingData);
            console.log('   km:', listingData.km);
            console.log('   hand:', listingData.hand);

            const km = sanitizeNumber(listingData.km);
            const handText = listingData.hand?.text || null;
            const handsCount = parseHands(handText);
            const manufacturer = listingData.manufacturer?.text || null;
            const model = listingData.model?.text || listingData.subModel?.text || null;
            const year = listingData.vehicleDates?.yearOfProduction || null;
            const title = listingData.subModel?.text || listingData.metaData?.title || null;

            console.log('🎯 Extracted structured data:', { mileage: km, handsCount, manufacturer, model, year });

            return {
                mileage: km,
                handText,
                handsCount,
                manufacturer,
                model,
                year,
                title
            };
        } catch (error) {
            console.error('❌ Structured listing extraction failed:', error);
            return null;
        }
    }

    function loadNextData() {
        if (nextDataCache) {
            return nextDataCache;
        }

        try {
            const script = document.getElementById(NEXT_DATA_ID);
            if (script?.textContent) {
                nextDataCache = JSON.parse(script.textContent);
                return nextDataCache;
            }

            if (window.__NEXT_DATA__ && typeof window.__NEXT_DATA__ === 'object' && !(window.__NEXT_DATA__ instanceof Element)) {
                nextDataCache = window.__NEXT_DATA__;
                return nextDataCache;
            }
        } catch (error) {
            console.warn('Unable to parse __NEXT_DATA__ payload:', error);
        }

        return null;
    }

    function extractMileage() {
        const selectors = [
            '[data-testid="item-mileage"]',
            '[data-testid="vehicleKilometers"]',
            '[data-testid="mileage-value"]',
            '[class*="km"] span',
            '[class*="kilometer"] span',
            '[data-test-id="km"]',
            '[data-test-id="mileage"]'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            const value = parseMileage(el?.textContent);
            if (value) {
                return value;
            }
        }

        // look for key-value pairs (dt/dd, div/span etc.)
        const labelValuePairs = findLabelValuePairs([
            /ק.?\"?מ/,
            /קילומטר/,
            /km/i,
            /מד\s*אוץ/,
            /mileage/i
        ]);

        for (const text of labelValuePairs) {
            const value = parseMileage(text);
            if (value) {
                return value;
            }
        }

        // fallback to raw text search
        return parseMileage(document.body.textContent);
    }

    function extractHandsCount() {
        const selectors = [
            '[data-testid*="hand"]',
            '[data-testid*="owner"]',
            '[data-test-id*="hand"]',
            '[data-test-id*="owner"]',
            '[class*="hand"] span',
            '[class*="owner"] span'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            const value = parseHands(el?.textContent);
            if (value) {
                return value;
            }
        }

        const labelValuePairs = findLabelValuePairs([
            /יד/,
            /בעלים/,
            /מספר\s*בעלים/,
            /owner/i,
            /hands?/i
        ]);

        for (const text of labelValuePairs) {
            const value = parseHands(text);
            if (value) {
                return value;
            }
        }

        return parseHands(document.body.textContent);
    }

    function findLabelValuePairs(labelPatterns) {
        const matches = [];
        const elements = document.querySelectorAll('li,div,span,dt,dd,p');

        const normalizedPatterns = labelPatterns.map(pattern => {
            if (pattern instanceof RegExp) {
                return pattern;
            }
            return new RegExp(pattern, 'i');
        });

        elements.forEach(el => {
            const text = (el.textContent || '').trim();
            if (!text || text.length > 80) {
                return;
            }

            if (normalizedPatterns.some(pattern => pattern.test(text))) {
                matches.push(text);

                if (el.nextElementSibling) {
                    matches.push(el.nextElementSibling.textContent.trim());
                }

                if (el.parentElement) {
                    matches.push(el.parentElement.textContent.trim());
                }
            }
        });

        return matches;
    }

    function parseMileage(text) {
        if (!text) {
            return null;
        }
        const clean = text.replace(/\s+/g, ' ').trim();

        const match = clean.match(/(\d{1,3}(?:[,\.\s]\d{3})+|\d{4,7})/);
        if (!match) {
            return null;
        }

        const number = sanitizeNumber(match[1]);
        if (!number) {
            return null;
        }

        if (clean.includes('ק') || clean.toLowerCase().includes('km') || clean.includes('מד אוץ')) {
            return number;
        }

        return null;
    }

    function parseHands(text) {
        if (!text) {
            return null;
        }

        const clean = text.replace(/\s+/g, ' ').trim();

        const hebrewHands = {
            'ראשונה': 1,
            'שנייה': 2,
            'שניה': 2,
            'שלישית': 3,
            'רביעית': 4,
            'חמישית': 5,
            'שישית': 6,
            'ששית': 6,
            'שביעית': 7,
            'שמינית': 8,
            'תשיעית': 9,
            'עשירית': 10
        };

        for (const [label, value] of Object.entries(hebrewHands)) {
            if (clean.includes(label)) {
                return value;
            }
        }

        const numericMatch = clean.match(/(\d+)/);
        if (numericMatch) {
            const num = parseInt(numericMatch[1], 10);
            if (num >= 1 && num <= 10) {
                return num;
            }
        }

        return null;
    }

    function sanitizeNumber(value) {
        if (value === null || value === undefined) {
            return null;
        }

        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === 'string') {
            const normalized = value.replace(/[^\d]/g, '');
            const number = parseInt(normalized, 10);
            return Number.isFinite(number) ? number : null;
        }

        return null;
    }

    function attachPriceButtonHandler() {
        const buttons = findPriceButtons();
        buttons.forEach(button => {
            if (button.dataset.yad2PriceHooked) {
                return;
            }

            button.dataset.yad2PriceHooked = 'true';
            button.addEventListener('click', () => {
                lastManualSave = Date.now();
                const data = latestExtraction || extractListingData();
                persistListingSnapshot(data, 'button-click');
            }, { capture: true });
            console.log('🟠 Hooked למחירון button for fast autofill');
        });
    }

    function findPriceButtons() {
        const candidates = document.querySelectorAll('a,button,[role="button"]');
        return Array.from(candidates).filter(button => {
            const text = (button.innerText || button.textContent || '').trim();
            return !!text && text.includes('למחירון');
        });
    }

    function simulateClick(element) {
        element.click();
        element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        if (element.tagName === 'A') {
            element.dispatchEvent(new Event('click', { bubbles: true }));
        }
    }

    function autoOpenPriceButton() {
        if (autoClickTriggered) {
            console.log('Auto click already triggered, skipping...');
            return true;
        }

        const button = findPriceButtons()[0];
        if (!button) {
            console.log('⚠️ "למחירון" button not found for auto click');
            return false;
        }

        const data = latestExtraction || extractListingData();
        if (data) {
            persistListingSnapshot(data, 'auto-click');
        }

        autoClickTriggered = true;
        console.log('🤖 Auto-clicking "למחירון" button');
        
        // Prevent default navigation if it's a link
        if (button.tagName === 'A' && button.href) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
            }, { once: true, capture: true });
        }
        
        simulateClick(button);
        return true;
    }

    // Initial extraction and setup
    scheduleExtraction('initial');
    attachPriceButtonHandler();

    // Observe DOM changes to refresh data and re-hook buttons
    const observer = new MutationObserver(() => {
        scheduleExtraction();
        attachPriceButtonHandler();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'REQUEST_LISTING_DATA') {
            const data = latestExtraction || extractListingData();
            if (data) {
                persistListingSnapshot(data, 'popup-request');
            }
            sendResponse({ success: !!data, data });
            return true;
        }

        if (request.type === 'AUTO_OPEN_PRICE_PAGE') {
            const success = autoOpenPriceButton();
            sendResponse({ success });
            return true;
        }
    });

    window.addEventListener('beforeunload', () => {
        observer.disconnect();
    });
})();


