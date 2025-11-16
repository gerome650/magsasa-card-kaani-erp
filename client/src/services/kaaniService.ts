/**
 * KaAni AI Chat Service
 * 
 * This service handles communication with the KaAni AI assistant (Google Gemini API).
 * Currently using mock responses - will be replaced with actual API integration.
 * 
 * TODO: Replace with actual Gemini API endpoint after KaAni deployment
 */

// Placeholder configuration - will be replaced with actual values
const KAANI_API_ENDPOINT = "https://your-kaani-api.run.app/api/chat"; // Replace after deployment
const KAANI_API_KEY = "your-api-key-here"; // Replace after deployment

interface KaAniMessage {
  role: "user" | "assistant";
  content: string;
}

interface KaAniRequest {
  message: string;
  userRole: string;
  conversationHistory?: KaAniMessage[];
}

interface KaAniResponse {
  response: string;
  confidence?: number;
}

/**
 * Send a message to KaAni AI and get a response
 * @param message - User's message
 * @param userRole - User's role (Farmer, Manager, Field Officer)
 * @param conversationHistory - Optional conversation history for context
 * @returns AI response text
 */
export async function sendMessageToKaAni(
  message: string,
  userRole: string,
  conversationHistory?: KaAniMessage[]
): Promise<string> {
  // TODO: Replace this mock implementation with actual API call
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

  // Mock responses based on keywords (for testing only)
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("palay") || lowerMessage.includes("rice") || lowerMessage.includes("tanim")) {
    return "Ang palay ay isa sa mga pangunahing pananim sa Pilipinas. Para sa magandang ani:\n\n1. Siguraduhing may sapat na tubig sa palayan\n2. Gumamit ng tamang pataba (14-14-14 NPK)\n3. Kontrolin ang mga peste at damo\n4. Mag-ani pagkatapos ng 120-130 araw\n\nMay specific na tanong ka ba tungkol sa pagtatanim ng palay?";
  }

  if (lowerMessage.includes("loan") || lowerMessage.includes("pautang") || lowerMessage.includes("utang")) {
    return `Bilang ${userRole}, maaari kang mag-apply ng loan sa CARD MRI. Ang iyong AgScore™ ay makakatulong sa mabilis na approval. Kailangan mo ng:\n\n1. Valid ID\n2. Proof of farm ownership\n3. Harvest records (minimum 2 seasons)\n4. Good credit standing\n\nGusto mo bang malaman ang iyong current AgScore™?`;
  }

  if (lowerMessage.includes("agscore") || lowerMessage.includes("score") || lowerMessage.includes("rating")) {
    return "Ang AgScore™ ay isang 1000-point system na sinusukat ang iyong performance bilang farmer. Nakabatay ito sa:\n\n📊 Harvest Performance (40%)\n💰 Loan Repayment History (30%)\n🌾 Farm Productivity (20%)\n✅ Verification Status (10%)\n\nMas mataas ang score, mas mabilis ang loan approval at mas mataas ang loan amount!";
  }

  if (lowerMessage.includes("peste") || lowerMessage.includes("pest") || lowerMessage.includes("insect")) {
    return "Para sa pest control:\n\n🐛 Common pests: Stem borer, leaf folder, rice bug\n🌿 Organic solutions: Neem oil, garlic spray\n💊 Chemical pesticides: Chlorpyrifos, Cypermethrin\n\nRekomendado ang Integrated Pest Management (IPM) para sa sustainable farming. Anong specific pest ang problema mo?";
  }

  if (lowerMessage.includes("presyo") || lowerMessage.includes("price") || lowerMessage.includes("market")) {
    return "Current market prices (as of today):\n\n🌾 Rice: ₱25.00/kg\n🌽 Corn: ₱18.00/kg\n🍅 Tomato: ₱45.00/kg\n🍆 Eggplant: ₱35.00/kg\n\nAng presyo ay nag-iiba araw-araw. Check ang Price Comparison page para sa latest updates!";
  }

  if (lowerMessage.includes("weather") || lowerMessage.includes("panahon") || lowerMessage.includes("ulan")) {
    return "Para sa weather updates, mahalaga ang:\n\n☀️ Daily monitoring ng temperature\n🌧️ Rainfall prediction para sa irrigation planning\n💨 Wind speed para sa pesticide application\n\nRekomendado ang PAGASA mobile app para sa real-time weather alerts. Nasa Laguna ka ba?";
  }

  // Default response for unrecognized queries
  return `Salamat sa iyong tanong! Ako si KaAni, at nandito ako para tumulong sa iyo tungkol sa:\n\n🌾 Pagtatanim at pag-aalaga ng pananim\n💰 CARD loans at AgScore™\n📊 Market prices at harvest tracking\n🐛 Pest control at farm management\n\nPwede mo akong tanungin ng mas specific na katanungan, at tutulungan kita!`;
}

/**
 * Call actual Gemini API (to be implemented after deployment)
 * @param request - Request payload
 * @returns API response
 */
async function callGeminiAPI(request: KaAniRequest): Promise<KaAniResponse> {
  // TODO: Implement actual API call
  // Example implementation:
  /*
  const response = await fetch(KAANI_API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${KAANI_API_KEY}`,
    },
    body: JSON.stringify({
      message: request.message,
      userRole: request.userRole,
      conversationHistory: request.conversationHistory,
    }),
  });

  if (!response.ok) {
    throw new Error(`KaAni API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
  */

  throw new Error("Gemini API not yet configured");
}
