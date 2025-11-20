# Farmers Feature - Admin User Guide

**Audience**: Internal administrators using the MAGSASA-CARD Kaani ERP system  
**Purpose**: Plain-language guide for understanding and using the Farmers feature

---

## What is a "Farmer"?

A **farmer** in this system is:
- A registered user with the role "user" (not "admin")
- Who owns at least one farm

**Important**: If a user doesn't have any farms, they won't appear in the farmer count or farmer list, even if they have the "user" role.

---

## Where You'll See Farmer Counts

### 1. **Farmers Page** (`/farmers`)

- **"Total Farmers"** card: Shows the total number of farmers in the system
- **Farmer List**: Shows individual farmer cards (25 per page)
- **Pagination**: Use the page controls at the bottom to see more farmers

**What the count means**: This is the number of users who have the "user" role AND own at least one farm.

### 2. **Dashboard** (`/`)

- **"Total Farmers"** metric: Shows the same count as the Farmers page
- **"Active Farms"** metric: Shows the total number of farms owned by all farmers

**Consistency**: The Dashboard and Farmers page should always show the same "Total Farmers" number.

### 3. **Analytics Page** (`/analytics`)

- Shows farm-level statistics (not farmer counts)
- Focuses on farms, crops, and yields

---

## Understanding the Numbers

### Why might farmer count be different from what I expect?

**Common Scenarios**:

1. **"I see 4,977 farms but only 2,500 farmers"**
   - ✅ **This is normal!** Many farmers own multiple farms (average ~2 farms per farmer in demo data)

2. **"I imported farmers via CSV but the count didn't change"**
   - Check: Did you also import farms for those farmers?
   - Remember: A user only counts as a "farmer" if they have at least one farm

3. **"Some users aren't showing up as farmers"**
   - Check: Do those users have the role "user" (not "admin")?
   - Check: Do those users have at least one farm?

### Why does the farmer count change?

**The count will change when**:
- New farmers are added (via CSV import or manual creation) AND they get farms
- Existing farmers get their first farm (they'll appear in the count)
- A farmer's last farm is deleted (they'll disappear from the count)

**The count will NOT change when**:
- A farmer gets additional farms (they're already counted)
- A farmer's farm data is updated (name, size, etc.)

---

## Using the Farmers Page

### Searching for Farmers

1. **By Name**: Type a farmer's name in the search box
2. **By Location**: Select a barangay from the dropdown
3. **Combined**: Use both search and barangay filter together

**Note**: Search looks at farmer names and email addresses.

### Understanding Farmer Cards

Each farmer card shows:
- **Name & ID**: Farmer's name and unique identifier
- **Location**: Barangay, municipality, province
- **Contact**: Email (if available)
- **Member Since**: When the farmer account was created
- **Total Area**: Sum of all their farms' sizes (in hectares)
- **Farms**: Number of farms they own
- **Harvest**: Total harvest across all farms (in metric tons)
- **Crops**: List of crops they grow (across all farms)

### Pagination

- **25 farmers per page**: Use the page controls at the bottom to navigate
- **Total pages**: Calculated automatically based on filtered results

---

## Common Questions (FAQ)

### Q: "Why does farmer count show 2,500 but I only see 25 on the page?"

**A**: The page shows 25 farmers at a time. Use pagination to see more. The "Total Farmers" count shows the total across all pages.

### Q: "I imported farmers via CSV but they're not showing up"

**A**: Check:
1. Did the CSV import complete successfully? (Check the import summary)
2. Did you also import farms for those farmers? (Farmers need farms to appear in the count)
3. Are the farmers' roles set to "user"? (Admins don't count as farmers)

### Q: "Why are some users not counted as farmers?"

**A**: A user must meet BOTH conditions:
1. Have role = "user" (not "admin")
2. Own at least one farm

If a user doesn't have any farms, they won't appear in the farmer count, even if they have the "user" role.

### Q: "The Dashboard and Farmers page show different counts"

**A**: This should not happen. If you see this:
1. Refresh both pages
2. Check if there are any error messages
3. Contact engineering if the issue persists

### Q: "Can I filter farmers by crop type or land area?"

**A**: Yes! Use the "Advanced Filters" section on the Farmers page to filter by:
- Land area (small, medium, large)
- Crop type
- Membership year
- Performance tier

**Note**: These filters work on the data already loaded, so they're applied after the initial search/barangay filter.

---

## When to Call Engineering

**Contact engineering if**:
- Farmer counts are inconsistent across pages (Dashboard vs Farmers page)
- Search or filters are not working
- The page shows an error message
- You suspect data corruption (e.g., farmers with negative farm counts)

**Do NOT contact engineering for**:
- Questions about what the counts mean (see this guide)
- Normal pagination behavior (25 per page)
- Expected behavior (e.g., farmers needing farms to be counted)

---

## Best Practices

1. **Import Order**: When importing data via CSV, always import in this order:
   - Farmers first
   - Farms second (requires farmers to exist)
   - Seasons/Yields last (requires farms to exist)

2. **Verification**: After CSV imports, verify farmer counts match your expectations

3. **Data Integrity**: If you delete a farmer's last farm, they'll disappear from the farmer count (this is expected behavior)

---

**Last Updated**: Pre-Production QA  
**Version**: 1.0

