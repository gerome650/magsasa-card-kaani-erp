import { useState } from 'react';
import { products, categories, getProductsByCategory, searchProducts } from '@/data/productsData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { Search, ShoppingCart, Package, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function Marketplace() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart, getCartItemCount } = useCart();

  // Filter products based on category and search query
  const filteredProducts = searchQuery
    ? searchProducts(searchQuery)
    : getProductsByCategory(selectedCategory);

  const handleAddToCart = (product: any) => {
    addToCart(product, 1);
    toast.success(`Added ${product.name} to cart`);
  };

  const cartItemCount = getCartItemCount();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white py-8">
        <div className="container">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Agricultural Marketplace</h1>
              <p className="text-green-100">Browse and purchase agricultural inputs using your approved loans</p>
            </div>
            <Button
              variant="outline"
              className="bg-white text-green-600 hover:bg-green-50 relative"
              onClick={() => window.location.href = '/cart'}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              View Cart
              {cartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-1 text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search for seeds, fertilizers, tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-lg"
            />
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedCategory(category);
                  setSearchQuery('');
                }}
                className={selectedCategory === category ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Info Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex items-start gap-3">
          <Info className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-800">
            Products sourced directly from verified suppliers with CARD MRI-negotiated pricing.
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-300" />
                  </div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription>{product.brand}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant="secondary">{product.category}</Badge>
                    {product.cardMriNegotiated && (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        CARD MRI Price
                      </Badge>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                    {product.composition && (
                      <p className="text-xs text-gray-500 font-mono">{product.composition}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <div className="w-full">
                    <div className="text-2xl font-bold text-green-600">
                      ₱{product.priceMin.toLocaleString()}
                      {product.priceMax && ` - ₱${product.priceMax.toLocaleString()}`}
                    </div>
                    <div className="text-sm text-gray-500">{product.unit}</div>
                  </div>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.inStock}
                  >
                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
