import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, TrendingDown, Package, Search, Filter } from 'lucide-react';
import { pricingAPI, type Product } from '@/services/pricingAPI';
import { toast } from 'sonner';

export default function PriceComparison() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCardMember, setIsCardMember] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const categories = ['fertilizer', 'seed', 'pesticide', 'equipment'];

  useEffect(() => {
    checkAPIStatus();
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const checkAPIStatus = async () => {
    setApiStatus('checking');
    const isOnline = await pricingAPI.checkHealth();
    setApiStatus(isOnline ? 'online' : 'offline');
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await pricingAPI.getProducts(
        selectedCategory || undefined,
        searchQuery || undefined
      );
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load products. Please try again.');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (product: Product) => {
    return isCardMember
      ? product.pricing.card_member_price
      : product.pricing.platform_price;
  };

  const getSavings = (product: Product) => {
    const price = getPrice(product);
    const savings = product.pricing.retail_price - price;
    const percent = (savings / product.pricing.retail_price) * 100;
    return { amount: savings, percent };
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agricultural Input Prices</h1>
          <p className="text-muted-foreground mt-1">
            Compare prices and save on quality agricultural products
          </p>
        </div>
        
        {/* API Status */}
        <Badge variant={apiStatus === 'online' ? 'default' : 'secondary'}>
          {apiStatus === 'checking' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          {apiStatus === 'online' ? '🟢 Live Data' : '🔴 Offline'}
        </Badge>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('')}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Button>
              ))}
            </div>

            {/* CARD Member Toggle */}
            <div className="flex items-center justify-end space-x-2">
              <Switch
                id="card-member"
                checked={isCardMember}
                onCheckedChange={setIsCardMember}
              />
              <Label htmlFor="card-member" className="cursor-pointer">
                CARD Member (3% discount)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No products found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const price = getPrice(product);
            const savings = getSavings(product);
            
            return (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {product.brand} • {product.unit}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{product.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pricing */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">
                        ₱{price.toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        ₱{product.pricing.retail_price.toFixed(2)}
                      </span>
                    </div>
                    {isCardMember && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Regular: ₱{product.pricing.platform_price.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Savings Badge */}
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        Save ₱{savings.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {savings.percent.toFixed(1)}% off retail price
                      </p>
                    </div>
                  </div>

                  {/* Supplier */}
                  <div className="text-sm text-muted-foreground">
                    Supplier: {product.supplier.name}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>

                  {/* Add to Order Button */}
                  <Button className="w-full" variant="outline">
                    Add to Order
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Potential Savings</CardTitle>
            <CardDescription>
              Based on {products.length} products shown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Average Savings</p>
                <p className="text-2xl font-bold text-green-600">
                  {(
                    products.reduce((sum, p) => sum + getSavings(p).percent, 0) /
                    products.length
                  ).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Status</p>
                <p className="text-2xl font-bold">
                  {isCardMember ? 'CARD Member' : 'Regular'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
