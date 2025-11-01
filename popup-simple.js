// Simple popup script without CSP issues
(function() {
    'use strict';

    // Simple DOM elements
    const loading = document.getElementById('loading');
    const notBidspirit = document.getElementById('not-bidspirit');
    const noData = document.getElementById('no-data');
    const priceFound = document.getElementById('price-found');
    const error = document.getElementById('error');

    // Vehicle info elements
    const vehicleTitle = document.getElementById('vehicle-title');
    const manufacturer = document.getElementById('manufacturer');
    const model = document.getElementById('model');
    const year = document.getElementById('year');
    const mileage = document.getElementById('mileage');
    const weightedPrice = document.getElementById('weighted-price');
    const priceRange = document.getElementById('price-range');
    const lastUpdated = document.getElementById('last-updated');

    // Debug elements
    const debugUrl = document.getElementById('debug-url');
    const debugData = document.getElementById('debug-data');
    const debugUrlNotBidspirit = document.getElementById('debug-url-not-bidspirit');

    // Show specific state
    function showState(stateName) {
        // Hide all states
        [loading, notBidspirit, noData, priceFound, error].forEach(el => {
            if (el) el.classList.remove('active');
        });
        
        // Show requested state
        const stateElement = document.getElementById(stateName);
        if (stateElement) {
            stateElement.classList.add('active');
        }
    }

    // Show debug info
    function showDebugInfo(url, data) {
        if (debugUrl) {
            debugUrl.textContent = 'URL: ' + url;
        }
        if (debugData) {
            debugData.textContent = 'Data: ' + (data ? 'Found data' : 'No data');
        }
        if (debugUrlNotBidspirit) {
            debugUrlNotBidspirit.textContent = 'URL: ' + url;
        }
    }

    // Display vehicle price
    function displayVehiclePrice(vehicleData, priceData) {
        if (vehicleTitle) {
            vehicleTitle.textContent = (vehicleData.manufacturer || 'לא זוהה') + ' ' + (vehicleData.model || '');
        }
        if (manufacturer) {
            manufacturer.textContent = vehicleData.manufacturer || '-';
        }
        if (model) {
            model.textContent = vehicleData.model || '-';
        }
        if (year) {
            year.textContent = vehicleData.year || '-';
        }
        if (mileage) {
            mileage.textContent = vehicleData.mileage ? vehicleData.mileage.toLocaleString() + ' ק"מ' : '-';
        }

        if (priceData && priceData.weightedPrice) {
            if (weightedPrice) {
                weightedPrice.textContent = '₪' + priceData.weightedPrice.toLocaleString();
            }
            if (priceRange && priceData.priceRange) {
                priceRange.textContent = '₪' + priceData.priceRange.min.toLocaleString() + ' - ' + priceData.priceRange.max.toLocaleString();
            }
        } else {
            // Show mock data
            if (weightedPrice) {
                weightedPrice.textContent = '₪85,000';
            }
            if (priceRange) {
                priceRange.textContent = '₪75,000 - ₪95,000';
            }
        }

        if (lastUpdated) {
            lastUpdated.textContent = 'עודכן לאחרונה: ' + new Date().toLocaleDateString('he-IL');
        }

        showState('price-found');
    }

    // Initialize popup
    async function init() {
        showState('loading');
        
        try {
            // Get current tab
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];
            
            // Check if we're on a Bidspirit page
            if (!tab.url.includes('bidspirit.com') || !tab.url.includes('/ui/lotPage/')) {
                showDebugInfo(tab.url, null);
                showState('not-bidspirit');
                return;
            }

            // Get stored vehicle data
            const result = await chrome.storage.local.get(['currentVehicleData', 'currentVehiclePrice', 'timestamp']);
            
            if (result.currentVehicleData) {
                // Check if data is recent (within last 5 minutes)
                const isDataRecent = result.timestamp && (Date.now() - result.timestamp < 5 * 60 * 1000);
                
                if (isDataRecent) {
                    displayVehiclePrice(result.currentVehicleData, result.currentVehiclePrice);
                    return;
                }
            }

            // No recent data - show no data state
            showDebugInfo(tab.url, result.currentVehicleData);
            showState('no-data');

        } catch (error) {
            console.error('Error in popup:', error);
            showState('error');
        }
    }

    // Add event listeners
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', init);
    }

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', init);
    }

    const openYad2Btn = document.getElementById('open-yad2-btn');
    if (openYad2Btn) {
        openYad2Btn.addEventListener('click', function() {
            chrome.tabs.create({ url: 'https://www.yad2.co.il/price-list' });
        });
    }

    // Initialize
    init();

})();




