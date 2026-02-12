import { generateAllTestData } from './generateTestData';

/**
 * Seed Test Data Script
 * Run this to populate localStorage with test candidates
 */

function seedTestData() {
    console.log('🌱 Seeding test data...\n');

    // Generate test candidates
    const candidates = generateAllTestData();

    // Save to localStorage
    localStorage.setItem('candidates', JSON.stringify(candidates));

    console.log('\n✅ Test data seeded successfully!');
    console.log('📊 Dashboard should now show:');
    console.log('   - Quick Profiles: 5');
    console.log('   - Partial Profiles: 7');
    console.log('   - Complete Profiles: 8');
    console.log('\n🔄 Refresh the page to see the data!');

    return candidates;
}

// Auto-run when script is loaded
if (typeof window !== 'undefined') {
    (window as any).seedTestData = seedTestData;
    console.log('💡 Run seedTestData() in console to populate test data');
}

export { seedTestData };
