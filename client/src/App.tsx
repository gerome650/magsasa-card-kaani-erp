import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { IS_LITE_MODE } from "@/const";
import ErrorBoundary from "./components/ErrorBoundary";
import { useEffect } from "react";

// Simple redirect component
function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  return null;
}

// Dashboard route wrapper: routes farmers to scoped dashboard, others to global dashboard
function DashboardRoute() {
  const { user } = useAuth();
  const normalizedRole = normalizeRole(user);
  
  if (normalizedRole === "farmer") {
    return <FarmerDashboard />;
  }
  
  // For staff (manager, field_officer, etc.), show the global FarmList dashboard
  return <FarmList />;
}
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
import KaAniPublic from "./pages/KaAniPublic";
import Marketplace from "./pages/Marketplace";
import ShoppingCart from "./pages/ShoppingCart";
import Checkout from "./pages/Checkout";
import OrderHistory from "./pages/OrderHistory";
import BatchOrders from "./pages/BatchOrders";
import BatchOrdersList from "./pages/BatchOrdersList";
import BatchOrderCreate from "./pages/BatchOrderCreate";
import BatchOrderDetail from "./pages/BatchOrderDetail";
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
import { useAuth } from "./contexts/AuthContext";
import { normalizeRole } from "./const";
import FarmerDashboard from "./components/FarmerDashboard";
import TRPCTest from "./pages/TRPCTest";
import DebugFarm from "./pages/DebugFarm";
import FarmNew from "./pages/FarmNew";
import TRPCClientTest from "./pages/TRPCClientTest";
import SkeletonDemo from "./pages/SkeletonDemo";
import Analytics from "./pages/Analytics";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import FarmMap from "./pages/FarmMap";
import AdminCsvUpload from "./pages/AdminCsvUpload";

function Router() {
  // make sure to consider if you need authentication for certain routes
  
  // DEV-only: Log Lite Mode status on mount
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[App] Lite Mode:", IS_LITE_MODE ? "ACTIVE" : "INACTIVE");
      console.log("[App] VITE_APP_MODE:", import.meta.env.VITE_APP_MODE || "not set");
      if (IS_LITE_MODE) {
        console.log("[App] Lite Mode: Only routes /kaani, /order-calculator, /price-comparison, /map are accessible");
      }
    }
  }, []);
  
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      {!IS_LITE_MODE && (
        <>
          <Route path="/trpc-test" component={TRPCTest} />
          <Route path="/debug-farm" component={DebugFarm} />
          <Route path="/trpc-client-test" component={TRPCClientTest} />
          <Route path="/skeleton-demo" component={SkeletonDemo} />
        </>
      )}
      
      {/* Lite Mode: Redirect root to KaAni */}
      {IS_LITE_MODE && (
        <Route path="/">
          <Redirect to="/kaani" />
        </Route>
      )}
      
      {/* Protected routes */}
      {!IS_LITE_MODE && (
        <Route path="/">
          <ProtectedRoute>
            <Layout>
              <DashboardRoute />
            </Layout>
          </ProtectedRoute>
        </Route>
      )}
      
      {/* Lite Mode routes - always available */}
      <Route path="/kaani">
        <KaAniPublic />
      </Route>
      
      <Route path="/order-calculator">
        <ProtectedRoute>
          <Layout>
            <OrderCalculator />
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
      
      {/* Map View - optional in Lite Mode */}
      <Route path="/map">
        <Layout>
          <FarmMap />
        </Layout>
      </Route>
      
      {/* Non-Lite Mode routes */}
      {!IS_LITE_MODE && (
        <>
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
          
          <Route path="/analytics-dashboard">
            <ProtectedRoute>
              <Layout>
                <AnalyticsDashboard />
              </Layout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/erp/kaani">
            <ProtectedRoute>
              <Layout>
                <KaAniChat />
              </Layout>
            </ProtectedRoute>
          </Route>
        </>
      )}
      
      {/* Non-Lite Mode routes - continued */}
      {!IS_LITE_MODE && (
        <>
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
          
          {/* Batch Orders routes - gated by feature flag */}
          {import.meta.env.VITE_BATCH_ORDERS_ENABLED === 'true' && (
            <>
              <Route path="/batch-orders">
                <ProtectedRoute allowedRoles={['manager', 'field_officer']}>
                  <Layout>
                    <BatchOrdersList />
                  </Layout>
                </ProtectedRoute>
              </Route>
              
              <Route path="/batch-orders/new">
                <ProtectedRoute allowedRoles={['manager', 'field_officer']}>
                  <Layout>
                    <BatchOrderCreate />
                  </Layout>
                </ProtectedRoute>
              </Route>
              
              <Route path="/batch-orders/:id">
                <ProtectedRoute allowedRoles={['manager', 'field_officer']}>
                  <Layout>
                    <BatchOrderDetail />
                  </Layout>
                </ProtectedRoute>
              </Route>
            </>
          )}
          
          <Route path="/supplier">
            <ProtectedRoute allowedRoles={['manager', 'field_officer']}>
              <Layout>
                <SupplierDashboard />
              </Layout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/supplier/inventory">
            <ProtectedRoute allowedRoles={['manager', 'field_officer']}>
              <Layout>
                <SupplierInventory />
              </Layout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/supplier/deliveries">
            <ProtectedRoute allowedRoles={['manager', 'field_officer']}>
              <Layout>
                <SupplierDeliveries />
              </Layout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/supplier/audit-log">
            <ProtectedRoute allowedRoles={['manager', 'field_officer']}>
              <Layout>
                <AuditLog />
              </Layout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/supplier/audit-archive">
            <ProtectedRoute allowedRoles={['manager', 'field_officer']}>
              <Layout>
                <AuditArchive />
              </Layout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/supplier/retention-settings">
            <ProtectedRoute allowedRoles={['manager']}>
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
            <ProtectedRoute allowedRoles={['manager']}>
              <Layout>
                <PermissionApproval />
              </Layout>
            </ProtectedRoute>
          </Route>
          
          <Route path="/admin/csv-upload">
            <ProtectedRoute allowedRoles={['manager', 'field_officer']}>
              <Layout>
                <AdminCsvUpload />
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
        </>
      )}
      
      <Route path="/404" component={NotFound} />
      
      {/* Catch-all route: redirect to /kaani in Lite Mode, 404 in Full Mode */}
      {IS_LITE_MODE ? (
        <Route>
          <Redirect to="/kaani" />
        </Route>
      ) : (
        <Route component={NotFound} />
      )}
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
