import { useState } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Marketplace v0 - Input Catalog + Price Lists (Read-Only)
 * 
 * Feature flag: Only rendered if VITE_MARKETPLACE_ENABLED=true
 */
export default function Marketplace() {
  // Check feature flag
  const isEnabled = import.meta.env.VITE_MARKETPLACE_ENABLED === "true";

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Fetch products with prices
  const productsQuery = trpc.marketplace.listActivePricedProducts.useQuery({
    q: searchQuery || undefined,
    category: selectedCategory || undefined,
  });

  // Fetch categories
  const categoriesQuery = trpc.marketplace.listProducts.useQuery({});
  const categories = Array.from(
    new Set(
      categoriesQuery.data
        ?.map((p) => p.category)
        .filter((cat): cat is string => cat !== null && cat !== undefined) || []
    )
  ).sort();

  if (!isEnabled) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
          <p className="text-yellow-800">
            Marketplace feature is not enabled. Set VITE_MARKETPLACE_ENABLED=true
            to enable.
          </p>
        </div>
      </div>
    );
  }

  const isLoading = productsQuery.isLoading;
  const error = productsQuery.error;
  const data = productsQuery.data;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Marketplace - Input Catalog</h1>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Search products..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">
            Error: {error.message || "Failed to load products"}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">Loading products...</p>
        </div>
      )}

      {/* No Price List State */}
      {!isLoading && !error && data && !data.priceList && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <p className="text-yellow-800">
            No active price list available. Products are shown without prices.
          </p>
        </div>
      )}

      {/* Products List */}
      {!isLoading && !error && data && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {data.priceList && (
            <div className="mb-4 pb-4 border-b">
              <h2 className="text-lg font-semibold">
                Price List: {data.priceList.name}
              </h2>
              <p className="text-sm text-gray-600">
                Code: {data.priceList.priceListCode}
              </p>
            </div>
          )}

          {data.products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No products found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.products.map((product: any) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          {product.description && (
                            <div className="text-sm text-gray-500">
                              {product.description}
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            Code: {product.productCode}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {product.category || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {product.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.price !== null ? (
                          <span className="text-sm font-medium text-gray-900">
                            {product.currency || "PHP"}{" "}
                            {Number(product.price).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            {product.priceUnit && ` / ${product.priceUnit}`}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
