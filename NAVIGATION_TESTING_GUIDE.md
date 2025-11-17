# Navigation Testing Guide

## Overview
This guide provides comprehensive testing procedures for verifying all navigation links work correctly on both desktop and mobile viewports.

## Test Environment
- **Application URL**: https://3000-i5h2pc37yq9g6wgknihl5-662933b1.manus-asia.computer
- **Test Accounts**: Use the demo accounts provided in the application

## Code Verification Summary

### ✅ Navigation Implementation Status
- **No nested anchor tags**: All navigation links use wouter's `<Link>` component correctly
- **Proper routing**: All routes are configured in App.tsx with appropriate role-based access
- **Mobile responsive**: Mobile menu implemented with hamburger toggle
- **Active state highlighting**: Current page is visually indicated in navigation

---

## Desktop Navigation Testing

### Setup
1. Open browser in desktop mode (viewport width ≥ 1024px)
2. Log in with a test account
3. Observe the left sidebar navigation

### Test Cases - Desktop

#### Common Navigation (All Roles)
- [ ] **Dashboard** (`/`) - Should navigate to farm list view
- [ ] **Ask KaAni** (`/kaani`) - Should open AI chat interface

#### Manager Role Navigation
Login as: **manager@example.com** / **password123**

- [ ] **Dashboard** (`/`) - Farm list view
- [ ] **Analytics** (`/analytics`) - Analytics dashboard
- [ ] **Permission Approval** (`/permission-approval`) - Should show badge if pending requests
- [ ] **Farmers** (`/farmers`) - Farmer management
- [ ] **Farms** (`/farms`) - Farm management
- [ ] **Harvest Tracking** (`/harvest-tracking`) - Harvest data
- [ ] **Price Comparison** (`/price-comparison`) - Price comparison tool
- [ ] **Order Calculator** (`/order-calculator`) - Order calculator
- [ ] **Batch Orders** (`/batch-orders`) - Batch order management
- [ ] **Ask KaAni** (`/kaani`) - AI assistant

**Expected Behavior**:
- Clicking each link should navigate to the correct page
- Active page should be highlighted with green background
- No console errors
- Page content should load properly

#### Field Officer Role Navigation
Login as: **officer@example.com** / **password123**

- [ ] **Dashboard** (`/`) - Farm list view
- [ ] **Analytics** (`/analytics`) - Analytics dashboard
- [ ] **My Requests** (`/my-requests`) - Permission requests
- [ ] **Farmers** (`/farmers`) - Farmer management
- [ ] **Farms** (`/farms`) - Farm management
- [ ] **Harvest Tracking** (`/harvest-tracking`) - Harvest data
- [ ] **Price Comparison** (`/price-comparison`) - Price comparison tool
- [ ] **Order Calculator** (`/order-calculator`) - Order calculator
- [ ] **Batch Orders** (`/batch-orders`) - Batch order management
- [ ] **Ask KaAni** (`/kaani`) - AI assistant

#### Farmer Role Navigation
Login as: **farmer@example.com** / **password123**

- [ ] **Dashboard** (`/`) - Farm list view
- [ ] **My Requests** (`/my-requests`) - Permission requests
- [ ] **Price Comparison** (`/price-comparison`) - Price comparison tool
- [ ] **Order Calculator** (`/order-calculator`) - Order calculator
- [ ] **Marketplace** (`/marketplace`) - Product marketplace
- [ ] **Order History** (`/orders`) - Order history
- [ ] **Ask KaAni** (`/kaani`) - AI assistant

#### Supplier Role Navigation
Login as: **supplier@example.com** / **password123**

- [ ] **Orders** (`/supplier`) - Order management dashboard
- [ ] **Inventory** (`/supplier/inventory`) - Inventory management
- [ ] **Deliveries** (`/supplier/deliveries`) - Delivery tracking
- [ ] **Audit Log** (`/supplier/audit-log`) - Audit log viewer
- [ ] **My Requests** (`/my-requests`) - Permission requests
- [ ] **Ask KaAni** (`/kaani`) - AI assistant

---

## Mobile Navigation Testing

### Setup
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
3. Select a mobile device (e.g., iPhone 12 Pro, Pixel 5)
4. Refresh the page

### Test Cases - Mobile

#### Mobile Menu Functionality
- [ ] **Hamburger icon visible** - Top-right corner shows menu icon
- [ ] **Menu opens** - Clicking hamburger opens navigation menu
- [ ] **Menu closes with X** - Clicking X icon closes menu
- [ ] **Menu closes on navigation** - Clicking a link closes menu and navigates

#### Mobile Navigation Links (Manager Role)
With mobile menu open:

- [ ] **Dashboard** - Navigates and closes menu
- [ ] **Analytics** - Navigates and closes menu
- [ ] **Permission Approval** - Shows badge if pending, navigates and closes menu
- [ ] **Farmers** - Navigates and closes menu
- [ ] **Farms** - Navigates and closes menu
- [ ] **Harvest Tracking** - Navigates and closes menu
- [ ] **Price Comparison** - Navigates and closes menu
- [ ] **Order Calculator** - Navigates and closes menu
- [ ] **Batch Orders** - Navigates and closes menu
- [ ] **Ask KaAni** - Navigates and closes menu

**Expected Behavior**:
- Menu should slide in from top
- Active page should have green left border and background
- Clicking any link should close menu automatically
- Navigation should work without page refresh (SPA behavior)

#### Mobile Viewport Sizes to Test
- [ ] **iPhone SE (375px)** - Smallest modern mobile
- [ ] **iPhone 12 Pro (390px)** - Standard iPhone
- [ ] **Pixel 5 (393px)** - Standard Android
- [ ] **iPad Mini (768px)** - Tablet (should still show mobile menu)
- [ ] **iPad Pro (1024px)** - Should switch to desktop sidebar

---

## Nested Routes Testing

### Farm Detail Navigation
1. Navigate to **Farms** (`/farms`)
2. Click on any farm card
3. [ ] Should navigate to `/farms/:id` with farm details
4. [ ] URL should show farm ID
5. [ ] Back button should return to farms list

### Farmer Profile Navigation
1. Navigate to **Farmers** (`/farmers`) as manager/officer
2. Click on any farmer card
3. [ ] Should navigate to `/farmers/:id` with farmer profile
4. [ ] URL should show farmer ID
5. [ ] Navigation should remain accessible

### Supplier Sub-Routes
As supplier role:
1. [ ] Navigate from **Orders** to **Inventory**
2. [ ] Navigate from **Inventory** to **Deliveries**
3. [ ] Navigate from **Deliveries** to **Audit Log**
4. [ ] All transitions should be smooth without page reload

---

## Browser Console Testing

### For Each Navigation Test
1. Open browser DevTools (F12)
2. Go to Console tab
3. Clear console
4. Click navigation link
5. [ ] **No errors** - Console should be clean
6. [ ] **No warnings** - No React warnings
7. [ ] **No 404s** - Network tab shows no failed requests

### Common Issues to Check
- [ ] No "Cannot read property" errors
- [ ] No "undefined is not a function" errors
- [ ] No nested anchor tag warnings
- [ ] No routing errors
- [ ] No CORS errors

---

## Cross-Browser Testing

### Browsers to Test
- [ ] **Chrome** (latest) - Primary browser
- [ ] **Firefox** (latest) - Secondary browser
- [ ] **Safari** (latest) - macOS/iOS
- [ ] **Edge** (latest) - Windows

### For Each Browser
1. Test desktop navigation (all roles)
2. Test mobile navigation (all roles)
3. Verify console is clean
4. Check for browser-specific issues

---

## Performance Testing

### Navigation Speed
For each navigation action:
- [ ] **Instant response** - Click should feel immediate
- [ ] **No flickering** - Smooth transition between pages
- [ ] **No loading delays** - Content should appear quickly

### Memory Leaks
1. Navigate through all pages 3-4 times
2. Open DevTools → Performance → Memory
3. [ ] Memory usage should stabilize
4. [ ] No continuous memory growth

---

## Accessibility Testing

### Keyboard Navigation
- [ ] **Tab key** - Can navigate through menu items
- [ ] **Enter key** - Activates focused link
- [ ] **Escape key** - Closes mobile menu (if implemented)
- [ ] **Focus visible** - Clear focus indicator on links

### Screen Reader Testing
- [ ] Links have descriptive text
- [ ] Icons have aria-labels
- [ ] Active state is announced
- [ ] Menu state changes are announced

---

## Issue Reporting Template

If you find any navigation issues, report them using this format:

```
**Issue**: [Brief description]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected**: [What should happen]
**Actual**: [What actually happens]
**Role**: [User role being tested]
**Device**: [Desktop/Mobile, browser]
**Console Errors**: [Any errors from console]
**Screenshot**: [If applicable]
```

---

## Summary Checklist

### Desktop Navigation
- [ ] All role-specific links visible and working
- [ ] Active state highlighting works
- [ ] No nested anchor errors
- [ ] Console is clean
- [ ] Logout button works

### Mobile Navigation
- [ ] Hamburger menu opens/closes
- [ ] All links work and close menu
- [ ] Active state visible
- [ ] Responsive at all viewport sizes
- [ ] Console is clean

### Overall
- [ ] No browser errors
- [ ] Fast navigation
- [ ] Smooth transitions
- [ ] Role-based access control works
- [ ] All routes accessible

---

## Quick Test Script

For rapid testing, use this sequence:

1. **Login as Manager**
2. Click through: Dashboard → Analytics → Farmers → Farms → Price Comparison → Order Calculator → Batch Orders → KaAni
3. **Check mobile** (resize browser)
4. Open menu, click through same links
5. **Logout and repeat** with Field Officer, Farmer, Supplier roles
6. **Check console** - Should be clean throughout

---

## Notes

- The application uses **wouter** for routing (not React Router)
- Navigation is **client-side** (SPA) - no page reloads
- **Role-based access** is enforced - some links only visible to certain roles
- **Active state** uses green background/border for current page
- **Mobile breakpoint** is at 1024px (lg: in Tailwind)

---

## Test Results

Date: _______________
Tester: _______________

**Desktop Navigation**: ☐ Pass ☐ Fail
**Mobile Navigation**: ☐ Pass ☐ Fail
**Console Errors**: ☐ None ☐ Found (details below)
**Cross-Browser**: ☐ Pass ☐ Fail
**Performance**: ☐ Pass ☐ Fail

**Issues Found**:
_______________________________________
_______________________________________
_______________________________________

**Overall Status**: ☐ Ready for Production ☐ Needs Fixes
