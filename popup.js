// Simple popup script - just shows vehicle data and opens Yad2
(function() {
    'use strict';

    // DOM elements
    const elements = {
        loading: document.getElementById('loading'),
        notBidspirit: document.getElementById('not-bidspirit'),
        noData: document.getElementById('no-data'),
        ready: document.getElementById('ready'),
        
        // Vehicle info elements
        vehicleTitle: document.getElementById('vehicle-title'),
        manufacturer: document.getElementById('manufacturer'),
        model: document.getElementById('model'),
        year: document.getElementById('year'),
        mileage: document.getElementById('mileage'),
        hands: document.getElementById('hands'),
        
        // Buttons
        openYad2Btn: document.getElementById('open-yad2-btn'),
        retryBtn: document.getElementById('retry-btn')
    };

    const CONTEXTS = {
        BIDSPIRIT: 'bidspirit',
        YAD2_LISTING: 'yad2_listing'
    };

    // Current state
    let currentVehicleData = null;
    let isOpening = false; // Prevent double-clicks
    let currentTab = null;
    let currentContext = null;

    // Initialize popup
    async function init() {
        showState('loading');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            currentTab = tab;

            if (!tab || !tab.url) {
                showState('no-data');
                return;
            }

            if (isBidspiritTab(tab)) {
                currentContext = CONTEXTS.BIDSPIRIT;
                await loadBidspiritVehicleData(tab);
                return;
            }

            if (isYad2ListingTab(tab)) {
                currentContext = CONTEXTS.YAD2_LISTING;
                await loadYad2ListingData(tab);
                return;
            }

            currentContext = null;
            showState('not-bidspirit');

        } catch (error) {
            console.error('Error initializing popup:', error);
            showState('no-data');
        }
    }

    function isBidspiritTab(tab) {
        if (!tab?.url) return false;
        return tab.url.includes('bidspirit.com') && tab.url.includes('/ui/lotPage/');
    }

    function isYad2ListingTab(tab) {
        if (!tab?.url) return false;
        return tab.url.includes('yad2.co.il') && tab.url.includes('/vehicles/item/');
    }

    async function loadBidspiritVehicleData(tab) {
        try {
            const result = await chrome.storage.local.get(['currentVehicleData']);
            
            console.log('Popup: Retrieved data from storage:', result);
            
            if (!result.currentVehicleData || !hasRequiredData(result.currentVehicleData)) {
                console.log('Popup: No vehicle data found, requesting from Bidspirit content script...');
                
                await requestVehicleData(tab.id);
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const updatedResult = await chrome.storage.local.get(['currentVehicleData']);
                console.log('Popup: Updated data after request:', updatedResult);
                
                currentVehicleData = updatedResult.currentVehicleData;
            } else {
                currentVehicleData = result.currentVehicleData;
                console.log('Popup: Using cached Bidspirit data:', currentVehicleData);
            }

            if (!currentVehicleData || !hasRequiredData(currentVehicleData)) {
                console.log('No Bidspirit data found or insufficient data:', currentVehicleData);
                showState('no-data');
                return;
            }

            displayVehicleInfo();
        } catch (error) {
            console.error('Error loading Bidspirit data:', error);
            showState('no-data');
        }
    }

    async function loadYad2ListingData(tab) {
        try {
            const response = await chrome.tabs.sendMessage(tab.id, { type: 'REQUEST_LISTING_DATA' });
            console.log('Popup: Listing data response', response);

            const listingData = response?.data || null;
            if (!listingData) {
                showState('no-data');
                return;
            }

            currentVehicleData = normalizeListingVehicleData(listingData);

            if (!currentVehicleData || !hasRequiredData(currentVehicleData)) {
                console.log('Listing data missing required fields:', currentVehicleData);
                showState('no-data');
                return;
            }

            displayVehicleInfo();

        } catch (error) {
            console.error('Error loading Yad2 listing data:', error);
            showState('no-data');
        }
    }

    // Show specific state
    function showState(stateName) {
        // Hide all states
        Object.keys(elements).forEach(key => {
            if (elements[key] && elements[key].classList && elements[key].classList.contains('state')) {
                elements[key].classList.remove('active');
            }
        });
        
        // Show requested state
        if (elements[stateName]) {
            elements[stateName].classList.add('active');
        }
    }

    // Check if vehicle data has required information
    function hasRequiredData(data) {
        return data && (data.vehicleNumber || (data.manufacturer && data.model && data.year));
    }

    function normalizeListingVehicleData(data) {
        if (!data) {
            return null;
        }

        const hands = data.handsCount || parseHandsFromText(data.handText);

        return {
            manufacturer: data.manufacturer || 'לא זוהה',
            model: data.model || data.listingTitle || '',
            year: data.year || null,
            mileage: data.mileage || null,
            handsCount: hands || null,
            handText: data.handText || null,
            source: data.source || 'yad2_listing'
        };
    }

    function parseHandsFromText(text) {
        if (!text) {
            return null;
        }

        const normalized = text.toLowerCase();
        const map = {
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

        for (const [label, value] of Object.entries(map)) {
            if (normalized.includes(label)) {
                return value;
            }
        }

        const numericMatch = normalized.match(/(\d+)/);
        if (numericMatch) {
            const value = parseInt(numericMatch[1], 10);
            return Number.isFinite(value) ? value : null;
        }

        return null;
    }

    // Request vehicle data from content script
    async function requestVehicleData(tabId) {
        try {
            await chrome.tabs.sendMessage(tabId, { type: 'REQUEST_VEHICLE_DATA' });
        } catch (error) {
            console.error('Error requesting vehicle data:', error);
        }
    }

    // Display vehicle information
    function displayVehicleInfo() {
        if (!currentVehicleData) {
            showState('no-data');
            return;
        }

        // Update vehicle information
        const title = `${currentVehicleData.manufacturer || 'לא זוהה'} ${currentVehicleData.model || ''}`.trim();
        elements.vehicleTitle.textContent = title || 'רכב לא זוהה';
        
        elements.manufacturer.textContent = currentVehicleData.manufacturer || '-';
        elements.model.textContent = currentVehicleData.model || '-';
        elements.year.textContent = currentVehicleData.year || '-';
        
        elements.mileage.textContent = currentVehicleData.mileage ? 
            `${currentVehicleData.mileage.toLocaleString('he-IL')} ק"מ` : '-';
        
        elements.hands.textContent = currentVehicleData.handsCount || '-';

        showState('ready');
    }

    // Open Yad2 calculator and fill it
    async function openYad2Calculator() {
        if (!currentVehicleData) {
            console.error('No vehicle data available');
            return;
        }

        if (isOpening) {
            console.log('Already opening Yad2, ignoring duplicate click');
            return;
        }
        
        isOpening = true;

        if (currentContext === CONTEXTS.YAD2_LISTING && currentTab) {
            console.log('Triggering auto "למחירון" click for listing page');
            chrome.tabs.sendMessage(currentTab.id, { type: 'AUTO_OPEN_PRICE_PAGE' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error auto-clicking price button:', chrome.runtime.lastError);
                    isOpening = false;
                    return;
                }

                console.log('Auto click response:', response);
                isOpening = false;
                window.close();
            });
            return;
        }

        console.log('User clicked button! Opening Yad2 calculator for:', currentVehicleData);
        
        chrome.runtime.sendMessage({
            type: 'OPEN_YAD2_CALCULATOR',
            data: currentVehicleData
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error sending message:', chrome.runtime.lastError);
                isOpening = false;
            } else {
                console.log('✅ Yad2 calculator opening, response:', response);
                isOpening = false;
                window.close();
            }
        });
    }

    // Event listeners
    if (elements.openYad2Btn) {
        elements.openYad2Btn.addEventListener('click', openYad2Calculator);
    }

    if (elements.retryBtn) {
        elements.retryBtn.addEventListener('click', () => {
            init();
        });
    }

    // Initialize when popup opens
    init();

})();
