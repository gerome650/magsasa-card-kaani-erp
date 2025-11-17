import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, CreditCard, Wallet, ArrowLeft, Package } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { cart, getCartTotal, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const [paymentMethod, setPaymentMethod] = useState('loan');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderId, setOrderId] = useState('');

  const cartTotal = getCartTotal();
  
  // Mock farmer loan data (in real app, fetch from API)
  const farmerLoan = {
    approvedAmount: 50000,
    usedAmount: 20000,
    remainingBalance: 30000,
  };

  const canUseLoan = cartTotal <= farmerLoan.remainingBalance;

  const handlePlaceOrder = () => {
    if (!deliveryAddress.trim()) {
      toast.error('Please enter your delivery address');
      return;
    }

    if (!contactNumber.trim()) {
      toast.error('Please enter your contact number');
      return;
    }

    if (paymentMethod === 'loan' && !canUseLoan) {
      toast.error('Insufficient loan balance');
      return;
    }

    setIsProcessing(true);

    // Simulate order processing
    setTimeout(() => {
      const newOrderId = `ORD-${Date.now().toString().slice(-8)}`;
      setOrderId(newOrderId);
      setOrderConfirmed(true);
      setIsProcessing(false);
      
      toast.success('Order placed successfully!');
      
      // Clear cart after successful order
      clearCart();
    }, 2000);
  };

  if (cart.length === 0 && !orderConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container py-8">
          <div className="text-center py-16">
            <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add some products to proceed with checkout</p>
            <Link href="/marketplace">
              <Button className="bg-green-600 hover:bg-green-700">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4">
                  <CheckCircle2 className="h-24 w-24 text-green-600" />
                </div>
                <CardTitle className="text-3xl mb-2">Order Confirmed!</CardTitle>
                <CardDescription className="text-lg">
                  Your order has been successfully placed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <p className="text-sm text-gray-600 mb-2">Order ID</p>
                  <p className="text-2xl font-bold text-green-600">{orderId}</p>
                </div>

                <div className="text-left space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Delivery Address</p>
                    <p className="font-semibold">{deliveryAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contact Number</p>
                    <p className="font-semibold">{contactNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-semibold">
                      {paymentMethod === 'loan' ? 'Loan Balance' : 'Cash on Delivery'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-green-600">₱{cartTotal.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    📦 Your order will be processed and delivered within 3-5 business days. 
                    You will receive updates via SMS.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex gap-4">
                <Link href="/marketplace" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Back to Dashboard
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <Link href="/cart">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Delivery Address *</Label>
                  <Input
                    id="address"
                    placeholder="Enter your complete delivery address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="contact">Contact Number *</Label>
                  <Input
                    id="contact"
                    placeholder="e.g., 09171234567"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-4">
                    {/* Loan Balance Option */}
                    <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 ${
                      paymentMethod === 'loan' ? 'border-green-600 bg-green-50' : 'border-gray-200'
                    }`}>
                      <RadioGroupItem value="loan" id="loan" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="loan" className="flex items-center gap-2 cursor-pointer">
                          <Wallet className="h-5 w-5 text-green-600" />
                          <span className="font-semibold">Use Loan Balance</span>
                        </Label>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600">
                            Available Balance: <span className="font-bold text-green-600">
                              ₱{farmerLoan.remainingBalance.toLocaleString()}
                            </span>
                          </p>
                          {!canUseLoan && (
                            <p className="text-sm text-red-600 font-semibold">
                              ⚠️ Insufficient balance for this purchase
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cash on Delivery Option */}
                    <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 ${
                      paymentMethod === 'cod' ? 'border-green-600 bg-green-50' : 'border-gray-200'
                    }`}>
                      <RadioGroupItem value="cod" id="cod" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer">
                          <CreditCard className="h-5 w-5 text-green-600" />
                          <span className="font-semibold">Cash on Delivery</span>
                        </Label>
                        <p className="text-sm text-gray-600 mt-2">
                          Pay when you receive your order
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item) => {
                    const price = item.product.priceMax || item.product.priceMin;
                    return (
                      <div key={item.product.id} className="flex justify-between text-sm">
                        <div className="flex-1">
                          <p className="font-semibold">{item.product.name}</p>
                          <p className="text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">₱{(price * item.quantity).toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">₱{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-600">₱{cartTotal.toLocaleString()}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || (paymentMethod === 'loan' && !canUseLoan)}
                >
                  {isProcessing ? 'Processing...' : 'Place Order'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
