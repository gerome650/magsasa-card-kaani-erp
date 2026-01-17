import { useState, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  Users,
  TrendingDown,
  ShoppingCart,
  Menu,
  X,
  Leaf,
  Wheat,
  LogOut,
  MessageCircle,
  Package,
  Truck,
  Box,
  FileText,
  Shield,
  MapPin,
  BarChart3,
  Map
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPendingRequestsCount } from '@/data/permissionRequestsData';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const pendingRequestsCount = getPendingRequestsCount();

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'farmer': return 'Farmer';
      case 'field_officer': return 'Field Officer';
      case 'manager': return 'Manager';
      case 'supplier': return 'Supplier';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'farmer': return 'bg-blue-100 text-blue-700';
      case 'field_officer': return 'bg-green-100 text-green-700';
      case 'manager': return 'bg-purple-100 text-purple-700';
      case 'supplier': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['farmer', 'manager', 'field_officer'] },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['manager', 'field_officer'] },
    { name: 'Map View', href: '/map', icon: Map, roles: ['manager', 'field_officer'] },
    { name: 'Orders', href: '/supplier', icon: Package, roles: ['supplier'] },
    { name: 'Inventory', href: '/supplier/inventory', icon: Box, roles: ['supplier'] },
    { name: 'Deliveries', href: '/supplier/deliveries', icon: Truck, roles: ['supplier'] },
    { name: 'Audit Log', href: '/supplier/audit-log', icon: FileText, roles: ['supplier'] },
    { name: 'Permission Approval', href: '/permission-approval', icon: Shield, roles: ['manager'] },
    { name: 'My Requests', href: '/my-requests', icon: FileText, roles: ['farmer', 'field_officer', 'supplier'] },
    { name: 'Farmers', href: '/farmers', icon: Users, roles: ['manager', 'field_officer'] },
    { name: 'Farms', href: '/farms', icon: MapPin, roles: ['manager', 'field_officer'] },
    { name: 'Harvest Tracking', href: '/harvest-tracking', icon: Wheat, roles: ['manager', 'field_officer'] },
    { name: 'Price Comparison', href: '/price-comparison', icon: TrendingDown, roles: ['farmer', 'manager', 'field_officer'] },
    { name: 'Order Calculator', href: '/order-calculator', icon: ShoppingCart, roles: ['farmer', 'manager', 'field_officer'] },
    ...(import.meta.env.VITE_BATCH_ORDERS_ENABLED === 'true' ? [{ name: 'Batch Orders', href: '/batch-orders', icon: Package, roles: ['manager', 'field_officer'] }] : []),
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingCart, roles: ['farmer'] },
    { name: 'Order History', href: '/orders', icon: Package, roles: ['farmer'] },
    { name: 'Ask KaAni', href: '/kaani', icon: MessageCircle },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location === '/';
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm">MAGSASA-CARD</h1>
              <p className="text-xs text-muted-foreground">Enhanced Platform</p>
            </div>
          </div>
          
          {/* KaAni AI Button - Centered */}
          <Link href="/kaani">
            <Button
              variant="ghost"
              size="sm"
              className="bg-black hover:bg-gray-800 text-white rounded-full px-4 py-2"
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              <span className="text-xs font-medium">KaAni</span>
            </Button>
          </Link>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t bg-white">
            {navigation.filter(item => !item.roles || item.roles.includes(user?.role || '')).map((item) => {
              const Icon = item.icon;
              const showBadge = item.href === '/permission-approval' && pendingRequestsCount > 0;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 border-b ${
                    isActive(item.href)
                      ? 'bg-green-50 text-green-600 border-l-4 border-l-green-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                  {showBadge && (
                    <Badge className="ml-auto bg-red-500 text-white animate-pulse">
                      {pendingRequestsCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold">MAGSASA-CARD</h1>
              <p className="text-xs text-muted-foreground">Enhanced Platform</p>
            </div>
          </div>
          
          {/* KaAni AI Quick Access */}
          <div className="px-4 py-4 border-b">
            <Link href="/kaani">
              <Button
                variant="ghost"
                className="w-full justify-start bg-black hover:bg-gray-800 text-white rounded-full px-4 py-2.5"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Ask KaAni AI</span>
              </Button>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.filter(item => !item.roles || item.roles.includes(user?.role || '')).map((item) => {
              const Icon = item.icon;
              const showBadge = item.href === '/permission-approval' && pendingRequestsCount > 0;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                  {showBadge && (
                    <Badge className="ml-auto bg-red-500 text-white hover:bg-red-600 animate-pulse">
                      {pendingRequestsCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="px-6 py-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-sm font-bold text-green-600">
                  {user ? getUserInitials(user.name) : 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${user ? getRoleBadgeColor(user.role) : 'bg-gray-100'}`}>
                  {user ? getRoleDisplay(user.role) : 'Guest'}
                </span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="py-6 px-4 sm:px-6 lg:px-8 mt-16 lg:mt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
