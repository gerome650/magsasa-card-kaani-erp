import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useCart } from '@/contexts/CartContext';
import { useLocation } from 'wouter';
import {
  getOrdersByFarmerId,
  getOrderStatusLabel,
  getOrderStatusColor,
  Order,
  OrderItem
} from '@/data/ordersData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Package,
  Calendar,
  MapPin,
  Phone,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Clock,
  CheckCircle2,
  Truck,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function OrderHistory() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [, setLocation] = useLocation();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Get orders for current farmer
  // Convert user.id to string for compatibility
  const orders = user ? getOrdersByFarmerId(String(user.id)) : [];

  const handleReorder = (order: Order) => {
    // Add all items from the order to the cart
    order.items.forEach(item => {
      addToCart(item.product);
    });
    
    toast.success(`${order.items.length} item(s) added to cart!`, {
      description: 'Ready to checkout',
      action: {
        label: 'View Cart',
        onClick: () => setLocation('/cart')
      }
    });
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'processing':
        return <Package className="w-5 h-5" />;
      case 'in_transit':
        return <Truck className="w-5 h-5" />;
      case 'delivered':
      case 'completed':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please log in to view your order history.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
          <p className="text-gray-600">
            Track your orders and view delivery status
          </p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">
              Start shopping in the marketplace to place your first order
            </p>
            <Button onClick={() => setLocation('/marketplace')}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Go to Marketplace
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order.orderId} className="overflow-hidden">
                {/* Order Header */}
                <div className="p-6 bg-white border-b">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {order.orderId}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getOrderStatusColor(order.status)}`}
                        >
                          {getStatusIcon(order.status)}
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.orderDate)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Package className="w-4 h-4" />
                          {order.items.length} item(s)
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        ₱{order.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {order.paymentMethod === 'loan' ? 'Paid with Loan' : 'Cash on Delivery'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleOrderDetails(order.orderId)}
                    >
                      {expandedOrderId === order.orderId ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          View Details
                        </>
                      )}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleReorder(order)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Reorder
                    </Button>
                  </div>
                </div>

                {/* Expanded Order Details */}
                {expandedOrderId === order.orderId && (
                  <div className="p-6 bg-gray-50 border-t">
                    {/* Order Items */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                      <div className="space-y-3">
                        {order.items.map((item: OrderItem, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.product.name}</p>
                              <p className="text-sm text-gray-600">
                                {item.product.brand} • {item.product.unit}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                {item.quantity} × ₱{item.priceAtPurchase.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600">
                                ₱{(item.quantity * item.priceAtPurchase).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Information */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Delivery Address</h4>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{order.deliveryAddress}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{order.contactNumber}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Payment Method</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CreditCard className="w-4 h-4" />
                          <span>
                            {order.paymentMethod === 'loan'
                              ? 'Loan Balance'
                              : 'Cash on Delivery'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order Timeline */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Order Timeline</h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Order Placed</p>
                            <p className="text-sm text-gray-600">{formatDate(order.orderDate)}</p>
                          </div>
                        </div>
                        {order.processedDate && (
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Order Processed</p>
                              <p className="text-sm text-gray-600">
                                {formatDate(order.processedDate)}
                              </p>
                            </div>
                          </div>
                        )}
                        {order.shippedDate && (
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Order Shipped</p>
                              <p className="text-sm text-gray-600">
                                {formatDate(order.shippedDate)}
                              </p>
                            </div>
                          </div>
                        )}
                        {order.deliveredDate && (
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Order Delivered</p>
                              <p className="text-sm text-gray-600">
                                {formatDate(order.deliveredDate)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-900">
                          <span className="font-medium">Note:</span> {order.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
