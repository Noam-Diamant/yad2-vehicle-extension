// Test script to check sub-model IDs
// Run this in browser console to test the IDs

const testSubModelIds = [
    '110430', // 2018
    '110432', // 2019
    '110434', // 2020 (old, wrong)
    '110436', // 2020 (new, hopefully correct)
    '110438', // 2021
    '110440', // 2022
];

async function testSubModelId(id, year) {
    const url = `https://www.yad2.co.il/price-list/sub-model/${id}/${year}`;
    console.log(`Testing ${id} for year ${year}: ${url}`);
    
    try {
        const response = await fetch(url, {
            method: 'HEAD',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            mode: 'cors'
        });
        
        if (response.ok) {
            console.log(`✅ ${id} for ${year}: OK (${response.status})`);
            return true;
        } else {
            console.log(`❌ ${id} for ${year}: ${response.status} ${response.statusText}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${id} for ${year}: Error - ${error.message}`);
        return false;
    }
}

async function testAllIds() {
    console.log('=== Testing Sub-Model IDs for Kia Picanto ===');
    
    for (const id of testSubModelIds) {
        const year = 2020; // Test for 2020
        await testSubModelId(id, year);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
    }
    
    console.log('=== Testing Complete ===');
}

// Run the test
testAllIds();
