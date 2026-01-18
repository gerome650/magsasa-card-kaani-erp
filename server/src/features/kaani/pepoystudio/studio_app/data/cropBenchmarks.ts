// This file acts as our crop benchmark database.

export interface CropBenchmark {
  crop: string;
  province: string;
  farmingSystemOrVariety: string;
  recommendedMinimumYield: number;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  justification: string;
}

export const CROP_BENCHMARKS: CropBenchmark[] = [
  {
    "crop": "Palay (Rice)",
    "province": "Laguna, laguna",
    "farmingSystemOrVariety": "Irrigated",
    "recommendedMinimumYield": 3.99,
    "confidenceLevel": "High",
    "justification": "Based on 2024 Philrice data."
  },
  {
    "crop": "Palay (Rice)",
    "province": "Laguna, laguna",
    "farmingSystemOrVariety": "Rainfed",
    "recommendedMinimumYield": 2.61,
    "confidenceLevel": "High",
    "justification": "Based on 2024 Philrice data."
  },
  {
    "crop": "Palay (Rice)",
    "province": "Cavite, cavite",
    "farmingSystemOrVariety": "Irrigated",
    "recommendedMinimumYield": 3.49,
    "confidenceLevel": "High",
    "justification": "Based on 2024 Philrice data."
  },
  {
    "crop": "Palay (Rice)",
    "province": "Cavite, cavite",
    "farmingSystemOrVariety": "Rainfed",
    "recommendedMinimumYield": 1.90,
    "confidenceLevel": "High",
    "justification": "Based on 2024 Philrice data."
  },
  {
    "crop": "Palay (Rice)",
    "province": "Batangas, batangas",
    "farmingSystemOrVariety": "Irrigated",
    "recommendedMinimumYield": 3.05,
    "confidenceLevel": "High",
    "justification": "Based on 2024 Philrice data."
  },
  {
    "crop": "Palay (Rice)",
    "province": "Batangas, batangas",
    "farmingSystemOrVariety": "Rainfed",
    "recommendedMinimumYield": 2.23,
    "confidenceLevel": "High",
    "justification": "Based on 2024 Philrice data."
  },
  {
    "crop": "Palay (Rice)",
    "province": "Quezon, quezon",
    "farmingSystemOrVariety": "Irrigated",
    "recommendedMinimumYield": 3.49,
    "confidenceLevel": "High",
    "justification": "Based on 2024 Philrice data."
  },
  {
    "crop": "Palay (Rice)",
    "province": "Quezon, quezon",
    "farmingSystemOrVariety": "Rainfed",
    "recommendedMinimumYield": 2.91,
    "confidenceLevel": "High",
    "justification": "Based on 2024 Philrice data."
  },
  {
    "crop": "Palay (Rice)",
    "province": "Rizal, rizal",
    "farmingSystemOrVariety": "Irrigated",
    "recommendedMinimumYield": 3.74,
    "confidenceLevel": "High",
    "justification": "Based on 2024 Philrice data."
  },
  {
    "crop": "Palay (Rice)",
    "province": "Rizal, rizal",
    "farmingSystemOrVariety": "Rainfed",
    "recommendedMinimumYield": 2.39,
    "confidenceLevel": "High",
    "justification": "Based on 2024 Philrice data."
  },
  {
    "crop": "Corn (Maize)",
    "province": "Quezon, Laguna",
    "farmingSystemOrVariety": "Yellow (Feed)",
    "recommendedMinimumYield": 3.00,
    "confidenceLevel": "High",
    "justification": "Based on Quezon’s 2024 avg. of 3.17 MT/ha. Increased to reflect hybrid seed adoption trends."
  },
  {
    "crop": "Corn (Maize)",
    "province": "All Provinces",
    "farmingSystemOrVariety": "White (Food)",
    "recommendedMinimumYield": 1.20,
    "confidenceLevel": "High",
    "justification": "Based on Quezon’s 2024 avg. of 1.13 MT/ha. Adjusted upward for improved practices."
  },
  {
    "crop": "Cassava",
    "province": "Quezon, Batangas",
    "farmingSystemOrVariety": "All",
    "recommendedMinimumYield": 6.50,
    "confidenceLevel": "Medium",
    "justification": "Above 2020 regional avg. (5.83 MT/ha) but below DA target (10.35 MT/ha). Reflects trends."
  },
  {
    "crop": "Sweet Potato",
    "province": "Quezon, Batangas",
    "farmingSystemOrVariety": "All",
    "recommendedMinimumYield": 7.50,
    "confidenceLevel": "Medium",
    "justification": "Aligned with 2020 regional avg. (7.52 MT/ha). Adjusted for improved practices in Quezon."
  },
  {
    "crop": "Tomato",
    "province": "Quezon, Batangas",
    "farmingSystemOrVariety": "All",
    "recommendedMinimumYield": 6.00,
    "confidenceLevel": "Medium",
    "justification": "Based on 2023 DA report (6–8 MT/ha in Quezon). Adjusted for regional productivity trends."
  },
  {
    "crop": "Ampalaya",
    "province": "Quezon, Laguna",
    "farmingSystemOrVariety": "All",
    "recommendedMinimumYield": 5.00,
    "confidenceLevel": "Medium",
    "justification": "Based on DA field data (5–6 MT/ha). Increased to reflect CALABARZON’s ranking."
  },
  {
    "crop": "Eggplant",
    "province": "Quezon, Laguna",
    "farmingSystemOrVariety": "All",
    "recommendedMinimumYield": 12.50,
    "confidenceLevel": "High",
    "justification": "Based on 2019 Quezon study (13–16 MT/ha). Adjusted for consistency with recent data."
  },
  {
    "crop": "Kalabasa (Squash)",
    "province": "Quezon",
    "farmingSystemOrVariety": "All",
    "recommendedMinimumYield": 11.00,
    "confidenceLevel": "Medium",
    "justification": "Based on VRC data (10–12 MT/ha). Increased to reflect Quezon’s dominance in production."
  },
  {
    "crop": "Pechay",
    "province": "Laguna, Quezon",
    "farmingSystemOrVariety": "Native",
    "recommendedMinimumYield": 4.00,
    "confidenceLevel": "Medium",
    "justification": "Based on DA reports (4–5 MT/ha in irrigated areas). Adjusted for Laguna’s irrigation."
  },
  {
    "crop": "Pechay",
    "province": "Cavite, Batangas, Rizal",
    "farmingSystemOrVariety": "Native",
    "recommendedMinimumYield": 3.50,
    "confidenceLevel": "Low",
    "justification": "Lowered for non-irrigated provinces, based on national averages."
  },
  {
    "crop": "Cabbage",
    "province": "Laguna, Quezon",
    "farmingSystemOrVariety": "All",
    "recommendedMinimumYield": 13.00,
    "confidenceLevel": "Medium",
    "justification": "Based on national avg. (15–16 MT/ha), adjusted for lowland conditions and cool season."
  },
  {
    "crop": "Wombok",
    "province": "Laguna, Quezon",
    "farmingSystemOrVariety": "Cool Season",
    "recommendedMinimumYield": 16.00,
    "confidenceLevel": "Medium",
    "justification": "Adjusted upward based on international benchmarks (40–50 MT/ha), with seasonal restriction."
  },
  {
    "crop": "Potato",
    "province": "All Provinces",
    "farmingSystemOrVariety": "All",
    "recommendedMinimumYield": 0.00,
    "confidenceLevel": "High",
    "justification": "Confirmed non-viable due to agro-climatic constraints. No production data exists."
  },
  {
    "crop": "Radish",
    "province": "Laguna, Quezon",
    "farmingSystemOrVariety": "All",
    "recommendedMinimumYield": 4.50,
    "confidenceLevel": "Medium",
    "justification": "Estimated from DA root crop data (4–6 MT/ha). Adjusted for irrigated provinces."
  },
  {
    "crop": "Radish",
    "province": "Cavite, Batangas, Rizal",
    "farmingSystemOrVariety": "All",
    "recommendedMinimumYield": 4.00,
    "confidenceLevel": "Low",
    "justification": "Conservative estimate for non-irrigated provinces, based on general root crop productivity."
  },
  // Add these entries to your CROP_BENCHMARKS array in data/cropBenchmarks.ts

  // --- Negros Occidental Sugarcane Benchmarks ---
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Cadiz City", // Using City/Municipality here
    "recommendedMinimumYield": 65,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (65–75 TC/ha) for Northern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Calatrava",
    "recommendedMinimumYield": 60,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (60–70 TC/ha) for Northern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Enrique B. Magalona",
    "recommendedMinimumYield": 65,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (65–75 TC/ha) for Northern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Escalante City",
    "recommendedMinimumYield": 65,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (65–75 TC/ha) for Northern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Manapla",
    "recommendedMinimumYield": 65,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (65–75 TC/ha) for Northern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Sagay City",
    "recommendedMinimumYield": 70,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (70–80 TC/ha) for Northern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "San Carlos City",
    "recommendedMinimumYield": 70,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (70–80 TC/ha) for Northern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Silay City",
    "recommendedMinimumYield": 65,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (65–75 TC/ha) for Northern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Talisay City",
    "recommendedMinimumYield": 65,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (65–75 TC/ha) for Northern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Toboso",
    "recommendedMinimumYield": 60,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (60–70 TC/ha) for Northern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Victorias City",
    "recommendedMinimumYield": 75,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (75–80 TC/ha) for Northern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Bacolod City",
    "recommendedMinimumYield": 60,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (60–65 TC/ha) for Central Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Bago City",
    "recommendedMinimumYield": 60,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (60–65 TC/ha) for Central Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Don Salvador Benedicto",
    "recommendedMinimumYield": 55,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (55–65 TC/ha) for Central Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "La Carlota City",
    "recommendedMinimumYield": 80,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (80–100 TC/ha) for Central Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "La Castellana",
    "recommendedMinimumYield": 70,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (70–80 TC/ha) for Central Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Moises Padilla",
    "recommendedMinimumYield": 55,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (55–65 TC/ha) for Central Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Murcia",
    "recommendedMinimumYield": 60,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (60–65 TC/ha) for Central Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Pontevedra",
    "recommendedMinimumYield": 80,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (80–100 TC/ha) for Central Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Pulupandan",
    "recommendedMinimumYield": 60,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (60–65 TC/ha) for Central Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "San Enrique",
    "recommendedMinimumYield": 80,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (80–100 TC/ha) for Central Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Valladolid",
    "recommendedMinimumYield": 80,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (80–100 TC/ha) for Central Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Binalbagan",
    "recommendedMinimumYield": 50,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (50–60 TC/ha) for Southern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Candoni",
    "recommendedMinimumYield": 45,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (45–55 TC/ha) for Southern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Cauayan",
    "recommendedMinimumYield": 45,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (45–55 TC/ha) for Southern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Himamaylan City",
    "recommendedMinimumYield": 50,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (50–60 TC/ha) for Southern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Hinigaran",
    "recommendedMinimumYield": 50,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (50–60 TC/ha) for Southern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Hinoba-an",
    "recommendedMinimumYield": 45,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (45–55 TC/ha) for Southern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Ilog",
    "recommendedMinimumYield": 45,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (45–55 TC/ha) for Southern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Isabela",
    "recommendedMinimumYield": 50,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (50–60 TC/ha) for Southern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Kabankalan City",
    "recommendedMinimumYield": 50,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (50–60 TC/ha) for Southern Cluster, Negros Occidental."
  },
  {
    "crop": "Sugarcane",
    "province": "Negros Occidental",
    "farmingSystemOrVariety": "Sipalay City",
    "recommendedMinimumYield": 45,
    "confidenceLevel": "Medium",
    "justification": "Estimated average yield range (45–55 TC/ha) for Southern Cluster, Negros Occidental."
  }
  // --- END Negros Occidental Sugarcane ---
];