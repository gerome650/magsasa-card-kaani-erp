/**
 * Market Price Data
 * Current market prices for agricultural products
 * Prices are in PHP per kg
 */

export interface MarketPrice {
  crop: string;
  pricePerKg: number;
  unit: 'kg' | 'MT';
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
  category: 'grain' | 'vegetable' | 'fruit' | 'other';
}

export const marketPrices: MarketPrice[] = [
  {
    crop: 'Rice',
    pricePerKg: 25,
    unit: 'kg',
    lastUpdated: '2024-10-20',
    trend: 'stable',
    category: 'grain'
  },
  {
    crop: 'Corn',
    pricePerKg: 18,
    unit: 'kg',
    lastUpdated: '2024-10-20',
    trend: 'up',
    category: 'grain'
  },
  {
    crop: 'Tomato',
    pricePerKg: 45,
    unit: 'kg',
    lastUpdated: '2024-10-20',
    trend: 'down',
    category: 'vegetable'
  },
  {
    crop: 'Eggplant',
    pricePerKg: 35,
    unit: 'kg',
    lastUpdated: '2024-10-20',
    trend: 'stable',
    category: 'vegetable'
  },
  {
    crop: 'Cabbage',
    pricePerKg: 30,
    unit: 'kg',
    lastUpdated: '2024-10-20',
    trend: 'stable',
    category: 'vegetable'
  },
  {
    crop: 'Lettuce',
    pricePerKg: 40,
    unit: 'kg',
    lastUpdated: '2024-10-20',
    trend: 'up',
    category: 'vegetable'
  },
  {
    crop: 'Carrot',
    pricePerKg: 38,
    unit: 'kg',
    lastUpdated: '2024-10-20',
    trend: 'stable',
    category: 'vegetable'
  },
  {
    crop: 'Banana',
    pricePerKg: 20,
    unit: 'kg',
    lastUpdated: '2024-10-20',
    trend: 'stable',
    category: 'fruit'
  },
  {
    crop: 'Mango',
    pricePerKg: 60,
    unit: 'kg',
    lastUpdated: '2024-10-20',
    trend: 'up',
    category: 'fruit'
  },
  {
    crop: 'Pineapple',
    pricePerKg: 35,
    unit: 'kg',
    lastUpdated: '2024-10-20',
    trend: 'stable',
    category: 'fruit'
  }
];

/**
 * Get market price for a specific crop
 */
export function getMarketPrice(cropName: string): MarketPrice | undefined {
  return marketPrices.find(p => p.crop.toLowerCase() === cropName.toLowerCase());
}

/**
 * Get all available crops
 */
export function getAvailableCrops(): string[] {
  return marketPrices.map(p => p.crop);
}

/**
 * Calculate total value based on quantity and crop
 */
export function calculateHarvestValue(cropName: string, quantityKg: number): number {
  const price = getMarketPrice(cropName);
  if (!price) return 0;
  return quantityKg * price.pricePerKg;
}
