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

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      
      {/* Protected routes */}
      <Route path="/">
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
          <Layout>
            <KaAniChat />
          </Layout>
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
