#!/usr/bin/env node
/**
 * Navigation Structure Verification Script
 * Verifies that all navigation links have corresponding routes
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read Layout.tsx to extract navigation links
const layoutPath = join(__dirname, 'client/src/components/Layout.tsx');
const appPath = join(__dirname, 'client/src/App.tsx');

const layoutContent = readFileSync(layoutPath, 'utf-8');
const appContent = readFileSync(appPath, 'utf-8');

console.log('🔍 Navigation Structure Verification\n');
console.log('=' .repeat(60));

// Extract navigation items from Layout.tsx
const navigationRegex = /\{\s*name:\s*['"]([^'"]+)['"]\s*,\s*href:\s*['"]([^'"]+)['"]/g;
const navigationItems = [];
let match;

while ((match = navigationRegex.exec(layoutContent)) !== null) {
  navigationItems.push({
    name: match[1],
    href: match[2]
  });
}

console.log(`\n📋 Found ${navigationItems.length} navigation items:\n`);

// Extract routes from App.tsx
const routeRegex = /<Route\s+path=["']([^"']+)["']/g;
const routes = [];

while ((match = routeRegex.exec(appContent)) !== null) {
  routes.push(match[1]);
}

console.log(`📍 Found ${routes.length} defined routes:\n`);

// Verify each navigation item has a corresponding route
let allValid = true;
const results = [];

for (const item of navigationItems) {
  const routeExists = routes.includes(item.href) || 
                     routes.some(route => {
                       // Handle dynamic routes like /farmers/:id
                       const routePattern = route.replace(/:[^/]+/g, '[^/]+');
                       return new RegExp(`^${routePattern}$`).test(item.href);
                     });
  
  const status = routeExists ? '✅' : '❌';
  const result = {
    status,
    name: item.name,
    href: item.href,
    valid: routeExists
  };
  
  results.push(result);
  
  if (!routeExists) {
    allValid = false;
  }
}

// Group by status
const valid = results.filter(r => r.valid);
const invalid = results.filter(r => !r.valid);

console.log('✅ Valid Navigation Links:');
console.log('─'.repeat(60));
valid.forEach(r => {
  console.log(`  ${r.status} ${r.name.padEnd(25)} → ${r.href}`);
});

if (invalid.length > 0) {
  console.log('\n❌ Invalid Navigation Links (No Route Found):');
  console.log('─'.repeat(60));
  invalid.forEach(r => {
    console.log(`  ${r.status} ${r.name.padEnd(25)} → ${r.href}`);
  });
}

console.log('\n' + '='.repeat(60));

// Check for nested anchor tags
console.log('\n🔗 Checking for Nested Anchor Tags...\n');

const nestedAnchorPattern = /<Link[^>]*>[\s\S]*?<a[\s\S]*?<\/a>[\s\S]*?<\/Link>/g;
const nestedAnchors = layoutContent.match(nestedAnchorPattern);

if (nestedAnchors && nestedAnchors.length > 0) {
  console.log('❌ Found nested anchor tags:');
  nestedAnchors.forEach((match, i) => {
    console.log(`\n  Issue ${i + 1}:`);
    console.log(`  ${match.substring(0, 100)}...`);
  });
  allValid = false;
} else {
  console.log('✅ No nested anchor tags found');
}

// Check Link component usage
console.log('\n🔗 Verifying Link Component Usage...\n');

const linkUsagePattern = /<Link\s+[^>]*href=["']([^"']+)["'][^>]*>/g;
const linkUsages = [];

while ((match = linkUsagePattern.exec(layoutContent)) !== null) {
  linkUsages.push(match[1]);
}

console.log(`✅ Found ${linkUsages.length} Link components in Layout`);

// Check for direct <a> tags in navigation
const directAnchorPattern = /<a\s+href=["'](?!#|javascript:)[^"']+["']/g;
const directAnchors = layoutContent.match(directAnchorPattern);

if (directAnchors && directAnchors.length > 0) {
  console.log(`⚠️  Found ${directAnchors.length} direct <a> tags (should use <Link>)`);
  allValid = false;
} else {
  console.log('✅ All navigation uses Link component (no direct <a> tags)');
}

console.log('\n' + '='.repeat(60));

// Summary
console.log('\n📊 Summary:\n');
console.log(`  Total Navigation Items: ${navigationItems.length}`);
console.log(`  Valid Routes: ${valid.length}`);
console.log(`  Invalid Routes: ${invalid.length}`);
console.log(`  Nested Anchor Issues: ${nestedAnchors ? nestedAnchors.length : 0}`);
console.log(`  Direct <a> Tags: ${directAnchors ? directAnchors.length : 0}`);

console.log('\n' + '='.repeat(60));

if (allValid && invalid.length === 0) {
  console.log('\n✅ All navigation links are properly configured!');
  console.log('✅ No nested anchor tags found!');
  console.log('✅ Navigation structure is valid!\n');
  process.exit(0);
} else {
  console.log('\n❌ Navigation issues found. Please review the errors above.\n');
  process.exit(1);
}
