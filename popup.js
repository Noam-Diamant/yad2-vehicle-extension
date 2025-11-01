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

    // Current vehicle data
    let currentVehicleData = null;
    let isOpening = false; // Prevent double-clicks

    // Initialize popup
    async function init() {
        showState('loading');
        
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we're on a Bidspirit page
            if (!tab.url.includes('bidspirit.com') || !tab.url.includes('/ui/lotPage/')) {
                showState('not-bidspirit');
                return;
            }

            // Get stored vehicle data
            const result = await chrome.storage.local.get(['currentVehicleData']);
            
            console.log('Popup: Retrieved data from storage:', result);
            
            if (!result.currentVehicleData || !hasRequiredData(result.currentVehicleData)) {
                console.log('Popup: No vehicle data found, requesting from content script...');
                
                // Request fresh data from content script
                await requestVehicleData(tab.id);
                
                // Wait a bit for content script to respond
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Try to get updated data
                const updatedResult = await chrome.storage.local.get(['currentVehicleData']);
                console.log('Popup: Updated data after request:', updatedResult);
                
                currentVehicleData = updatedResult.currentVehicleData;
            } else {
                currentVehicleData = result.currentVehicleData;
                console.log('Popup: Using cached data:', currentVehicleData);
            }

            // Check if we have vehicle data
            if (!currentVehicleData || !hasRequiredData(currentVehicleData)) {
                console.log('No vehicle data found or insufficient data:', currentVehicleData);
                showState('no-data');
                return;
            }

            console.log('Vehicle data found:', currentVehicleData);
            displayVehicleInfo();

        } catch (error) {
            console.error('Error initializing popup:', error);
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

        // Prevent double-clicks
        if (isOpening) {
            console.log('Already opening Yad2, ignoring duplicate click');
            return;
        }
        
        isOpening = true;
        console.log('User clicked button! Opening Yad2 calculator for:', currentVehicleData);
        
        // Send message to background script to open Yad2 calculator
        chrome.runtime.sendMessage({
            type: 'OPEN_YAD2_CALCULATOR',
            data: currentVehicleData
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error sending message:', chrome.runtime.lastError);
                isOpening = false; // Reset on error
            } else {
                console.log('✅ Yad2 calculator opening, response:', response);
                // Close popup after opening Yad2
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
