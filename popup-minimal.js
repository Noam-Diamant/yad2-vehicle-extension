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
    chrome.storage.local.get(['currentVehicleData', 'currentVehiclePrice'], function(result) {
        console.log('Storage result:', result);
        
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
            
            // Show mock price data
            const weightedPrice = document.getElementById('weighted-price');
            if (weightedPrice) weightedPrice.textContent = '₪85,000';
            
            const priceRange = document.getElementById('price-range');
            if (priceRange) priceRange.textContent = '₪75,000 - ₪95,000';
            
            const lastUpdated = document.getElementById('last-updated');
            if (lastUpdated) lastUpdated.textContent = 'עודכן לאחרונה: היום';
            
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
            window.location.reload();
        });
    }
});



