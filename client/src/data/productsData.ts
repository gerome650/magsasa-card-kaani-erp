/**
 * Agricultural Marketplace Product Catalog
 * Products sourced directly from verified suppliers with CARD MRI-negotiated pricing
 */

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: 'Seeds' | 'Fertilizers' | 'Tools' | 'Organic';
  priceMin: number;
  priceMax?: number;
  unit: string;
  description: string;
  composition?: string;
  imageUrl: string;
  supplier: string;
  inStock: boolean;
  cardMriNegotiated: boolean;
}

export const products: Product[] = [
  // Atlas Fertilizer Corporation Products
  {
    id: 'P001',
    name: 'Atlas Perfect Gro 14-14-14',
    brand: 'Atlas',
    category: 'Fertilizers',
    priceMin: 1490,
    priceMax: 1841,
    unit: '50kg bag',
    description: 'Complete NPK fertilizer with balanced nutrients for optimal crop growth. Suitable for rice, corn, and vegetables.',
    composition: 'Nitrogen (N) 14%, Phosphorus (P) 14%, Potassium (K) 14%',
    imageUrl: '/products/atlas-perfect-gro.jpg',
    supplier: 'Atlas Fertilizer Corporation',
    inStock: true,
    cardMriNegotiated: true,
  },
  {
    id: 'P002',
    name: 'Atlas Super Gro 16-20-0',
    brand: 'Atlas',
    category: 'Fertilizers',
    priceMin: 1560,
    priceMax: 1920,
    unit: '50kg bag',
    description: 'High phosphorus fertilizer ideal for root development and early plant growth. Perfect for transplanting and seedling establishment.',
    composition: 'Nitrogen (N) 16%, Phosphorus (P) 20%, Potassium (K) 0%',
    imageUrl: '/products/atlas-super-gro.jpg',
    supplier: 'Atlas Fertilizer Corporation',
    inStock: true,
    cardMriNegotiated: true,
  },
  
  // Harvester Products
  {
    id: 'P003',
    name: 'Harvester Urea 46-0-0',
    brand: 'Harvester',
    category: 'Fertilizers',
    priceMin: 1585,
    priceMax: 1866,
    unit: '50kg bag',
    description: 'High nitrogen fertilizer for rapid vegetative growth. Ideal for rice, corn, and leafy vegetables during growing season.',
    composition: 'Nitrogen (N) 46%, Phosphorus (P) 0%, Potassium (K) 0%',
    imageUrl: '/products/harvester-urea.jpg',
    supplier: 'Harvester Agribusiness Corporation',
    inStock: true,
    cardMriNegotiated: true,
  },
  {
    id: 'P004',
    name: 'Harvester Complete 14-14-14',
    brand: 'Harvester',
    category: 'Fertilizers',
    priceMin: 1480,
    unit: '50kg bag',
    description: 'All-purpose complete fertilizer with balanced NPK ratio. Suitable for all crops and growth stages.',
    composition: 'Nitrogen (N) 14%, Phosphorus (P) 14%, Potassium (K) 14%',
    imageUrl: '/products/harvester-complete.jpg',
    supplier: 'Harvester Agribusiness Corporation',
    inStock: true,
    cardMriNegotiated: true,
  },
  {
    id: 'P005',
    name: 'Harvester Solowell 16-16-16',
    brand: 'Harvester',
    category: 'Fertilizers',
    priceMin: 1650,
    priceMax: 1850,
    unit: '50kg bag',
    description: 'Premium complete fertilizer with higher nutrient concentration for maximum yield. Recommended for high-value crops.',
    composition: 'Nitrogen (N) 16%, Phosphorus (P) 16%, Potassium (K) 16%',
    imageUrl: '/products/harvester-solowell.jpg',
    supplier: 'Harvester Agribusiness Corporation',
    inStock: true,
    cardMriNegotiated: true,
  },
  {
    id: 'P006',
    name: 'Harvester Organic Fertilizer',
    brand: 'Harvester',
    category: 'Organic',
    priceMin: 1200,
    unit: '50kg bag',
    description: 'Certified organic fertilizer made from natural materials. Improves soil health and promotes sustainable farming.',
    composition: 'Organic matter 60%, NPK 4-3-2',
    imageUrl: '/products/harvester-organic.jpg',
    supplier: 'Harvester Agribusiness Corporation',
    inStock: true,
    cardMriNegotiated: true,
  },
  
  // Masinag Organic Products
  {
    id: 'P007',
    name: 'Masinag Organic Plant Supplement',
    brand: 'Masinag',
    category: 'Organic',
    priceMin: 980,
    unit: 'per liter',
    description: 'Liquid organic supplement with beneficial microorganisms. Enhances nutrient uptake and plant immunity.',
    composition: 'Beneficial bacteria, organic acids, trace minerals',
    imageUrl: '/products/masinag-organic.jpg',
    supplier: 'Masinag Organic Farm Supplies',
    inStock: true,
    cardMriNegotiated: true,
  },
  
  // Yara International Products
  {
    id: 'P008',
    name: 'Yara Mila Winner',
    brand: 'Yara',
    category: 'Fertilizers',
    priceMin: 1750,
    unit: '50kg bag',
    description: 'Premium compound fertilizer with micronutrients. Specially formulated for rice and corn production.',
    composition: 'NPK 12-12-17-2 + Micronutrients (Zn, B)',
    imageUrl: '/products/yara-mila-winner.jpg',
    supplier: 'Yara Philippines Inc.',
    inStock: true,
    cardMriNegotiated: true,
  },
  {
    id: 'P009',
    name: 'Yara Mila Power',
    brand: 'Yara',
    category: 'Fertilizers',
    priceMin: 1820,
    unit: '50kg bag',
    description: 'High-performance fertilizer with balanced nutrients and sulfur. Ideal for high-yield farming systems.',
    composition: 'NPK 12-11-18-2 + Sulfur 6%',
    imageUrl: '/products/yara-mila-power.jpg',
    supplier: 'Yara Philippines Inc.',
    inStock: true,
    cardMriNegotiated: true,
  },
  
  // Seeds
  {
    id: 'P010',
    name: 'NSIC Rc222 (Mestizo 20) Rice Seeds',
    brand: 'PhilRice',
    category: 'Seeds',
    priceMin: 45,
    priceMax: 50,
    unit: 'per kg',
    description: 'High-yielding inbred rice variety with good grain quality. Matures in 105-110 days. Resistant to blast and tungro.',
    composition: 'Certified seeds, 98% purity',
    imageUrl: '/products/rice-seeds-nsic222.jpg',
    supplier: 'Philippine Rice Research Institute',
    inStock: true,
    cardMriNegotiated: true,
  },
  {
    id: 'P011',
    name: 'Pioneer 30G19 Corn Hybrid Seeds',
    brand: 'Pioneer',
    category: 'Seeds',
    priceMin: 3200,
    priceMax: 3500,
    unit: '18kg bag',
    description: 'Premium yellow corn hybrid with excellent yield potential. Suitable for both wet and dry seasons.',
    composition: 'Hybrid seeds, treated with fungicide',
    imageUrl: '/products/corn-seeds-pioneer.jpg',
    supplier: 'Corteva Agriscience',
    inStock: true,
    cardMriNegotiated: true,
  },
  {
    id: 'P012',
    name: 'Known-You Tomato Seeds (Diamante Max)',
    brand: 'Known-You',
    category: 'Seeds',
    priceMin: 850,
    unit: '10g pack',
    description: 'Hybrid tomato variety with high yield and disease resistance. Suitable for lowland and highland production.',
    composition: 'F1 hybrid seeds, approximately 3,000 seeds per pack',
    imageUrl: '/products/tomato-seeds-diamante.jpg',
    supplier: 'Known-You Seed Philippines',
    inStock: true,
    cardMriNegotiated: true,
  },
  
  // Tools and Equipment
  {
    id: 'P013',
    name: 'Knapsack Sprayer 16L',
    brand: 'Farmhand',
    category: 'Tools',
    priceMin: 1250,
    priceMax: 1450,
    unit: 'per unit',
    description: 'Manual knapsack sprayer with adjustable nozzle. Ideal for pesticide and fertilizer application.',
    composition: 'Heavy-duty plastic tank, brass nozzle, adjustable strap',
    imageUrl: '/products/knapsack-sprayer.jpg',
    supplier: 'Farmhand Equipment Supply',
    inStock: true,
    cardMriNegotiated: true,
  },
  {
    id: 'P014',
    name: 'Bolo Knife (Itak)',
    brand: 'Batangas Steel',
    category: 'Tools',
    priceMin: 350,
    priceMax: 450,
    unit: 'per piece',
    description: 'Traditional Filipino machete for harvesting and farm maintenance. High-carbon steel blade.',
    composition: 'Carbon steel blade, hardwood handle',
    imageUrl: '/products/bolo-knife.jpg',
    supplier: 'Batangas Steel Works',
    inStock: true,
    cardMriNegotiated: true,
  },
  {
    id: 'P015',
    name: 'Hand Trowel and Cultivator Set',
    brand: 'Garden Pro',
    category: 'Tools',
    priceMin: 280,
    unit: 'per set',
    description: 'Essential hand tools for planting and soil cultivation. Rust-resistant steel with ergonomic handles.',
    composition: 'Stainless steel tools, rubber grip handles',
    imageUrl: '/products/hand-tools-set.jpg',
    supplier: 'Garden Pro Philippines',
    inStock: true,
    cardMriNegotiated: true,
  },
  {
    id: 'P016',
    name: 'Water Hose 50m with Spray Gun',
    brand: 'AquaFlow',
    category: 'Tools',
    priceMin: 1850,
    priceMax: 2100,
    unit: 'per set',
    description: 'Durable PVC water hose with multi-pattern spray gun. Perfect for irrigation and crop spraying.',
    composition: '3-layer PVC hose, brass fittings, 7-pattern spray gun',
    imageUrl: '/products/water-hose.jpg',
    supplier: 'AquaFlow Irrigation Systems',
    inStock: true,
    cardMriNegotiated: true,
  },
];

// Helper functions for filtering and searching
export function getProductsByCategory(category: string): Product[] {
  if (category === 'All') return products;
  return products.filter(p => p.category === category);
}

export function searchProducts(query: string): Product[] {
  const lowerQuery = query.toLowerCase();
  return products.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.brand.toLowerCase().includes(lowerQuery) ||
    p.category.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery)
  );
}

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

export function getProductsBySupplier(supplier: string): Product[] {
  return products.filter(p => p.supplier === supplier);
}

export const categories = ['All', 'Seeds', 'Fertilizers', 'Tools', 'Organic'];

export const suppliers = [
  'Atlas Fertilizer Corporation',
  'Harvester Agribusiness Corporation',
  'Masinag Organic Farm Supplies',
  'Yara Philippines Inc.',
  'Philippine Rice Research Institute',
  'Corteva Agriscience',
  'Known-You Seed Philippines',
  'Farmhand Equipment Supply',
  'Batangas Steel Works',
  'Garden Pro Philippines',
  'AquaFlow Irrigation Systems',
];
