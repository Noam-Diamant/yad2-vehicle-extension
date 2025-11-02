// Background service worker for Yad2 price fetching
(function() {
    'use strict';

    console.log('=== BACKGROUND SCRIPT STARTING ===');
    console.log('Background script is running!');
    console.log('Background service worker initialized successfully');

    // Cache for price data
    const priceCache = new Map();
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Background received message:', request.type, request.data);
        
        if (request.type === 'PING') {
            console.log('PING received, responding...');
            sendResponse({ status: 'alive' });
            return true;
        } else if (request.type === 'VEHICLE_DATA_EXTRACTED') {
            console.log('Handling VEHICLE_DATA_EXTRACTED message');
            console.log('Message sent successfully to background');
            handleVehicleData(request.data).then(() => {
                console.log('Vehicle data processing completed');
                sendResponse({ success: true });
            }).catch(error => {
                console.error('Error processing vehicle data:', error);
                sendResponse({ error: error.message });
            });
            return true; // Keep message channel open for async response
        } else if (request.type === 'YAD2_PRICE_DATA') {
            console.log('Handling YAD2_PRICE_DATA message');
            handleYad2PriceData(request.data);
            sendResponse({ success: true, message: 'Price data received and stored' });
            return true;
        } else if (request.type === 'GET_PRICE') {
            console.log('Handling GET_PRICE message');
            getVehiclePrice(request.data).then(price => {
                sendResponse({ price });
            }).catch(error => {
                sendResponse({ error: error.message });
            });
            return true; // Keep message channel open for async response
        } else if (request.type === 'OPEN_YAD2_CALCULATOR') {
            console.log('Handling OPEN_YAD2_CALCULATOR message (user clicked button)');
            openYad2Calculator(request.data).then(() => {
                sendResponse({ success: true });
            }).catch(error => {
                console.error('Error opening Yad2 calculator:', error);
                sendResponse({ error: error.message });
            });
            return true; // Keep message channel open for async response
        }
    });

    // Handle Yad2 price data from content script
    function handleYad2PriceData(priceData) {
        console.log('=== REAL YAD2 PRICE DATA RECEIVED ===');
        console.log('Yad2 price data:', priceData);
        
        // Add metadata to show this is real Yad2 data
        const enrichedPriceData = {
            ...priceData,
            source: 'yad2_real',
            lastUpdated: new Date().toISOString(),
            isRealYad2Data: true
        };
        
        // Store the price data for popup access (this overrides any estimation)
        chrome.storage.local.set({
            currentVehiclePrice: enrichedPriceData,
            priceTimestamp: Date.now(),
            priceError: null
        });
        
        console.log('✅ Real Yad2 price stored successfully!');
        
        // Optional: Close the Yad2 tab after extracting data
        chrome.tabs.query({ url: 'https://www.yad2.co.il/price-list/sub-model/*' }, (tabs) => {
            if (tabs.length > 0) {
                console.log('Consider closing Yad2 tab:', tabs[0].id);
                // Uncomment to auto-close: chrome.tabs.remove(tabs[0].id);
            }
        });
    }

    // Track last processed vehicle to prevent duplicates
    let lastProcessedVehicle = null;
    let lastProcessedTime = 0;
    const VEHICLE_PROCESS_COOLDOWN = 5000; // 5 seconds

    // Handle extracted vehicle data
    async function handleVehicleData(vehicleData) {
        console.log('Vehicle data extracted:', vehicleData);
        
        try {
            // Check if this is a duplicate call
            const vehicleKey = `${vehicleData.vehicleNumber || ''}-${vehicleData.manufacturer || ''}-${vehicleData.model || ''}-${vehicleData.year || ''}`;
            const now = Date.now();
            
            if (lastProcessedVehicle === vehicleKey && (now - lastProcessedTime) < VEHICLE_PROCESS_COOLDOWN) {
                console.log('🚫 Duplicate vehicle data received, skipping...');
                return;
            }
            
            lastProcessedVehicle = vehicleKey;
            lastProcessedTime = now;
            
            // Store in cache for popup access
            await chrome.storage.local.set({
                currentVehicleData: vehicleData,
                timestamp: Date.now()
            });

            // Just store the vehicle data - don't auto-open Yad2
            // The popup will trigger Yad2 opening when user clicks the button
            console.log('✅ Vehicle data stored successfully');
            console.log('Waiting for user to click extension button to open Yad2...');
        } catch (error) {
            console.error('Error in handleVehicleData:', error);
            throw error;
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

            // Skip Yad2 calculator due to CAPTCHA, go directly to market estimation
            console.log('All price lookup methods failed, using market estimation...');
            const estimatedPrice = estimateMarketPrice(vehicleData);
            if (estimatedPrice) {
                return estimatedPrice;
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

    // Fetch price by vehicle number - NOT USED, use openYad2Calculator instead
    async function fetchPriceByVehicleNumber(vehicleNumber) {
        console.log('Skipping direct fetch, will open Yad2 tab for user');
        return null;
    }

    // Extract price data from Yad2 search results
    function extractPriceFromSearchResults(html, vehicleNumber) {
        try {
            console.log('Extracting price from search results for vehicle:', vehicleNumber);
            
            // Look for price patterns in the search results
            const pricePatterns = [
                /(\d{1,3}(?:,\d{3})*)\s*₪/g,
                /(\d{1,3}(?:,\d{3})*)\s*שקל/g,
                /מחיר[:\s]*(\d{1,3}(?:,\d{3})*)/g
            ];
            
            const prices = [];
            for (const pattern of pricePatterns) {
                const matches = [...html.matchAll(pattern)];
                matches.forEach(match => {
                    const price = parseInt(match[1].replace(/,/g, ''));
                    if (price > 10000 && price < 1000000) { // Reasonable price range
                        prices.push(price);
                    }
                });
            }
            
            if (prices.length === 0) {
                console.log('No prices found in search results');
                return null;
            }
            
            // Calculate statistics
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
            
            console.log(`Found ${prices.length} prices: min=${minPrice}, max=${maxPrice}, avg=${avgPrice}`);
            
            return {
                basePrice: avgPrice,
                weightedPrice: avgPrice,
                priceRange: {
                    min: minPrice,
                    max: maxPrice
                },
                source: 'yad2_search',
                lastUpdated: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error extracting price from search results:', error);
            return null;
        }
    }

    // Fetch price by vehicle details - Opens Yad2 tab for user
    async function fetchPriceByDetails(vehicleData) {
        try {
            // Instead of fetching, open Yad2 calculator for the user (only once!)
            console.log('Will attempt to open Yad2 calculator for user to get real price');
            
            // This will handle duplicate prevention internally
            await openYad2Calculator(vehicleData);
            
            return null; // Return null for now, price will come from Yad2 content script
            
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
                const priceData = await fetchPriceFromSubModel(subModelId, vehicleData.year, vehicleData.mileage, vehicleData.engineSize);
                
                // If we got base price but no weighted price, calculate it
                if (priceData && priceData.basePrice && !priceData.weightedPrice) {
                    priceData.weightedPrice = calculateWeightedPrice(priceData.basePrice, vehicleData);
                }
                
                return priceData;
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
            console.log(`Searching for sub-model ID: ${manufacturer} ${model} ${year}`);
            
            // First try the main price list page
            const mainUrl = 'https://www.yad2.co.il/price-list';
            
            const response = await fetch(mainUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
                },
                mode: 'cors'
            });

            if (!response.ok) {
                console.log('Failed to fetch main price list page, using fallback');
                return getFallbackSubModelId(manufacturer, model, year);
            }

            const html = await response.text();
            
            // Check if we got a CAPTCHA page
            if (html.includes('Are you for real') || html.includes('CAPTCHA')) {
                console.log('Got CAPTCHA page, using fallback');
                return getFallbackSubModelId(manufacturer, model, year);
            }
            
            const subModelId = extractSubModelIdFromHtml(html, manufacturer, model, year);
            
            if (subModelId) {
                console.log(`Found sub-model ID: ${subModelId}`);
                return subModelId;
            }

            console.log('Sub-model ID not found, using fallback');
            return getFallbackSubModelId(manufacturer, model, year);

        } catch (error) {
            console.error('Error finding sub-model ID:', error);
            return getFallbackSubModelId(manufacturer, model, year);
        }
    }

    // Extract sub-model ID from HTML search results
    function extractSubModelIdFromHtml(html, manufacturer, model, year) {
        try {
            console.log(`Extracting sub-model ID for ${manufacturer} ${model} ${year}`);
            
            // Look for popular models section first
            const popularSectionPattern = /<div[^>]*class="[^"]*popular[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
            const popularMatch = html.match(popularSectionPattern);
            
            if (popularMatch) {
                const popularSection = popularMatch[1];
                console.log('Found popular models section, searching within it...');
                
                // Look for model links in popular section
                const modelLinkPattern = new RegExp(`href="/price-list/sub-model/(\\d+)/(${year})"`, 'g');
                const matches = [...popularSection.matchAll(modelLinkPattern)];
                
                if (matches.length > 0) {
                    console.log(`Found ${matches.length} model links for year ${year} in popular section`);
                    return matches[0][1];
                }
            }
            
            // Look for model links in the entire HTML
            const modelLinkPattern = new RegExp(`href="/price-list/sub-model/(\\d+)/(${year})"`, 'g');
            const matches = [...html.matchAll(modelLinkPattern)];
            
            if (matches.length > 0) {
                console.log(`Found ${matches.length} model links for year ${year}`);
                return matches[0][1];
            }

            // Look for any sub-model links (without year restriction)
            const anyYearPattern = /href="\/price-list\/sub-model\/(\d+)\/\d{4}"/g;
            const anyYearMatches = [...html.matchAll(anyYearPattern)];
            if (anyYearMatches.length > 0) {
                console.log(`Found ${anyYearMatches.length} model links (any year)`);
                return anyYearMatches[0][1];
            }

            // Look for model names in text content near sub-model links
            const modelTextPattern = new RegExp(`${model}[^<]*<[^>]*href="/price-list/sub-model/(\\d+)/`, 'i');
            const modelTextMatch = html.match(modelTextPattern);
            if (modelTextMatch) {
                console.log('Found sub-model ID via model text pattern');
                return modelTextMatch[1];
            }

            // Look for manufacturer and model in text near sub-model links
            const manufacturerModelPattern = new RegExp(`${manufacturer}[^<]*${model}[^<]*<[^>]*href="/price-list/sub-model/(\\d+)/`, 'i');
            const manufacturerModelMatch = html.match(manufacturerModelPattern);
            if (manufacturerModelMatch) {
                console.log('Found sub-model ID via manufacturer+model pattern');
                return manufacturerModelMatch[1];
            }

            console.log('No sub-model ID found in HTML');
            return null;
        } catch (error) {
            console.error('Error extracting sub-model ID from HTML:', error);
            return null;
        }
    }

    // Fallback sub-model IDs for common vehicles
    function getFallbackSubModelId(manufacturer, model, year) {
        const fallbackIds = {
            'קיה': {
                'פיקנטו': {
                    2018: '110430',
                    2019: '110432',
                    2020: '110436', // Updated to correct ID
                    2021: '110438',
                    2022: '110440',
                    2023: '110442',
                    2024: '110444',
                    2025: '110446'
                },
                'סולטו': {
                    2018: '110500',
                    2019: '110502',
                    2020: '110504',
                    2021: '110506',
                    2022: '110508'
                },
                'סורנטו': {
                    2018: '110600',
                    2019: '110602',
                    2020: '110604',
                    2021: '110606',
                    2022: '110608'
                }
            },
            'טויוטה': {
                'קורולה': {
                    2018: '120000',
                    2019: '120002',
                    2020: '120004',
                    2021: '120006',
                    2022: '120008'
                },
                'קמארי': {
                    2018: '120100',
                    2019: '120102',
                    2020: '120104',
                    2021: '120106',
                    2022: '120108'
                }
            },
            'הונדה': {
                'סיוויק': {
                    2018: '130000',
                    2019: '130002',
                    2020: '130004',
                    2021: '130006',
                    2022: '130008'
                },
                'אקורד': {
                    2018: '130100',
                    2019: '130102',
                    2020: '130104',
                    2021: '130106',
                    2022: '130108'
                }
            },
            'מזדה': {
                '3': {
                    2018: '140000',
                    2019: '140002',
                    2020: '140004',
                    2021: '140006',
                    2022: '140008'
                },
                '6': {
                    2018: '140100',
                    2019: '140102',
                    2020: '140104',
                    2021: '140106',
                    2022: '140108'
                }
            },
            'סקודה': {
                'אוקטביה': {
                    2013: '150000',
                    2014: '150002',
                    2015: '150004',
                    2016: '150006',
                    2017: '150008',
                    2018: '150010',
                    2019: '150012',
                    2020: '150014',
                    2021: '150016',
                    2022: '150018'
                },
                'פאביה': {
                    2015: '150100',
                    2016: '150102',
                    2017: '150104',
                    2018: '150106',
                    2019: '150108',
                    2020: '150110'
                }
            }
        };

        const manufacturerData = fallbackIds[manufacturer];
        if (manufacturerData) {
            const modelData = manufacturerData[model];
            if (modelData) {
                return modelData[year] || modelData[Object.keys(modelData)[0]];
            }
        }

        // No fallback found - return null to open main price list page
        console.log('No sub-model ID found for:', manufacturer, model, year);
        return null;
    }

    // Fetch price from Yad2 sub-model page
    async function fetchPriceFromSubModel(subModelId, year, mileage, engineSize) {
        try {
            // First try the direct sub-model URL
            const url = `https://www.yad2.co.il/price-list/sub-model/${subModelId}/${year}`;
            console.log('Fetching price from Yad2 URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                },
                mode: 'cors'
            });

            if (response.ok) {
                const html = await response.text();
                console.log('Successfully fetched Yad2 page, length:', html.length);
                
                // Check if we got a CAPTCHA page
                if (html.includes('Are you for real') || html.includes('CAPTCHA')) {
                    console.log('Got CAPTCHA page, trying alternative method...');
                    return await fetchFromMainPriceList(subModelId, year, mileage);
                }
                
                const priceData = parseYad2PricePage(html, year, mileage);
                if (priceData) {
                    return {
                        ...priceData,
                        source: 'yad2',
                        url: url,
                        lastUpdated: new Date().toISOString()
                    };
                }
            }

            // If direct URL failed, try the main price list page
            console.log('Direct URL failed, trying main price list page...');
            return await fetchFromMainPriceList(subModelId, year, mileage);

        } catch (error) {
            console.error('Error fetching price from sub-model:', error);
            // Try fallback method
            return await fetchFromMainPriceList(subModelId, year, mileage);
        }
    }

    // Fetch price from main Yad2 price list page
    async function fetchFromMainPriceList(subModelId, year, mileage) {
        try {
            const mainUrl = 'https://www.yad2.co.il/price-list';
            console.log('Fetching from main price list:', mainUrl);
            
            const response = await fetch(mainUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
                },
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const html = await response.text();
            const priceData = parseMainPriceListPage(html, year, mileage);
            
            if (priceData) {
                return {
                    ...priceData,
                    source: 'yad2_main',
                    url: mainUrl,
                    lastUpdated: new Date().toISOString()
                };
            }

            throw new Error('Could not extract price data from main price list');

        } catch (error) {
            console.error('Error fetching from main price list:', error);
            throw error;
        }
    }

    // Parse main Yad2 price list page
    function parseMainPriceListPage(html, year, mileage) {
        try {
            console.log('Parsing main Yad2 price list page...');
            
            // Look for popular models section with prices
            const popularModelsPattern = /<div[^>]*class="[^"]*popular[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
            const popularMatch = html.match(popularModelsPattern);
            
            if (popularMatch) {
                const popularSection = popularMatch[1];
                console.log('Found popular models section');
                
                // Look for price patterns in popular section
                const pricePatterns = [
                    /(\d{1,3}(?:,\d{3})*)\s*₪/g,
                    /החל\s*מ-?\s*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                    /(\d{1,3}(?:,\d{3})*)\s*שקל/g,
                    /מחיר[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g
                ];
                
                const prices = [];
                for (const pattern of pricePatterns) {
                    const matches = [...popularSection.matchAll(pattern)];
                    matches.forEach(match => {
                        const price = parseInt(match[1].replace(/,/g, ''));
                        if (price > 50000 && price < 500000) { // Reasonable range for cars
                            prices.push(price);
                        }
                    });
                }
                
                if (prices.length > 0) {
                    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);
                    
                    console.log(`Found ${prices.length} prices in popular section: avg=${avgPrice}, min=${minPrice}, max=${maxPrice}`);
                    
                    return {
                        basePrice: avgPrice,
                        weightedPrice: avgPrice,
                        priceRange: {
                            min: minPrice,
                            max: maxPrice
                        }
                    };
                }
            }
            
            // Fallback: look for any price patterns in the entire page
            const allPricePatterns = [
                /(\d{1,3}(?:,\d{3})*)\s*₪/g,
                /החל\s*מ-?\s*₪?\s*(\d{1,3}(?:,\d{3})*)/g
            ];
            
            const allPrices = [];
            for (const pattern of allPricePatterns) {
                const matches = [...html.matchAll(pattern)];
                matches.forEach(match => {
                    const price = parseInt(match[1].replace(/,/g, ''));
                    if (price > 50000 && price < 500000) {
                        allPrices.push(price);
                    }
                });
            }
            
            if (allPrices.length > 0) {
                const avgPrice = Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length);
                const minPrice = Math.min(...allPrices);
                const maxPrice = Math.max(...allPrices);
                
                console.log(`Found ${allPrices.length} prices in entire page: avg=${avgPrice}, min=${minPrice}, max=${maxPrice}`);
                
                return {
                    basePrice: avgPrice,
                    weightedPrice: avgPrice,
                    priceRange: {
                        min: minPrice,
                        max: maxPrice
                    }
                };
            }
            
            console.log('No prices found in main price list page');
            return null;
            
        } catch (error) {
            console.error('Error parsing main price list page:', error);
            return null;
        }
    }

    // Parse Yad2 price page HTML to extract price information
    function parseYad2PricePage(html, year, mileage) {
        try {
            console.log('Parsing Yad2 price page...');
            
            // Look for price patterns in the HTML
            // Common patterns in Yad2 price pages:
            // 1. Base price: "החל מ- ₪ 150,600"
            // 2. Price range: "₪ 120,000 - ₪ 180,000"
            // 3. Weighted price: "מחיר משוקלל: ₪ 145,000"
            // 4. Popular models prices
            
            let basePrice = null;
            let priceRange = null;
            let weightedPrice = null;

            // Pattern 1: Base price (החל מ-)
            const basePricePatterns = [
                /החל\s*מ-?\s*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                /מחיר\s*התחלתי[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                /מחיר\s*בסיס[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g
            ];
            
            for (const pattern of basePricePatterns) {
                const match = html.match(pattern);
                if (match) {
                    const price = parseInt(match[1].replace(/,/g, ''));
                    if (price > 10000 && price < 1000000) {
                        basePrice = price;
                        console.log('Found base price:', basePrice);
                        break;
                    }
                }
            }

            // Pattern 2: Price range (₪ X - ₪ Y)
            const priceRangePatterns = [
                /₪?\s*(\d{1,3}(?:,\d{3})*)\s*-\s*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                /טווח\s*מחירים[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)\s*-\s*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                /מחיר[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)\s*-\s*₪?\s*(\d{1,3}(?:,\d{3})*)/g
            ];
            
            for (const pattern of priceRangePatterns) {
                const match = html.match(pattern);
                if (match) {
                    const minPrice = parseInt(match[1].replace(/,/g, ''));
                    const maxPrice = parseInt(match[2].replace(/,/g, ''));
                    if (minPrice > 10000 && maxPrice > minPrice && maxPrice < 1000000) {
                        priceRange = { min: minPrice, max: maxPrice };
                        console.log('Found price range:', priceRange);
                        break;
                    }
                }
            }

            // Pattern 3: Weighted price (מחיר משוקלל)
            const weightedPricePatterns = [
                /מחיר\s*משוקלל[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                /מחיר\s*ממוצע[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                /מחיר\s*שקול[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g
            ];
            
            for (const pattern of weightedPricePatterns) {
                const match = html.match(pattern);
                if (match) {
                    const price = parseInt(match[1].replace(/,/g, ''));
                    if (price > 10000 && price < 1000000) {
                        weightedPrice = price;
                        console.log('Found weighted price:', weightedPrice);
                        break;
                    }
                }
            }

            // Pattern 4: Look for calculator results (מחיר מחירון משוקלל)
            if (!weightedPrice) {
                const calculatorPatterns = [
                    /מחיר\s*מחירון\s*משוקלל[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                    /מחיר\s*משוקלל[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                    /מחיר\s*סופי[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                    /Weighted\s*Price[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                    /Final\s*Price[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g
                ];
                
                for (const pattern of calculatorPatterns) {
                    const match = html.match(pattern);
                    if (match) {
                        const price = parseInt(match[1].replace(/,/g, ''));
                        if (price > 10000 && price < 1000000) {
                            weightedPrice = price;
                            console.log('Found calculator weighted price:', weightedPrice);
                            break;
                        }
                    }
                }
            }

            // Pattern 5: Look for price range from calculator (מינימום/מקסימום)
            if (!priceRange) {
                const rangePatterns = [
                    /מינימום[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)[^0-9]*מקסימום[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g,
                    /מינ[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)[^0-9]*מקס[:\s]*₪?\s*(\d{1,3}(?:,\d{3})*)/g
                ];
                
                for (const pattern of rangePatterns) {
                    const match = html.match(pattern);
                    if (match) {
                        const minPrice = parseInt(match[1].replace(/,/g, ''));
                        const maxPrice = parseInt(match[2].replace(/,/g, ''));
                        if (minPrice > 10000 && maxPrice > minPrice && maxPrice < 1000000) {
                            priceRange = { min: minPrice, max: maxPrice };
                            console.log('Found calculator price range:', priceRange);
                            break;
                        }
                    }
                }
            }

            // Pattern 6: Look for any reasonable car prices in the page (fallback)
            if (!basePrice && !priceRange && !weightedPrice) {
                console.log('No specific price patterns found, looking for any car prices...');
                const allPricePatterns = [
                    /(\d{1,3}(?:,\d{3})*)\s*₪/g,
                    /₪\s*(\d{1,3}(?:,\d{3})*)/g
                ];
                
                const allPrices = [];
                for (const pattern of allPricePatterns) {
                    const matches = [...html.matchAll(pattern)];
                    matches.forEach(match => {
                        const price = parseInt(match[1].replace(/,/g, ''));
                        if (price > 50000 && price < 500000) { // Reasonable car price range
                            allPrices.push(price);
                        }
                    });
                }
                
                if (allPrices.length > 0) {
                    const avgPrice = Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length);
                    const minPrice = Math.min(...allPrices);
                    const maxPrice = Math.max(...allPrices);
                    
                    basePrice = avgPrice;
                    priceRange = { min: minPrice, max: maxPrice };
                    console.log(`Found ${allPrices.length} prices: avg=${avgPrice}, min=${minPrice}, max=${maxPrice}`);
                }
            }

            // If we found a base price but no weighted price, calculate it
            if (basePrice && !weightedPrice) {
                weightedPrice = calculateWeightedPrice(basePrice, { mileage, year });
                console.log('Calculated weighted price:', weightedPrice);
            }

            // If we found a price range but no base price, use the average
            if (priceRange && !basePrice) {
                basePrice = Math.round((priceRange.min + priceRange.max) / 2);
                console.log('Using average of price range as base price:', basePrice);
            }

            // If we have a base price but no range, estimate it (±15%)
            if (basePrice && !priceRange) {
                priceRange = {
                    min: Math.round(basePrice * 0.85),
                    max: Math.round(basePrice * 1.15)
                };
                console.log('Estimated price range:', priceRange);
            }

            if (!basePrice && !priceRange && !weightedPrice) {
                console.log('No price data found in HTML');
                return null;
            }

            return {
                basePrice: basePrice,
                weightedPrice: weightedPrice || basePrice,
                priceRange: priceRange
            };

        } catch (error) {
            console.error('Error parsing Yad2 price page:', error);
            return null;
        }
    }

    // Calculate weighted price based on vehicle parameters
    function calculateWeightedPrice(basePrice, vehicleData) {
        if (!basePrice) return null;
        
        let adjustedPrice = basePrice;
        const { mileage, year, handsCount, condition } = vehicleData || {};
        
        console.log(`Calculating weighted price for base: ${basePrice}, data:`, vehicleData);
        
        // Adjust for mileage (more realistic depreciation)
        if (mileage) {
            // More aggressive depreciation for high mileage
            let mileageDepreciation = 0;
            if (mileage <= 50000) {
                mileageDepreciation = mileage * 0.0001; // 0.01% per km up to 50k
            } else if (mileage <= 100000) {
                mileageDepreciation = 0.5 + (mileage - 50000) * 0.0002; // 0.5% + 0.02% per km over 50k
            } else {
                mileageDepreciation = 1.5 + (mileage - 100000) * 0.0003; // 1.5% + 0.03% per km over 100k
            }
            
            // Cap depreciation at 25%
            mileageDepreciation = Math.min(mileageDepreciation, 0.25);
            adjustedPrice = adjustedPrice * (1 - mileageDepreciation);
            console.log(`Mileage adjustment: -${(mileageDepreciation * 100).toFixed(1)}% (${mileage} km)`);
        }
        
        // Adjust for number of hands (more realistic)
        if (handsCount && handsCount > 1) {
            const handsDepreciation = (handsCount - 1) * 0.08; // 8% per additional hand (was 12%)
            adjustedPrice = adjustedPrice * (1 - handsDepreciation);
            console.log(`Hands adjustment: -${(handsDepreciation * 100).toFixed(1)}% (${handsCount} hands)`);
        }
        
        // Adjust for vehicle age (more realistic)
        if (year) {
            const currentYear = new Date().getFullYear();
            const vehicleAge = currentYear - year;
            if (vehicleAge > 0) {
                // Less aggressive age depreciation
                const ageDepreciation = Math.min(vehicleAge * 0.03, 0.2); // 3% per year, max 20% (was 5% and 30%)
                adjustedPrice = adjustedPrice * (1 - ageDepreciation);
                console.log(`Age adjustment: -${(ageDepreciation * 100).toFixed(1)}% (${vehicleAge} years old)`);
            }
        }
        
        // Adjust for condition (if available)
        if (condition) {
            let conditionMultiplier = 1.0;
            const cond = condition.toLowerCase();
            if (cond.includes('מצוין') || cond.includes('מצוין מאוד')) {
                conditionMultiplier = 1.02; // Slight premium for excellent condition
            } else if (cond.includes('טוב') || cond.includes('טוב מאוד')) {
                conditionMultiplier = 1.0; // No change for good condition
            } else if (cond.includes('בינוני')) {
                conditionMultiplier = 0.95; // Slight discount for fair condition
            } else if (cond.includes('לא טוב') || cond.includes('רע')) {
                conditionMultiplier = 0.85; // Larger discount for poor condition
            }
            adjustedPrice = adjustedPrice * conditionMultiplier;
            console.log(`Condition adjustment: ${((conditionMultiplier - 1) * 100).toFixed(1)}% (${condition})`);
        }
        
        // Ensure reasonable price range (30-90% of base price)
        adjustedPrice = Math.max(adjustedPrice, basePrice * 0.3);
        adjustedPrice = Math.min(adjustedPrice, basePrice * 0.9);
        
        console.log(`Final price calculation: ${basePrice} -> ${Math.round(adjustedPrice)}`);
        return Math.round(adjustedPrice);
    }

    // Fetch price from Yad2 calculator
    async function fetchFromYad2Calculator(vehicleData) {
        try {
            console.log('Trying to fetch from Yad2 calculator...');
            
            // Try to find the vehicle in Yad2's database and get calculator data
            const searchUrl = `https://www.yad2.co.il/vehicles/cars?manufacturer=${encodeURIComponent(vehicleData.manufacturer)}&model=${encodeURIComponent(vehicleData.model)}&year=${vehicleData.year}`;
            
            const response = await fetch(searchUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
                },
                mode: 'cors'
            });

            if (!response.ok) {
                console.log('Failed to fetch from Yad2 calculator, status:', response.status);
                return null;
            }

            const html = await response.text();
            
            // Look for calculator results or price data
            const calculatorPatterns = [
                /מחירון[^>]*>([^<]*(\d{1,3}(?:,\d{3})*)[^<]*)</g,
                /מחיר\s*משוקלל[^>]*>([^<]*(\d{1,3}(?:,\d{3})*)[^<]*)</g,
                /טווח\s*מחירים[^>]*>([^<]*(\d{1,3}(?:,\d{3})*)[^<]*)</g
            ];
            
            for (const pattern of calculatorPatterns) {
                const matches = [...html.matchAll(pattern)];
                if (matches.length > 0) {
                    const prices = [];
                    matches.forEach(match => {
                        const priceText = match[1];
                        const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*)/);
                        if (priceMatch) {
                            const price = parseInt(priceMatch[1].replace(/,/g, ''));
                            if (price > 10000 && price < 1000000) {
                                prices.push(price);
                            }
                        }
                    });
                    
                    if (prices.length > 0) {
                        const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);
                        
                        console.log(`Found calculator prices: avg=${avgPrice}, min=${minPrice}, max=${maxPrice}`);
                        
                        return {
                            basePrice: avgPrice,
                            weightedPrice: avgPrice,
                            priceRange: {
                                min: minPrice,
                                max: maxPrice
                            },
                            source: 'yad2_calculator',
                            lastUpdated: new Date().toISOString()
                        };
                    }
                }
            }
            
            console.log('No calculator data found');
            return null;
            
        } catch (error) {
            console.error('Error fetching from Yad2 calculator:', error);
            return null;
        }
    }

    // Estimate market price based on vehicle data
    function estimateMarketPrice(vehicleData) {
        try {
            const { manufacturer, model, year, mileage } = vehicleData;
            
            // Market price estimates for common vehicles (base prices for 2020-2022)
            const marketPrices = {
                'קיה': {
                    'פיקנטו': {
                        basePrice: 85000, // Base price for 2020 Picanto (adjusted to market reality)
                        yearAdjustment: 0.92 // 8% depreciation per year
                    },
                    'סולטו': {
                        basePrice: 120000,
                        yearAdjustment: 0.93
                    },
                    'סורנטו': {
                        basePrice: 180000,
                        yearAdjustment: 0.92
                    }
                },
                'טויוטה': {
                    'קורולה': {
                        basePrice: 130000,
                        yearAdjustment: 0.94
                    },
                    'קמארי': {
                        basePrice: 200000,
                        yearAdjustment: 0.92
                    }
                },
                'הונדה': {
                    'סיוויק': {
                        basePrice: 140000,
                        yearAdjustment: 0.94
                    },
                    'אקורד': {
                        basePrice: 190000,
                        yearAdjustment: 0.92
                    }
                },
                'מזדה': {
                    '3': {
                        basePrice: 110000,
                        yearAdjustment: 0.93
                    },
                    '6': {
                        basePrice: 160000,
                        yearAdjustment: 0.92
                    }
                }
            };

            const manufacturerData = marketPrices[manufacturer];
            if (!manufacturerData) {
                console.log('No market data for manufacturer:', manufacturer);
                return null;
            }

            const modelData = manufacturerData[model];
            if (!modelData) {
                console.log('No market data for model:', model);
                return null;
            }

            let estimatedPrice = modelData.basePrice;
            
            // Adjust for year
            if (year) {
                const currentYear = new Date().getFullYear();
                const yearsOld = currentYear - year;
                estimatedPrice = estimatedPrice * Math.pow(modelData.yearAdjustment, yearsOld);
            }

            // Calculate weighted price with the estimated base price
            const weightedPrice = calculateWeightedPrice(estimatedPrice, vehicleData);
            
            // Create price range (±15% of weighted price)
            const priceRange = {
                min: Math.round(weightedPrice * 0.85),
                max: Math.round(weightedPrice * 1.15)
            };

            console.log(`Estimated market price: base=${estimatedPrice}, weighted=${weightedPrice}, range=${priceRange.min}-${priceRange.max}`);

            return {
                basePrice: estimatedPrice,
                weightedPrice: weightedPrice,
                priceRange: priceRange,
                source: 'market_estimation',
                lastUpdated: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error estimating market price:', error);
            return null;
        }
    }

    // Track if we already opened a Yad2 tab
    let yad2TabOpenTimestamp = 0;
    let yad2TabId = null;
    let yad2TabOpening = false; // Flag to prevent concurrent openings
    const TAB_COOLDOWN = 10000; // 10 seconds cooldown

    // Open Yad2 calculator with vehicle parameters
    async function openYad2Calculator(vehicleData) {
        try {
            console.log('=== OPENING YAD2 CALCULATOR REQUEST ===');
            console.log('Vehicle data:', vehicleData);
            
            // Check if we're currently in the process of opening a tab
            if (yad2TabOpening) {
                console.log('🚫 Already opening a Yad2 tab, skipping duplicate request...');
                return;
            }
            
            // Check if we recently opened a tab
            const now = Date.now();
            if (yad2TabId && (now - yad2TabOpenTimestamp) < TAB_COOLDOWN) {
                console.log('⏸️ Yad2 tab recently opened, skipping... (cooldown active)');
                // Try to update the existing tab instead
                try {
                    await chrome.tabs.get(yad2TabId);
                    console.log('Existing Yad2 tab still open, reusing it');
                    setTimeout(() => {
                        fillYad2Calculator(vehicleData, yad2TabId);
                    }, 500); // Reduced to 500ms
                    return;
                } catch (e) {
                    console.log('Previous tab no longer exists, will create new one');
                    yad2TabId = null;
                }
            }
            
            // Set the flag to prevent concurrent calls
            yad2TabOpening = true;
            
            // Check if there's already an open Yad2 calculator tab
            const existingTabs = await chrome.tabs.query({ 
                url: 'https://www.yad2.co.il/price-list/sub-model/*' 
            });
            
            if (existingTabs.length > 0) {
                console.log('Found existing Yad2 calculator tab, reusing it');
                yad2TabId = existingTabs[0].id;
                yad2TabOpenTimestamp = now;
                
                // Focus the existing tab
                await chrome.tabs.update(yad2TabId, { active: true });
                
                // Fill the form
                setTimeout(() => {
                    fillYad2Calculator(vehicleData, yad2TabId);
                }, 500); // Reduced to 500ms
                
                // Reset the flag
                yad2TabOpening = false;
                return;
            }
            
            // Try to find sub-model ID from dictionary first
            let subModelId = null;
            let targetUrl = null;
            
            if (vehicleData.manufacturer && vehicleData.model && vehicleData.year) {
                subModelId = getFallbackSubModelId(vehicleData.manufacturer, vehicleData.model, vehicleData.year);
                
                if (subModelId) {
                    // Found in dictionary - go directly to specific model page!
                    targetUrl = `https://www.yad2.co.il/price-list/sub-model/${subModelId}/${vehicleData.year}`;
                    console.log('✅ Found sub-model ID in dictionary:', subModelId);
                    console.log('🎯 Opening direct URL:', targetUrl);
                } else {
                    console.log('⚠️ Sub-model not found in dictionary, will try vehicle number search as fallback');
                }
            }
            
            // If not found in dictionary, fall back to main price list page (vehicle number search)
            if (!targetUrl) {
                if (vehicleData.vehicleNumber) {
                    targetUrl = 'https://www.yad2.co.il/price-list';
                    console.log('📋 Fallback: Opening main price list for vehicle number search:', vehicleData.vehicleNumber);
                } else {
                    console.error('❌ No sub-model ID found and no vehicle number available');
                    return;
                }
            }
            
            const tab = await chrome.tabs.create({ 
                url: targetUrl,
                active: true // Open in foreground so user can see it
            });
            
            yad2TabId = tab.id;
            yad2TabOpenTimestamp = now;
            console.log('Yad2 tab opened:', tab.id, 'URL:', targetUrl);
            
            // Store the vehicle data so we can use it when the page loads
            await chrome.storage.local.set({
                pendingYad2Fill: {
                    vehicleData: vehicleData,
                    tabId: tab.id,
                    timestamp: now,
                    usedDictionary: !!subModelId,
                    subModelId: subModelId
                }
            });
            
            // Wait for the page to load, then fill the form
            // If we're on specific model page, just fill the form
            // If we're on main page, trigger vehicle number search flow
            setTimeout(() => {
                fillYad2Calculator(vehicleData, tab.id);
            }, subModelId ? 1000 : 1500); // Faster if going directly to model page
            
        } catch (error) {
            console.error('Error opening Yad2 calculator:', error);
        } finally {
            // Always reset the flag
            yad2TabOpening = false;
            console.log('✅ Tab opening process completed, flag reset');
        }
    }

    // Fill Yad2 calculator with vehicle parameters
    function fillYad2Calculator(vehicleData, tabId = null) {
        try {
            console.log('=== FILLING YAD2 CALCULATOR ===');
            console.log('Vehicle data:', vehicleData);
            console.log('Target tab ID:', tabId);
            
            // If we have a specific tab ID, use it
            if (tabId) {
                chrome.tabs.sendMessage(tabId, {
                    type: 'FILL_CALCULATOR',
                    data: vehicleData
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('Error sending message to Yad2 tab:', chrome.runtime.lastError.message);
                        console.log('Retrying in 3 seconds...');
                        // Retry once more after delay
                        setTimeout(() => {
                            chrome.tabs.sendMessage(tabId, {
                                type: 'FILL_CALCULATOR',
                                data: vehicleData
                            });
                        }, 3000);
                    } else {
                        console.log('Message sent to Yad2 tab successfully:', response);
                    }
                });
            } else {
                // Fallback: find any Yad2 tab
                chrome.tabs.query({ url: 'https://www.yad2.co.il/*' }, (tabs) => {
                    if (tabs.length > 0) {
                        // Use the first Yad2 tab found
                        const tab = tabs[0];
                        console.log('Found Yad2 tab:', tab.id);
                        chrome.tabs.sendMessage(tab.id, {
                            type: 'FILL_CALCULATOR',
                            data: vehicleData
                        }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.log('Error sending message to Yad2 tab:', chrome.runtime.lastError.message);
                            } else {
                                console.log('Message sent to Yad2 tab successfully:', response);
                            }
                        });
                    } else {
                        console.log('No Yad2 tabs found for filling calculator');
                    }
                });
            }
            
        } catch (error) {
            console.error('Error filling Yad2 calculator:', error);
        }
    }

    // Handle extension installation
    chrome.runtime.onInstalled.addListener(() => {
        console.log('Yad2 Vehicle Price Extension installed');
    });

    // Keep service worker alive
    chrome.runtime.onStartup.addListener(() => {
        console.log('Yad2 Vehicle Price Extension service worker started');
    });

    // Ping to keep service worker alive
    setInterval(() => {
        console.log('Service worker ping - keeping alive');
    }, 30000); // Every 30 seconds

})();




