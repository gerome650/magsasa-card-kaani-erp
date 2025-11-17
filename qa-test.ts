/**
 * Comprehensive QA Test Script for MAGSASA-CARD Platform
 * Tests all major features and identifies potential bugs
 */

import { farmersData } from './client/src/data/farmersData';
import { harvestData } from './client/src/data/harvestData';
import { getFarms } from './client/src/data/farmsData';
const farmsData = getFarms();

interface TestResult {
  module: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details?: string;
}

const results: TestResult[] = [];

function test(module: string, testName: string, condition: boolean, details?: string) {
  results.push({
    module,
    test: testName,
    status: condition ? 'PASS' : 'FAIL',
    details
  });
}

function warn(module: string, testName: string, details: string) {
  results.push({
    module,
    test: testName,
    status: 'WARNING',
    details
  });
}

console.log('🔍 Starting QA Tests...\n');

// ===== DATA INTEGRITY TESTS =====
console.log('📊 Testing Data Integrity...');

// Test 1: Farmers Data
test('Data', 'Farmers data exists', farmersData.length > 0, `Found ${farmersData.length} farmers`);
test('Data', 'All farmers have required fields', 
  farmersData.every(f => f.id && f.name && f.barangay),
  'All farmers have id, name, and barangay'
);

// Test 2: Harvest Data
test('Data', 'Harvest data exists', harvestData.length > 0, `Found ${harvestData.length} harvest records`);
test('Data', 'All harvests have totalValue', 
  harvestData.every(h => typeof h.totalValue === 'number' && !isNaN(h.totalValue)),
  'All harvest records have valid totalValue (not NaN)'
);

// Test 3: Farms Data  
test('Data', 'Farms data exists', farmsData.length > 0, `Found ${farmsData.length} farms`);
test('Data', 'All farms have coordinates',
  farmsData.every(f => f.location && f.location.coordinates && f.location.coordinates.lat && f.location.coordinates.lng),
  'All farms have valid GPS coordinates'
);

// ===== CALCULATION TESTS =====
console.log('\n🧮 Testing Calculations...');

// Test 4: Revenue Calculations
const totalRevenue = harvestData.reduce((sum, h) => sum + h.totalValue, 0);
test('Calculations', 'Total revenue is valid number', 
  !isNaN(totalRevenue) && totalRevenue > 0,
  `Total revenue: ₱${(totalRevenue / 1000000).toFixed(2)}M`
);

// Test 5: Farmer Performance
const farmerPerformance = farmersData.map(f => {
  const farmerHarvests = harvestData.filter(h => h.farmerId === f.id);
  const totalValue = farmerHarvests.reduce((sum, h) => sum + h.totalValue, 0);
  return { ...f, totalValue, harvestCount: farmerHarvests.length };
}).sort((a, b) => b.totalValue - a.totalValue);

test('Calculations', 'Top farmer has valid revenue',
  farmerPerformance.length > 0 && !isNaN(farmerPerformance[0].totalValue),
  `Top farmer: ${farmerPerformance[0]?.name} with ₱${(farmerPerformance[0]?.totalValue / 1000).toFixed(1)}K`
);

// ===== DATA CONSISTENCY TESTS =====
console.log('\n🔗 Testing Data Consistency...');

// Test 6: Farmer-Harvest Links
const orphanedHarvests = harvestData.filter(h => 
  !farmersData.some(f => f.id === h.farmerId)
);
test('Consistency', 'No orphaned harvest records',
  orphanedHarvests.length === 0,
  orphanedHarvests.length > 0 ? `Found ${orphanedHarvests.length} harvests with invalid farmerId` : 'All harvests linked to valid farmers'
);

// Test 7: Farm-Farmer Links
const orphanedFarms = farmsData.filter(farm =>
  !farmersData.some(f => f.id === farm.farmerId)
);
test('Consistency', 'No orphaned farm records',
  orphanedFarms.length === 0,
  orphanedFarms.length > 0 ? `Found ${orphanedFarms.length} farms with invalid farmerId` : 'All farms linked to valid farmers'
);

// ===== BUSINESS LOGIC TESTS =====
console.log('\n💼 Testing Business Logic...');

// Test 8: Quality Grades
const validGrades = ['Premium', 'Grade A', 'Grade B', 'Grade C'];
const invalidGrades = harvestData.filter(h => !validGrades.includes(h.qualityGrade));
test('Business Logic', 'All harvests have valid quality grades',
  invalidGrades.length === 0,
  invalidGrades.length > 0 ? `Found ${invalidGrades.length} invalid quality grades` : 'All quality grades are valid'
);

// Test 9: Harvest Dates
const futureHarvests = harvestData.filter(h => new Date(h.harvestDate) > new Date());
warn('Business Logic', 'No future harvest dates',
  futureHarvests.length > 0 ? `Found ${futureHarvests.length} harvests with future dates` : 'All harvest dates are in the past'
);

// Test 10: Yield Calculations
const invalidYields = harvestData.filter(h => 
  h.yieldPerHectare && (isNaN(h.yieldPerHectare) || h.yieldPerHectare < 0)
);
test('Business Logic', 'All yield calculations are valid',
  invalidYields.length === 0,
  invalidYields.length > 0 ? `Found ${invalidYields.length} invalid yield calculations` : 'All yields are valid positive numbers'
);

// ===== PRINT RESULTS =====
console.log('\n' + '='.repeat(80));
console.log('📋 QA TEST RESULTS SUMMARY');
console.log('='.repeat(80) + '\n');

const groupedResults = results.reduce((acc, r) => {
  if (!acc[r.module]) acc[r.module] = [];
  acc[r.module].push(r);
  return acc;
}, {} as Record<string, TestResult[]>);

Object.entries(groupedResults).forEach(([module, tests]) => {
  console.log(`\n${module}:`);
  tests.forEach(t => {
    const icon = t.status === 'PASS' ? '✅' : t.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`  ${icon} ${t.test}`);
    if (t.details) {
      console.log(`     ${t.details}`);
    }
  });
});

const passCount = results.filter(r => r.status === 'PASS').length;
const failCount = results.filter(r => r.status === 'FAIL').length;
const warnCount = results.filter(r => r.status === 'WARNING').length;

console.log('\n' + '='.repeat(80));
console.log(`✅ PASSED: ${passCount}/${results.length}`);
console.log(`❌ FAILED: ${failCount}/${results.length}`);
console.log(`⚠️  WARNINGS: ${warnCount}/${results.length}`);
console.log('='.repeat(80) + '\n');

if (failCount === 0) {
  console.log('🎉 All critical tests passed! Platform is ready for presentation.');
} else {
  console.log('⚠️  Some tests failed. Please review and fix before publishing.');
  process.exit(1);
}
