import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { productsData, type SimpleProduct } from '@/services/demoData';

interface CartItem extends SimpleProduct {
  quantity: number;
}

export default function OrderCalculator() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCardMember, setIsCardMember] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [approvedBudget, setApprovedBudget] = useState<string | null>(null);

  // Load approved budget from localStorage (demo feature)
  useEffect(() => {
    const budget = localStorage.getItem('kaaniApprovedBudget');
    if (budget) {
      setApprovedBudget(budget);
    }
  }, []);

  const categories = ['all', 'fertilizer', 'seed', 'pesticide', 'equipment'];

  const filteredProducts = selectedCategory === 'all' 
    ? productsData 
    : productsData.filter(p => p.category === selectedCategory);

  const addToCart = (product: SimpleProduct) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, change: number) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => {
      const price = isCardMember ? item.card_member_price : item.platform_price;
      return sum + (price * item.quantity);
    }, 0);

    const savings = cart.reduce((sum, item) => {
      const regularPrice = item.retail_price * item.quantity;
      const discountedPrice = (isCardMember ? item.card_member_price : item.platform_price) * item.quantity;
      return sum + (regularPrice - discountedPrice);
    }, 0);

    return { subtotal, savings };
  };

  const { subtotal, savings } = calculateTotal();
  const savingsPercentage = subtotal > 0 ? ((savings / (subtotal + savings)) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Order Calculator</h1>
            {approvedBudget && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Approved: ₱{parseInt(approvedBudget).toLocaleString()}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">Calculate your order total with real-time pricing</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">CARD Member</span>
          <button
            onClick={() => setIsCardMember(!isCardMember)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isCardMember ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isCardMember ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Products */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Available Products</h2>
            
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Products List */}
            <div className="space-y-3">
              {filteredProducts.map(product => {
                const price = isCardMember ? product.card_member_price : product.platform_price;
                const savings = product.retail_price - price;
                const savingsPercent = ((savings / product.retail_price) * 100).toFixed(1);

                return (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-green-600 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.supplier}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-lg font-bold text-green-600">₱{price.toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground line-through">₱{product.retail_price.toFixed(2)}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                          Save {savingsPercent}%
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => addToCart(product)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Shopping Cart */}
        <div className="space-y-4">
          <Card className="p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold">Shopping Cart ({cart.length} items)</h2>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
                <p className="text-sm text-muted-foreground mt-1">Add products to calculate your order</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                  {cart.map(item => {
                    const price = isCardMember ? item.card_member_price : item.platform_price;
                    const itemTotal = price * item.quantity;

                    return (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-xs text-muted-foreground">{item.unit}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-100"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-100"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-semibold">₱{itemTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Member Status</span>
                    <span className="font-medium">{isCardMember ? 'CARD Member' : 'Regular'}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Savings</span>
                    <span className="font-semibold text-green-600">₱{savings.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Savings Percentage</span>
                    <span className="font-semibold text-green-600">{savingsPercentage}%</span>
                  </div>

                  <div className="flex items-center justify-between text-lg font-bold pt-3 border-t">
                    <span>Total</span>
                    <span className="text-green-600">₱{subtotal.toFixed(2)}</span>
                  </div>

                  {isCardMember && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-800">
                        🎉 You're saving an extra 3% as a CARD member!
                      </p>
                    </div>
                  )}

                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Proceed to Checkout
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
