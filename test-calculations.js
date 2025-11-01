// Test script for price calculations
// Run this in browser console to test the calculations

function calculateWeightedPrice(basePrice, vehicleData) {
    if (!basePrice) return null;
    
    let adjustedPrice = basePrice;
    const { mileage, year, handsCount, condition } = vehicleData || {};
    
    console.log(`Calculating weighted price for base: ${basePrice}, data:`, vehicleData);
    
    // Adjust for mileage (more realistic depreciation)
    if (mileage) {
        let mileageDepreciation = 0;
        if (mileage <= 50000) {
            mileageDepreciation = mileage * 0.0001; // 0.01% per km up to 50k
        } else if (mileage <= 100000) {
            mileageDepreciation = 0.5 + (mileage - 50000) * 0.0002; // 0.5% + 0.02% per km over 50k
        } else {
            mileageDepreciation = 1.5 + (mileage - 100000) * 0.0003; // 1.5% + 0.03% per km over 100k
        }
        
        mileageDepreciation = Math.min(mileageDepreciation, 0.25);
        adjustedPrice = adjustedPrice * (1 - mileageDepreciation);
        console.log(`Mileage adjustment: -${(mileageDepreciation * 100).toFixed(1)}% (${mileage} km)`);
    }
    
    // Adjust for number of hands
    if (handsCount && handsCount > 1) {
        const handsDepreciation = (handsCount - 1) * 0.08; // 8% per additional hand
        adjustedPrice = adjustedPrice * (1 - handsDepreciation);
        console.log(`Hands adjustment: -${(handsDepreciation * 100).toFixed(1)}% (${handsCount} hands)`);
    }
    
    // Adjust for vehicle age
    if (year) {
        const currentYear = new Date().getFullYear();
        const vehicleAge = currentYear - year;
        if (vehicleAge > 0) {
            const ageDepreciation = Math.min(vehicleAge * 0.03, 0.2); // 3% per year, max 20%
            adjustedPrice = adjustedPrice * (1 - ageDepreciation);
            console.log(`Age adjustment: -${(ageDepreciation * 100).toFixed(1)}% (${vehicleAge} years old)`);
        }
    }
    
    // Adjust for condition
    if (condition) {
        let conditionMultiplier = 1.0;
        const cond = condition.toLowerCase();
        if (cond.includes('מצוין') || cond.includes('מצוין מאוד')) {
            conditionMultiplier = 1.02;
        } else if (cond.includes('טוב') || cond.includes('טוב מאוד')) {
            conditionMultiplier = 1.0;
        } else if (cond.includes('בינוני')) {
            conditionMultiplier = 0.95;
        } else if (cond.includes('לא טוב') || cond.includes('רע')) {
            conditionMultiplier = 0.85;
        }
        adjustedPrice = adjustedPrice * conditionMultiplier;
        console.log(`Condition adjustment: ${((conditionMultiplier - 1) * 100).toFixed(1)}% (${condition})`);
    }
    
    // Ensure reasonable price range
    adjustedPrice = Math.max(adjustedPrice, basePrice * 0.3);
    adjustedPrice = Math.min(adjustedPrice, basePrice * 0.9);
    
    console.log(`Final price calculation: ${basePrice} -> ${Math.round(adjustedPrice)}`);
    return Math.round(adjustedPrice);
}

// Test with Kia Picanto 2020 data from the image
const testData = {
    manufacturer: 'קיה',
    model: 'פיקנטו',
    year: 2020,
    mileage: 75311,
    handsCount: 4, // יד רביעית
    condition: 'טוב'
};

console.log('=== Testing Price Calculations ===');
console.log('Vehicle:', testData.manufacturer, testData.model, testData.year);
console.log('Mileage:', testData.mileage, 'km');
console.log('Hands:', testData.handsCount);
console.log('Condition:', testData.condition);

// Test different base prices
const basePrices = [95000, 100000, 110000, 120000];

basePrices.forEach(basePrice => {
    const weightedPrice = calculateWeightedPrice(basePrice, testData);
    const priceRange = {
        min: Math.round(weightedPrice * 0.85),
        max: Math.round(weightedPrice * 1.15)
    };
    
    console.log(`\nBase Price: ₪${basePrice.toLocaleString()}`);
    console.log(`Weighted Price: ₪${weightedPrice.toLocaleString()}`);
    console.log(`Price Range: ₪${priceRange.min.toLocaleString()} - ₪${priceRange.max.toLocaleString()}`);
});

console.log('\n=== Expected vs Actual ===');
console.log('Expected (from Bidspirit): ₪69,600');
console.log('Expected range: ₪60,000 - ₪80,000');
console.log('Current extension shows: ₪384 (WRONG!)');
console.log('Current range shows: ₪85 - ₪682 (WRONG!)');
