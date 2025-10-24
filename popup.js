// Popup script for the extension
(function() {
    'use strict';

    // DOM elements
    const elements = {
        loading: document.getElementById('loading'),
        notBidspirit: document.getElementById('not-bidspirit'),
        noData: document.getElementById('no-data'),
        priceFound: document.getElementById('price-found'),
        error: document.getElementById('error'),
        
        // Vehicle info elements
        vehicleTitle: document.getElementById('vehicle-title'),
        manufacturer: document.getElementById('manufacturer'),
        model: document.getElementById('model'),
        year: document.getElementById('year'),
        mileage: document.getElementById('mileage'),
        
        // Price elements
        weightedPrice: document.getElementById('weighted-price'),
        priceRange: document.getElementById('price-range'),
        lastUpdated: document.getElementById('last-updated'),
        
        // Action buttons
        refreshBtn: document.getElementById('refresh-btn'),
        openYad2Btn: document.getElementById('open-yad2-btn'),
        retryBtn: document.getElementById('retry-btn'),
        
        // Error message
        errorMessage: document.getElementById('error-message'),
        
        // Debug elements
        debugUrl: document.getElementById('debug-url'),
        debugData: document.getElementById('debug-data'),
        debugUrlNotBidspirit: document.getElementById('debug-url-not-bidspirit')
    };

    // State management
    let currentVehicleData = null;
    let currentPrice = null;

    // Initialize popup
    async function init() {
        showState('loading');
        
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we're on a Bidspirit page
            if (!tab.url.includes('bidspirit.com') || !tab.url.includes('/ui/lotPage/')) {
                showDebugInfo(tab.url, null);
                showState('not-bidspirit');
                return;
            }

            // Get stored vehicle data
            const result = await chrome.storage.local.get(['currentVehicleData', 'currentVehiclePrice', 'priceError', 'timestamp']);
            
            console.log('Popup: Retrieved data from storage:', result);
            
            // Check if data is recent (within last 5 minutes)
            const isDataRecent = result.timestamp && (Date.now() - result.timestamp < 5 * 60 * 1000);
            console.log('Popup: Data is recent:', isDataRecent, 'Timestamp:', result.timestamp);
            
            if (!result.currentVehicleData || !isDataRecent) {
                console.log('Popup: Requesting fresh data from content script...');
                // Request fresh data from content script
                await requestVehicleData(tab.id);
                
                // Wait a bit for content script to respond
                await new Promise(resolve => {
                    setTimeout(() => resolve(), 3000);
                });
                
                // Try to get updated data
                const updatedResult = await chrome.storage.local.get(['currentVehicleData', 'currentVehiclePrice', 'priceError']);
                console.log('Popup: Updated data after request:', updatedResult);
                
                currentVehicleData = updatedResult.currentVehicleData;
                currentPrice = updatedResult.currentVehiclePrice;
                
                if (updatedResult.priceError) {
                    showError(updatedResult.priceError);
                    return;
                }
            } else {
                currentVehicleData = result.currentVehicleData;
                currentPrice = result.currentVehiclePrice;
                console.log('Popup: Using cached data:', currentVehicleData);
            }

            // Check if we have vehicle data
            if (!currentVehicleData || !hasRequiredData(currentVehicleData)) {
                console.log('No vehicle data found or insufficient data:', currentVehicleData);
                showDebugInfo(tab.url, currentVehicleData);
                showState('no-data');
                return;
            }

            console.log('Vehicle data found:', currentVehicleData);

            // If we have price data, show it
            if (currentPrice) {
                displayVehiclePrice();
            } else {
                // Try to fetch price
                try {
                    currentPrice = await fetchPrice();
                    displayVehiclePrice();
                } catch (error) {
                    showError(error.message);
                }
            }

        } catch (error) {
            console.error('Error initializing popup:', error);
            showError('שגיאה בטעינת התוסף');
        }
    }

    // Show specific state
    function showState(stateName) {
        // Hide all states
        Object.keys(elements).forEach(key => {
            if (elements[key] && elements[key].classList) {
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

    // Request vehicle data from content script
    async function requestVehicleData(tabId) {
        try {
            await chrome.tabs.sendMessage(tabId, { type: 'REQUEST_VEHICLE_DATA' });
        } catch (error) {
            console.error('Error requesting vehicle data:', error);
        }
    }

    // Fetch price from background script
    async function fetchPrice() {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                type: 'GET_PRICE',
                data: currentVehicleData
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.price);
                }
            });
        });
    }

    // Display vehicle price information
    function displayVehiclePrice() {
        if (!currentVehicleData || !currentPrice) {
            showError('לא נמצא מחיר לרכב זה');
            return;
        }

        // Update vehicle information
        elements.vehicleTitle.textContent = `${currentVehicleData.manufacturer || 'לא זוהה'} ${currentVehicleData.model || ''}`.trim();
        elements.manufacturer.textContent = currentVehicleData.manufacturer || '-';
        elements.model.textContent = currentVehicleData.model || '-';
        elements.year.textContent = currentVehicleData.year || '-';
        elements.mileage.textContent = currentVehicleData.mileage ? 
            `${currentVehicleData.mileage.toLocaleString('he-IL')} ק"מ` : '-';

        // Update price information
        if (currentPrice.weightedPrice) {
            elements.weightedPrice.textContent = `₪${currentPrice.weightedPrice.toLocaleString('he-IL')}`;
        }

        if (currentPrice.priceRange) {
            const range = `${currentPrice.priceRange.min.toLocaleString('he-IL')} - ${currentPrice.priceRange.max.toLocaleString('he-IL')}`;
            elements.priceRange.textContent = `₪${range}`;
        }

        if (currentPrice.lastUpdated) {
            const date = new Date(currentPrice.lastUpdated);
            elements.lastUpdated.textContent = `עודכן לאחרונה: ${date.toLocaleDateString('he-IL')}`;
        }

        showState('price-found');
    }

    // Show error state
    function showError(message) {
        elements.errorMessage.textContent = message;
        showState('error');
    }

    // Show debug information
    function showDebugInfo(url, data) {
        if (elements.debugUrl) {
            elements.debugUrl.textContent = `URL: ${url}`;
        }
        if (elements.debugData) {
            try {
                elements.debugData.textContent = `Data: ${JSON.stringify(data, null, 2)}`;
            } catch (error) {
                elements.debugData.textContent = `Data: ${String(data)}`;
            }
        }
        if (elements.debugUrlNotBidspirit) {
            elements.debugUrlNotBidspirit.textContent = `URL: ${url}`;
        }
    }

    // Format number with Hebrew locale
    function formatNumber(num) {
        return num ? num.toLocaleString('he-IL') : '-';
    }

    // Event listeners
    elements.refreshBtn.addEventListener('click', async () => {
        showState('loading');
        try {
            currentPrice = await fetchPrice();
            displayVehiclePrice();
        } catch (error) {
            showError(error.message);
        }
    });

    elements.openYad2Btn.addEventListener('click', () => {
        if (currentPrice && currentPrice.url) {
            chrome.tabs.create({ url: currentPrice.url });
        } else {
            // Fallback to Yad2 price list homepage
            chrome.tabs.create({ url: 'https://www.yad2.co.il/price-list' });
        }
    });

    elements.retryBtn.addEventListener('click', () => {
        init();
    });

    // Initialize when popup opens
    init();

})();
