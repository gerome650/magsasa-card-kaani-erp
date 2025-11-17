# Bulk Operations Guide

## Overview

The MAGSASA-CARD dashboard includes powerful bulk operations for managing multiple farms at once. This feature allows you to select multiple farms and perform actions like deletion or CSV export in a single operation.

## Features

### ✅ Multi-Select System
- Individual farm checkboxes on each card
- "Select All" checkbox to select all visible farms
- Visual feedback for selected farms (ring border and background tint)
- Selected count display
- Clear selection button

### 🗑️ Bulk Delete
- Delete multiple farms at once
- Confirmation dialog with farm list preview
- Optimistic UI updates for instant feedback
- Automatic rollback on errors
- Partial success handling (some deleted, some failed)
- Toast notifications for all states

### 📥 CSV Export
- Export selected farms to CSV file
- Comprehensive data export (all farm fields)
- Automatic filename with timestamp
- Browser download trigger
- Success notification

## How to Use

### Selecting Farms

#### Individual Selection
1. Navigate to the Farms page
2. Click the checkbox on any farm card
3. Selected farms will show a blue ring border and light blue background
4. Click again to deselect

#### Select All
1. Click the "Select all X farms" checkbox above the farm grid
2. All visible farms will be selected
3. Click again to deselect all

**Note:** Selection only applies to currently filtered farms. If you have filters active, only matching farms will be selected.

### Bulk Action Toolbar

When farms are selected, a toolbar appears with:
- **Selected count**: Shows how many farms are selected
- **Clear Selection**: Deselects all farms
- **Export CSV**: Downloads selected farms as CSV
- **Delete Selected**: Deletes selected farms (with confirmation)

### Exporting to CSV

**Steps:**
1. Select one or more farms using checkboxes
2. Click "Export CSV" button in the bulk action toolbar
3. CSV file downloads automatically with filename: `farms_export_YYYY-MM-DD.csv`
4. Success toast notification appears

**CSV Contents:**
The exported CSV includes the following columns:
- Farm Name
- Farmer Name
- Barangay
- Municipality
- Latitude
- Longitude
- Size (ha)
- Crops (semicolon-separated)
- Soil Type
- Irrigation Type
- Status
- Average Yield (MT/ha)
- Date Registered

**Example CSV:**
```csv
Farm Name,Farmer Name,Barangay,Municipality,Latitude,Longitude,Size (ha),Crops,Soil Type,Irrigation Type,Status,Average Yield (MT/ha),Date Registered
"Sunrise Rice Farm","Juan Dela Cruz","Pila","Laguna","14.2345","121.3456","5.5","Rice; Corn","Clay Loam","Irrigated","active","4.5","2024-01-15"
"Golden Harvest","Maria Santos","Bay","Laguna","14.1234","121.2345","3.2","Rice","Silty Clay","Rainfed","active","3.8","2024-02-20"
```

### Bulk Delete

**Steps:**
1. Select one or more farms using checkboxes
2. Click "Delete Selected" button (red button with trash icon)
3. Confirmation dialog appears showing:
   - Number of farms to be deleted
   - List of farm names (if 5 or fewer)
   - Warning about permanent deletion
4. Click "Delete X Farms" to confirm or "Cancel" to abort
5. Farms are deleted with optimistic UI update
6. Success/error toast notification appears

**Important Notes:**
- ⚠️ **Deletion is permanent** - Cannot be undone
- All associated data is deleted:
  - Farm boundaries
  - Yield records
  - Cost records
- Optimistic updates show immediate UI changes
- Automatic rollback if deletion fails
- Partial success handling (some farms may fail to delete)

## User Interface

### Bulk Action Toolbar

The toolbar appears above the filters when farms are selected:

```
┌─────────────────────────────────────────────────────────────┐
│ 5 farms selected  [X Clear Selection]  [Export CSV] [Delete]│
└─────────────────────────────────────────────────────────────┘
```

**Styling:**
- Muted background with primary border
- Sticky positioning (stays visible when scrolling)
- Responsive layout (stacks on mobile)

### Selected Farm Cards

Selected farms show visual feedback:
- **Ring border**: 2px blue ring around card
- **Background tint**: Light blue background (primary/5 opacity)
- **Checkbox**: Checked state with blue checkmark

### Delete Confirmation Dialog

**Dialog Contents:**
- **Title**: "Delete X farm(s)?"
- **Description**: Warning about permanent deletion
- **Farm List**: Shows farm names if 5 or fewer selected
- **Actions**: Cancel (gray) or Delete (red)

**Example:**
```
Delete 3 farms?

This action cannot be undone. This will permanently delete 
the selected farms and all associated data including boundaries,
yields, and cost records.

Farms to be deleted:
• Sunrise Rice Farm - Juan Dela Cruz
• Golden Harvest - Maria Santos
• Valley View Farm - Pedro Reyes

[Cancel]  [Delete 3 Farms]
```

## Technical Implementation

### Frontend (Farms.tsx)

**State Management:**
```typescript
const [selectedFarms, setSelectedFarms] = useState<Set<string>>(new Set());
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
```

**Selection Handlers:**
```typescript
// Select/deselect individual farm
const handleSelectFarm = (farmId: string) => {
  const newSelected = new Set(selectedFarms);
  if (newSelected.has(farmId)) {
    newSelected.delete(farmId);
  } else {
    newSelected.add(farmId);
  }
  setSelectedFarms(newSelected);
};

// Select/deselect all visible farms
const handleSelectAll = () => {
  if (selectedFarms.size === filteredFarms.length) {
    setSelectedFarms(new Set());
  } else {
    setSelectedFarms(new Set(filteredFarms.map(f => f.id)));
  }
};
```

**CSV Export:**
```typescript
const handleExportSelected = () => {
  const selectedFarmData = filteredFarms.filter(f => selectedFarms.has(f.id));
  
  // Build CSV content
  const headers = ['Farm Name', 'Farmer Name', ...];
  const rows = selectedFarmData.map(farm => [
    farm.name,
    farm.farmerName,
    // ... more fields
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `farms_export_${timestamp}.csv`);
  link.click();
};
```

### Backend (server/routers.ts)

**Bulk Delete Mutation:**
```typescript
bulkDelete: protectedProcedure
  .input(z.object({ ids: z.array(z.number()) }))
  .mutation(async ({ input }) => {
    const results = {
      success: [] as number[],
      failed: [] as { id: number; error: string }[],
    };
    
    for (const id of input.ids) {
      try {
        await db.deleteFarm(id);
        results.success.push(id);
      } catch (error) {
        results.failed.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return results;
  }),
```

**Response Format:**
```typescript
{
  success: [1, 2, 3],  // IDs of successfully deleted farms
  failed: [            // IDs and errors for failed deletions
    { id: 4, error: "Farm not found" },
    { id: 5, error: "Permission denied" }
  ]
}
```

### Optimistic Updates

**Mutation Configuration:**
```typescript
const bulkDeleteMutation = trpc.farms.bulkDelete.useMutation({
  onMutate: async (variables) => {
    // Cancel outgoing refetches
    await utils.farms.list.cancel();
    
    // Snapshot previous value
    const previousFarms = utils.farms.list.getData();
    
    // Optimistically update cache
    utils.farms.list.setData(undefined, (old) => {
      if (!old) return old;
      return old.filter(farm => !variables.ids.includes(farm.id));
    });
    
    return { previousFarms };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousFarms) {
      utils.farms.list.setData(undefined, context.previousFarms);
    }
  },
  onSettled: () => {
    // Always refetch after error or success
    utils.farms.list.invalidate();
  },
});
```

## Best Practices

### 1. **Review Before Deleting**
- Always review the confirmation dialog
- Check farm names carefully
- Verify the count matches your selection

### 2. **Export Before Delete**
- Export farms to CSV before bulk deletion
- Keep a backup of important data
- Use exports for reporting and analysis

### 3. **Use Filters First**
- Filter farms before selecting
- Easier to select specific groups
- Reduces accidental selections

### 4. **Check Selection Count**
- Verify the selected count in toolbar
- Ensure you haven't selected too many/few
- Use "Clear Selection" to start over

### 5. **Handle Partial Failures**
- Check toast notifications for partial success
- Note which farms failed to delete
- Retry failed deletions individually

## Keyboard Shortcuts

Currently, bulk operations are mouse/touch-driven. Future enhancements may include:
- `Ctrl+A` - Select all visible farms
- `Ctrl+Shift+E` - Export selected farms
- `Delete` - Delete selected farms (with confirmation)
- `Escape` - Clear selection

## Common Use Cases

### 1. **Clean Up Test Data**
**Scenario:** Remove multiple test farms after demo

**Steps:**
1. Filter by barangay or date range
2. Select all test farms
3. Bulk delete with confirmation

### 2. **Export for Reporting**
**Scenario:** Generate monthly report of active farms

**Steps:**
1. Filter by status: "Active"
2. Filter by date range (if needed)
3. Select all filtered farms
4. Export to CSV
5. Open in Excel/Google Sheets

### 3. **Archive Inactive Farms**
**Scenario:** Remove farms that are no longer active

**Steps:**
1. Filter by status: "Inactive"
2. Review farm list
3. Export to CSV (backup)
4. Select all inactive farms
5. Bulk delete

### 4. **Transfer Data**
**Scenario:** Export farm data for external analysis

**Steps:**
1. Select specific farms or use filters
2. Export to CSV
3. Import into analysis tool (R, Python, etc.)

## Troubleshooting

### Selection Not Working

**Problem:** Clicking checkbox doesn't select farm

**Solutions:**
- Refresh the page
- Check browser console for errors
- Ensure you're logged in
- Try individual selection first

### Export Not Downloading

**Problem:** CSV export button clicked but no download

**Solutions:**
- Check browser download settings
- Allow pop-ups for the site
- Check browser console for errors
- Try with fewer farms selected

### Delete Fails

**Problem:** Bulk delete shows error notification

**Possible Causes:**
- Network connection issue
- Permission denied (not farm owner)
- Farm has dependent data
- Database connection error

**Solutions:**
- Check error message in toast
- Retry the operation
- Delete farms individually
- Contact support if persistent

### Partial Delete Success

**Problem:** Some farms deleted, some failed

**What Happens:**
- Successfully deleted farms are removed
- Failed farms remain in list
- Toast shows both success and failure count
- Error details provided

**Next Steps:**
- Note which farms failed (check IDs in toast)
- Try deleting failed farms individually
- Check farm details for issues
- Contact support if needed

## Performance Considerations

### Large Selections

**Recommendations:**
- Limit bulk operations to 50 farms at a time
- Use filters to narrow selection
- Export in batches for large datasets
- Monitor network speed for uploads

### CSV Export Size

**File Size Estimates:**
- 10 farms: ~2 KB
- 50 farms: ~10 KB
- 100 farms: ~20 KB
- 500 farms: ~100 KB

**Large Exports:**
- May take a few seconds to generate
- Browser may show "Save As" dialog
- File opens in Excel/Google Sheets
- No server-side processing required

## Future Enhancements

Planned improvements for bulk operations:

1. **Bulk Edit**
   - Update status for multiple farms
   - Change irrigation type in bulk
   - Assign to different farmers

2. **Bulk Import**
   - Import farms from CSV
   - Validate data before import
   - Preview before saving

3. **Advanced Filters**
   - Save filter presets
   - Complex filter combinations
   - Quick filter buttons

4. **Export Formats**
   - Excel (.xlsx) export
   - PDF report generation
   - JSON export for APIs

5. **Undo Delete**
   - Soft delete with recovery
   - Trash bin for deleted farms
   - Restore within 30 days

## Summary

Bulk operations streamline farm management by allowing you to:

✅ Select multiple farms with checkboxes  
✅ Export farm data to CSV for analysis  
✅ Delete multiple farms with confirmation  
✅ See instant UI updates (optimistic)  
✅ Handle partial successes gracefully  
✅ Clear visual feedback for all actions  

Use bulk operations to save time and manage your farms more efficiently!
