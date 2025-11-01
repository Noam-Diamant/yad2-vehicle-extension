// Minimal popup script - no complex functions
console.log('Popup script loaded');

// Simple state management
function showState(stateName) {
    const states = ['loading', 'not-bidspirit', 'no-data', 'price-found', 'error'];
    states.forEach(state => {
        const el = document.getElementById(state);
        if (el) el.classList.remove('active');
    });
    
    const targetEl = document.getElementById(stateName);
    if (targetEl) targetEl.classList.add('active');
}

// Initialize when popup opens
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const tab = tabs[0];
    console.log('Current tab:', tab.url);
    
    // Check if on Bidspirit page
    if (!tab.url.includes('bidspirit.com') || !tab.url.includes('/ui/lotPage/')) {
        console.log('Not on Bidspirit page');
        showState('not-bidspirit');
        return;
    }
    
    // Get stored data
    chrome.storage.local.get(['currentVehicleData', 'currentVehiclePrice', 'priceError'], function(result) {
        console.log('Storage result:', result);
        
        // Check for price errors
        if (result.priceError) {
            console.log('Price error found:', result.priceError);
            const errorMessage = document.getElementById('error-message');
            if (errorMessage) {
                errorMessage.textContent = 'שגיאה בחיפוש מחיר: ' + result.priceError;
            }
            showState('error');
            return;
        }
        
        if (result.currentVehicleData) {
            // Show the data
            const data = result.currentVehicleData;
            
            // Update vehicle info
            const vehicleTitle = document.getElementById('vehicle-title');
            if (vehicleTitle) {
                vehicleTitle.textContent = (data.manufacturer || 'לא זוהה') + ' ' + (data.model || '');
            }
            
            const manufacturer = document.getElementById('manufacturer');
            if (manufacturer) manufacturer.textContent = data.manufacturer || '-';
            
            const model = document.getElementById('model');
            if (model) model.textContent = data.model || '-';
            
            const year = document.getElementById('year');
            if (year) year.textContent = data.year || '-';
            
            const mileage = document.getElementById('mileage');
            if (mileage) {
                mileage.textContent = data.mileage ? data.mileage.toLocaleString() + ' ק"מ' : '-';
            }
            
            // Show real price data from storage
            if (result.currentVehiclePrice) {
                const priceData = result.currentVehiclePrice;
                
                const weightedPrice = document.getElementById('weighted-price');
                if (weightedPrice && priceData.weightedPrice) {
                    weightedPrice.textContent = '₪' + priceData.weightedPrice.toLocaleString('he-IL');
                }
                
                const priceRange = document.getElementById('price-range');
                if (priceRange && priceData.priceRange) {
                    const range = priceData.priceRange.min.toLocaleString('he-IL') + ' - ' + priceData.priceRange.max.toLocaleString('he-IL');
                    priceRange.textContent = '₪' + range;
                }
                
                const lastUpdated = document.getElementById('last-updated');
                if (lastUpdated) {
                    if (priceData.lastUpdated) {
                        const date = new Date(priceData.lastUpdated);
                        lastUpdated.textContent = 'עודכן לאחרונה: ' + date.toLocaleDateString('he-IL');
                    } else {
                        lastUpdated.textContent = 'עודכן לאחרונה: היום';
                    }
                }
                
                // Add debug info
                console.log('Price data source:', priceData.source);
                console.log('Base price:', priceData.basePrice);
                console.log('Weighted price:', priceData.weightedPrice);
                console.log('Price range:', priceData.priceRange);
            } else {
                // Show "no price found" state
                const weightedPrice = document.getElementById('weighted-price');
                if (weightedPrice) weightedPrice.textContent = 'לא נמצא מחיר';
                
                const priceRange = document.getElementById('price-range');
                if (priceRange) priceRange.textContent = 'לא זמין';
                
                const lastUpdated = document.getElementById('last-updated');
                if (lastUpdated) lastUpdated.textContent = 'מחיר לא זמין';
                
                console.log('No price data available');
            }
            
            showState('price-found');
        } else {
            console.log('No vehicle data found');
            showState('no-data');
        }
    });
});

// Add button listeners
document.addEventListener('DOMContentLoaded', function() {
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', function() {
            window.location.reload();
        });
    }
    
    const openYad2Btn = document.getElementById('open-yad2-btn');
    if (openYad2Btn) {
        openYad2Btn.addEventListener('click', function() {
            chrome.tabs.create({ url: 'https://www.yad2.co.il/price-list' });
        });
    }
    
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            // Show loading state
            showState('loading');
            
            // Request fresh price data
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                const tab = tabs[0];
                if (tab && tab.url.includes('bidspirit.com')) {
                    // Send message to content script to refresh data
                    chrome.tabs.sendMessage(tab.id, { type: 'REQUEST_VEHICLE_DATA' }, function(response) {
                        if (chrome.runtime.lastError) {
                            console.error('Error requesting fresh data:', chrome.runtime.lastError);
                            showState('error');
                        } else {
                            // Wait a bit for data to be processed, then reload
                            setTimeout(function() {
                                window.location.reload();
                            }, 2000);
                        }
                    });
                } else {
                    window.location.reload();
                }
            });
        });
    }
});




