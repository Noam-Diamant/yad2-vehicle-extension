// Test script to verify extension structure
// Run this in the browser console on a Bidspirit page to test data extraction

(function() {
    'use strict';

    console.log('Testing Yad2 Vehicle Price Extension...');

    // Test if we're on a Bidspirit page
    function isBidspiritVehiclePage() {
        return window.location.hostname.includes('bidspirit.com') && 
               window.location.pathname.includes('/ui/lotPage/');
    }

    // Test vehicle data extraction
    function testVehicleDataExtraction() {
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
            // Test manufacturer extraction
            const manufacturerElement = document.querySelector('h1, .lot-title, [class*="title"]');
            if (manufacturerElement) {
                const text = manufacturerElement.textContent.trim();
                const parts = text.split(' ');
                if (parts.length > 0) {
                    vehicleData.manufacturer = parts[0];
                }
            }

            // Test year extraction
            const yearMatch = document.body.textContent.match(/(\d{4})/);
            if (yearMatch) {
                const year = parseInt(yearMatch[1]);
                if (year >= 1990 && year <= new Date().getFullYear() + 1) {
                    vehicleData.year = year;
                }
            }

            // Test mileage extraction
            const mileageMatch = document.body.textContent.match(/(\d{1,3}(?:,\d{3})*)\s*(?:ק"מ|km|kilometers?)/i);
            if (mileageMatch) {
                vehicleData.mileage = parseInt(mileageMatch[1].replace(/,/g, ''));
            }

            // Test price extraction
            const priceMatch = document.body.textContent.match(/(\d{1,3}(?:,\d{3})*)\s*(?:₪|שקל|NIS)/);
            if (priceMatch) {
                vehicleData.price = parseInt(priceMatch[1].replace(/,/g, ''));
            }

        } catch (error) {
            console.error('Error in test extraction:', error);
        }

        return vehicleData;
    }

    // Run tests
    if (isBidspiritVehiclePage()) {
        console.log('✓ On Bidspirit vehicle page');
        const extractedData = testVehicleDataExtraction();
        console.log('Extracted vehicle data:', extractedData);
        
        if (extractedData.manufacturer || extractedData.year) {
            console.log('✓ Vehicle data extraction working');
        } else {
            console.log('⚠ Vehicle data extraction may need adjustment');
        }
    } else {
        console.log('✗ Not on a Bidspirit vehicle page');
        console.log('Current URL:', window.location.href);
    }

    // Test Chrome extension APIs (if available)
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        console.log('✓ Chrome extension APIs available');
    } else {
        console.log('⚠ Chrome extension APIs not available (normal if not in extension context)');
    }

})();




