/**
 * Pricing API Service
 * Handles all API calls to the Flask backend for dynamic pricing and order processing
 */

const API_BASE_URL = 'https://5000-i5h2pc37yq9g6wgknihl5-662933b1.manus-asia.computer/api';

export interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  unit: string;
  brand: string;
  supplier: {
    id: number;
    name: string;
  };
  pricing: {
    wholesale_price: number;
    platform_price: number;
    card_member_price: number;
    retail_price: number;
    market_average_price: number;
    competitor_price: number;
  };
  savings: {
    market_savings: number;
    market_savings_percent: number;
    card_savings: number;
    card_savings_percent: number;
  };
  effective_date: string;
  region: string;
}

export interface OrderItem {
  product_id: number;
  quantity: number;
}

export interface OrderCalculation {
  items: Array<{
    product_id: number;
    product_name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    subtotal: number;
  }>;
  subtotal: number;
  delivery: {
    method: string;
    name: string;
    total_fee: number;
    estimated_days: number;
  };
  delivery_fee: number;
  discount_amount: number;
  total_amount: number;
  is_card_member: boolean;
}

export interface DeliveryOption {
  code: string;
  name: string;
  description: string;
  base_fee: number;
  per_km_fee: number;
  total_fee: number;
  estimated_days: number;
  features: string[];
}

class PricingAPIService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch all products with optional filtering
   */
  async getProducts(category?: string, search?: string): Promise<Product[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const url = `${this.baseUrl}/pricing/products${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<Array<{ name: string; count: number }>> {
    try {
      const response = await fetch(`${this.baseUrl}/pricing/categories`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Compare prices for multiple products
   */
  async comparePrices(productIds: number[], isCardMember: boolean = false) {
    try {
      const response = await fetch(`${this.baseUrl}/pricing/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_ids: productIds,
          is_card_member: isCardMember,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error comparing prices:', error);
      throw error;
    }
  }

  /**
   * Calculate order total
   */
  async calculateOrder(
    items: OrderItem[],
    isCardMember: boolean,
    deliveryMethod: string,
    distanceKm: number = 0
  ): Promise<OrderCalculation> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          is_card_member: isCardMember,
          delivery_method: deliveryMethod,
          distance_km: distanceKm,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.calculation;
    } catch (error) {
      console.error('Error calculating order:', error);
      throw error;
    }
  }

  /**
   * Get delivery options
   */
  async getDeliveryOptions(distanceKm: number = 0): Promise<DeliveryOption[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/orders/delivery-options?distance_km=${distanceKm}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.options || [];
    } catch (error) {
      console.error('Error fetching delivery options:', error);
      throw error;
    }
  }

  /**
   * Get market analysis
   */
  async getMarketAnalysis(category?: string) {
    try {
      const url = category
        ? `${this.baseUrl}/pricing/market-analysis?category=${category}`
        : `${this.baseUrl}/pricing/market-analysis`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching market analysis:', error);
      throw error;
    }
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api', '')}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const pricingAPI = new PricingAPIService();
export default pricingAPI;
