// Background service worker for Yad2 price fetching
(function() {
    'use strict';

    // Cache for price data
    const priceCache = new Map();
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'VEHICLE_DATA_EXTRACTED') {
            handleVehicleData(request.data);
        } else if (request.type === 'GET_PRICE') {
            getVehiclePrice(request.data).then(price => {
                sendResponse({ price });
            }).catch(error => {
                sendResponse({ error: error.message });
            });
            return true; // Keep message channel open for async response
        }
    });

    // Handle extracted vehicle data
    async function handleVehicleData(vehicleData) {
        console.log('Vehicle data extracted:', vehicleData);
        
        // Store in cache for popup access
        chrome.storage.local.set({
            currentVehicleData: vehicleData,
            timestamp: Date.now()
        });

        // Try to get price if we have enough data
        if (vehicleData.vehicleNumber || (vehicleData.manufacturer && vehicleData.model && vehicleData.year)) {
            try {
                const price = await getVehiclePrice(vehicleData);
                chrome.storage.local.set({
                    currentVehiclePrice: price,
                    priceTimestamp: Date.now()
                });
            } catch (error) {
                console.error('Error fetching price:', error);
                chrome.storage.local.set({
                    priceError: error.message
                });
            }
        }
    }

    // Get vehicle price from Yad2
    async function getVehiclePrice(vehicleData) {
        const cacheKey = generateCacheKey(vehicleData);
        
        // Check cache first
        if (priceCache.has(cacheKey)) {
            const cached = priceCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                return cached.price;
            }
        }

        try {
            // Phase 1: Try direct vehicle number lookup
            if (vehicleData.vehicleNumber) {
                const price = await fetchPriceByVehicleNumber(vehicleData.vehicleNumber);
                if (price) {
                    cachePrice(cacheKey, price);
                    return price;
                }
            }

            // Phase 2: Try manufacturer/model/year lookup
            if (vehicleData.manufacturer && vehicleData.model && vehicleData.year) {
                const price = await fetchPriceByDetails(vehicleData);
                if (price) {
                    cachePrice(cacheKey, price);
                    return price;
                }
            }

            throw new Error('Unable to find price for this vehicle');

        } catch (error) {
            console.error('Error fetching vehicle price:', error);
            throw error;
        }
    }

    // Generate cache key for vehicle data
    function generateCacheKey(vehicleData) {
        return `${vehicleData.vehicleNumber || ''}-${vehicleData.manufacturer || ''}-${vehicleData.model || ''}-${vehicleData.year || ''}`;
    }

    // Cache price data
    function cachePrice(key, price) {
        priceCache.set(key, {
            price: price,
            timestamp: Date.now()
        });
    }

    // Fetch price by vehicle number
    async function fetchPriceByVehicleNumber(vehicleNumber) {
        try {
            // This would need to be implemented based on Yad2's actual API or scraping method
            // For now, return null to fall back to detail-based lookup
            return null;
        } catch (error) {
            console.error('Error fetching price by vehicle number:', error);
            return null;
        }
    }

    // Fetch price by vehicle details
    async function fetchPriceByDetails(vehicleData) {
        try {
            // Map manufacturer names to Yad2's format
            const manufacturerMap = {
                'קיה': 'kia',
                'הונדה': 'honda',
                'טויוטה': 'toyota',
                'מזדה': 'mazda',
                'ניסאן': 'nissan',
                'מיצובישי': 'mitsubishi',
                'סובארו': 'subaru',
                'הונדאי': 'hyundai',
                'BMW': 'bmw',
                'מרצדס': 'mercedes',
                'אאודי': 'audi',
                'פולקסווגן': 'volkswagen',
                'פורד': 'ford',
                'שברולט': 'chevrolet',
                'פיגו': 'peugeot',
                'רנו': 'renault',
                'סיטרואן': 'citroen'
            };

            const manufacturer = manufacturerMap[vehicleData.manufacturer] || vehicleData.manufacturer.toLowerCase();
            
            // Try to find the sub-model ID by searching Yad2
            const subModelId = await findSubModelId(manufacturer, vehicleData.model, vehicleData.year);
            
            if (subModelId) {
                return await fetchPriceFromSubModel(subModelId, vehicleData.year, vehicleData.mileage, vehicleData.engineSize);
            }

            return null;

        } catch (error) {
            console.error('Error fetching price by details:', error);
            return null;
        }
    }

    // Find sub-model ID on Yad2
    async function findSubModelId(manufacturer, model, year) {
        try {
            // This is a simplified approach - in reality, you'd need to scrape Yad2's search interface
            // or use their API if available
            
            // For now, return a mock ID - in production, this would need proper implementation
            const mockSubModelId = '110436'; // This would be dynamically determined
            return mockSubModelId;

        } catch (error) {
            console.error('Error finding sub-model ID:', error);
            return null;
        }
    }

    // Fetch price from Yad2 sub-model page
    async function fetchPriceFromSubModel(subModelId, year, mileage, engineSize) {
        try {
            const url = `https://www.yad2.co.il/price-list/sub-model/${subModelId}/${year}`;
            
            // Note: This approach has limitations due to CORS and Yad2's bot protection
            // In a real implementation, you might need to:
            // 1. Use a proxy server
            // 2. Implement the scraping on a backend service
            // 3. Use Yad2's official API if available
            
            // For now, return mock data
            const mockPrice = {
                weightedPrice: 85000,
                priceRange: {
                    min: 75000,
                    max: 95000
                },
                source: 'yad2',
                url: url,
                lastUpdated: new Date().toISOString()
            };

            return mockPrice;

        } catch (error) {
            console.error('Error fetching price from sub-model:', error);
            throw error;
        }
    }

    // Handle extension installation
    chrome.runtime.onInstalled.addListener(() => {
        console.log('Yad2 Vehicle Price Extension installed');
    });

})();



