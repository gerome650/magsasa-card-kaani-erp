import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  suppliers,
  supplierProducts,
  getSupplierProducts,
  SupplierProduct
} from "@/data/supplierData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Plus,
  TrendingDown,
  Search,
  TrendingUp
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import BulkInventoryUpdate from "@/components/BulkInventoryUpdate";
import { toast } from "sonner";
import { addAuditLog } from "@/data/auditLogData";

export default function SupplierInventory() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<SupplierProduct | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newStockLevel, setNewStockLevel] = useState<number>(0);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  // For demo, use first supplier (Atlas Fertilizer)
  const supplier = suppliers[0];
  const products = getSupplierProducts(supplier.id);

  // Filter products by search
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate inventory metrics
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stockStatus === 'low-stock').length;
  const outOfStockProducts = products.filter(p => p.stockStatus === 'out-of-stock').length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.stockLevel * p.unitPrice), 0);

  // Stock status configuration
  const stockStatusConfig = {
    'in-stock': { label: 'In Stock', color: 'bg-green-500', icon: CheckCircle2 },
    'low-stock': { label: 'Low Stock', color: 'bg-yellow-500', icon: AlertTriangle },
    'out-of-stock': { label: 'Out of Stock', color: 'bg-red-500', icon: AlertTriangle }
  };

  // Selection handlers
  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const clearSelection = () => setSelectedProducts(new Set());

  // Handlers
  const handleUpdateStock = (product: SupplierProduct) => {
    setSelectedProduct(product);
    setNewStockLevel(product.stockLevel);
    setUpdateDialogOpen(true);
  };

  const handleSaveStock = () => {
    if (!selectedProduct) return;

    toast.success("Stock updated!", {
      description: `${selectedProduct.name} stock level updated to ${newStockLevel} ${selectedProduct.unit}`
    });
    setUpdateDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleAddProduct = () => {
    toast.info("Opening add product form");
  };

  const handleBulkUpdate = () => {
    setBulkDialogOpen(true);
  };

  const handleBulkUpdateComplete = () => {
    clearSelection();
  };

  const getSelectedProductsData = () => {
    return products.filter(p => selectedProducts.has(p.id));
  };

  // Check if user is supplier
  const isSupplier = user?.role === 'supplier';

  if (!isSupplier) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Supplier Access Only</h2>
            <p className="text-muted-foreground mb-6">
              This portal is only accessible to registered suppliers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your product stock levels and availability
          </p>
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" />
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active SKUs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{lowStockProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Need restocking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{outOfStockProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unavailable items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" />
              Stock Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₱{(totalStockValue / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total inventory value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedProducts.size > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <span className="font-semibold">
                  {selectedProducts.size} products selected
                </span>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleBulkUpdate}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Bulk Update Stock
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Products</h2>
        {filteredProducts.length > 0 && (
          <Button variant="outline" size="sm" onClick={toggleSelectAll}>
            {selectedProducts.size === filteredProducts.length ? 'Deselect All' : 'Select All'}
          </Button>
        )}
      </div>
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? `No products match "${searchQuery}"`
                  : 'Add your first product to get started'
                }
              </p>
              {!searchQuery && (
                <Button onClick={handleAddProduct}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map((product) => {
            const status = stockStatusConfig[product.stockStatus];
            const StatusIcon = status.icon;
            const stockPercentage = Math.round((product.stockLevel / (product.reorderPoint * 3)) * 100);
            const isSelected = selectedProducts.has(product.id);

            return (
              <Card key={product.id} className={`hover:shadow-lg transition-all ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : ''
              }`}>
                <CardContent className="pt-6">
                  <div className="flex gap-4 mb-4">
                    <div className="flex items-start pt-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleProduct(product.id)}
                      />
                    </div>
                    <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-muted-foreground">
                          {product.sku}
                        </span>
                        <Badge className={`${status.color} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Stock</p>
                      <p className="text-2xl font-bold">
                        {product.stockLevel}
                      </p>
                      <p className="text-xs text-muted-foreground">{product.unit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reorder Point</p>
                      <p className="text-lg font-semibold">
                        {product.reorderPoint}
                      </p>
                      <p className="text-xs text-muted-foreground">{product.unit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unit Price</p>
                      <p className="text-lg font-semibold">
                        ₱{product.unitPrice.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">per {product.unit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">MOQ</p>
                      <p className="text-lg font-semibold">
                        {product.moq}
                      </p>
                      <p className="text-xs text-muted-foreground">{product.unit}</p>
                    </div>
                  </div>

                  {/* Stock Level Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Stock Level</span>
                      <span className={
                        product.stockStatus === 'low-stock' ? 'text-yellow-600' :
                        product.stockStatus === 'out-of-stock' ? 'text-red-600' :
                        'text-green-600'
                      }>
                        {stockPercentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          product.stockStatus === 'low-stock' ? 'bg-yellow-500' :
                          product.stockStatus === 'out-of-stock' ? 'bg-red-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>
                      Last restocked: {new Date(product.lastRestocked).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <span>
                      Stock value: ₱{(product.stockLevel * product.unitPrice).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleUpdateStock(product)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Update Stock
                    </Button>
                    <Button variant="outline">
                      View History
                    </Button>
                  </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Update Stock Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock Level</DialogTitle>
            <DialogDescription>
              Update the current stock level for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="current-stock">Current Stock</Label>
              <div className="text-2xl font-bold">
                {selectedProduct?.stockLevel} {selectedProduct?.unit}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-stock">New Stock Level *</Label>
              <Input
                id="new-stock"
                type="number"
                min="0"
                value={newStockLevel}
                onChange={(e) => setNewStockLevel(parseInt(e.target.value) || 0)}
                placeholder="Enter new stock level"
              />
              <p className="text-xs text-muted-foreground">
                Reorder point: {selectedProduct?.reorderPoint} {selectedProduct?.unit}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setUpdateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveStock}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Inventory Update Dialog */}
      <BulkInventoryUpdate
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedProducts={getSelectedProductsData()}
        onUpdate={handleBulkUpdateComplete}
        onAuditLog={(updateType, value, unit) => {
          const count = selectedProducts.size;
          const selectedProductsList = Array.from(selectedProducts);
          
          addAuditLog({
            userId: user?.id || 'supplier-001',
            userName: user?.name || 'Maria Santos',
            userRole: user?.role || 'supplier',
            actionType: 'bulk_inventory_update',
            actionDescription: `${updateType === 'set' ? 'Set stock to' : updateType === 'increase' ? 'Increased stock by' : 'Decreased stock by'} ${value}${unit === 'percentage' ? '%' : ' units'} for ${count} products`,
            affectedItemsCount: count,
            affectedItems: selectedProductsList,
            details: {
              updateType,
              value,
              unit
            },
            category: 'inventory'
          });
        }}
      />
    </div>
  );
}
