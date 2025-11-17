import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Farmers from "./pages/Farmers";
import FarmerProfile from "./pages/FarmerProfile";
import HarvestTracking from "./pages/HarvestTracking";
import PriceComparison from "./components/PriceComparison";
import OrderCalculator from "./pages/OrderCalculator";
import Login from "./pages/Login";
import KaAniChat from "./pages/KaAniChat";
import Marketplace from "./pages/Marketplace";
import ShoppingCart from "./pages/ShoppingCart";
import Checkout from "./pages/Checkout";
import OrderHistory from "./pages/OrderHistory";
import BatchOrders from "./pages/BatchOrders";
import SupplierDashboard from "./pages/SupplierDashboardBulk";
import SupplierInventory from "./pages/SupplierInventory";
import SupplierDeliveries from "./pages/SupplierDeliveries";
import AuditLog from "./pages/AuditLog";
import AuditArchive from "./pages/AuditArchive";
import Farms from "./pages/Farms";
import FarmDetail from "./pages/FarmDetail";
import FarmList from "./pages/FarmList";
import RetentionSettings from "./pages/RetentionSettings";
import RolePermissions from "./pages/RolePermissions";
import PermissionApproval from "./pages/PermissionApproval";
import MyRequests from "./pages/MyRequests";
import TRPCTest from "./pages/TRPCTest";
import DebugFarm from "./pages/DebugFarm";
import FarmNew from "./pages/FarmNew";
import TRPCClientTest from "./pages/TRPCClientTest";
import SkeletonDemo from "./pages/SkeletonDemo";
import Analytics from "./pages/Analytics";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/trpc-test" component={TRPCTest} />
      <Route path="/debug-farm" component={DebugFarm} />
      <Route path="/trpc-client-test" component={TRPCClientTest} />
      <Route path="/skeleton-demo" component={SkeletonDemo} />
      
      {/* Protected routes */}
      <Route path="/">
        <ProtectedRoute>
          <Layout>
            <FarmList />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/farmers">
        <ProtectedRoute allowedRoles={['manager', 'field_officer']}>
          <Layout>
            <Farmers />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/farmers/:id">
        <ProtectedRoute allowedRoles={['manager', 'field_officer']}>
          <Layout>
            <FarmerProfile />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/harvest-tracking">
        <ProtectedRoute>
          <Layout>
            <HarvestTracking />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/price-comparison">
        <ProtectedRoute>
          <Layout>
            <PriceComparison />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/order-calculator">
        <ProtectedRoute>
          <Layout>
            <OrderCalculator />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/kaani">
        <ProtectedRoute>
          <KaAniChat />
        </ProtectedRoute>
      </Route>
      
      <Route path="/marketplace">
        <ProtectedRoute allowedRoles={['farmer']}>
          <Layout>
            <Marketplace />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/cart">
        <ProtectedRoute allowedRoles={['farmer']}>
          <Layout>
            <ShoppingCart />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/checkout">
        <ProtectedRoute allowedRoles={['farmer']}>
          <Layout>
            <Checkout />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/orders">
        <ProtectedRoute allowedRoles={['farmer']}>
          <Layout>
            <OrderHistory />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/batch-orders">
        <ProtectedRoute allowedRoles={['manager', 'field_officer']}>
          <Layout>
            <BatchOrders />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/supplier">
        <ProtectedRoute allowedRoles={['supplier']}>
          <Layout>
            <SupplierDashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/supplier/inventory">
        <ProtectedRoute allowedRoles={['supplier']}>
          <Layout>
            <SupplierInventory />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/supplier/deliveries">
        <ProtectedRoute allowedRoles={['supplier']}>
          <Layout>
            <SupplierDeliveries />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/supplier/audit-log">
        <ProtectedRoute allowedRoles={['supplier']}>
          <Layout>
            <AuditLog />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/supplier/audit-archive">
        <ProtectedRoute allowedRoles={['supplier']}>
          <Layout>
            <AuditArchive />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/supplier/retention-settings">
        <ProtectedRoute allowedRoles={['supplier', 'manager']}>
          <Layout>
            <RetentionSettings />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/role-permissions">
        <Layout>
          <RolePermissions />
        </Layout>
      </Route>
      
      <Route path="/permission-approval">
        <ProtectedRoute allowedRoles={['manager', 'admin']}>
          <Layout>
            <PermissionApproval />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/my-requests">
        <Layout>
          <MyRequests />
        </Layout>
      </Route>

      {/* Analytics Route */}
      <Route path="/analytics">
        <Layout>
          <Analytics />
        </Layout>
      </Route>

      {/* Farms Routes */}
      <Route path="/farms">
        <Layout>
          <Farms />
        </Layout>
      </Route>
      <Route path="/farms/new">
        <Layout>
          <FarmNew />
        </Layout>
      </Route>
      <Route path="/farms/:id">
        <Layout>
          <FarmDetail />
        </Layout>
      </Route>
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
