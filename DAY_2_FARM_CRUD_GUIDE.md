# 📋 Day 2: Farm CRUD Operations - Detailed Implementation Guide

**Total Time:** 6-7 hours  
**Goal:** Enable users to create and edit farms through the UI with full database persistence  
**Prerequisites:** Day 1 database integration completed and tested

---

## **Morning Session (3-4 hours): Add Farm Functionality**

### **Task 2.1: Create AddFarm Component** (2 hours)

#### **File to Create:** `client/src/components/AddFarmDialog.tsx`

#### **Component Structure:**

```typescript
import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function AddFarmDialog() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    farmerName: "",
    location: "",
    size: "",
    crops: "",
    status: "Active"
  });

  // tRPC mutation
  const createFarm = trpc.farms.create.useMutation({
    onSuccess: (newFarm) => {
      toast.success(`Farm "${newFarm.name}" created successfully!`);
      setOpen(false);
      setLocation(`/farms/${newFarm.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create farm: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.farmerName || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    const size = parseFloat(formData.size);
    if (isNaN(size) || size <= 0) {
      toast.error("Please enter a valid farm size");
      return;
    }

    // Submit
    createFarm.mutate({
      name: formData.name,
      farmerName: formData.farmerName,
      location: formData.location,
      size: size,
      crops: formData.crops.split(",").map(c => c.trim()).filter(Boolean),
      status: formData.status as "Active" | "Inactive" | "Fallow"
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add New Farm
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Farm</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields here */}
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

#### **Form Fields Required:**

1. **Farm Name** (Input, required)
   - Label: "Farm Name"
   - Placeholder: "e.g., Santos Rice Farm"
   - Validation: Min 3 characters

2. **Farmer Name** (Input, required)
   - Label: "Farmer Name"
   - Placeholder: "e.g., Juan Santos"
   - Validation: Min 2 characters

3. **Location** (Input with autocomplete, required)
   - Label: "Location"
   - Placeholder: "e.g., Barangay San Jose, Batangas"
   - Future: Integrate Google Places Autocomplete

4. **Farm Size** (Input type="number", required)
   - Label: "Farm Size (hectares)"
   - Placeholder: "e.g., 2.5"
   - Validation: Must be positive number

5. **Crops** (Textarea, required)
   - Label: "Crops (comma-separated)"
   - Placeholder: "e.g., Rice, Corn, Vegetables"
   - Validation: At least one crop

6. **Status** (Select, required)
   - Label: "Status"
   - Options: Active, Inactive, Fallow
   - Default: Active

7. **Registration Date** (Input type="date", optional)
   - Label: "Registration Date"
   - Default: Today's date

#### **Deliverables:**
- [ ] AddFarmDialog component created with all form fields
- [ ] Form validation implemented
- [ ] Responsive layout (mobile-friendly)
- [ ] Loading state during submission
- [ ] Success/error toast notifications

---

### **Task 2.2: Implement Add Farm API Integration** (1-2 hours)

#### **API Endpoint (Already exists in `server/routers.ts`):**

```typescript
// Verify this exists in server/routers.ts
create: publicProcedure
  .input(z.object({
    name: z.string().min(3),
    farmerName: z.string().min(2),
    location: z.string(),
    size: z.number().positive(),
    crops: z.array(z.string()),
    status: z.enum(["Active", "Inactive", "Fallow"]),
    registrationDate: z.string().optional()
  }))
  .mutation(async ({ input }) => {
    const newFarm = await db.createFarm({
      ...input,
      registrationDate: input.registrationDate || new Date().toISOString().split('T')[0]
    });
    return newFarm;
  })
```

#### **Database Helper (Already exists in `server/db.ts`):**

```typescript
// Verify this exists in server/db.ts
export async function createFarm(data: {
  name: string;
  farmerName: string;
  location: string;
  size: number;
  crops: string[];
  status: string;
  registrationDate: string;
}) {
  const [farm] = await db.insert(farms).values({
    name: data.name,
    farmerName: data.farmerName,
    location: data.location,
    size: data.size,
    crops: data.crops.join(", "),
    status: data.status,
    registrationDate: data.registrationDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }).returning();
  
  return farm;
}
```

#### **Integration Steps:**

1. **Update FarmList.tsx to include AddFarmDialog:**
```typescript
// In client/src/pages/FarmList.tsx
import { AddFarmDialog } from "@/components/AddFarmDialog";

// In the header section, replace the existing "Add New Farm" button:
<div className="flex items-center gap-4">
  <AddFarmDialog />
</div>
```

2. **Test the integration:**
   - [ ] Click "Add New Farm" button
   - [ ] Fill in all required fields
   - [ ] Submit form
   - [ ] Verify success toast appears
   - [ ] Verify redirect to new farm detail page
   - [ ] Verify new farm appears in farm list
   - [ ] Verify data persists after page refresh

3. **Error Scenarios to Test:**
   - [ ] Submit with empty required fields → Show validation error
   - [ ] Submit with invalid size (negative/zero) → Show validation error
   - [ ] Submit with no crops → Show validation error
   - [ ] Network error during submission → Show error toast with retry option

#### **Deliverables:**
- [ ] AddFarmDialog integrated into FarmList page
- [ ] tRPC mutation connected and working
- [ ] Success toast and redirect implemented
- [ ] Error handling with user-friendly messages
- [ ] All test scenarios passing

---

## **Afternoon Session (3 hours): Edit Farm Functionality**

### **Task 2.3: Create EditFarm Component** (1.5 hours)

#### **File to Create:** `client/src/components/EditFarmDialog.tsx`

#### **Component Structure:**

```typescript
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface EditFarmDialogProps {
  farm: {
    id: number;
    name: string;
    farmerName: string;
    location: string;
    size: number;
    crops: string;
    status: string;
    registrationDate: string;
  };
}

export function EditFarmDialog({ farm }: EditFarmDialogProps) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();
  
  // Pre-populate form with existing farm data
  const [formData, setFormData] = useState({
    name: farm.name,
    farmerName: farm.farmerName,
    location: farm.location,
    size: farm.size.toString(),
    crops: farm.crops,
    status: farm.status,
    registrationDate: farm.registrationDate
  });

  // Reset form when farm prop changes
  useEffect(() => {
    setFormData({
      name: farm.name,
      farmerName: farm.farmerName,
      location: farm.location,
      size: farm.size.toString(),
      crops: farm.crops,
      status: farm.status,
      registrationDate: farm.registrationDate
    });
  }, [farm]);

  // tRPC mutation with optimistic update
  const updateFarm = trpc.farms.update.useMutation({
    onMutate: async (updatedData) => {
      // Cancel outgoing refetches
      await utils.farms.getById.cancel({ id: farm.id });
      
      // Snapshot previous value
      const previousFarm = utils.farms.getById.getData({ id: farm.id });
      
      // Optimistically update
      utils.farms.getById.setData({ id: farm.id }, (old) => ({
        ...old!,
        ...updatedData
      }));
      
      return { previousFarm };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousFarm) {
        utils.farms.getById.setData({ id: farm.id }, context.previousFarm);
      }
      toast.error(`Failed to update farm: ${error.message}`);
    },
    onSuccess: () => {
      toast.success("Farm updated successfully!");
      setOpen(false);
      // Refetch to ensure consistency
      utils.farms.getById.invalidate({ id: farm.id });
      utils.farms.list.invalidate();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation (same as AddFarm)
    if (!formData.name || !formData.farmerName || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    const size = parseFloat(formData.size);
    if (isNaN(size) || size <= 0) {
      toast.error("Please enter a valid farm size");
      return;
    }

    // Submit
    updateFarm.mutate({
      id: farm.id,
      name: formData.name,
      farmerName: formData.farmerName,
      location: formData.location,
      size: size,
      crops: formData.crops.split(",").map(c => c.trim()).filter(Boolean),
      status: formData.status as "Active" | "Inactive" | "Fallow",
      registrationDate: formData.registrationDate
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Edit Farm
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Farm: {farm.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Same form fields as AddFarm, but pre-populated */}
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

#### **Key Differences from AddFarm:**

1. **Pre-populated fields:** Form loads with existing farm data
2. **Optimistic updates:** UI updates immediately, rollback on error
3. **Different button style:** "Edit Farm" with Pencil icon
4. **Dialog title:** Shows farm name being edited
5. **Mutation:** Uses `update` instead of `create`

#### **Deliverables:**
- [ ] EditFarmDialog component created
- [ ] Form pre-populated with existing data
- [ ] Same validation as AddFarm
- [ ] Responsive layout
- [ ] Loading state during submission

---

### **Task 2.4: Implement Edit Farm API Integration** (1.5 hours)

#### **API Endpoint (Already exists in `server/routers.ts`):**

```typescript
// Verify this exists in server/routers.ts
update: publicProcedure
  .input(z.object({
    id: z.number(),
    name: z.string().min(3).optional(),
    farmerName: z.string().min(2).optional(),
    location: z.string().optional(),
    size: z.number().positive().optional(),
    crops: z.array(z.string()).optional(),
    status: z.enum(["Active", "Inactive", "Fallow"]).optional(),
    registrationDate: z.string().optional()
  }))
  .mutation(async ({ input }) => {
    const { id, ...updateData } = input;
    const updatedFarm = await db.updateFarm(id, updateData);
    return updatedFarm;
  })
```

#### **Database Helper (Already exists in `server/db.ts`):**

```typescript
// Verify this exists in server/db.ts
export async function updateFarm(id: number, data: Partial<{
  name: string;
  farmerName: string;
  location: string;
  size: number;
  crops: string[];
  status: string;
  registrationDate: string;
}>) {
  const updatePayload: any = {
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  if (data.crops) {
    updatePayload.crops = data.crops.join(", ");
  }
  
  const [updatedFarm] = await db
    .update(farms)
    .set(updatePayload)
    .where(eq(farms.id, id))
    .returning();
  
  return updatedFarm;
}
```

#### **Integration Steps:**

1. **Add EditFarmDialog to FarmDetail page:**
```typescript
// In client/src/pages/FarmDetail.tsx
import { EditFarmDialog } from "@/components/EditFarmDialog";

// In the header section, after the farm name:
<div className="flex items-center justify-between">
  <h1 className="text-3xl font-bold">{farm.name}</h1>
  <EditFarmDialog farm={farm} />
</div>
```

2. **Test the integration:**
   - [ ] Navigate to any farm detail page
   - [ ] Click "Edit Farm" button
   - [ ] Verify all fields pre-populated correctly
   - [ ] Change farm name and submit
   - [ ] Verify success toast appears
   - [ ] Verify farm name updates in header immediately (optimistic update)
   - [ ] Verify changes persist after page refresh
   - [ ] Test editing each field individually

3. **Optimistic Update Testing:**
   - [ ] Edit farm with slow network (throttle in DevTools)
   - [ ] Verify UI updates immediately
   - [ ] Simulate error (disconnect network before submit)
   - [ ] Verify UI rolls back to previous state
   - [ ] Verify error toast appears

4. **Edge Cases to Test:**
   - [ ] Edit farm with very long name (>100 chars)
   - [ ] Edit farm with special characters in location
   - [ ] Edit farm with decimal size (e.g., 2.75 hectares)
   - [ ] Edit farm and immediately navigate away
   - [ ] Edit farm with empty crops field

#### **Deliverables:**
- [ ] EditFarmDialog integrated into FarmDetail page
- [ ] tRPC mutation with optimistic updates working
- [ ] Success toast and data refresh implemented
- [ ] Rollback on error working correctly
- [ ] All test scenarios passing

---

## **End of Day 2: Testing & Validation** (30 minutes)

### **Complete User Journey Tests:**

#### **Test 1: Add Farm Flow**
1. [ ] Go to Farm List dashboard
2. [ ] Click "Add New Farm"
3. [ ] Fill in all fields with valid data
4. [ ] Submit form
5. [ ] Verify redirect to new farm detail page
6. [ ] Verify farm appears in list with correct data
7. [ ] Refresh page and verify farm still exists

#### **Test 2: Edit Farm Flow**
1. [ ] Go to any farm detail page
2. [ ] Click "Edit Farm"
3. [ ] Modify farm name and size
4. [ ] Submit form
5. [ ] Verify changes reflected immediately
6. [ ] Refresh page and verify changes persisted
7. [ ] Go back to farm list and verify changes there too

#### **Test 3: Validation Flow**
1. [ ] Try to add farm with empty name → Error
2. [ ] Try to add farm with negative size → Error
3. [ ] Try to add farm with no crops → Error
4. [ ] Try to edit farm and clear required field → Error

#### **Test 4: Error Handling**
1. [ ] Disconnect network
2. [ ] Try to add farm → Error toast with retry option
3. [ ] Reconnect network
4. [ ] Retry → Success

---

## **Day 2 Checkpoint Criteria**

Before creating checkpoint "Day 2 - Farm CRUD Complete", verify:

- [ ] AddFarmDialog component exists and works
- [ ] EditFarmDialog component exists and works
- [ ] Both dialogs have proper validation
- [ ] Both dialogs show loading states
- [ ] Success/error toasts appear correctly
- [ ] Optimistic updates work in EditFarm
- [ ] All data persists to database
- [ ] Farm list updates after add/edit
- [ ] No console errors
- [ ] Mobile layout tested and working
- [ ] All 4 user journey tests pass

---

## **Files Modified/Created on Day 2**

### **New Files:**
1. `client/src/components/AddFarmDialog.tsx` (~200 lines)
2. `client/src/components/EditFarmDialog.tsx` (~220 lines)

### **Modified Files:**
1. `client/src/pages/FarmList.tsx` (add AddFarmDialog import and usage)
2. `client/src/pages/FarmDetail.tsx` (add EditFarmDialog import and usage)

### **Existing Files (verify they exist from Day 1):**
1. `server/routers.ts` (farms.create and farms.update procedures)
2. `server/db.ts` (createFarm and updateFarm helpers)
3. `drizzle/schema.ts` (farms table schema)

---

## **Common Issues & Solutions**

### **Issue 1: "Cannot read property 'id' of undefined"**
**Solution:** Ensure farm data is loaded before rendering EditFarmDialog. Add conditional rendering:
```typescript
{farm && <EditFarmDialog farm={farm} />}
```

### **Issue 2: Form doesn't reset after successful submission**
**Solution:** Add form reset in onSuccess callback:
```typescript
onSuccess: () => {
  setFormData({ name: "", farmerName: "", ... });
  setOpen(false);
}
```

### **Issue 3: Optimistic update doesn't work**
**Solution:** Ensure you're using `trpc.useUtils()` and calling `utils.farms.getById.setData()` correctly.

### **Issue 4: Crops array not saving correctly**
**Solution:** Verify you're splitting the comma-separated string:
```typescript
crops: formData.crops.split(",").map(c => c.trim()).filter(Boolean)
```

---

## **Next Steps After Day 2**

Once Day 2 is complete, you'll have:
✅ Full farm management (Add, Edit, View)  
✅ Data persistence to database  
✅ Optimistic UI updates  
✅ Proper error handling  

**Ready for Day 3:** Security & Mobile Optimization

---

**Ready to start Day 2?** Let me know and I'll begin with Task 2.1: Creating the AddFarmDialog component.
