/**
 * Demo Data for Price Comparison Interface
 * Used as fallback when backend API is unavailable
 */

import type { Product, DeliveryOption } from './pricingAPI';

// Simplified product type for easy consumption
export interface SimpleProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  supplier: string;
  retail_price: number;
  platform_price: number;
  card_member_price: number;
  savings_percent: number;
}

export const productsData: SimpleProduct[] = [
  // Fertilizers
  {
    id: 'P001',
    name: 'Complete Fertilizer 14-14-14',
    category: 'fertilizer',
    description: 'Balanced NPK fertilizer for general crop use',
    unit: 'bag (50kg)',
    supplier: 'Atlas Fertilizer Corporation',
    retail_price: 1500.0,
    platform_price: 1350.0,
    card_member_price: 1309.5,
    savings_percent: 10.0
  },
  {
    id: 'P002',
    name: 'Urea Fertilizer 46-0-0',
    category: 'fertilizer',
    description: 'High nitrogen fertilizer for vegetative growth',
    unit: 'bag (50kg)',
    supplier: 'Atlas Fertilizer Corporation',
    retail_price: 1400.0,
    platform_price: 1250.0,
    card_member_price: 1212.5,
    savings_percent: 10.71
  },
  {
    id: 'P003',
    name: 'Organic Compost',
    category: 'fertilizer',
    description: 'Natural organic fertilizer from composted materials',
    unit: 'bag (25kg)',
    supplier: 'Local Agri Supply Co.',
    retail_price: 450.0,
    platform_price: 350.0,
    card_member_price: 339.5,
    savings_percent: 22.22
  },

  // Seeds
  {
    id: 'P004',
    name: 'Hybrid Rice Seeds - RC222',
    category: 'seed',
    description: 'High-yielding hybrid rice variety',
    unit: 'kg',
    supplier: 'East-West Seed Company',
    retail_price: 250.0,
    platform_price: 200.0,
    card_member_price: 194.0,
    savings_percent: 20.0
  },
  {
    id: 'P005',
    name: 'Corn Seeds - Pioneer 30G88',
    category: 'seed',
    description: 'Drought-resistant corn hybrid',
    unit: 'kg',
    supplier: 'East-West Seed Company',
    retail_price: 480.0,
    platform_price: 400.0,
    card_member_price: 388.0,
    savings_percent: 16.67
  },
  {
    id: 'P006',
    name: 'Tomato Seeds - Diamante Max',
    category: 'seed',
    description: 'Disease-resistant tomato variety',
    unit: 'packet (10g)',
    supplier: 'East-West Seed Company',
    retail_price: 600.0,
    platform_price: 500.0,
    card_member_price: 485.0,
    savings_percent: 16.67
  },

  // Pesticides
  {
    id: 'P007',
    name: 'Insecticide - Decis 2.5EC',
    category: 'pesticide',
    description: 'Broad-spectrum insecticide',
    unit: 'liter',
    supplier: 'Bayer CropScience Philippines',
    retail_price: 1100.0,
    platform_price: 900.0,
    card_member_price: 873.0,
    savings_percent: 18.18
  },
  {
    id: 'P008',
    name: 'Fungicide - Score 250EC',
    category: 'pesticide',
    description: 'Systemic fungicide for disease control',
    unit: 'liter',
    supplier: 'Bayer CropScience Philippines',
    retail_price: 1600.0,
    platform_price: 1350.0,
    card_member_price: 1309.5,
    savings_percent: 15.63
  },
  {
    id: 'P009',
    name: 'Herbicide - Roundup',
    category: 'pesticide',
    description: 'Non-selective herbicide for weed control',
    unit: 'liter',
    supplier: 'Bayer CropScience Philippines',
    retail_price: 850.0,
    platform_price: 700.0,
    card_member_price: 679.0,
    savings_percent: 17.65
  },

  // Equipment
  {
    id: 'P010',
    name: 'Hand Sprayer - 16L Knapsack',
    category: 'equipment',
    description: 'Manual backpack sprayer for pesticide application',
    unit: 'piece',
    supplier: 'Local Agri Supply Co.',
    retail_price: 2000.0,
    platform_price: 1700.0,
    card_member_price: 1649.0,
    savings_percent: 15.0
  },
  {
    id: 'P011',
    name: 'Garden Hoe',
    category: 'equipment',
    description: 'Heavy-duty garden hoe for soil cultivation',
    unit: 'piece',
    supplier: 'Local Agri Supply Co.',
    retail_price: 400.0,
    platform_price: 300.0,
    card_member_price: 291.0,
    savings_percent: 25.0
  },
  {
    id: 'P012',
    name: 'Irrigation Timer',
    category: 'equipment',
    description: 'Automatic irrigation timer for water management',
    unit: 'piece',
    supplier: 'Local Agri Supply Co.',
    retail_price: 1200.0,
    platform_price: 950.0,
    card_member_price: 921.5,
    savings_percent: 20.83
  },
];

// Original demo products for PriceComparison component
export const demoProducts: Product[] = [
  // Fertilizers
  {
    id: 1,
    name: 'Complete Fertilizer 14-14-14',
    category: 'fertilizer',
    description: 'Balanced NPK fertilizer for general crop use',
    unit: 'bag (50kg)',
    brand: 'Atlas',
    supplier: {
      id: 1,
      name: 'Atlas Fertilizer Corporation',
    },
    pricing: {
      wholesale_price: 1200.0,
      platform_price: 1350.0,
      card_member_price: 1309.5,
      retail_price: 1500.0,
      market_average_price: 1425.0,
      competitor_price: 1425.0,
    },
    savings: {
      market_savings: 150.0,
      market_savings_percent: 10.0,
      card_savings: 40.5,
      card_savings_percent: 3.0,
    },
    effective_date: new Date().toISOString(),
    region: 'National',
  },
  {
    id: 2,
    name: 'Urea Fertilizer 46-0-0',
    category: 'fertilizer',
    description: 'High nitrogen fertilizer for vegetative growth',
    unit: 'bag (50kg)',
    brand: 'Atlas',
    supplier: {
      id: 1,
      name: 'Atlas Fertilizer Corporation',
    },
    pricing: {
      wholesale_price: 1100.0,
      platform_price: 1250.0,
      card_member_price: 1212.5,
      retail_price: 1400.0,
      market_average_price: 1325.0,
      competitor_price: 1330.0,
    },
    savings: {
      market_savings: 150.0,
      market_savings_percent: 10.71,
      card_savings: 37.5,
      card_savings_percent: 3.0,
    },
    effective_date: new Date().toISOString(),
    region: 'National',
  },
  {
    id: 3,
    name: 'Organic Compost',
    category: 'fertilizer',
    description: 'Natural organic fertilizer from composted materials',
    unit: 'bag (25kg)',
    brand: 'Local Agri',
    supplier: {
      id: 4,
      name: 'Local Agri Supply Co.',
    },
    pricing: {
      wholesale_price: 300.0,
      platform_price: 350.0,
      card_member_price: 339.5,
      retail_price: 450.0,
      market_average_price: 400.0,
      competitor_price: 427.5,
    },
    savings: {
      market_savings: 100.0,
      market_savings_percent: 22.22,
      card_savings: 10.5,
      card_savings_percent: 3.0,
    },
    effective_date: new Date().toISOString(),
    region: 'National',
  },

  // Seeds
  {
    id: 4,
    name: 'Hybrid Rice Seeds - RC222',
    category: 'seed',
    description: 'High-yielding hybrid rice variety',
    unit: 'kg',
    brand: 'East-West',
    supplier: {
      id: 2,
      name: 'East-West Seed Company',
    },
    pricing: {
      wholesale_price: 180.0,
      platform_price: 200.0,
      card_member_price: 194.0,
      retail_price: 250.0,
      market_average_price: 225.0,
      competitor_price: 237.5,
    },
    savings: {
      market_savings: 50.0,
      market_savings_percent: 20.0,
      card_savings: 6.0,
      card_savings_percent: 3.0,
    },
    effective_date: new Date().toISOString(),
    region: 'National',
  },
  {
    id: 5,
    name: 'Corn Seeds - Pioneer 30G88',
    category: 'seed',
    description: 'Drought-resistant corn hybrid',
    unit: 'kg',
    brand: 'East-West',
    supplier: {
      id: 2,
      name: 'East-West Seed Company',
    },
    pricing: {
      wholesale_price: 350.0,
      platform_price: 400.0,
      card_member_price: 388.0,
      retail_price: 480.0,
      market_average_price: 440.0,
      competitor_price: 456.0,
    },
    savings: {
      market_savings: 80.0,
      market_savings_percent: 16.67,
      card_savings: 12.0,
      card_savings_percent: 3.0,
    },
    effective_date: new Date().toISOString(),
    region: 'National',
  },
  {
    id: 6,
    name: 'Tomato Seeds - Diamante Max',
    category: 'seed',
    description: 'Disease-resistant tomato variety',
    unit: 'packet (10g)',
    brand: 'East-West',
    supplier: {
      id: 2,
      name: 'East-West Seed Company',
    },
    pricing: {
      wholesale_price: 450.0,
      platform_price: 500.0,
      card_member_price: 485.0,
      retail_price: 600.0,
      market_average_price: 550.0,
      competitor_price: 570.0,
    },
    savings: {
      market_savings: 100.0,
      market_savings_percent: 16.67,
      card_savings: 15.0,
      card_savings_percent: 3.0,
    },
    effective_date: new Date().toISOString(),
    region: 'National',
  },

  // Pesticides
  {
    id: 7,
    name: 'Insecticide - Decis 2.5EC',
    category: 'pesticide',
    description: 'Broad-spectrum insecticide',
    unit: 'liter',
    brand: 'Bayer',
    supplier: {
      id: 3,
      name: 'Bayer CropScience Philippines',
    },
    pricing: {
      wholesale_price: 800.0,
      platform_price: 900.0,
      card_member_price: 873.0,
      retail_price: 1100.0,
      market_average_price: 1000.0,
      competitor_price: 1045.0,
    },
    savings: {
      market_savings: 200.0,
      market_savings_percent: 18.18,
      card_savings: 27.0,
      card_savings_percent: 3.0,
    },
    effective_date: new Date().toISOString(),
    region: 'National',
  },
  {
    id: 8,
    name: 'Fungicide - Score 250EC',
    category: 'pesticide',
    description: 'Systemic fungicide for disease control',
    unit: 'liter',
    brand: 'Bayer',
    supplier: {
      id: 3,
      name: 'Bayer CropScience Philippines',
    },
    pricing: {
      wholesale_price: 1200.0,
      platform_price: 1350.0,
      card_member_price: 1309.5,
      retail_price: 1600.0,
      market_average_price: 1475.0,
      competitor_price: 1520.0,
    },
    savings: {
      market_savings: 250.0,
      market_savings_percent: 15.63,
      card_savings: 40.5,
      card_savings_percent: 3.0,
    },
    effective_date: new Date().toISOString(),
    region: 'National',
  },
  {
    id: 9,
    name: 'Herbicide - Roundup',
    category: 'pesticide',
    description: 'Non-selective herbicide for weed control',
    unit: 'liter',
    brand: 'Bayer',
    supplier: {
      id: 3,
      name: 'Bayer CropScience Philippines',
    },
    pricing: {
      wholesale_price: 600.0,
      platform_price: 700.0,
      card_member_price: 679.0,
      retail_price: 850.0,
      market_average_price: 775.0,
      competitor_price: 807.5,
    },
    savings: {
      market_savings: 150.0,
      market_savings_percent: 17.65,
      card_savings: 21.0,
      card_savings_percent: 3.0,
    },
    effective_date: new Date().toISOString(),
    region: 'National',
  },

  // Equipment
  {
    id: 10,
    name: 'Hand Sprayer - 16L Knapsack',
    category: 'equipment',
    description: 'Manual backpack sprayer for pesticide application',
    unit: 'piece',
    brand: 'Local Agri',
    supplier: {
      id: 4,
      name: 'Local Agri Supply Co.',
    },
    pricing: {
      wholesale_price: 1500.0,
      platform_price: 1700.0,
      card_member_price: 1649.0,
      retail_price: 2000.0,
      market_average_price: 1850.0,
      competitor_price: 1900.0,
    },
    savings: {
      market_savings: 300.0,
      market_savings_percent: 15.0,
      card_savings: 51.0,
      card_savings_percent: 3.0,
    },
    effective_date: new Date().toISOString(),
    region: 'National',
  },
  {
    id: 11,
    name: 'Garden Hoe',
    category: 'equipment',
    description: 'Heavy-duty garden hoe for soil cultivation',
    unit: 'piece',
    brand: 'Local Agri',
    supplier: {
      id: 4,
      name: 'Local Agri Supply Co.',
    },
    pricing: {
      wholesale_price: 250.0,
      platform_price: 300.0,
      card_member_price: 291.0,
      retail_price: 400.0,
      market_average_price: 350.0,
      competitor_price: 380.0,
    },
    savings: {
      market_savings: 100.0,
      market_savings_percent: 25.0,
      card_savings: 9.0,
      card_savings_percent: 3.0,
    },
    effective_date: new Date().toISOString(),
    region: 'National',
  },
  {
    id: 12,
    name: 'Irrigation Timer',
    category: 'equipment',
    description: 'Automatic irrigation timer for water management',
    unit: 'piece',
    brand: 'Local Agri',
    supplier: {
      id: 4,
      name: 'Local Agri Supply Co.',
    },
    pricing: {
      wholesale_price: 800.0,
      platform_price: 950.0,
      card_member_price: 921.5,
      retail_price: 1200.0,
      market_average_price: 1075.0,
      competitor_price: 1140.0,
    },
    savings: {
      market_savings: 250.0,
      market_savings_percent: 20.83,
      card_savings: 28.5,
      card_savings_percent: 3.0,
    },
    effective_date: new Date().toISOString(),
    region: 'National',
  },
];

export const demoDeliveryOptions: DeliveryOption[] = [
  {
    code: 'platform_delivery',
    name: 'Platform Delivery',
    description: 'Delivered by our logistics partners',
    base_fee: 100,
    per_km_fee: 10,
    total_fee: 100,
    estimated_days: 2,
    features: ['Tracking available', 'Insurance included', 'Door-to-door service'],
  },
  {
    code: 'supplier_direct',
    name: 'Supplier Direct',
    description: 'Delivered directly by the supplier',
    base_fee: 50,
    per_km_fee: 0,
    total_fee: 50,
    estimated_days: 3,
    features: ['Direct from supplier', 'Bulk orders preferred'],
  },
  {
    code: 'farmer_pickup',
    name: 'Farmer Pickup',
    description: 'Pick up from designated location',
    base_fee: 0,
    per_km_fee: 0,
    total_fee: 0,
    estimated_days: 1,
    features: ['No delivery fee', 'Immediate availability', 'Flexible pickup times'],
  },
];

export const demoCategories = [
  { name: 'fertilizer', count: 3 },
  { name: 'seed', count: 3 },
  { name: 'pesticide', count: 3 },
  { name: 'equipment', count: 3 },
];
