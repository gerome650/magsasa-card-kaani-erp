import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
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
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
