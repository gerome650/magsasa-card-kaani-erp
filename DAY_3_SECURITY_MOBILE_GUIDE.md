# 🔒 Day 3: Security & Mobile Optimization - Detailed Implementation Guide

**Total Time:** 6-7 hours  
**Goal:** Implement role-based access control and optimize for mobile field officers  
**Dependencies:** Day 1 (Database) and Day 2 (Farm CRUD) must be complete

---

## **Morning Session (3-4 hours): Security & Authentication**

### **Task 3.1: Role-Based Access Control (RBAC)** (2.5 hours)

#### **Step 3.1.1: Define User Roles and Permissions** (30 minutes)

**Create file:** `shared/roles.ts`

```typescript
export enum UserRole {
  ADMIN = 'admin',
  FIELD_OFFICER = 'field_officer',
  FARMER = 'farmer',
  VIEWER = 'viewer',
  ACCOUNTANT = 'accountant'
}

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    { resource: 'farms', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'boundaries', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'yields', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'costs', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'orders', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'prices', actions: ['create', 'read', 'update', 'delete'] },
  ],
  
  [UserRole.FIELD_OFFICER]: [
    { resource: 'farms', actions: ['create', 'read', 'update'] }, // Can't delete
    { resource: 'boundaries', actions: ['create', 'read', 'update'] },
    { resource: 'yields', actions: ['create', 'read', 'update'] },
    { resource: 'costs', actions: ['create', 'read'] }, // Can't modify costs
    { resource: 'orders', actions: ['read'] }, // View only
    { resource: 'prices', actions: ['read'] },
  ],
  
  [UserRole.FARMER]: [
    { resource: 'farms', actions: ['read', 'update'] }, // Own farms only
    { resource: 'boundaries', actions: ['read'] }, // View only
    { resource: 'yields', actions: ['read'] },
    { resource: 'costs', actions: ['read'] },
    { resource: 'orders', actions: ['create', 'read'] }, // Can place orders
    { resource: 'prices', actions: ['read'] },
  ],
  
  [UserRole.ACCOUNTANT]: [
    { resource: 'farms', actions: ['read'] },
    { resource: 'yields', actions: ['read'] },
    { resource: 'costs', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'orders', actions: ['read'] },
    { resource: 'prices', actions: ['read', 'update'] },
  ],
  
  [UserRole.VIEWER]: [
    { resource: 'farms', actions: ['read'] },
    { resource: 'boundaries', actions: ['read'] },
    { resource: 'yields', actions: ['read'] },
    { resource: 'costs', actions: ['read'] },
    { resource: 'orders', actions: ['read'] },
    { resource: 'prices', actions: ['read'] },
  ],
};

export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  const resourcePermission = permissions.find(p => p.resource === resource);
  return resourcePermission?.actions.includes(action) || false;
}

export function canAccessFarm(
  userRole: UserRole,
  userId: string,
  farmOwnerId: string
): boolean {
  // Admin and Field Officers can access all farms
  if (userRole === UserRole.ADMIN || userRole === UserRole.FIELD_OFFICER) {
    return true;
  }
  
  // Farmers can only access their own farms
  if (userRole === UserRole.FARMER) {
    return userId === farmOwnerId;
  }
  
  // Accountants and Viewers can view all farms
  return userRole === UserRole.ACCOUNTANT || userRole === UserRole.VIEWER;
}
```

**Checklist:**
- [ ] File created at `shared/roles.ts`
- [ ] All 5 roles defined
- [ ] Permissions matrix complete
- [ ] Helper functions implemented
- [ ] No TypeScript errors

---

#### **Step 3.1.2: Add User Context** (30 minutes)

**Create file:** `client/src/contexts/UserContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@/../../shared/roles';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  openId?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (resource: string, action: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage or session)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // TODO: Replace with actual API call
    // For now, mock login based on email
    const mockUser: User = {
      id: '1',
      name: email.split('@')[0],
      email: email,
      role: email.includes('admin') ? UserRole.ADMIN :
            email.includes('officer') ? UserRole.FIELD_OFFICER :
            UserRole.FARMER
    };
    
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
  };

  const hasPermission = (resource: string, action: string) => {
    if (!user) return false;
    
    const { hasPermission: checkPermission } = await import('@/../../shared/roles');
    return checkPermission(
      user.role, 
      resource, 
      action as 'create' | 'read' | 'update' | 'delete'
    );
  };

  return (
    <UserContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
```

**Update:** `client/src/App.tsx`

```typescript
import { UserProvider } from './contexts/UserContext';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <UserProvider>  {/* Add this wrapper */}
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </UserProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

**Checklist:**
- [ ] UserContext.tsx created
- [ ] User state management implemented
- [ ] Login/logout functions work
- [ ] hasPermission helper works
- [ ] UserProvider wraps App
- [ ] No console errors

---

#### **Step 3.1.3: Protect Routes with Authentication** (45 minutes)

**Create file:** `client/src/components/ProtectedRoute.tsx`

```typescript
import { useEffect } from 'react';
import { useLocation, useRouter } from 'wouter';
import { useUser } from '@/contexts/UserContext';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/../../shared/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: {
    resource: string;
    action: 'create' | 'read' | 'update' | 'delete';
  };
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  requiredPermission 
}: ProtectedRouteProps) {
  const { user, isLoading, hasPermission } = useUser();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    // Not logged in - redirect to login
    if (!user) {
      setLocation(`/login?redirect=${encodeURIComponent(location)}`);
      return;
    }

    // Check role requirement
    if (requiredRole && user.role !== requiredRole) {
      setLocation('/unauthorized');
      return;
    }

    // Check permission requirement
    if (requiredPermission) {
      const { resource, action } = requiredPermission;
      if (!hasPermission(resource, action)) {
        setLocation('/unauthorized');
        return;
      }
    }
  }, [user, isLoading, location, requiredRole, requiredPermission]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3">Checking authentication...</span>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
```

**Update:** `client/src/App.tsx` to protect routes

```typescript
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserRole } from '@/../../shared/roles';

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/unauthorized" component={Unauthorized} />
      
      {/* Protected routes */}
      <Route path="/">
        <ProtectedRoute>
          <FarmList />
        </ProtectedRoute>
      </Route>
      
      <Route path="/farms/:id">
        {(params) => (
          <ProtectedRoute requiredPermission={{ resource: 'farms', action: 'read' }}>
            <FarmDetail id={params.id} />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute requiredRole={UserRole.ADMIN}>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}
```

**Checklist:**
- [ ] ProtectedRoute component created
- [ ] Routes wrapped with ProtectedRoute
- [ ] Login redirect works
- [ ] Unauthorized page created
- [ ] Role-based access enforced
- [ ] Test with different user roles

---

#### **Step 3.1.4: Enforce Permissions in UI** (45 minutes)

**Update:** `client/src/pages/FarmDetail.tsx` - Hide/disable actions based on permissions

```typescript
import { useUser } from '@/contexts/UserContext';

export default function FarmDetail({ id }: { id: string }) {
  const { user, hasPermission } = useUser();
  
  const canEditFarm = hasPermission('farms', 'update');
  const canDeleteFarm = hasPermission('farms', 'delete');
  const canCreateBoundary = hasPermission('boundaries', 'create');
  const canRecordYield = hasPermission('yields', 'create');
  const canRecordCost = hasPermission('costs', 'create');

  // ... existing code ...

  return (
    <div>
      {/* Only show Edit button if user has permission */}
      {canEditFarm && (
        <Button onClick={() => setIsEditDialogOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Farm
        </Button>
      )}

      {/* Disable drawing if no permission */}
      <Button 
        onClick={handleDrawBoundary}
        disabled={!canCreateBoundary || isDrawing}
      >
        {!canCreateBoundary && <Lock className="mr-2 h-4 w-4" />}
        Draw Boundary
      </Button>

      {/* Hide Record Harvest button if no permission */}
      {canRecordYield && (
        <Button onClick={() => setIsYieldDialogOpen(true)}>
          <Sprout className="mr-2 h-4 w-4" />
          Record Harvest
        </Button>
      )}

      {/* Show read-only message for viewers */}
      {user?.role === UserRole.VIEWER && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You have view-only access. Contact an administrator to make changes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

**Update:** `client/src/pages/FarmList.tsx` - Hide Add Farm button for non-admins

```typescript
import { useUser } from '@/contexts/UserContext';
import { UserRole } from '@/../../shared/roles';

export default function FarmList() {
  const { user, hasPermission } = useUser();
  const canCreateFarm = hasPermission('farms', 'create');

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1>Farms</h1>
        
        {/* Only show Add Farm for admins and field officers */}
        {canCreateFarm && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Farm
          </Button>
        )}
      </div>

      {/* Show role badge in header */}
      <Badge variant={user?.role === UserRole.ADMIN ? 'default' : 'secondary'}>
        {user?.role?.replace('_', ' ').toUpperCase()}
      </Badge>
    </div>
  );
}
```

**Checklist:**
- [ ] Buttons hidden/disabled based on permissions
- [ ] Read-only alerts shown for viewers
- [ ] Role badges displayed
- [ ] Test with each user role
- [ ] UI updates correctly on role change

---

### **Task 3.2: Server-Side Permission Enforcement** (1 hour)

#### **Step 3.2.1: Add Permission Middleware to tRPC**

**Update:** `server/routers.ts`

```typescript
import { TRPCError } from '@trpc/server';
import { hasPermission, UserRole } from '../shared/roles';

// Add permission check middleware
const requirePermission = (resource: string, action: 'create' | 'read' | 'update' | 'delete') => {
  return async (opts: any) => {
    const { ctx } = opts;
    
    // Get user from context (set by auth middleware)
    const user = ctx.user;
    
    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to perform this action',
      });
    }

    if (!hasPermission(user.role, resource, action)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You don't have permission to ${action} ${resource}`,
      });
    }

    return opts.next();
  };
};

// Apply to procedures
export const appRouter = router({
  farms: router({
    list: publicProcedure
      .use(requirePermission('farms', 'read'))
      .query(async () => {
        return await db.getAllFarms();
      }),
    
    create: publicProcedure
      .use(requirePermission('farms', 'create'))
      .input(z.object({
        name: z.string(),
        farmer: z.string(),
        // ... other fields
      }))
      .mutation(async ({ input, ctx }) => {
        // Only admins and field officers can create farms
        return await db.createFarm(input);
      }),
    
    update: publicProcedure
      .use(requirePermission('farms', 'update'))
      .input(z.object({
        id: z.number(),
        // ... other fields
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if user owns the farm (for farmers)
        if (ctx.user.role === UserRole.FARMER) {
          const farm = await db.getFarmById(input.id);
          if (farm.ownerId !== ctx.user.id) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You can only edit your own farms',
            });
          }
        }
        return await db.updateFarm(input);
      }),
    
    delete: publicProcedure
      .use(requirePermission('farms', 'delete'))
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        // Only admins can delete farms
        return await db.deleteFarm(input.id);
      }),
  }),
  
  // Apply same pattern to boundaries, yields, costs...
});
```

**Checklist:**
- [ ] Permission middleware created
- [ ] Applied to all sensitive procedures
- [ ] Ownership checks for farmer role
- [ ] Test API calls with different roles
- [ ] Proper error messages returned

---

## **Afternoon Session (3 hours): Mobile Optimization**

### **Task 3.3: Responsive Layout Improvements** (1.5 hours)

#### **Step 3.3.1: Optimize FarmDetail for Mobile** (45 minutes)

**Update:** `client/src/pages/FarmDetail.tsx`

```typescript
export default function FarmDetail({ id }: { id: string }) {
  return (
    <div className="container mx-auto py-4 md:py-8">
      {/* Mobile-friendly header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{farm.name}</h1>
          <p className="text-sm md:text-base text-gray-600">{farm.location}</p>
        </div>
        
        {/* Stack buttons on mobile */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button size="sm" className="w-full sm:w-auto">Edit Farm</Button>
          <Button size="sm" variant="outline" className="w-full sm:w-auto">Download Report</Button>
        </div>
      </div>

      {/* Two-column layout on desktop, stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Map section - full width on mobile */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg md:text-xl">Farm Boundary</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Map controls - horizontal scroll on mobile */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <Button size="sm" className="flex-shrink-0">
                  <Pencil className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Draw</span>
                </Button>
                <Button size="sm" className="flex-shrink-0">
                  <Ruler className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Measure</span>
                </Button>
                <Button size="sm" className="flex-shrink-0">
                  <Calculator className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Calculate</span>
                </Button>
              </div>

              {/* Map - adjust height for mobile */}
              <div className="h-[400px] md:h-[600px] relative">
                <MapView onMapReady={handleMapReady} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info sidebar - below map on mobile */}
        <div className="space-y-4">
          {/* Farm details card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Farm Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm md:text-base">
              <div className="flex justify-between">
                <span className="text-gray-600">Farmer:</span>
                <span className="font-medium">{farm.farmer}</span>
              </div>
              {/* ... more details ... */}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Yield and Cost tables - horizontal scroll on mobile */}
      <div className="mt-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Yield History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                {/* Table content */}
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Checklist:**
- [ ] Responsive grid layout (1 col mobile, 3 cols desktop)
- [ ] Buttons stack on mobile
- [ ] Map height adjusts for mobile (400px) vs desktop (600px)
- [ ] Tables scroll horizontally on mobile
- [ ] Text sizes responsive (text-sm md:text-base)
- [ ] Test on iPhone SE (375px), iPad (768px), Desktop (1920px)

---

#### **Step 3.3.2: Touch-Friendly Map Controls** (45 minutes)

**Update:** Map button sizes and spacing

```typescript
// Larger touch targets for mobile
<div className="flex flex-wrap gap-2 mb-4">
  <Button 
    size="lg"  // Larger on mobile
    className="min-w-[44px] min-h-[44px]"  // iOS recommended touch target
    onClick={handleDrawBoundary}
  >
    <Pencil className="h-5 w-5 md:mr-2" />
    <span className="hidden sm:inline">Draw Boundary</span>
  </Button>
  
  {/* Map type switcher - larger buttons */}
  <div className="flex gap-1 border rounded-md p-1">
    <Button
      size="sm"
      variant={mapType === 'roadmap' ? 'default' : 'ghost'}
      className="min-w-[44px] min-h-[44px]"
      onClick={() => setMapType('roadmap')}
    >
      <Map className="h-5 w-5" />
    </Button>
    <Button
      size="sm"
      variant={mapType === 'satellite' ? 'default' : 'ghost'}
      className="min-w-[44px] min-h-[44px]"
      onClick={() => setMapType('satellite')}
    >
      <Satellite className="h-5 w-5" />
    </Button>
  </div>
</div>
```

**Add pinch-to-zoom support:**

```typescript
useEffect(() => {
  if (!mapInstance) return;

  // Enable gesture handling for mobile
  mapInstance.setOptions({
    gestureHandling: 'greedy', // Allow one-finger pan on mobile
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER,
    },
    fullscreenControl: true,
    fullscreenControlOptions: {
      position: google.maps.ControlPosition.RIGHT_TOP,
    },
  });
}, [mapInstance]);
```

**Checklist:**
- [ ] All buttons minimum 44x44px (iOS guideline)
- [ ] Touch targets have adequate spacing (8px+)
- [ ] Pinch-to-zoom enabled on map
- [ ] One-finger pan enabled (gestureHandling: 'greedy')
- [ ] Fullscreen button visible on mobile
- [ ] Test on actual mobile device (not just DevTools)

---

### **Task 3.4: Mobile-Specific Features** (1.5 hours)

#### **Step 3.4.1: Add Bottom Navigation for Mobile** (45 minutes)

**Create file:** `client/src/components/MobileNav.tsx`

```typescript
import { Home, Map, ShoppingCart, User } from 'lucide-react';
import { useLocation } from 'wouter';

export function MobileNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { icon: Home, label: 'Farms', path: '/' },
    { icon: Map, label: 'Map', path: '/map' },
    { icon: ShoppingCart, label: 'Orders', path: '/orders' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 ${
                isActive ? 'text-primary' : 'text-gray-600'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

**Update:** `client/src/App.tsx`

```typescript
import { MobileNav } from './components/MobileNav';

function App() {
  return (
    <>
      <Router />
      <MobileNav />  {/* Add bottom nav */}
      
      {/* Add padding to prevent content from being hidden behind nav */}
      <style>{`
        @media (max-width: 768px) {
          body {
            padding-bottom: 64px;
          }
        }
      `}</style>
    </>
  );
}
```

**Checklist:**
- [ ] Bottom nav shows on mobile only (hidden md:hidden)
- [ ] Fixed to bottom of screen
- [ ] Active state highlights current page
- [ ] Icons and labels clear
- [ ] Content has bottom padding to avoid overlap
- [ ] Test navigation between pages

---

#### **Step 3.4.2: Optimize Forms for Mobile** (45 minutes)

**Update:** Form dialogs to be full-screen on mobile

```typescript
import { Dialog, DialogContent } from '@/components/ui/dialog';

<Dialog open={isYieldDialogOpen} onOpenChange={setIsYieldDialogOpen}>
  <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
    {/* On mobile, dialog takes full width */}
    <form onSubmit={handleYieldSubmit} className="space-y-4">
      {/* Larger input fields for mobile */}
      <div className="space-y-2">
        <Label htmlFor="quantity" className="text-base">Quantity</Label>
        <Input
          id="quantity"
          type="number"
          className="h-12 text-base"  // Larger height and text
          placeholder="Enter quantity"
        />
      </div>

      {/* Date picker with native mobile input */}
      <div className="space-y-2">
        <Label htmlFor="date" className="text-base">Harvest Date</Label>
        <Input
          id="date"
          type="date"
          className="h-12 text-base"
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Larger select dropdowns */}
      <div className="space-y-2">
        <Label htmlFor="crop" className="text-base">Crop Type</Label>
        <Select>
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="Select crop" />
          </SelectTrigger>
          <SelectContent>
            {/* Options */}
          </SelectContent>
        </Select>
      </div>

      {/* Full-width submit button */}
      <Button type="submit" className="w-full h-12 text-base">
        Record Harvest
      </Button>
    </form>
  </DialogContent>
</Dialog>
```

**Checklist:**
- [ ] Form inputs minimum 44px height
- [ ] Text size 16px+ (prevents iOS zoom)
- [ ] Native date/time pickers on mobile
- [ ] Full-width buttons
- [ ] Dialog scrollable on small screens
- [ ] Test on iPhone and Android

---

## **End of Day 3: Comprehensive Testing** (30 minutes)

### **Test 1: Role-Based Access Control**

**Test as Admin:**
- [ ] Can access all pages
- [ ] Can create, edit, delete farms
- [ ] Can record yields and costs
- [ ] Can see all farms in list

**Test as Field Officer:**
- [ ] Can access farm pages
- [ ] Can create and edit farms
- [ ] Can record yields
- [ ] Cannot delete farms
- [ ] Can see all farms

**Test as Farmer:**
- [ ] Can only see own farms
- [ ] Cannot create new farms
- [ ] Cannot edit boundaries
- [ ] Can view yields and costs
- [ ] Redirected if accessing other farmer's farm

**Test as Viewer:**
- [ ] Can view all pages
- [ ] All edit buttons hidden/disabled
- [ ] Cannot record data
- [ ] Read-only mode message shown

---

### **Test 2: Mobile Responsiveness**

**iPhone SE (375px):**
- [ ] All content visible without horizontal scroll
- [ ] Buttons stack vertically
- [ ] Map controls fit on screen
- [ ] Tables scroll horizontally
- [ ] Forms usable with thumb
- [ ] Bottom nav visible and functional

**iPad (768px):**
- [ ] Two-column layout works
- [ ] Map and sidebar side-by-side
- [ ] Bottom nav hidden, regular nav shown
- [ ] Touch targets adequate

**Desktop (1920px):**
- [ ] Three-column layout
- [ ] All features accessible
- [ ] No wasted space
- [ ] Hover states work

---

### **Test 3: Touch Interactions**

**On actual mobile device:**
- [ ] Can draw polygon with finger
- [ ] Can pinch to zoom map
- [ ] Can pan map with one finger
- [ ] Can tap small buttons accurately
- [ ] Can scroll tables horizontally
- [ ] Forms don't cause page zoom
- [ ] Keyboard doesn't obscure inputs

---

### **Test 4: Security**

**Attempt unauthorized actions:**
- [ ] Try to access `/farms/1` as logged-out user → Redirect to login
- [ ] Try to delete farm as Field Officer → Button hidden
- [ ] Try to edit another farmer's farm as Farmer → Error message
- [ ] Try to call API with wrong role → 403 Forbidden error
- [ ] Check server logs for permission errors

---

### **Test 5: Performance on Mobile**

**On 3G network:**
- [ ] Pages load in <5 seconds
- [ ] Loading states show during load
- [ ] Map tiles load progressively
- [ ] Forms remain responsive
- [ ] No layout shift during load

---

## **Day 3 Checkpoint Criteria**

Before creating checkpoint "Day 3 - Security & Mobile Complete", verify:

### **Security:**
- [ ] All 5 user roles defined
- [ ] Permissions enforced in UI (buttons hidden/disabled)
- [ ] Permissions enforced in API (tRPC middleware)
- [ ] Protected routes redirect to login
- [ ] Unauthorized access shows error page
- [ ] Ownership checks work for farmers
- [ ] Test passed with all 4 roles

### **Mobile:**
- [ ] Responsive layout works on 375px, 768px, 1920px
- [ ] Touch targets minimum 44x44px
- [ ] Forms usable on mobile (no zoom)
- [ ] Bottom navigation works
- [ ] Map controls touch-friendly
- [ ] Tables scroll horizontally
- [ ] Tested on real mobile device

---

## **Common Issues & Solutions**

### **Issue 1: Permission checks slow down UI**
**Solution:** Cache permissions in context, don't check on every render

### **Issue 2: Mobile keyboard obscures form inputs**
**Solution:** Add `scrollIntoView()` when input focused

### **Issue 3: Map drawing difficult on mobile**
**Solution:** Increase polygon stroke width, add larger touch handles

### **Issue 4: Bottom nav overlaps content**
**Solution:** Add `pb-16` class to main content wrapper

### **Issue 5: Unauthorized users see flash of content**
**Solution:** Add loading state in ProtectedRoute, don't render until auth checked

---

## **Files Modified/Created on Day 3**

### **New Files:**
1. `shared/roles.ts` - Role definitions and permissions
2. `client/src/contexts/UserContext.tsx` - User state management
3. `client/src/components/ProtectedRoute.tsx` - Route protection
4. `client/src/components/MobileNav.tsx` - Bottom navigation
5. `client/src/pages/Login.tsx` - Login page
6. `client/src/pages/Unauthorized.tsx` - 403 error page

### **Modified Files:**
1. `client/src/App.tsx` - Add UserProvider, protect routes
2. `client/src/pages/FarmDetail.tsx` - Responsive layout, permission checks
3. `client/src/pages/FarmList.tsx` - Hide buttons based on permissions
4. `server/routers.ts` - Add permission middleware
5. `client/src/index.css` - Mobile-specific styles

---

## **Next Steps After Day 3**

Once Day 3 is complete, you'll have:
✅ Role-based access control fully implemented  
✅ Mobile-optimized layouts and touch controls  
✅ Secure API with permission enforcement  
✅ Professional mobile experience for field officers  

**Ready for Day 4:** Order Checkout & Final Testing

---

## **Estimated Time Breakdown**

| Task | Estimated Time | Actual Time |
|------|----------------|-------------|
| 3.1 RBAC | 2.5 hours | _____ |
| 3.2 Server Security | 1 hour | _____ |
| 3.3 Responsive Layout | 1.5 hours | _____ |
| 3.4 Mobile Features | 1.5 hours | _____ |
| Testing | 30 min | _____ |
| **Total** | **6-7 hours** | **_____** |

---

**Ready to start Day 3?** Complete Day 1 and Day 2 first, then proceed with Task 3.1: Role-Based Access Control.
