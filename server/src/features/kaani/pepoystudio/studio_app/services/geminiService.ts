import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Audience, ChatMessage, GeminiResponse, Dialect, FlowType } from '../types';
import { calculateBaselineRiskScore, RiskScoreInput, RiskScoreResult, SoilSubScoreDetail } from './riskCalculator';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const translateContent = async (
  content: { question: string; choices: string[] },
  targetDialect: string
): Promise<{ question: string; choices: string[] }> => {
  if (targetDialect === Dialect.Tagalog) {
    return content;
  }
  
  const model = 'gemini-2.5-flash';
  const prompt = `Translate the 'question' and all items in the 'choices' array of the following JSON object into the ${targetDialect} dialect. Crucially, ONLY return the raw, translated JSON object. Do not add any commentary, explanations, or markdown formatting like \`\`\`json. Your entire response should be parseable JSON.

Original JSON:
${JSON.stringify(content, null, 2)}
`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING, description: `The translated question in ${targetDialect}.` },
      choices: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: `The translated choices in ${targetDialect}.`
      },
    },
    required: ['question', 'choices'],
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error(`Failed to translate content to ${targetDialect}:`, error);
    return content;
  }
};


const calculateBaselineRiskScoreTool: FunctionDeclaration = {
  name: 'calculateBaselineRiskScore',
  description: "Calculates a baseline risk score for a farm loan. This single function handles soil-only, climate-only, soil+climate, and inline 'harvest score' comparisons versus provincial benchmarks.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      // Existing (soil + climate)
      sand: { type: Type.NUMBER, description: 'Percentage of sand in the soil, e.g., 30.', nullable: true },
      silt: { type: Type.NUMBER, description: 'Percentage of silt in the soil, e.g., 40.', nullable: true },
      clay: { type: Type.NUMBER, description: 'Percentage of clay in the soil, e.g., 30.', nullable: true },
      latitude: { type: Type.NUMBER, description: 'The latitude of the farm, e.g., 14.0901.', nullable: true },
      longitude: { type: Type.NUMBER, description: 'The longitude of the farm, e.g., 121.0552.', nullable: true },
      cropCycleMonths: { 
        type: Type.ARRAY, 
        description: 'An array of month names for the crop cycle, e.g., ["May", "June", "July"].',
        items: { type: Type.STRING },
        nullable: true,
      },

      // NEW (harvest score trigger/direct fields)
      triggerText: {
        type: Type.STRING,
        nullable: true,
        description: 'If the user typed "harvest score …", pass the entire user message here (e.g., "harvest score palay irrigated 5.2 mt/ha nueva ecija area 1.5").'
      },
      cropType: {
        type: Type.STRING,
        nullable: true,
        description: 'Crop name (e.g., "Palay (Rice)", "Corn (Maize)", "Tomato"). Optional if triggerText is provided.'
      },
      province: {
        type: Type.STRING,
        nullable: true,
        description: 'Philippine province (e.g., "Nueva Ecija", "Quezon"). Optional if triggerText is provided.'
      },
      projectedYieldPerHa: {
        type: Type.NUMBER,
        nullable: true,
        description: 'Projected yield in MT/ha (e.g., 5.2). Optional if triggerText is provided.'
      },
      areaSizeHa: {
        type: Type.NUMBER,
        nullable: true,
        description: 'Area size in hectares (default 1 if not provided). Optional if triggerText is provided.'
      },
      systemOrVariety: {
        type: Type.STRING,
        nullable: true,
        description: 'Can be a Crop Variety (e.g. "Yellow") or Method of Irrigation (e.g. "Rainfed") or City/ Town in a province in the Philippines (e.g. "Cadiz") Optional if trigger is provided'
      },
    },
  },
};


// Schema for Farmer and non-risk-scoring Loan Matching audience.
const FARMER_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['question', 'diagnosis'], description: "Whether you are asking a question or providing a final diagnosis/recommendation." },
    text: { type: Type.STRING, description: "The content of your question or diagnosis." },
    choices: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      nullable: true,
      description: "A list of 2-4 choices for the user if the type is 'question'."
    },
  },
  required: ['type', 'text'],
};

// Schema for Technician audience.
const TECHNICIAN_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['question', 'diagnosis'], description: "Whether you are asking a clarifying question or providing a final diagnosis." },
    text: { type: Type.STRING, description: "The content of your question or diagnosis." },
    choices: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      nullable: true,
      description: "A list of 2-4 choices for the user if the type is 'question'."
    },
  },
  required: ['type', 'text'],
};

const getLoanMatchingSystemInstruction = (currentDate: string): string => {
      const preamble = `You are "KaAni," a specialized AI assistant from AgSense, designed to help Filipino farmers and agri-entrepreneurs understand Landbank's agricultural loan programs. Your current date is ${currentDate}.`;

      const loanScreenerInstructions = `
### **Primary Function: Landbank Loan Screener**
Your primary role is to act as a **Loan Program Screener**. Your goal is to identify a suitable Landbank agricultural loan program for the user by following a strict, multi-step, multiple-choice decision tree.

**Your process:**
1.  **Strict Adherence to JSON Schema:** You MUST always structure your response using the provided JSON schema, with \`type: 'question'\` and a populated \`choices\` array for each step of the screening process.
2.  **Follow the Decision Tree EXACTLY:** Do not deviate from the prescribed questions and choices below.

#### **Decision Tree Logic:**

**Step 1: Initial Question**
*   **Condition:** The conversation history is empty.
*   **Action:** Ask the initial question.
*   **Question Text:** "Magandang araw! Ako po si KaAni, isang AI assistant mula sa AgSense, at matutulungan ko po kayong makahanap ng angkop na agricultural loan program mula sa Landbank. Para makapagsimula, maaari ko bang malaman kung sino po ang kumakatawan sa aplikasyon?"
*   **Choices:** ["Indibidwal na Magsasaka/Mangingisda", "Kooperatiba o Asosasyon", "MSME (Negosyo)", "LGU (Local Government Unit)"]

---
**Branch: "Indibidwal na Magsasaka/Mangingisda"**

**Step 2 (Individual): Purpose**
*   **Condition:** User chose "Indibidwal na Magsasaka/Mangingisda".
*   **Action:** Ask about their primary goal.
*   **Question Text:** "Salamat po. Ano po ang pangunahing layunin ng inyong uutangin?"
*   **Choices:** ["Pang-gastos sa produksyon (binhi, abono, atbp.)", "Pagbili ng makinarya (traktora, harvester, atbp.)", "Pangkalahatang suporta sa bukid/palaisdaan"]

**Step 3 (Individual, if "Pang-gastos sa produksyon"): Crop Type**
*   **Condition:** User chose "Pang-gastos sa produksyon".
*   **Action:** Ask for the specific crop to narrow down programs.
*   **Question Text:** "Naintindihan ko. Para po sa anong partikular na pananim ang pautang?"
*   **Choices:** ["Niyog (Coconut)", "Palay, Mais, o Gulay", "Pangisdaan (Aquaculture)", "Iba pa"]
*   **Logic:**
    *   If user chooses "Niyog (Coconut)", immediately proceed to **Step 5: Match and Summarize** and recommend the **Coco-Financing Program**.
    *   If user chooses "Pangisdaan (Aquaculture)", immediately proceed to **Step 5: Match and Summarize** and recommend the **AFFP**, highlighting its applicability to fisheries.
    *   If user chooses "Palay, Mais, o Gulay" or "Iba pa", proceed to Step 4.

**Step 4 (Individual, for general production): RSBSA Registration**
*   **Condition:** User needs production loan for general crops.
*   **Action:** Ask about RSBSA status, as it's a key requirement for a major program.
*   **Question Text:** "Mahalaga po ito para sa mga programa ng gobyerno. Nakarehistro po ba kayo sa RSBSA (Registry System for Basic Sectors in Agriculture)?"
*   **Choices:** ["Opo, nakarehistro ako", "Hindi pa po, pero plano kong magparehistro", "Hindi po ako sigurado"]
*   **Logic:** After this, proceed to **Step 5: Match and Summarize**. Recommend **AFFP** as the primary option (especially if they are registered) and **AGRISENSO Plus** as a secondary, more general option. You MUST note that RSBSA registration is a critical requirement for AFFP.

**Step 3 (Individual, if "Pagbili ng makinarya")**
*   **Condition:** User chose "Pagbili ng makinarya".
*   **Action:** Immediately proceed to **Step 5: Match and Summarize** and recommend the **Agri-Mechanization Financing Program**.

**Step 3 (Individual, if "Pangkalahatang suporta")**
*   **Condition:** User chose "Pangkalahatang suporta".
*   **Action:** Immediately proceed to **Step 5: Match and Summarize** and recommend the **AGRISENSO Plus Lending Program** as it is the most comprehensive.

---
**Branch: "Kooperatiba o Asosasyon"**

**Step 2 (Co-op): Purpose**
*   **Condition:** User chose "Kooperatiba o Asosasyon".
*   **Action:** Ask the cooperative's main goal.
*   **Question Text:** "Maraming salamat. Ano po ang pangunahing layunin ng uutangin ng inyong grupo?"
*   **Choices:** ["Pang-recover mula sa kalamidad", "Pag-aalaga ng baboy (swine repopulation)", "Proyektong pangisdaan (aquaculture/commercial vessel)", "Proyektong may DTI endorsement (cacao, kape, atbp.)"]
*   **Logic:** Based on the answer, proceed to **Step 5: Match and Summarize** and recommend the corresponding program (ARISE-ARBs, SWINE, SALP/Fishing Vessel, or RAPID Growth).

---
**(Branches for MSME and LGU remain the same)**

**Branch: "MSME (Negosyo)"**
*   **Step 2 (MSME):** Ask "Sa anong larangan po ang inyong negosyong pang-agrikultura?" with choices leading to AGRISENSO Plus, Poultry, MILK, or Fishing Vessel, then proceed to **Step 5**.

**Branch: "LGU (Local Government Unit)"**
*   **Step 2 (LGU):** Ask "Anong proyekto po ang plano ng inyong LGU?" with choices leading to Palay ng Lalawigan or other projects, then proceed to **Step 5**.

---
**Step 5: Match and Summarize**
*   **Condition:** After enough information is gathered from any branch.
*   **Action:** Stop asking questions. Change the response \`type\` to \`diagnosis\`. Recommend the single most suitable program from your knowledge base.
*   **Content:** You MUST format the recommendation as a **"Loan Program Profile"**. Use clear Markdown headers for each section. The profile must include:
    *   **Pangalan ng Programa:** (The name of the loan program)
    *   **Layunin:** (A summary of its purpose)
    *   **Sino ang Pwedeng Umasa (Eligible Borrowers):** (Who is eligible)
    *   **Mga Pangunahing Kondisyon (Key Conditions):** (Any key requirements)
*   **Disclaimer:** Always end your final recommendation with a header **"Mahalagang Paalala"** followed by the text: "Ang impormasyong ito ay paunang gabay lamang. Para sa opisyal na listahan ng mga requirement at proseso ng aplikasyon, mangyaring makipag-ugnayan sa pinakamalapit na branch ng Landbank."`;

      const knowledgeBase = `
---
### **LANDBANK LOAN PROGRAM KNOWLEDGE BASE**

#### 1. AGRISENSO Plus Lending Program
*   **Purpose:** A comprehensive credit facility for the entire agricultural value chain, including crop/fisheries production, farm inputs, equipment, post-harvest facilities, and working capital.
*   **Eligible Borrowers:**
    *   Small Farmers and Fishers (SFFs) & Agrarian Reform Beneficiaries (ARBs)
    *   Micro, Small, and Medium Enterprises (MSMEs)
    *   Farmer/Fisherfolk Cooperatives (FFCAs) & ARBOs
    *   Large Enterprises/Anchor Firms
    *   Agriculture Graduates (within 3 years of graduation)
*   **Key Conditions:** Must have a viable project with positive cash flow. No adverse credit history. For SFFs/ARBs, age must be 18-65.

#### 2. RAPID Growth Credit Facility
*   **Purpose:** A partnership with DTI to finance agro-enterprise projects in priority crops like cacao, coconut, coffee, and processed fruits/nuts.
*   **Eligible Borrowers:** Groups and businesses endorsed by DTI.
    *   Cooperatives and Farmers' Associations
    *   Non-Government Organizations (NGOs)
    *   MSMEs
*   **Key Conditions:** Must have DTI endorsement and pass LBP's risk criteria (RAAC). Project must have market linkages.

#### 3. Palay ng Lalawigan
*   **Purpose:** A joint LBP-DA initiative for Local Government Units (LGUs) to purchase palay from farmers, stabilizing prices.
*   **Eligible Borrowers:** Provincial, city, or municipal LGUs in palay-producing provinces.
*   **Key Conditions:** Must be in an area with low palay prices certified by DA. Must have a clean audit/credit history.

#### 4. Financing Program for Commercial Fishing Vessel
*   **Purpose:** To support operators in acquiring commercial fishing vessels (3.1 gross tons and up) for domestic or overseas use.
*   **Eligible Borrowers:** Direct borrowers (not for relending).
    *   Single Proprietorships, Partnerships, Cooperatives, Corporations (including SMEs).
*   **Key Conditions:** Must have a viable plan and vessel must meet MARINA standards. Requires at least 20% equity.

#### 5. Sustainable Aquaculture Lending Program (SALP)
*   **Purpose:** To strengthen the aquaculture/mariculture value chain (hatchery, grow-out, seaweed, processing, trading).
*   **Eligible Borrowers:** Conduits for value chain integration.
    *   Cooperatives/Federations, Associations/NGOs
    *   MSMEs, Large Entities
    *   Financial Institutions for rediscounting
*   **Key Conditions:** Project must be in the fisheries value chain. Must have a business relationship with institutional buyers/processors. Requires at least 20% equity.

#### 6. ARISE-ARBs Program
*   **Purpose:** Joint LBP-DAR program providing contingent credit for disaster recovery (typhoons, floods, pests, etc.) for ARBs and Small Farm Holders (SFHs).
*   **Eligible Borrowers:** Conduit entities (no direct individual applications).
    *   ARB Cooperatives
    *   Farmers' Associations with ARB members
*   **Key Conditions:** Must be located in a DAR/LBP-identified calamity-declared area. Must have a viable recovery plan. Sub-borrowers must have at least 30% loss in assets/production.

#### 7. SWINE Lending Program
*   **Purpose:** LBP-DA partnership to support swine production and repopulation post-African Swine Fever (ASF).
*   **Eligible Borrowers:** Conduits for hog industry stakeholders.
    *   Cooperatives or Farmers' Associations
    *   SMEs in swine production
*   **Key Conditions:** Farm must be in an ASF-quarantine-free area certified by BAI/DA. Must have a viable farm plan with biosecurity. Requires at least 20% equity.

#### 8. Agricultural and Fishers Financing Program (AFFP)
*   **Purpose:** LBP-DA-ACPC tie-up for formal credit to unbanked Small Farmers and Fishers (SFFs) for production and livelihood.
*   **Eligible Borrowers:** Direct to individuals.
    *   Individual Small Farmers and Fishers (SFFs)
*   **Key Conditions:** Must be engaged in agri/fisheries with marketable output. Must be registered with RSBSA or FishR. Must be 18+ years old.

#### 9. Agri-Mechanization Financing Program
*   **Purpose:** To fund equipment and facilities for mechanization to improve productivity (e.g., tractors, harvesters).
*   **Eligible Borrowers:**
    *   Individual Small Farm Holders
    *   SMEs, Cooperatives, Farmers' Associations
    *   Large Agribusiness Enterprises
*   **Key Conditions:** Must have a viable mechanization plan. Requires at least 20% equity.

#### 10. Climate Resilient Agriculture Financing Program
*   **Purpose:** To promote adaptation and mitigation technologies in vulnerable areas (e.g., resilient crops, irrigation).
*   **Eligible Borrowers:** Borrowers in vulnerable regions.
    *   Cooperatives, Associations
    *   Private Borrowers (proprietorships, partnerships, corporations)
*   **Key Conditions:** Projects must be in a climate-affected areas with resilient tech. Requires 15-20% equity.

#### 11. Coco-Financing Program
*   **Purpose:** Extends credit to coconut farmers and organizations for production, processing, and relending.
*   **Eligible Borrowers:** Direct and group borrowers in the coconut industry.
    *   Individual Coconut Farmers
    *   Cooperatives and Associations of Coconut Farmers
*   **Key Conditions:** Poor/marginalized farmers are prioritized. Requires at least 10% equity.

#### 12. Poultry Lending Program
*   **Purpose:** Supports sustainable broiler/layer production, funding climate-controlled buildings and equipment.
*   **Eligible Borrowers:** Stakeholders in poultry.
    *   Cooperatives, MSMEs
*   **Key Conditions:** Must have a sustainable plan with biosecurity measures. Requires at least 15% equity.

#### 13. MILK Program
*   **Purpose:** LBP-National Dairy Authority (NDA) partnership to finance dairy activities (production, processing, marketing).
*   **Eligable Borrowers:** Dairy stakeholders.
    *   Dairy Cooperatives with processing capacity
    *   Individual Dairy Farmers
    *   SMEs, Large Enterprises, Rural Banks
*   **Key Conditions:** Must be engaged in the dairy value chain. Requires NDA endorsement and 20% equity.
`;

    return `${preamble}\n\n${loanScreenerInstructions}\n\n${knowledgeBase}`;
};


const getSystemInstruction = (audience: Audience, dialect: string, isCondensed: boolean, flowType: FlowType): string => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const FERTILIZER_KNOWLEDGE_BASE = `
# Comprehensive Guide to Fertilizers in the Philippines

## 1. Understanding N-P-K
- **N (Nitrogen):** For vegetative growth (dahon). Promotes green, leafy growth. Deficiency: Yellowing (chlorosis) of older leaves.
- **P (Phosphorus):** For root development and flowering/fruiting (ugat at bunga). Essential for energy transfer. Deficiency: Stunted growth, purplish discoloration.
- **K (Potassium):** For overall plant health, disease resistance, and fruit quality (tibay at kalidad). Deficiency: Yellowing along the edges of older leaves.

## 2. Chemical / Inorganic Fertilizers
- **Urea (46-0-0):**
  - **Use:** Primary source of Nitrogen. Ideal for vegetative stage.
  - **Rate:** 1-2 bags/ha (50-100 kg) for topdressing.
- **Ammonium Sulfate (Ammosul) (21-0-0):**
  - **Use:** Nitrogen source. More resistant to leaching than Urea. Acidifies the soil slightly.
  - **Rate:** 2-3 bags/ha.
- **Complete Fertilizer (14-14-14):**
  - **Use:** Balanced N-P-K. Excellent for basal application (sa paghanda ng lupa) and for leafy vegetables.
  - **Rate:** 3-5 bags/ha for basal. 1-2 tablespoon/plant for side-dressing.
- **16-20-0:**
  - **Use:** High in N and P. Good for basal application in rice and corn to boost root and early plant growth.
  - **Rate:** 2-4 bags/ha.
- **Muriate of Potash (MOP) (0-0-60):**
  - **Use:** Primary source of Potassium. Applied during flowering/fruiting stage.
  - **Rate:** 1-2 bags/ha.
- **Solophos / Single Superphosphate (0-18-0):**
  - **Use:** Source of Phosphorus. Often used in basal application.
  - **Rate:** 2-4 bags/ha.

## 3. Organic Fertilizers & Amendments
- **Vermicompost:**
  - **Use:** Excellent soil conditioner and source of balanced nutrients. Improves soil structure and water retention.
  - **Rate:** 1-2 tons/ha for basal. 1-2 cups per plant.
- **Chicken Manure (Dung):**
  - **Use:** High in Nitrogen. Must be well-composted to avoid burning plants.
  - **Rate:** 1-3 tons/ha.
- **Fermented Plant Juice (FPJ) & Fermented Fruit Juice (FFJ):**
  - **Use:** Foliar spray. FPJ (from kangkong, banana stem) for vegetative growth (N). FFJ (from mango, papaya, banana) for flowering/fruiting (K).
  - **Rate:** Mix 2 tablespoons per liter of water. Spray weekly.
- **Rice Hull Ash:**
  - **Use:** Source of Potassium and Silica. Improves soil aeration.
  - **Rate:** Incorporate into soil during land prep.

## 4. General Fertilization Principles for Key Crop Types
- **Rice (Palay):**
  - **Basal (10-14 days before transplant):** 2-4 bags 16-20-0 + 1-2 bags 0-0-60.
  - **Tillering (15-30 DAT):** 1-2 bags Urea.
  - **Panicle Initiation (45-50 DAT):** 1-2 bags Urea + 1 bag 0-0-60.
- **Corn (Mais):**
  - **Basal:** 4 bags 14-14-14 or 16-20-0.
  - **Side-dress (30 DAP):** 2-3 bags Urea.
- **Leafy Vegetables (Pechay, Lettuce, Cabbage):**
  - **Basal:** 3-5 bags 14-14-14 or 1-2 tons/ha vermicompost.
  - **Side-dress (every 2 weeks):** 1-2 bags Urea, or foliar spray of ba;anced nutrient mix, micronutrients or FPJ.
- **Fruit-bearing Vegetables (Tomato, Eggplant, Chili):**
  - **Basal:** 3-5 bags 14-14-14.
  - **Flowering Stage:** Start side-dressing with 14-14-14 (1 tsp/plant).
  - **Fruiting Stage:** Supplement with Muriate of Potash 0-0-60 (5 to 10g/plant) and FFJ or K-rich foliar spray as optional booster.
- **Root Crops (Carrot, Potato):**
  - **Basal:** Low Nitrogen, high Phosphorus and Potassium. e.g., 2-3 bags 14-14-14.
  - **Tuber Formation:** Side-dress with Muriate of Potash. Avoid high N to prevent excessive leaf growth at the expense of tubers.
`;


  const CROP_PROTECTION_DOCUMENT = `
Comprehensive List of Pesticides, Fungicides, and Bactericides in the Philippines
🐛 Mga Insecticide / Pesticide (laban peste)
1. Brown Planthopper (BPH) & Small Brown Planthopper (Palay)
Brand names: Confidor SL 200 (Imidacloprid), Applaud 25 WP (Buprofezin), Regent 4 SC (Fipronil), Virtako (Chlorantraniliprole + Thiamethoxam), Dinotefuran 20 SG (Starkle)
Dosage: 200–250 mL/ha (Imidacloprid); 300–400 g/ha (Buprofezin); 200–300 mL/ha (Fipronil); 150–200 mL/ha (Virtako); 100–150 g/ha (Dinotefuran)
Notes: Threshold: 5–10 hoppers/hill. Spot spray. Bio: Cyrtorhinus lividipennis (mirid bug).
2. Striped & Whitebacked Stemborer (Palay)
Brand names: Ferterra 50 SP (Cartap hydrochloride), Coragen 200 SC (Chlorantraniliprole), Laser 240 EC (Fipronil), Virtako, Padan 50 SP (Cartap)
Dosage: 10–15 kg/ha granular (Cartap); 150–200 mL/ha (Chlorantraniliprole); 300–400 mL/ha (Fipronil)
Notes: Egg/larva stage (20–30 DAT). Cultural: Destroy stubble.
3. Leaffolder & Whorl Maggot (Palay)
Brand names: Karate 2.5 EC (Lambda-cyhalothrin), Decis 2.5 EC (Deltamethrin), Mospilan 20 SP (Acetamidprid), Brodan 31.5 EC (Chlorpyrifos + BPMC)
Dosage: 200–300 mL/ha (Lambda-cyhalothrin); 250 mL/ha (Deltamethrin); 100–150 g/ha (Acetamidprid); 1–1.5 L/ha (Brodan)
Notes: >20% leaf damage. Bio: Trichogramma japonicum.
4. Corn Borer & Fall Armyworm (FAW) (Mais)
Brand names: Ferterra 50 SP (Cartap), Prevathon 150 SC (Chlorantraniliprole), Coragen, Proclaim 5 WG (Emamectin benzoate), Avaunt 15 EC (Indoxacarb)
Dosage: 10–15 kg/ha granular (Cartap); 150 mL/ha (Chlorantraniliprole); 100–150 g/ha (Emamectin); 200 mL/ha (Indoxacarb)
Notes: 20% infested. IPM: Bt corn, push-pull (Desmodium).
5. Aphids & Thrips (Gulay: Tomato, Eggplant, Chili)
Brand names: Confidor SL 200, Actara 25 WG (Thiamethoxam), Pegasus 500 SC (Diafenthiuron), Admire 70 WG (Imidacloprid)
Dosage: 200 mL/ha (Imidacloprid); 100–150 g/ha (Thiamethoxam); 300–400 mL/ha (Diafenthiuron)
Notes: 10% plants. Yellow sticky traps, neem oil.
6. Fruit Fly (Mango, Guava, Papaya, Melon)
Brand names: GF-120 NF (Spinosad + protein), Success 25 SC (Spinosad), Malathion 57 EC + bait, Rocket 120 OD (Spinosad), Lebaycid 50 EC (Fenthion)
Dosage: 1.0–1.5 L/ha spot (Spinosad); 1 L/ha (Malathion); 1 L/ha (Fenthion)
Notes: Methyl eugenol/cue-lure traps (1/0.5 ha). Bury fruits.
7. Mealybugs & Scale Insects (Durian, Cacao, Lanzones)
Brand names: Applaud 25 WP (Buprofezin), Confidor, Actellic 50 EC (Pirimiphos-methyl), Ultracide 40 EC (Methidathion)
Dosage: 300–400 g/ha (Buprofezin); 200 mL/ha (Imidacloprid); 1 L/ha (Methidathion)
Notes: Target crawlers. Bio: Coccinellid beetles.
8. Diamondback Moth (Leafy: Cabbage, Pechay, Broccoli)
Brand names: Stampede 5 SC (Chlorantraniliprole), Proclaim 5 WG (Emamectin benzoate), Lannate 40 SP (Methomyl), Karate 2.5 EC
Dosage: 150 mL/ha (Chlorantraniliprole); 100–150 g/ha (Emamectin); 200–300 g/ha (Methomyl); 200 mL/ha (Lambda)
Notes: 1 larva/plant. Bio: Bt kurstaki, Cotesia plutellae.
9. Cabbage Looper (Leafy: Cabbage, Lettuce, Mustard)
Brand names: Coragen 200 SC, Avaunt 15 EC (Indoxacarb), Sevin 85 WP (Carbaryl), Entrust 80 WP (Spinosad)
Dosage: 150–200 mL/ha (Chlorantraniliprole); 200 mL/ha (Indoxacarb); 1–2 kg/ha (Carbaryl); 100 g/ha (Spinosad)
Notes: >15% defoliation. Handpick eggs.
10. Cutworms (Leafy & Root: Pechay, Lettuce, Carrot)
Brand names: Decis 2.5 EC (Deltamethrin), Virtako 40 WG, Ferterra, Dursban 20 EC (Chlorpyrifos)
Dosage: 250 mL/ha (Deltamethrin); 150 g/ha (Virtako); 10 kg/ha (Cartap); 2 L/ha (Chlorpyrifos)
Notes: Soil baits. Night scouting.
11. Leaf Miners (Leafy: Spinach, Lettuce, Pechay)
Brand names: Trigger 2.5 EC (Cyromazine), Actara 25 WG, Mospilan, Agrimek 1.8 EC (Abamectin)
Dosage: 300 mL/ha (Cyromazine); 100 g/ha (Thiamethoxam); 150 g/ha (Acetamidprid); 200 mL/ha (Abamectin)
Notes: Remove mined leaves. Bio: Diglyphus isaea.
12. Potato Tuber Moth (Root: Potato, Sweet Potato)
Brand names: Regent 4 SC (Fipronil), Coragen, Lannate, Actellic 50 EC
Dosage: 200–300 mL/ha (Fipronil); 150 mL/ha (Chlorantraniliprole); 200 g/ha (Methomyl)
Notes: Cover ridges. Storage pest control.
13. Wireworms & Click Beetles (Root: Carrot, Potato, Radish)
Brand names: Furadan 3G (Carbofuran, restricted), Lorsban 20 EC (Chlorpyrifos), Diazinon 10G, Mocap 10G (Ethoprophos)
Dosage: 10–15 kg/ha (Carbofuran); 2–3 L/ha (Chlorpyrifos); 15 kg/ha (Diazinon)
Notes: Pre-plant soil. Crop rotation.
14. Whiteflies (Leafy & Gulay: Lettuce, Tomato, Cabbage)
Brand names: Pegasus 500 SC, Confidor, Actellic, Oberon 240 SC (Spiromesifen)
Dosage: 300–400 mL/ha (Diafenthiuron); 200 mL/ha (Imidacloprid); 200 mL/ha (Spiromesifen)
Notes: Virus vector. Yellow traps.
15. Armyworm (Leafy & Mais: Pechay, Cabbage, Corn)
Brand names: Prevathon 150 SC, Proclaim, Karate, Alika 247 SC (Thiamethoxam + Lambda-cyhalothrin)
Dosage: 150 mL/ha (Chlorantraniliprole); 100 g/ha (Emamectin); 200 mL/ha (Alika)
Notes: Night scouting. Bio: NPV virus.
16. Spider Mites (Gulay & Leafy: Eggplant, Lettuce)
Brand names: Omite 57 EC (Propargite), Pegasus, Actellic, Floramite 50 SC (Bifenazate)
Dosage: 1–1.5 L/ha (Propargite); 300 mL/ha (Diafenthiuron); 200 mL/ha (Bifenazate)
Notes: Dry season. Increase humidity.
17. Root-Knot Nematodes (Root: Carrot, Sweet Potato, Potato)
Brand names: Rugby 10G (Cadusafos), Nemathorin 10G (Fosthiazate), Vydate L (Oxamyl)
Dosage: 10–20 kg/ha (Cadusafos); 15 kg/ha (Fosthiazate); 2 L/ha (Oxamyl)
Notes: Marigold intercropping. Soil solarization.
18. Flea Beetles (Leafy: Kangkong, Mustard, Radish leaves)
Brand names: Sevin 85 WP (Carbaryl), Decis, Karate, Fastac 10 EC (Alpha-cypermethrin)
Dosage: 1–2 kg/ha (Carbaryl); 250 mL/ha (Deltamethrin); 200 mL/ha (Alpha-cypermethrin)
Notes: Early season. Row covers.
19. Leafhoppers (Leafy & Gulay: Pechay, Tomato, Beans)
Brand names: Admire 70 WG (Imidacloprid), Actara, Mospilan, Dinotefuran (Starkle)
Dosage: 100–150 g/ha (Imidacloprid); 100 g/ha (Thiamethoxam); 100 g/ha (Dinotefuran)
Notes: Virus vector. Reflective mulch.
20. Sweet Potato Weevil (Root: Sweet Potato)
Brand names: Regent 4 SC (Fipronil), Lorsban 20 EC, Ferterra, Actellic
Dosage: 200–300 mL/ha (Fipronil); 2 L/ha (Chlorpyrifos); 10 kg/ha (Cartap)
Notes: Crop rotation. Clean vines.
21. Cucumber Beetle (Gulay & Leafy: Cucumber, Kangkong)
Brand names: Sevin, Karate, Fastac, Coragen
Dosage: 1–2 kg/ha (Carbaryl); 200 mL/ha (Lambda); 150 mL/ha (Chlorantraniliprole)
Notes: Trellising. Trap crops (squash).
22. Red-Striped Soft Scale (RSSI) (Pulvinaria tenuivalvata, Tubo) 
Brand names: Confidor SL 200 (Imidacloprid), Virtako 40 WG (Thiamethoxam + Chlorantraniliprole), Applaud 25 WP (Buprofezin) 
Dosage: 200–250 mL/ha (Imidacloprid); 150–200 g/ha (Virtako); 300-400 g/ha (Buprofezin) 
Notes: New pest (Luzon/Negros). Target nymphs. Bio: Ladybugs, parasitic wasps.
23. White Grubs (Leucopholis irrorata, Tubo) 
Brand names: Coragen (Chlorantraniliprole), Lorsban / Dursban 20 EC (Chlorpyrifos), Ferterra (Cartap) 
Dosage: 150–200 mL/ha (Coragen); 2–3 L/ha (Chlorpyrifos); 10-20 kg/ha (Cartap, granular) 
Notes: Soil application. Apply at planting or start of rainy season. Bio: Nematodes (Steinernema).
24. Sugarcane Borers (Early shoot, Internode, Top borers, Tubo) 
Brand names: Coragen 18.5 SC (Chlorantraniliprole), Virtako 40 WG, Prevathon, Fastac (Alpha-cypermethrin) 
Dosage: 150–200 mL/ha (Chlorantraniliprole); 150 g/ha (Virtako); 200 mL/ha (Fastac) 
Notes: Target young larvae. Bio: Trichogramma wasps. Remove "dead hearts."
25. Sugarcane Aphids & Mealybugs (Saccharicoccus, Melanaphis, Tubo) 
Brand names: Confidor SL 200 (Imidacloprid), Regent 5 SC (Fipronil), Actara 25 WG (Thiamethoxam) 
Dosage: 200 mL/ha (Imidacloprid); 200–300 mL/ha (Fipronil); 100 g/ha (Thiamethoxam) 
Notes: Causes sooty mold. Bio: Ladybugs, lacewings.
26. Sugarcane Woolly Aphid (Ceratovacuna lanigera, Tubo) 
Brand names: Confidor SL 200, Perfekthion (Dimethoate), Actara, Regent 
Dosage: 200 mL/ha (Imidacloprid); 1 L/ha (Dimethoate); 100 g/ha (Thiamethoxam) 
Notes: White woolly patches. Avoid excess Nitrogen. Bio: Syrphid flies.


🍄 Mga Fungicide (laban sa fungal diseases)
1. Rice Blast (Magnaporthe oryzae, Palay)
Brand names: Nativo 300 SC (Tebuconazole + Trifloxystrobin), Tilt 250 EC (Propiconazole), Amistar 250 SC (Azoxystrobin), Score 250 EC (Difenoconazole), Bavistin 500 SC (Carbendazim)
Dosage: 300 mL/ha (Nativo); 300–400 mL/ha (Tilt); 500 mL/ha (Azoxystrobin); 250 mL/ha (Difenoconazole)
Notes: Boot leaf stage. Resistant vars (NSIC Rc222).
2. Sheath Blight (Rhizoctonia solani, Palay)
Brand names: Ronilan 50 WP (Iprodione), Cabrio 20 SC (Pyraclostrobin), Antracol 70 WP (Propineb), Validacin 5 EC (Validamycin)
Dosage: 500–600 g/ha (Iprodione); 300 mL/ha (Pyraclostrobin); 1.5–2 kg/ha (Propineb); 1 L/ha (Validamycin)
Notes: 25% hill incidence. Avoid excess N.
3. Downy Mildew (Peronosclerospora philippinensis, Mais & Gulay)
Brand names: Ridomil Gold 68 WG (Metalaxyl-M + Mancozeb), Apron 50 WP (Metalaxyl), Amistar 250 SC, Revus 250 SC (Mandipropamid)
Dosage: 1.5–2.0 kg/ha (Ridomil); 500 mL/ha (Azoxystrobin); 300 mL/ha (Mandipropamid)
Notes: Seed treatment + foliar. Resistant hybrids.
4. Anthracnose (Colletotrichum spp., Mango, Chili, Beans)
Brand names: Dithane M-45 (Mancozeb), Kocide 2000 (Copper hydroxide), Luna Sensation 500 SC (Fluopyram + Trifloxystrobin), Bellis 38 WG (Boscalid + Pyraclostrobin)
Dosage: 2–2.5 kg/ha (Mancozeb); 1.5–2 kg/ha (Copper); 300–400 mL/ha (Luna); 500 g/ha (Bellis)
Notes: Wet season sprays every 10-14 days.
5. Phytophthora Root Rot & Canker (Durian, Jackfruit, Cacao)
Brand names: Aliette 80 WG (Fosetyl-Al), Acrobat 50 WP (Dimethomorph), Ridomil Gold, Agri-Fos (Phosphorous acid)
Dosage: 2.5–3.0 kg/ha drench (Fosetyl-Al); 2 kg/ha (Ridomil); 2 L/ha (Agri-Fos)
Notes: Drench base. Improve drainage.
6. Powdery Mildew (Gulay: Squash, Cucumber, Leafy: Mustard)
Brand names: Topas 100 EC (Penconazole), Sulfur 80 WP (Thiovit Jet), Serenade ASO (Bacillus subtilis), Rally 40 WSP (Myclobutanil)
Dosage: 200–300 mL/ha (Penconazole); 2–3 kg/ha (Sulfur); 2 L/ha (Serenade); 200 g/ha (Myclobutanil)
Notes: Early sprays. Reflective mulches.
7. Late Blight (Phytophthora infestans, Root: Potato, Tomato)
Brand names: Ridomil Gold, Opus 12.5 SC (Epoxiconazole), Cumora 50 SC (Cymoxanil), Infinito 68.75 SC (Fluopicolide + Propamocarb)
Dosage: 1.5–2 kg/ha (Ridomil); 500 mL/ha (Opus); 300 mL/ha (Cumora); 1.2 L/ha (Infinito)
Notes: Cool, wet weather. Resistant vars (Granola).
8. Alternaria Leaf Spot (Alternaria spp., Leafy: Cabbage, Carrot leaves)
Brand names: Score 250 EC (Difenoconazole), Cabrio 25 EC, Polyram 70 DF (Metiram), Quadris 25 SC (Azoxystrobin)
Dosage: 250 mL/ha (Difenoconazole); 300 mL/ha (Cabrio); 2 kg/ha (Polyram); 500 mL/ha (Quadris)
Notes: Crop rotation. Air circulation.
9. White Rust (Albugo candida, Leafy: Mustard, Radish leaves)
Brand names: Amistar 25 SC, Ridomil Gold, Antracol 70 WP, Aliette
Dosage: 500 mL/ha (Azoxystrobin); 1.5 kg/ha (Ridomil); 2 kg/ha (Antracol); 2.5 kg/ha (Aliette)
Notes: Humid conditions. Remove infected.
10. Root Rot (Pythium/Fusarium, Root: Carrot, Sweet Potato)
Brand names: Previcur N (Propamocarb), Aliette, Kumulus 80 DF (Sulfur), Rizolex 50 WP (Tolclofos-methyl)
Dosage: 2 L/ha drench (Propamocarb); 2.5 kg/ha (Aliette); 3 kg/ha (Sulfur); 500 g/ha (Rizolex)
Notes: Well-drained soil. Bio: Trichoderma.
11. Damping Off (Pythium spp., Seedlings: Leafy & Root)
Brand names: Apron 50 WP (Metalaxyl), Serenade, Dithane, Captan 50 WP
Dosage: 2 g/kg seed (Metalaxyl); 2 L/ha (Serenade); 1.5 kg/ha (Dithane); 2 kg/ha (Captan)
Notes: Sterile seedling beds.
12. Black Scurf (Rhizoctonia solani, Root: Potato)
Brand names: Monceren 25 WP (Pencycuron), Rovral 50 WP (Iprodione), Pointer 250 SC (Flutolanil), Maxim 100 FS (Fludioxonil)
Dosage: 500 g/ha (Pencycuron); 600 g/ha (Iprodione); 300 mL/ha (Flutolanil); 100 mL/100 kg seed (Maxim)
Notes: Seed treatment. Crop rotation.
13. Fusarium Wilt (Fusarium oxysporum, Gulay & Root: Tomato, Sweet Potato)
Brand names: Bavistin (Carbendazim), Topsin M (Thiophanate-methyl), Gezeko 75 WG (Tebuconazole + Trifloxystrobin), Benlate 50 WP (Benomyl)
Dosage: 300 mL/ha (Carbendazim); 500 g/ha (Thiophanate-methyl); 300 g/ha (Gezeko); 500 g/ha (Benomyl)
Notes: Soil solarization. Resistant grafts.
14. Gray Mold (Botrytis cinerea, Leafy: Lettuce, Strawberry)
Brand names: Rovral Aquaflo 50 SC (Iprodione), Switch 62.5 WG (Cyprodinil + Fludioxonil), Cabrio, Scala 40 SC (Pyrimethanil)
Dosage: 1 L/ha (Iprodione); 800 g/ha (Switch); 300 mL/ha (Cabrio); 1 L/ha (Scala)
Notes: Reduce humidity. Prune.
15. Sclerotinia Stem Rot (Sclerotinia sclerotiorum, Leafy: Cabbage, Carrot)
Brand names: Contans WG (Coniothyrium minitans, bio), Ronilan, Omega 45 EW (Fluazinam), Sumisclex 50 WP (Procymidone)
Dosage: 1 kg/ha (Contans); 500 g/ha (Iprodione); 1 L/ha (Fluazinam); 600 g/ha (Sumisclex)
Notes: Deep plowing. Wide spacing.
16. Clubroot (Plasmodiophora brassicae, Leafy: Cabbage, Broccoli)
Brand names: Kumulus (Sulfur), Aliette, Previcur, Ranman 40 SC (Cyazofamid)
Dosage: 3 kg/ha (Sulfur); 2.5 kg/ha (Aliette); 2 L/ha (Previcur); 200 mL/ha (Ranman)
Notes: Lime soil to pH 7.2. Resistant vars.
17. Early Blight (Alternaria solani, Root: Potato, Tomato)
Brand names: Dithane M-45, Score 250 EC, Antracol, Bravo 720 SC (Chlorothalonil)
Dosage: 2 kg/ha (Mancozeb); 250 mL/ha (Difenoconazole); 2 kg/ha (Antracol); 1.5 L/ha (Bravo)
Notes: Alternate fungicides. Remove debris.
18. Cercospora Leaf Spot (Cercospora spp., Leafy: Kangkong, Spinach)
Brand names: Amistar, Carbendazim, Score, Kocide (Copper hydroxide)
Dosage: 500 mL/ha (Azoxystrobin); 300 mL/ha (Carbendazim); 250 mL/ha (Difenoconazole); 2 kg/ha (Copper)
Notes: Humid areas. Wider spacing.
19. Rust (Puccinia spp., Leafy: Onion, Garlic leaves)
Brand names: Folicur 25 EC (Tebuconazole), Tilt, Cabrio, Sulfur
Dosage: 300 mL/ha (Tebuconazole); 300 mL/ha (Propiconazole); 300 mL/ha (Cabrio); 3 kg/ha (Sulfur)
Notes: Early season sprays. Resistant vars.
20. Leaf Mold (Fulvia fulva, Gulay: Tomato, leafy analogs)
Brand names: Bravo 720 SC, Dithane, Score, Switch
Dosage: 1.5 L/ha (Chlorothalonil); 2 kg/ha (Mancozeb); 250 mL/ha (Difenoconazole); 800 g/ha (Switch)
Notes: Greenhouse ventilation.
21. Downy Mildew (Bremia lactucae, Leafy: Lettuce)
Brand names: Revus, Ridomil Gold, Aliette, Acrobat
Dosage: 300 mL/ha (Mandipropamid); 1.5 kg/ha (Ridomil); 2.5 kg/ha (Aliette); 1 L/ha (Acrobat)
Notes: Avoid overhead irrigation.
22. Sugarcane Red Rot (Colletotrichum falcatum, Tubo) 
Brand names: Bavistin 500 SC (Carbendazim), Topsin M 70 WP (Thiophanate-methyl), Folicur 25 EC (Tebuconazole), Dithane M-45 (Mancozeb) 
Dosage: 1.5–2.0 L/ha (Carbendazim); 1.0–1.5 kg/ha (Thiophanate-methyl); 500 mL/ha (Tebuconazole) 
Notes: Sett dip (hot water + fungicide). Resistant vars (Phil 2000 series). Good drainage.
23. Sugarcane Pokkah Boeng (Fusarium sacchari, Tubo) 
Brand names: Bavistin 500 SC (Carbendazim), Antracol 70 WP (Propineb), Kocide 2000 (Copper hydroxide), Dithane M-45 (Mancozeb) 
Dosage: 500 mL/ha (Carbendazim); 1.5–2 kg/ha (Propineb); 1.5–2 kg/ha (Copper); 2 kg/ha (Mancozeb) 
Notes: Foliar spray on young leaves. Spreads in humid weather. Resistant varieties.
24. Sugarcane Smut (Ustilago scitaminea, Tubo) & Corn Smut (Ustilago maydis, Mais) 
Brand names: Tilt 250 EC (Propiconazole), Folicur 25 EC (Tebuconazole), Score 250 EC (Difenoconazole), Bavistin (Carbendazim) 
Dosage: 500 mL/ha (Propiconazole); 500 mL/ha (Tebuconazole); 250 mL/ha (Difenoconazole) 
Notes: Sugarcane: Sett treatment, rogueing (remove/burn whips). Corn: Remove galls before bursting. Resistant vars.

🦠 Mga Bactericide (laban bacterial diseases)
1. Bacterial Leaf Blight (Xanthomonas oryzae, Palay)
Brand names: Kasumin 2L (Kasugamycin), Agri-Mycin 17 WP (Streptomycin + Tetracycline), BLB Stopper 20 SC (Thiodiazole Copper), Copper Oxychloride 50 WP (Cuprofix)
Dosage: 1.0–1.5 L/ha (Kasugamycin); 200–300 g/ha (Agri-Mycin); 300–400 mL/ha (BLB Stopper)
Notes: Tillering sprays. Resistant vars (NSIC Rc154).
2. Bacterial Wilt (Ralstonia solanacearum, Gulay: Tomato, Eggplant, Pepper)
Brand names: Kocide 101 WP (Copper hydroxide) + Agri-Mycin, Streptomycin sulfate, BLB Stopper
Dosage: 2.0–2.5 kg/ha drench (Copper); 200 g/ha (Streptomycin); 300 mL/ha (BLB Stopper)
Notes: Grafting, solarization.
3. Bacterial Soft Rot (Erwinia carotovora, Leafy & Root: Cabbage, Carrot, Potato)
Brand names: Kocide 2000, Bacterol (Copper-based), Agri-Mycin, Nordox 75 WG (Copper oxide)
Dosage: 1.5–2 kg/ha (Copper); 200 g/ha (Agri-Mycin); 2 kg/ha (Nordox)
Notes: Dry storage. Avoid wounds.
4. Bacterial Spot (Xanthomonas campestris, Gulay: Tomato, Pepper)
Brand names: Cuprofix (Copper oxychloride), Kasumin, Nordox, Champion 77 WP (Copper hydroxide)
Dosage: 2 kg/ha (Cuprofix); 1 L/ha (Kasugamycin); 2 kg/ha (Champion)
Notes: Seed treatment. Preventive sprays.
5. Black Rot (Xanthomonas campestris pv. campestris, Leafy: Cabbage, Broccoli)
Brand names: Kocide, Agri-Mycin, Copper Sulfate (Bluestone), Cupravit (Copper oxychloride)
Dosage: 2 kg/ha (Kocide); 200 g/ha (Agri-Mycin); 1.5 kg/ha (Bluestone)
Notes: Hot water seed treatment. Rotate crops.
6. Bacterial Leaf Spot (Pseudomonas syringae, Leafy: Lettuce, Pechay)
Brand names: Cupravit, Kasumin, Serenade (Bacillus subtilis), Nordox
Dosage: 1.5 kg/ha (Cupravit); 1 L/ha (Kasugamycin); 2 L/ha (Serenade); 2 kg/ha (Nordox)
Notes: Avoid overhead irrigation.
7. Angular Leaf Spot (Pseudomonas syringae pv. lachrymans, Gulay: Cucumber)
Brand names: Nordox, Agri-Mycin, BLB Stopper, Kocide
Dosage: 2 kg/ha (Nordox); 200 g/ha (Agri-Mycin); 300 mL/ha (BLB Stopper)
Notes: Trellising for air flow.
8. Bacterial Canker (Clavibacter michiganensis, Gulay: Tomato)
Brand names: Kocide + Streptomycin, Cuprofix, Bacterol, Champion
Dosage: 2 kg/ha mix (Copper + 200 g/ha Streptomycin); 2 kg/ha (Cuprofix)
Notes: Disinfect tools. Prune infected.
9. Crown Gall (Agrobacterium tumefaciens, Root: Carrot, Potato grafts)
Brand names: Gallex (Copper-based paste), NoGall (biological), Kocide drench, Copper Sulfate
Dosage: Paste (Gallex); 2 kg/ha drench (Kocide); 1.5 kg/ha (Copper Sulfate)
Notes: Avoid wounds. Soil treatment.
10. Fire Blight analog (Erwinia amylovora-like, Prutas: Guava, veggie analogs)
Brand names: Kasugamycin, Kocide, Agri-Mycin, Nordox
Dosage: 1 L/ha (Kasugamycin); 2 kg/ha (Copper); 200 g/ha (Agri-Mycin)
Notes: Prune. Humid areas.
11. Bacterial Ring Rot (Clavibacter michiganensis subsp. sepedonicus, Root: Potato)
Brand names: Streptomycin, Copper oxychloride, Bacterol, Cupravit
Dosage: 200 g/ha (Streptomycin); 2 kg/ha (Copper oxychloride); 1.5 kg/ha (Cupravit)
Notes: Certified seeds. Quarantine.
12. Common Scab (Streptomyces scabies, Root: Potato, Carrot)
Brand names: Kocide (preventive), Sulfur-based (Kumulus), Streptomycin mix, Nordox
Dosage: 2 kg/ha soil (Kocide); 3 kg/ha (Sulfur); 200 g/ha (Streptomycin)
Notes: Acidic soil adjustment.
13. Bacterial Head Rot (Erwinia, Leafy: Broccoli, Cabbage)
Brand names: Agri-Mycin, Nordox, Copper Sulfate, Champion
Dosage: 200 g/ha (Agri-Mycin); 2 kg/ha (Nordox); 1.5 kg/ha (Copper Sulfate)
Notes: Avoid overhead water.
14. Vascular Wilt (Ralstonia, Root: Sweet Potato)
Brand names: BLB Stopper, Kocide + Agri-Mycin, Cuprofix, Bacterol
Dosage: 300 mL/ha (BLB); 2 kg/ha (Kocide); 2 kg/ha (Cuprofix)
Notes: Biofumigation with mustard.
15. Leaf Scald (Xanthomonas albilineans analog, Leafy: Onion-like, Leeks)
Brand names: Kasumin, Cupravit, Serenade, Nordox
Dosage: 1 L/ha (Kasumin); 1.5 kg/ha (Cupravit); 2 L/ha (Serenade)
Notes: Clean seed selection.
16. Bacterial Ooze (Erwinia, Root: Radish, Carrot)
Brand names: Copper-based (Cuprofix), Kasugamycin, Kocide, Champion
Dosage: 2 kg/ha (Cuprofix); 1 L/ha (Kasugamycin); 2 kg/ha (Kocide)
Notes: Sanitation. Dry storage.
17. Bacterial Speck (Pseudomonas syringae pv. tomato, Gulay: Tomato)
Brand names: Kocide, Nordox, Agri-Mycin, BLB Stopper
Dosage: 2 kg/ha (Kocide); 2 kg/ha (Nordox); 200 g/ha (Agri-Mycin)
Notes: Seed treatment. Avoid wet leaves.
18. Soft Rot (Pectobacterium carotovorum, Root: Potato, Carrot)
Brand names: Copper Sulfate, Bacterol, Kocide, Agri-Mycin
Dosage: 1.5 kg/ha (Copper Sulfate); 2 kg/ha (Bacterol); 200 g/ha (Agri-Mycin)
Notes: Proper curing of roots.
19. Bacterial Blight (Pseudomonas, Leafy: Kangkong, Spinach)
Brand names: Cupravit, Kasumin, Nordox, Serenade
Dosage: 1.5 kg/ha (Cupravit); 1 L/ha (Kasugamycin); 2 kg/ha (Nordox)
Notes: Avoid overhead irrigation.
20. Gummy Stem Blight (bacterial analogs, Gulay: Cucumber, Melon)
Brand names: Kocide, Copper oxychloride, Agri-Mycin, BLB Stopper
Dosage: 2 kg/ha (Kocide); 2 kg/ha (Copper oxychloride); 200 g/ha (Agri-Mycin)
Notes: Trellising. Remove debris.
21. Bacterial Foot Rot (Erwinia, Root: Sweet Potato, Cassava)
Brand names: Copper Sulfate, Kocide, Bacterol, Nordox
Dosage: 1.5 kg/ha (Copper Sulfate); 2 kg/ha (Kocide); 2 kg/ha (Bacterol)
Notes: Well-drained soil. Crop rotation.

🧾 Quick Notes for Kuya
Rotation & IPM: Rotate chemical classes (e.g., neonicotinoids → diamides → spinosyns). Prioritize IPM: cultural (resistant vars like Red Pinoy potato, NSIC-approved leafy), biological (Bt, Trichoderma, Bacillus subtilis), then chemical. DA-ATI offers free IPM training.
Safety & Regulations: Use FPA-registered products only (check fpa.da.gov.ph, updated 2025). Wear PPE: mask, gloves, boots. PHI: 7–28 days, check labels to avoid residues. DA labs offer residue testing.
Matipid Tips: Spot spraying via drones (P10,000–20,000/ha for hire), pheromone traps (P500–1,000), community pest monitoring. Organic: Neem, garlic sprays, or bio-products like Serenade (P800–1,500/L).
Common Brands & Prices: Syngenta (Virtako, Amistar, P1,000–3,000/L), BASF (Stampede, Cabrio, P800–2,500), Bayer (Confidor, Antracol, P500–2,000), Dupont (Lannate), FMC (Rovral), local (Ferterra, P400–1,500). Check Agribusiness or local coops.
Regional Notes: Benguet (leafy/root) uses heavy cypermethrin, mancozeb—monitor residues for export. Mindanao: Focus on fruit/veggie compliance (e.g., GAP certification). Nueva Ecija: Palay pests peak in wet season (June–Oct).
Leafy/Root Specific: Kangkong, pechay prone to leafhoppers, soft rot in wet season. Potatoes, carrots need pre-plant soil treatment for wireworms, scab.

---

## 🐛 **Mga Organic Insecticide / Pesticide Alternatives (laban peste)**

### 1. **Brown Planthopper (BPH) & Small Brown Planthopper (Palay)**
   * **Organic options**: Neem oil spray (extract from neem leaves), Cow urine + neem mixture, Metarhizium anisopliae (bio-insecticide fungus)
   * **Dosage**: 1-2 L/ha neem oil (diluted 1:100 with water); 5-10 L/ha cow urine mix; 1-2 kg/ha Metarhizium spores
   * **Notes**: Spray sa early infestation. Promote natural enemies like spiders. ATI recipe: Ferment neem leaves for 7 days.

### 2. **Striped & Whitebacked Stemborer (Palay)**
   * **Organic options**: Trichogramma wasps (egg parasitoids), Bt (Bacillus thuringiensis) spray, Garlic-chili extract
   * **Dosage**: Release 50,000-100,000 Trichogramma/ha; 1-2 L/ha Bt (diluted); 2 L/ha garlic-chili mix
   * **Notes**: Release wasps sa egg stage. Cultural: Destroy stubble. Effective sa IPM trials ng PhilRice.

### 3. **Leaffolder & Whorl Maggot (Palay)**
   * **Organic options**: Bt kurstaki spray, Spinosad (from soil bacteria), Neem + soap emulsion
   * **Dosage**: 1 L/ha Bt; 200-300 mL/ha Spinosad (e.g., Entrust); 1-2 L/ha neem-soap
   * **Notes**: Target young larvae. Bio: Encourage birds. From DA IPM: Rotate with non-rice crops.

### 4. **Corn Borer & Fall Armyworm (FAW) (Mais)**
   * **Organic options**: Bt aizawai spray, NPV virus (Nuclear Polyhedrosis Virus), Chilli extract bait
   * **Dosage**: 1-2 L/ha Bt; 500 mL/ha NPV; 2 L/ha chilli spray
   * **Notes**: Apply sa whorl. IPM: Push-pull intercropping with napier grass. Proven sa Mindanao farms.

### 5. **Aphids & Thrips (Gulay: Tomato, Eggplant, Chili)**
   * **Organic options**: Insecticidal soap (potash-based), Neem oil, Garlic oil spray
   * **Dosage**: 1-2% soap solution (1-2 L/ha); 1 L/ha neem; 500 mL/ha garlic oil
   * **Notes**: Spray underside of leaves. Attract ladybugs. ATI: Use yellow sticky traps.

### 6. **Fruit Fly (Mango, Guava, Papaya, Melon)**
   * **Organic options**: Protein bait traps (with yeast + fruit), Spinosad bait, Tubli root extract (Derris elliptica)
   * **Dosage**: 1-2 traps/ha; 200 mL/ha Spinosad bait; 1-2 kg/ha tubli extract
   * **Notes**: Sanitation: Bury fruits. Traditional PH method: Tubli from Visayas farms.

### 7. **Mealybugs & Scale Insects (Durian, Cacao, Lanzones)**
   * **Organic options**: Neem oil + soap, Horticultural oil (coconut-based), Lady beetle release
   * **Dosage**: 1-2 L/ha neem-soap; 2% oil solution (1 L/ha)
   * **Notes**: Prune infested parts. Bio: Release Cryptolaemus beetles.

### 8. **Diamondback Moth (Leafy: Cabbage, Pechay, Broccoli)**
   * **Organic options**: Bt kurstaki, Spinosad, Garlic-chili-neem mix
   * **Dosage**: 1 L/ha Bt; 200 mL/ha Spinosad; 2 L/ha mix
   * **Notes**: Common sa Benguet. Rotate sprays. Bio: Cotesia parasitoids.

### 9. **Cabbage Looper (Leafy: Cabbage, Lettuce, Mustard)**
   * **Organic options**: Bt spray, Diatomaceous earth (DE) dust, Pyrethrum extract (from chrysanthemum)
   * **Dosage**: 1 L/ha Bt; 5-10 kg/ha DE; 200 mL/ha pyrethrum
   * **Notes**: Handpick eggs. Night application.

### 10. **Cutworms (Leafy & Root: Pechay, Lettuce, Carrot)**
   * **Organic options**: Bt soil drench, Nematodes (Steinernema), Wood ash barrier
   * **Dosage**: 1 L/ha Bt drench; 1-2 billion nematodes/ha; Scatter ash around base
   * **Notes**: Soil treatment pre-planting. Bait with bran + molasses.

### 11. **Leaf Miners (Leafy: Spinach, Lettuce, Pechay)**
   * **Organic options**: Neem oil foliar, Spinosad, Sticky traps + garlic spray
   * **Dosage**: 1 L/ha neem; 200 mL/ha Spinosad; Traps 10-20/ha
   * **Notes**: Remove mined leaves. Bio: Parasitic wasps.

### 12. **Potato Tuber Moth (Root: Potato, Sweet Potato)**
   * **Organic options**: Neem powder (for storage), Bt spray, Pheromone traps
   * **Dosage**: Dust tubers with neem; 1 L/ha Bt; 5-10 traps/ha
   * **Notes**: Cover soil ridges. Traditional: Store with eucalyptus leaves.

### 13. **Wireworms & Click Beetles (Root: Carrot, Potato, Radish)**
   * **Organic options**: Beneficial nematodes, Mustard green manure, DE soil mix
   * **Dosage**: 1-2 billion nematodes/ha; Incorporate mustard pre-plant; 10 kg/ha DE
   * **Notes**: Crop rotation. Biofumigation with mustard.

### 14. **Whiteflies (Leafy & Gulay: Lettuce, Tomato, Cabbage)**
   * **Organic options**: Insecticidal soap, Neem oil, Yellow sticky traps
   * **Dosage**: 1-2% soap (1 L/ha); 1 L/ha neem; 20 traps/ha
   * **Notes**: Virus vector. Reflective mulch.

### 15. **Armyworm (Leafy & Mais: Pechay, Cabbage, Corn)**
   * **Organic options**: Bt aizawai, NPV virus, Garlic-chili spray
   * **Dosage**: 1 L/ha Bt; 500 mL/ha NPV; 2 L/ha spray
   * **Notes**: Scout at night. Bio: Attract birds.

### 16. **Spider Mites (Gulay & Leafy: Eggplant, Lettuce)**
   * **Organic options**: Neem oil, Sulfur dust (organic), Horticultural oil
   * **Dosage**: 1 L/ha neem; 2-3 kg/ha sulfur; 1% oil (1 L/ha)
   * **Notes**: Increase humidity. Avoid dry conditions.

### 17. **Root-Knot Nematodes (Root: Carrot, Sweet Potato, Potato)**
   * **Organic options**: Marigold intercropping, Bio-nematicides (Paecomyces lilacinus), Compost tea
   * **Dosage**: Plant marigolds 1:1 ratio; 1-2 kg/ha bio-agent; 5-10 L/ha tea
   * **Notes**: Solarization. ATI: Use tagetes species.

### 18. **Flea Beetles (Leafy: Kangkong, Mustard, Radish leaves)**
   * **Organic options**: Pyrethrum spray, DE dust, Row covers
   * **Dosage**: 200 mL/ha pyrethrum; 5 kg/ha DE; Covers pre-infestation
   * **Notes**: Early season. Trap crops like radish.

### 19. **Leafhoppers (Leafy & Gulay: Pechay, Tomato, Beans)**
   * **Organic options**: Neem spray, Garlic oil, Reflective mulch
   * **Dosage**: 1 L/ha neem; 500 mL/ha garlic; Mulch full coverage
   * **Notes**: Virus vector. Attract beneficials.

### 20. **Sweet Potato Weevil (Root: Sweet Potato)**
   * **Organic options**: Neem cake soil amendment, Pheromone traps, Tubli extract
   * **Dosage**: 5-10 kg/ha neem cake; 5 traps/ha; 1-2 L/ha tubli
   * **Notes**: Clean vines. Rotation with non-hosts.

### 21. **Cucumber Beetle (Gulay & Leafy: Cucumber, Kangkong)**
   * **Organic options**: Pyrethrum, Spinosad, Trap crops (squash)
   * **Dosage**: 200 mL/ha pyrethrum; 200 mL/ha Spinosad; Intercrop 1:10
   * **Notes**: Trellising. Handpick.

---

## 🍄 **Mga Organic Fungicide Alternatives (laban sa fungal diseases)**

### 1. **Rice Blast (Magnaporthe oryzae, Palay)**
   * **Organic options**: Trichoderma harzianum bio-fungicide, Compost tea, Silicon fertilizer (rice hull ash)
   * **Dosage**: 1-2 kg/ha Trichoderma; 5-10 L/ha tea; 200-300 kg/ha silicon
   * **Notes**: Seed treatment. Resistant vars like NSIC Rc222.

### 2. **Sheath Blight (Rhizoctonia solani, Palay)**
   * **Organic options**: Trichoderma koningii, Bacillus subtilis spray, Neem extract
   * **Dosage**: 1 kg/ha Trichoderma; 2 L/ha Bacillus (e.g., Serenade); 1 L/ha neem
   * **Notes**: Avoid excess N. Bio: Flood-drain cycles.

### 3. **Downy Mildew (Peronosclerospora philippinensis, Mais & Gulay)**
   * **Organic options**: Copper sulfate (Bordeaux mix, organic-approved), TazSCure (citrus-based), Baking soda spray
   * **Dosage**: 1-2 kg/ha copper; 1 L/ha TazSCure; 1 tbsp soda/gal water (2 L/ha)
   * **Notes**: Seed treatment. Resistant hybrids.

### 4. **Anthracnose (Colletotrichum spp., Mango, Chili, Beans)**
   * **Organic options**: Antica (citrus extract), Garlic + ginger extract, Sulfur dust
   * **Dosage**: 1 L/ha Antica; 2 L/ha extract; 2-3 kg/ha sulfur
   * **Notes**: Preventive in wet season. Prune for air flow.

### 5. **Phytophthora Root Rot & Canker (Durian, Jackfruit, Cacao)**
   * **Organic options**: Trichoderma viride drench, Phosphorous acid (Agri-Fos, organic), Aloe vera extract
   * **Dosage**: 1-2 kg/ha Trichoderma; 2 L/ha acid; 1 L/ha aloe
   * **Notes**: Improve drainage. Drench base.

### 6. **Powdery Mildew (Gulay: Squash, Cucumber, Leafy: Mustard)**
   * **Organic options**: Baking soda + soap, Sulfur WP, Milk spray (1:9 dilution)
   * **Dosage**: 1 tbsp soda/gal (2 L/ha); 2 kg/ha sulfur; 5 L/ha milk
   * **Notes**: Early sprays. Mulches.

### 7. **Late Blight (Phytophthora infestans, Root: Potato, Tomato)**
   * **Organic options**: Copper hydroxide (Kocide, organic version), TazSCure, Compost tea
   * **Dosage**: 1.5 kg/ha copper; 1 L/ha TazSCure; 5 L/ha tea
   * **Notes**: Cool weather. Resistant vars.

### 8. **Alternaria Leaf Spot (Alternaria spp., Leafy: Cabbage, Carrot leaves)**
   * **Organic options**: Neem oil, Bacillus subtilis, Garlic extract
   * **Dosage**: 1 L/ha neem; 2 L/ha Bacillus; 1 L/ha garlic
   * **Notes**: Rotation. Air circulation.

### 9. **White Rust (Albugo candida, Leafy: Mustard, Radish leaves)**
   * **Organic options**: Sulfur spray, Antica, Baking soda
   * **Dosage**: 2 kg/ha sulfur; 1 L/ha Antica; 2 L/ha soda
   * **Notes**: Remove infected. Humid control.

### 10. **Root Rot (Pythium/Fusarium, Root: Carrot, Sweet Potato)**
   * **Organic options**: Trichoderma mix, Bio-char amendment, Mustard biofumigation
   * **Dosage**: 1 kg/ha Trichoderma; 200 kg/ha bio-char; Incorporate mustard
   * **Notes**: Well-drained soil.

### 11. **Damping Off (Pythium spp., Seedlings: Leafy & Root)**
   * **Organic options**: Cinnamon powder (seed treatment), Trichoderma, Chamomile tea
   * **Dosage**: Dust seeds; 1 kg/ha Trichoderma; 5 L/ha tea
   * **Notes**: Sterile beds.

### 12. **Black Scurf (Rhizoctonia solani, Root: Potato)**
   * **Organic options**: Trichoderma koningii, Sulfur soil mix, Bio-fungus (Coniothyrium)
   * **Dosage**: 1 kg/ha Trichoderma; 3 kg/ha sulfur; 1 kg/ha bio
   * **Notes**: Seed treatment. Rotation.

### 13. **Fusarium Wilt (Fusarium oxysporum, Gulay & Root: Tomato, Sweet Potato)**
   * **Organic options**: Trichoderma harzianum, Compost tea, Marigold extract
   * **Dosage**: 1-2 kg/ha Trichoderma; 5 L/ha tea; 2 L/ha extract
   * **Notes**: Solarization. Grafts.

### 14. **Gray Mold (Botrytis cinerea, Leafy: Lettuce, Strawberry)**
   * **Organic options**: Bacillus subtilis, Neem, Vinegar spray (5%)
   * **Dosage**: 2 L/ha Bacillus; 1 L/ha neem; 2 L/ha vinegar
   * **Notes**: Reduce humidity.

### 15. **Sclerotinia Stem Rot (Sclerotinia sclerotiorum, Leafy: Cabbage, Carrot)**
   * **Organic options**: Coniothyrium minitans (Contans), Trichoderma, Deep plowing
   * **Dosage**: 1 kg/ha Contans; 1 kg/ha Trichoderma
   * **Notes**: Wide spacing.

### 16. **Clubroot (Plasmodiophora brassicae, Leafy: Cabbage, Broccoli)**
   * **Organic options**: Lime (to pH 7.2), Mustard biofumigation, Crab shell meal
   * **Dosage**: 2-3 tons/ha lime; Incorporate mustard; 200 kg/ha meal
   * **Notes**: Resistant vars.

### 17. **Early Blight (Alternaria solani, Root: Potato, Tomato)**
   * **Organic options**: Copper sulfate, Baking soda, Garlic extract
   * **Dosage**: 1 kg/ha copper; 2 L/ha soda; 1 L/ha garlic
   * **Notes**: Remove debris.

### 18. **Cercospora Leaf Spot (Cercospora spp., Leafy: Kangkong, Spinach)**
   * **Organic options**: Neem, Sulfur, Antica
   * **Dosage**: 1 L/ha neem; 2 kg/ha sulfur; 1 L/ha Antica
   * **Notes**: Wider spacing.

### 19. **Rust (Puccinia spp., Leafy: Onion, Garlic leaves)**
   * **Organic options**: Sulfur dust, Garlic spray, Milk dilution
   * **Dosage**: 2 kg/ha sulfur; 1 L/ha garlic; 5 L/ha milk
   * **Notes**: Early sprays.

### 20. **Leaf Mold (Fulvia fulva, Gulay: Tomato, Leafy analogs)**
   * **Organic options**: Baking soda, Trichoderma, Ventilation
   * **Dosage**: 2 L/ha soda; 1 kg/ha Trichoderma
   * **Notes**: Greenhouse control.

### 21. **Downy Mildew (Bremia lactucae, Leafy: Lettuce)**
   * **Organic options**: Copper mix, TazSCure, Aloe vera extract
   * **Dosage**: 1 kg/ha copper; 1 L/ha TazSCure; 1 L/ha aloe
   * **Notes**: Avoid overhead water.

---

## 🦠 **Mga Organic Bactericide Alternatives (laban bacterial diseases)**

### 1. **Bacterial Leaf Blight (Xanthomonas oryzae, Palay)**
* **Organic options**: Copper hydroxide (Kocide, organic-approved), Bacillus subtilis spray (Serenade), Fermented Plant Juice (FPJ) + Compost Tea
* **Dosage**: 1.5–2 kg/ha (Copper); 2 L/ha (Bacillus); 5 L/ha (FPJ/Tea mix)
* **Notes**: Preventive sprays. Resistant vars (NSIC Rc154). Avoid excess N.

### 2. **Bacterial Wilt (Ralstonia solanacearum, Gulay: Tomato, Eggplant, Pepper)**
* **Organic options**: Grafting (onto resistant rootstock), Soil solarization, Bacillus subtilis soil drench
* **Dosage**: N/A (Grafting); N/A (Solarization); 2 L/ha drench (Bacillus)
* **Notes**: Extremely hard to control. Rotate with corn. Promote Trichoderma in soil.

### 3. **Bacterial Soft Rot (Erwinia carotovora, Leafy & Root: Cabbage, Carrot, Potato)**
* **Organic options**: Copper spray (preventive), Sanitation (remove debris), Proper curing & dry storage
* **Dosage**: 1.5–2 kg/ha (Copper); N/A (Sanitation); N/A (Storage)
* **Notes**: Avoid harvesting in wet conditions. Minimize wounding.

### 4. **Bacterial Spot (Xanthomonas campestris, Gulay: Tomato, Pepper)**
* **Organic options**: Copper hydroxide, Bacillus subtilis, Garlic + ginger extract
* **Dosage**: 1.5 kg/ha (Copper); 2 L/ha (Bacillus); 1–2 L/ha (Extract)
* **Notes**: Use clean seed. Preventive sprays.

### 5. **Black Rot (Xanthomonas campestris pv. campestris, Leafy: Cabbage, Broccoli)**
* **Organic options**: Hot water seed treatment, Copper spray, Crop rotation (3+ years)
* **Dosage**: 50°C for 25 min (seeds); 1.5 kg/ha (Copper); N/A (Rotation)
* **Notes**: Critical to rotate with non-brassicas.

### 6. **Bacterial Leaf Spot (Pseudomonas syringae, Leafy: Lettuce, Pechay)**
* **Organic options**: Bacillus subtilis (Serenade), Copper spray, Neem oil (mild)
* **Dosage**: 2 L/ha (Bacillus); 1.5 kg/ha (Copper); 1 L/ha (Neem)
* **Notes**: Avoid overhead irrigation. Remove infected leaves.

### 7. **Angular Leaf Spot (Pseudomonas syringae pv. lachrymans, Gulay: Cucumber)**
* **Organic options**: Copper hydroxide, Bacillus subtilis, Trellising for air flow
* **Dosage**: 1.5 kg/ha (Copper); 2 L/ha (Bacillus); N/A (Trellising)
* **Notes**: Use clean seeds.

### 8. **Bacterial Canker (Clavibacter michiganensis, Gulay: Tomato)**
* **Organic options**: Copper spray, Bacillus subtilis, Strict sanitation (disinfect tools)
* **Dosage**: 1.5 kg/ha (Copper); 2 L/ha (Bacillus); N/A (Sanitation)
* **Notes**: Prune infected stems (burn). Very difficult to manage.

### 9. **Crown Gall (Agrobacterium tumefaciens, Root: Carrot, Potato grafts)**
* **Organic options**: Agrobacterium radiobacter K84 (bio-control), Avoid wounding, Copper paste
* **Dosage**: Dip roots (K84); N/A (Wounding); Apply paste to galls
* **Notes**: Biological control is the main solution.

### 10. **Fire Blight analog (Erwinia amylovora-like, Prutas: Guava, veggie analogs)**
* **Organic options**: Copper spray (dormant stage), Bacillus subtilis, Pruning
* **Dosage**: 2 kg/ha (Copper); 2 L/ha (Bacillus); N/A (Pruning)
* **Notes**: Prune 12 inches below infection.

### 11. **Bacterial Ring Rot (Clavibacter michiganensis subsp. sepedonicus, Root: Potato)**
* **Organic options**: Certified disease-free seed, Strict sanitation (tools, storage), Crop rotation (3+ years)
* **Dosage**: N/A
* **Notes**: No effective organic spray. Prevention is mandatory.

### 12. **Common Scab (Streptomyces scabies, Root: Potato, Carrot)**
* **Organic options**: Adjust soil pH (to 5.0-5.2), Sulfur (to lower pH), High organic matter (compost)
* **Dosage**: N/A (pH); 2–3 kg/ha (Sulfur); N/A (Compost)
* **Notes**: Avoid infected manure. Resistant varieties.

### 13. **Bacterial Head Rot (Erwinia, Leafy: Broccoli, Cabbage)**
* **Organic options**: Copper spray (preventive), Bacillus subtilis, Avoid overhead water at heading
* **Dosage**: 1.5 kg/ha (Copper); 2 L/ha (Bacillus); N/A
* **Notes**: Plant tolerant varieties.

NEW_TASK

### 14. **Vascular Wilt (Ralstonia, Root: Sweet Potato)**
* **Organic options**: Bacillus subtilis drench, Mustard biofumigation, Clean planting material
* **Dosage**: 2 L/ha (Bacillus); Incorporate mustard; N/A
* **Notes**: Rotate with non-hosts.

### 15. **Leaf Scald (Xanthomonas albilineans analog, Leafy: Onion-like, Leeks)**
* **Organic options**: Bacillus subtilis (Serenade), Copper spray, Clean seed selection
* **Dosage**: 2 L/ha (Bacillus); 1.5 kg/ha (Copper); N/A
* **Notes**: Good sanitation.

### 16. **Bacterial Ooze (Erwinia, Root: Radish, Carrot)**
* **Organic options**: Copper spray, Sanitation, Dry storage
* **Dosage**: 1.5 kg/ha (Copper); N/A; N/A
* **Notes**: Avoid harvesting in wet conditions.

### 17. **Bacterial Speck (Pseudomonas syringae pv. tomato, Gulay: Tomato)**
* **Organic options**: Copper hydroxide, Bacillus subtilis, Hot water seed treatment
* **Dosage**: 1.5 kg/ha (Copper); 2 L/ha (Bacillus); N/A
* **Notes**: Avoid wet leaves.

### 18. **Soft Rot (Pectobacterium carotovorum, Root: Potato, Carrot)**
* **Organic options**: Proper curing (storage), Sanitation (avoid wounds), Copper spray (field)
* **Dosage**: N/A; N/A; 1.5 kg/ha (Copper)
* **Notes**: Ensure good air flow in storage.

### 19. **Bacterial Blight (Pseudomonas, Leafy: Kangkong, Spinach)**
* **Organic options**: Copper spray, Bacillus subtilis, Avoid overhead irrigation
* **Dosage**: 1.5 kg/ha (Copper); 2 L/ha (Bacillus); N/A
* **Notes**: Remove infected leaves.

### 20. **Gummy Stem Blight (bacterial analogs, Gulay: Cucumber, Melon)**
* **Organic options**: Copper hydroxide, Bacillus subtilis, Trellising
* **Dosage**: 1.5 kg/ha (Copper); 2 L/ha (Bacillus); N/A
* **Notes**: Remove debris.

### 21. **Bacterial Foot Rot (Erwinia, Root: Sweet Potato, Cassava)**
* **Organic options**: Trichoderma (soil health), Well-drained soil, Copper drench
* **Dosage**: 1–2 kg/ha (Trichoderma); N/A; 1.5 kg/ha (Copper)
* **Notes**: Crop rotation.`;

  switch (audience) {
    case Audience.Farmer:
      const isChatModeFarmer = flowType === 'chat' || flowType === 'diagnosis_chat';
      const farmerDataSourceInstruction = isChatModeFarmer
        ? `- **Data Sources:** For specific fertilizer and pesticide recommendations, you MUST prioritize information from the attached **CROP_PROTECTION_DOCUMENT** and **FERTILIZER_KNOWLEDGE_BASE**. For all other topics, including general agronomy, planting techniques, climate, and problem analysis, you may use your general, extensive knowledge base.`
        : `- **Data Sources:** Your knowledge comes from the attached **CROP_PROTECTION_DOCUMENT** and **FERTILIZER_KNOWLEDGE_BASE**. Only recommend products and practices found there.`;

      return `You are "KaAni," a friendly and knowledgeable AI assistant for smallholder farmers in the Philippines. Your current date is ${currentDate}. You are an expert agronomist.

**Core Directives:**
- **Language:** Communicate in clear, simple, and encouraging ${dialect}. Use common farming terms from that dialect.
- **Tone:** Empathetic, supportive, and practical. Be like a helpful kapitbahay who is also an expert farmer.
- **Format:** Use Markdown for lists and bolding to make text easy to read. Start with a friendly greeting.
- **Solutions:** Prioritize practical, low-cost, and organic/natural solutions first. Be specific with quantities (e.g., "isang dakot ng compost," "isang kutsara ng abono"). If chemical solutions are necessary, mention them as a last resort and always include a strong, clear safety warning ("**Babala sa Kaligtasan:**").
${farmerDataSourceInstruction}${isCondensed 
    ? `

**STYLE DIRECTIVE (Condensed):** Your responses MUST be very condensed. Use short, direct sentences. Be concise and to the point while keeping the same structured format.` 
    : `

**STYLE DIRECTIVE (Detailed):** Your responses MUST be detailed and easy to understand. Use a friendly, conversational tone. Explain the 'why' behind each step clearly (e.g., "Maglagay ng compost para bumuhaghag ang lupa at makahinga ang mga ugat."), as if you are talking to a fellow farmer who needs guidance.`
}

**Planting Guidance Protocol:**
- If the user's request starts with "const upperContent = content.toUpperCase(); REQUEST:", it will be followed by detailed context about the farmer's situation, which now includes **Soil Type**, **Location (Municipality, Province)**, and **Planned Planting Time**.
- You MUST use this context to generate a single, comprehensive, and tailored **PLANTING ADVISORY**.
- **Crucially, use the provided Location and Planting Time to give climate-specific advice.** For example, if the location is 'Malaybalay, Bukidnon' and the time is 'June', your advice must reflect the heavy rainfall typical for that area during that month. Use your knowledge of Philippine regional climate patterns.
- DO NOT ask any further clarifying questions. Provide the complete guide in one response.
- The advice you give MUST be tailored to their context.
    -   *For "Sa bakuran lang" (backyard gardeners):* Use simple units like "kutsara" (tablespoon) or "tasa" (cup). Recommend smaller-scale techniques.
    -   *For "Pang-komersyal" (commercial farmers):* Use "ektarya" (hectare) and provide advice suitable for larger operations.
- The structure must follow the "PLANTING ADVISORY" format with sections like "Mga Mungkahing Itanim," "Paghahanda ng Lupa," etc., but the content must be customized but Do not put any numbering like I., II., etc.
- At the end, you must give the beakdown of the number of sacks per fertilizer type needed based on the area size submitted. Do this in table form. 
- Add to the breakdown the ranged cost using the ff data: 
  - Urea granular (1,680 - 1,900) 
  - Ammosul (800 - 1,200)
  - Complete 14-14-14 (1,625 - 1900)
  - Ammophos (1,500 - 1,900)
  - MOP (1,715 - 2,150)
- Add to the breakdown, the use of the brand "Masinag" as a soil conditioner at 2 bottles per hectare. Cost is 1,800 per bottle.
- Provide the **total cost** of all fertilizers and Masinag. 
  - Provide in a separate table an optional fertilization breakdown by replacing one bag of urea with 5 bags of Organic Fertilizer called "Seasons". The price is 365 pesos per bag. 
  - Provide in another separate table another optional breakdown wherein all bags of urea is replaced by  the organic fertilizer "Seasons" @ 1 bag Urea = 5 bags of Seasons. 
- Underneath the **total cost** attached to each table add an entry called **Buffer**, which is 10% of minimum cost to 10% of maximum cost. Do not add Buffer to total cost. 
**IMMEDIATELY AFTER** the fertilizer cost tables (ranged min to max) and total costs (ranged min to max), you MUST add a new section titled **"Crop–Location Plausibility Check"**. In this section:
  - Use your knowledge of **Philippine agro-climate and cropping patterns** to evaluate if the main crop is realistic and suitable for the given **Location (Municipality, Province)** and **Planned Planting Time**.
  - Clearly indicate:
    - Longitude of the location through geolocation
    - latitude of the location through geolocation
    - A simple overall rating: **"Mataas na Akma"** (high suitability), **"Katamtamang Akma"**, **"Mababang Akma"**, or **"Hindi Tiyak"**.
    - Whether the planting time is **"In-season"**, **"Off-season"**, or **"Pwede pero mas ligtas kung may irigasyon/greenhouse"**.
  - Briefly explain in 2–4 sentences *bakit* (e.g., maulan sa buwan na iyon, tag-init, typhoon season, kilala ang lugar sa ganitong pananim, atbp.).
  - If suitability is low or off-season, gently suggest **1–2 alternative crops or varieties** that are more common or better suited to that location and planting month.
- Mention at the end of the response that products are available at the online store **www.Agrigrosir.com**, provide a clickable link.

- **Problem Diagnosis Protocol:** If the user's request starts with "DIAGNOSIS REQUEST:", provide a DETAILED and ACTIONABLE diagnosis. Explain the 'why' behind your advice simply. Use your knowledge from the CROP_PROTECTION_DOCUMENT and FERTILIZER_KNOWLEDGE_BASE. Structure the response in Tagalog with these sections:
    - **Posibleng Problema:** (Identify the most likely pest/disease/deficiency).
    - **Paliwanag:** (Briefly explain *why* this is the likely problem, connecting it directly to the farmer's description).
    - **Mga Sunod-sunod na Hakbang (Step-by-Step Guide):** (Provide a clear, numbered list of actions. Start with immediate, low-cost/organic solutions from the knowledge base. For example: "1. Alisin at sunugin ang mga apektadong dahon. 2. Mag-spray ng pinaghalong sili at bawang...". If chemical solutions are needed, specify the product and provide simple dosage instructions like "isang kutsara bawat 16-litro na sprayer" and a strong safety warning).
    - **Pag-iwas sa Hinaharap (Prevention):** (Give 1-2 long-term strategies to prevent the problem from recurring, like crop rotation or improving soil health with compost).

**Interaction Flow Protocol:**
- **Clarification is Key:** Your primary goal is to gather enough information to give a complete, actionable answer. If the user's message is ever unclear or lacks detail, you MUST ask a clarifying multiple-choice question. Structure this using the JSON schema with \`type: 'question'\` and a \`choices\` array. This is your default behavior when you need more context.
- **Deliver Final Reports:** Once you are confident you have all the necessary information, you must STOP asking questions. Your next response must be a single, complete, structured report (either a **Problem Diagnosis Protocol** or **PLANTING ADVISORY**). This final report response must use \`type: 'diagnosis'\`.
- **Chat Mode:** During a free-form chat (\`chat\` or \`diagnosis_chat\` flow), continue to use clarifying multiple-choice questions to guide the conversation towards a point where you can deliver a final, formatted report.
- **End Interaction:** Always end with an encouraging note and a disclaimer. "Sana po ay makatulong ito! Tandaan, pinakamainam pa rin na kumonsulta sa isang lokal na technician para sa mas tiyak na payo."---

CROP_PROTECTION_DOCUMENT:
${CROP_PROTECTION_DOCUMENT}
---
FERTILIZER_KNOWLEDGE_BASE:
${FERTILIZER_KNOWLEDGE_BASE}`;

    case Audience.Technician:
        const isChatModeTechnician = flowType === 'chat' || flowType === 'diagnosis_chat';
      
        const technicianPreamble = isChatModeTechnician
            ? `**General Knowledge Protocol (Active in Chat Mode):** While you MUST prioritize the attached **CROP_PROTECTION_DOCUMENT** and **FERTILIZER_KNOWLEDGE_BASE** for specific product recommendations (active ingredients, brand names, dosages), you are now authorized to use your full, general agronomic knowledge for broader topics. This includes complex diagnostics, climate patterns beyond the provided data, soil science principles, advanced IPM strategies, and emerging agricultural technologies. Your goal is to provide the most comprehensive answer possible, while still grounding specific product advice in the provided documents. You MUST still adhere strictly to the **TECHNICAL BULLETIN** formatting for all final reports.\n\n`
            : '';
            
        const pestManagementInstruction = `- **Pest/Disease Management:** ${isChatModeTechnician ? 'For specific chemical recommendations, prioritize' : 'Your primary knowledge base for pest, disease, and weed management is'} the **CROP_PROTECTION_DOCUMENT**. Cross-reference it for specific brand names, dosages, and local context. Do not invent products.`;
        
        const nutrientDiagnosisInstruction = `- **Nutrient Deficiency Diagnosis:** If the user describes symptoms of poor crop health that suggest a nutrient deficiency (e.g., yellowing, stunted growth, purplish leaves), use the **FERTILIZER_KNOWLEDGE_BASE** to diagnose the potential deficiency${isChatModeTechnician ? ' and prioritize it for specific fertilizer recommendations' : ''}.`;
        
        const fertilizationPlanInstruction = `- **Fertilization Plans:** If the user requests a fertilization plan for a specific crop, use the provided **FERTILIZER_KNOWLEDGE_BASE** to generate a detailed, stage-by-stage program${isChatModeTechnician ? ', prioritizing it for specific product choices' : ''}.`;

      return `You are "KaAni," a highly advanced AI Agronomist for the Philippines, specifically interacting with a trained **Agricultural Technician**. Your current date is ${currentDate}.

${technicianPreamble}**Core Directives:**
- **Clarity & Depth:** Provide responses in a technical, detailed, and structured manner. Use scientific names (e.g., *Oryza sativa*) alongside common names. Assume the user is familiar with agricultural concepts.
- **Format:** Use Markdown for clear formatting, including tables.
- **Tone:** Professional, direct, and data-driven.${isCondensed ? `
- **Style:** Provide only the most critical information in a highly condensed, bullet-point format. Prioritize active ingredients, dosages, and key cultural methods. Omit lengthy biological explanations unless essential.` : ''}

**Interaction Flow Protocol:**
- **Clarification is Key:** Your primary goal is to gather sufficient information to generate a complete and accurate **TECHNICAL BULLETIN** or **PLANTING ADVISORY**. If the user's query is ever ambiguous or lacks detail, you MUST ask clarifying multiple-choice questions to narrow down the possibilities. Structure these questions using the JSON schema with \`type: 'question'\` and a \`choices\` array.
- **Deliver Final Reports:** Once you have a high degree of confidence, you MUST cease asking questions and provide the full, formatted report as your response. This final response MUST use \`type: 'diagnosis'\`.
- **Chat Mode:** During a free-form chat (\`chat\` or \`diagnosis_chat\` flow), continue to use clarifying multiple-choice questions to guide the conversation towards a point where you can deliver a final, formatted report.

- **Planting Guidance:** If the user's request starts with "PLANTING GUIDE REQUEST:", you MUST provide a detailed, tailored recommendation. Structure the response as a **PLANTING ADVISORY**. The user will provide context including **Sunlight, Drainage, Soil Type, Location, and Planting Time.**
    *   **PLANTING ADVISORY**
    *   **I. SITE CONDITION ANALYSIS:** (Briefly summarize and interpret all user inputs. **Crucially, analyze the implications of the provided Location and Planting Time by referencing your knowledge of general Philippine climatological data.**)
    *   **II. RECOMMENDED CROP VARIETIES:** (Provide a list of at least 3–5 specific crop varieties suitable for the user's goal and site conditions. Include scientific names).
    *   **III. SOIL PREPARATION & AMENDMENT PLAN:** (Provide detailed instructions, e.g., "For the described clay soil, recommend deep tillage and incorporation of 3–5 tons/ha of composted rice hull to improve aeration and drainage.").
    *   **IV. PLANTING & CROP MANAGEMENT STRATEGY:** (Include advice on planting depth, spacing, initial watering, fertilization method based on soil type, and a basic fertilization schedule recommendation).
    *   **V. POTENTIAL CHALLENGES & MITIGATION:** (Briefly mention potential issues based on the site analysis (soil type, climate, etc. ), e.g., "The location and planting time indicate a high probability of waterlogging. Ensure adequate drainage is established.").
    - Provide the specific pests and diseases that can be encountered as well as the Biological/Organic, Chemical, and other solutions.
    - Provide the specific brand names the farmer can use to deal with the pests and disease.
    *   **VI. FERTILIZER REQUIREMENT & COST TABLE:** (Summarize the number of sacks per fertilizer type, their cost ranges, Masinag soil conditioner at 2 bottles/ha, and the total cost.)
          - Provide in a separate table an optional fertilization breakdown by replacing one bag of urea with 5 bags of Organic Fertilizer called "Seasons". The price is 365 pesos per bag. 
          - Provide in another separate table another optional breakdown wherein all bags of urea is replaced by  the organic fertilizer "Seasons" @ 1 bag Urea = 5 bags of Seasons.
    *   **VII. CROP–LOCATION PLAUSIBILITY CHECK:**  
        - Provide an explicit agronomic assessment of whether the **main crop** is realistic for the supplied **location (Municipality/Province)** and **planting month**.
        - Provide Longitude, Latitude  
        - Classify suitability as **High / Medium / Low / Unknown** and seasonality as **In-season / Off-season / Possible with irrigation or protected cultivation**.  
        - Support this with **short, evidence-based reasoning** referring to known production belts, rainfall/temperature patterns, and hazard exposure (e.g., typhoon season, drought).  

- **Problem Diagnosis:** If the user describes a crop problem (e.g., via "DIAGNOSIS REQUEST:" or general chat), you must conduct a thorough analysis and provide a **TECHNICAL BULLETIN** structured exactly as follows:
    *   **TECHNICAL BULLETIN: [Identify the pest/disease and crop]**
    *   **I. BIOLOGY AND IDENTIFICATION:** (Provide a detailed description of the pest/disease, its life cycle, and the specific damage it causes to the crop).
    *   **II. INTEGRATED PEST MANAGEMENT (IPM) STRATEGIES:** (This section must contain the following sub-sections).
        *   **A. Cultural Control:** (List at least 3-4 specific, actionable cultural methods).
        *   **B. Biological Control:** (List relevant natural enemies and bio-pesticides from the CROP_PROTECTION_DOCUMENT).
        *   **C. Chemical Control:** (List specific active ingredients, brand names, and dosages from the CROP_PROTECTION_DOCUMENT. Emphasize rotating chemical classes and observing the Pre-Harvest Interval (PHI)).
    *   **III. DISCLAIMER:** (Include a concluding disclaimer about consulting local authorities and following label instructions).
${pestManagementInstruction}
- **Soil & Climate Advisory:** If the user asks for information about the climate or typical soil type of a specific location in the Philippines, generate a **SOIL AND CLIMATE ADVISORY**. Use general knowledge of Philippine agrology and reference the provided weather station data where relevant. Format it with these sections:
    *   **SOIL AND CLIMATE ADVISORY: [Location]**
    *   **I. GENERAL CLIMATE PROFILE:** (Describe the climate type based on PAGASA classifications, highlighting wet/dry seasons, average rainfall trends, and potential risks like typhoons, referencing the provided climate data if a nearby station exists).
    *   **II. TYPICAL SOIL CHARACTERISTICS:** (Describe the common soil types found in the region, e.g., "The Bicol region is known for its volcanic, andisolic soils which are generally fertile but may have high phosphorus retention.").
    *   **III. KEY AGRONOMIC CONSIDERATIONS:** (Provide actionable advice based on the climate and soil. E.g., "Given the pronounced dry season, consider drought-tolerant varieties or investing in irrigation." or "The clay loam texture means you should manage tillage carefully to avoid compaction.").
    *   **IV. RECOMMENDATION:** (Conclude by strongly recommending a specific soil analysis for accurate data and checking PAGASA for real-time weather updates).
${nutrientDiagnosisInstruction}
${fertilizationPlanInstruction}
---
CROP_PROTECTION_DOCUMENT:
${CROP_PROTECTION_DOCUMENT}
---
FERTILIZER_KNOWLEDGE_BASE:
${FERTILIZER_KNOWLEDGE_BASE}
`;

    case Audience.LoanMatching:
        return getLoanMatchingSystemInstruction(currentDate);

    case Audience.RiskScoring:
  return `You are "KaAni," a specialized AI assistant from AgSense, designed to perform preliminary agricultural risk assessments.

### Primary Function: Risk Score Calculator
Your sole function is to collect the necessary data and CALL the \`calculateBaselineRiskScore\` tool as soon as you have enough information.

**What you can send to the tool:**
- **Soil:** sand, silt, clay (percentages).
- **Climate:** latitude, longitude, cropCycleMonths (month names).
- **Harvest Score (benchmark comparison):**
  - If the user types anything starting with **"harvest score"**, ALWAYS call the tool and include \`triggerText\` set to the user's message verbatim. 
  - If the user instead gives structured details, pass \`cropType\`, \`province\`, \`projectedYieldPerHa\`, optional \`areaSizeHa\` (default 1), and optional \`systemOrVariety\` (e.g., "Irrigated", "Rainfed", "Yellow", "White").

**When to call the tool:**
1) As soon as you have **either**:
   - Soil-only data (sand/silt/clay), OR
   - Climate-only data (lat/long and at least one month), OR
   - A "harvest score" request (use \`triggerText\`), OR
   - Any combination of the above.
2) Do not wait to collect everything; call the tool with whatever is ready.

**Response behavior:**
- After calling the function, the returned report is final. Do not summarize or reformat it.
- If a user gives partial info, ask a short, friendly follow-up and aim to call the function quickly.

**Examples:**
- User: "harvest score palay irrigated 5.2 mt/ha nueva ecija area 1.5" → Call the tool with \`triggerText\` = the whole user message.
- User: "lat 14.5, lon 121.1, cycle May–July" → Call the tool with climate fields.
- User: "sand 30, silt 40, clay 30" → Call the tool with soil fields.
`;


    default:
      return "You are a helpful assistant.";
  }
};

const getQualitativeTier = (score: number): { tier: number, label: string } => {
    if (score < 100) return { tier: 1, label: 'Very Low' };
    if (score <= 249) return { tier: 2, label: 'Low' };
    if (score <= 399) return { tier: 3, label: 'Moderately Low' };
    if (score <= 549) return { tier: 4, label: 'Moderate' };
    if (score <= 699) return { tier: 5, label: 'Moderately High' };
    if (score <= 849) return { tier: 6, label: 'High' };
    return { tier: 7, label: 'Very High' };
}

const getManagementRecommendations = (soilAnalysis: RiskScoreResult['soilAnalysis']): string => {
    if (!soilAnalysis) return '';

    const recommendations: { [key: string]: string } = {
        Waterlogging: 'Improve drainage canals, avoid field traffic during wet periods, incorporate rice hulls or compost.',
        Compaction: 'Use minimal tillage, subsoil if possible, avoid tractors when soil is moist.',
        'Nutrient Management': 'Split fertilizer doses; use slow-release formulations; integrate organics.',
        'Drought Stress': 'Maintain mulch cover and promote deep rooting varieties.'
    };

    const subScores = [
        { name: 'Waterlogging', score: soilAnalysis.subScores.waterlogging.raw },
        { name: 'Compaction', score: soilAnalysis.subScores.compaction.raw },
        { name: 'Nutrient Management', score: soilAnalysis.subScores.nutrient.raw },
        { name: 'Drought Stress', score: soilAnalysis.subScores.drought.raw }
    ].sort((a, b) => b.score - a.score);

    let report = `| Risk Factor | Current Risk | Recommendations |\n`;
    report += `| :--- | :--- | :--- |\n`;
    
    subScores.forEach(item => {
        const riskLevel = getQualitativeTier(item.score).label;
        report += `| ${item.name} | **${riskLevel}** | ${recommendations[item.name]} |\n`;
    });

    return report;
};


const generateRiskScoreReport = (result: RiskScoreResult, input: RiskScoreInput): string => {
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  let report = `### KaAni Risk Score Report\n\n`;

  if (input.latitude && input.longitude) {
    report += `**Location:** ${input.latitude.toFixed(4)}° N, ${input.longitude.toFixed(4)}° E\n`;
  }
  if (result.climateType && result.climateTypeDescription) {
    report += `**Climate Type:** ${result.climateType} — ${result.climateTypeDescription}\n`;
  }
  if (input.cropCycleMonths && input.cropCycleMonths.length > 0) {
    report += `**Crop Cycle:** ${input.cropCycleMonths.join(' – ')}\n`;
  }
  report += `**Computation Date:** ${currentDate}\n\n`;

    // ---- OVERALL BASELINE
    report += `#### OVERALL BASELINE RISK SCORE\n\n`;

    // Build the present components (mirror of calculateBaselineRiskScore)
    type CompKey = 'climate' | 'soil' | 'harvest';
    type Comp = { key: CompKey; label: string; score: number; tier: string };
    const present: Comp[] = [];

    if (result.climateScore !== null) {
      present.push({
        key: 'climate',
        label: 'Climate Score',
        score: result.climateScore,
        tier: getQualitativeTier(result.climateScore).label
      });
    }
    if (result.soilScore !== null) {
      present.push({
        key: 'soil',
        label: 'Soil Score',
        score: result.soilScore,
        tier: getQualitativeTier(result.soilScore).label
      });
    }
    if (result.harvestScore) {
      // Use the risk tiering function for display consistency
      const hScore = result.harvestScore.score;
      present.push({
        key: 'harvest',
        label: 'Harvest Score',
        score: hScore,
        tier: getQualitativeTier(hScore).label
      });
    }

    // Determine weights (mirror calculateBaselineRiskScore with summer logic)
    const weights: Record<CompKey, number> = { climate: 0, soil: 0, harvest: 0 };

    // Determine if crop overlaps with summer
    const summerMonths = ['March', 'April', 'May'];
    const isSummer =
      result.monthlyClimateBreakdown &&
      result.monthlyClimateBreakdown.some(m => summerMonths.includes(m.month));

    if (present.length === 3) {
      if (isSummer) {
        // Summer override: 40/40/20
        weights.climate = 0.40;
        weights.soil = 0.40;
        weights.harvest = 0.20;
      } else {
        // Default: 50/30/20
        weights.climate = 0.50;
        weights.soil = 0.30;
        weights.harvest = 0.20;
      }
    } else if (present.length === 2) {
      const ks = present.map(p => p.key);

      // climate + soil → special summer rule
      if (ks.includes('climate') && ks.includes('soil')) {
        if (isSummer) {
          weights.climate = 0.50;
          weights.soil = 0.50;
        } else {
          weights.climate = 0.60;
          weights.soil = 0.40;
        }
      }

      // climate + harvest → always 60/40
      else if (ks.includes('climate') && ks.includes('harvest')) {
        weights.climate = 0.60;
        weights.harvest = 0.40;
      }

      // soil + harvest → always 60/40
      else if (ks.includes('soil') && ks.includes('harvest')) {
        weights.soil = 0.60;
        weights.harvest = 0.40;
      }
    } else if (present.length === 1) {
      weights[present[0].key] = 1.0;
    }


    // Render table
    report += `| Component | Score | Tier | Weight |\n`;
    report += `| :--- | :---: | :--- | :---: |\n`;
    present.forEach(p => {
      const w = Math.round((weights[p.key] ?? 0) * 100);
      report += `| ${p.label} | ${p.score} | ${p.tier} | ${w ? w + '%' : '—'} |\n`;
    });
    report += `| **Overall Baseline Score** | **${result.baselineScore}** | **${result.qualitativeRisk} Risk** | — |\n\n`;

    // Formula line that exactly matches the active components and weights
    if (present.length > 0) {
      const formulaTerms = present
        .filter(p => (weights[p.key] ?? 0) > 0)
        .map(p => `(${(weights[p.key] * 1).toFixed(2)} × ${p.label})`)
        .join(' + ');
      report += `**Formula Used:** Overall = ${formulaTerms}\n`;
    }

    // Keep your existing interpretation line
    report += `**Interpretation:** ${result.explanation}\n\n`;


  // ---- CLIMATE BREAKDOWN
  if (result.monthlyClimateBreakdown && result.monthlyClimateBreakdown.length > 0) {
    report += `--- \n\n#### CLIMATE RISK ANALYSIS\n\n`;
    report += `| Month | Rainfall (mm) | Rainy Days | RH (%) | Limiting Factor | Monthly Score | Tier | Risk Level |\n`;
    report += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    result.monthlyClimateBreakdown.forEach(m => {
      const tierInfo = getQualitativeTier(m.monthlyScore);
      report += `| ${m.month} | ${m.rainfall.toFixed(0)} | ${m.rainyDays.toFixed(0)} | ${m.humidity.toFixed(0)} | ${m.limitingFactor} | **${m.monthlyScore}** | ${m.finalTier} | ${tierInfo.label} |\n`;
    });
    report += `\n**Climate Average Score:** ${result.climateScore} → **${getQualitativeTier(result.climateScore!).label} Risk** (Tier ${getQualitativeTier(result.climateScore!).tier})\n`;
    report += `**Dominant Hazard:** ${result.dominantClimateHazard}\n\n`;
  }

  // ---- SOIL ANALYSIS
  if (result.soilAnalysis) {
    const soil = result.soilAnalysis;
    report += `--- \n\n#### SOIL RISK ANALYSIS\n\n`;
    report += `| Subfactor | Raw Score | Activity Factor | Effective Score | Weight | Contribution |\n`;
    report += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    const renderSubScoreRow = (name: string, data: SoilSubScoreDetail) =>
      `| ${name} | ${data.raw} | ${data.factor.toFixed(1)} | ${data.effective} | ${(data.weight * 100).toFixed(0)}% | ${data.contribution} |\n`;
    report += renderSubScoreRow('Nutrient Management', soil.subScores.nutrient);
    report += renderSubScoreRow('Waterlogging', soil.subScores.waterlogging);
    report += renderSubScoreRow('Compaction', soil.subScores.compaction);
    report += renderSubScoreRow('Drought Stress', soil.subScores.drought);
    report += `| **Final Soil Score** | — | — | — | — | **${result.soilScore}** |\n\n`;

    report += `**Soil Composition:** Sand ${soil.sand.toFixed(0)}% | Silt ${soil.silt.toFixed(0)}% | Clay ${soil.clay.toFixed(0)}% → **Texture: ${soil.soilTexture}**\n`;
    if (soil.activityFactorsApplied.length > 0) {
      report += `**Activity Factors Applied:** ${soil.activityFactorsApplied.join('; ')}\n`;
    }
    report += `**Dominant Soil Risks:** ${soil.dominantRisks}\n\n`;

    // Management table
    report += `#### RECOMMENDED MANAGEMENT PRACTICES\n\n`;
    report += getManagementRecommendations(result.soilAnalysis);
    report += `\n`;
  }

  // --- HARVEST SCORE (if available) ---
  if (result.harvestScore) {
    const hs = result.harvestScore;
    report += `---\n\n#### HARVEST PERFORMANCE (vs Provincial/DB Benchmark)\n\n`;
    report += `**Crop:** ${hs.cropType}  \n`;
    report += `**Province:** ${hs.province}  \n`;
    report += `**Benchmark Yield:** ${hs.benchmarkYield.toFixed(2)} MT/ha  \n`;
    report += `**Projected Yield:** ${hs.projectedYieldPerHa.toFixed(2)} MT/ha  \n`;
    report += `**Area:** ${hs.areaSizeHa} ha  \n`;
    report += `**Projected Total Harvest:** ${hs.projectedTotalHarvest.toFixed(2)} MT  \n`;
    report += `**Performance Ratio (my/benchmark):** ${hs.ratio.toFixed(2)}×  \n`;
    //report += `**Yield Ratio Score:** ${hs.score} → **${hs.qualitativeTier}** (Tier ${hs.tier})  \n`;
    //report += `**Harvest Risk Score:** ${hs.score} (0–1000; higher = higher risk)  \n`;
    // Keep the original performance line if you like it:
    report += `**Yield Ratio Score:** ${hs.score} → **${hs.qualitativeTier}** (Tier ${hs.tier})  \n`;
    report += `**Harvest Risk Score:** ${hs.score} → **${getQualitativeTier(hs.score).label} Risk** (Tier ${getQualitativeTier(hs.score).tier})  \n`;
    report += `**Harvest Confidence Weight (wₕ):** ${(hs.weight ?? 1).toFixed(2)}  \n`;
    // New: risk-tiered display aligned with Climate/Soil
    const harvestRiskTier = getQualitativeTier(hs.score); // 0–1000, higher = higher risk
    report += `**Harvest Risk Score:** ${hs.score} → **${harvestRiskTier.label} Risk** (Tier ${harvestRiskTier.tier})  \n`;
    report += `**Benchmark Source:** ${hs.benchmarkSource}\n\n`;
    report += `${hs.summary}\n\n`;
  }

  if (result.alpha != null && result.alphaRisk != null && result.alphaTier && result.alphaTierLabel) {
    report += `---\n\n#### FARMER ALPHA (Performance vs Context)\n\n`;
    report += `**Formula:** α = (0.60 × Climate) + (0.40 × Soil) − (wₕ × Harvest)  \n`;
    report += `**Farmer α:** ${result.alpha > 0 ? '+' : ''}${result.alpha} → ${result.alpha >= 0 ? '**Outperforming**' : '**Underperforming**'} vs climate+soil context  \n`;
    report += `**Alpha Score:** ${result.alphaRisk} → **${result.alphaTierLabel} Risk** (Tier ${result.alphaTier})  \n`;
    report += `_Note: Positive α means outcomes are better than the biophysical context predicts; negative α means worse._\n\n`;
  }


  // ---- FINAL
  report += `--- \n\n**Final Statement:** Overall Weighted Baseline Risk Score : **${result.baselineScore} (${result.qualitativeRisk} Risk)**.\n`;
  //report += `This reflects ${result.finalStatement}. You should focus on ${result.finalRecommendation}.\n\n`;
  report += `**Disclaimer:** This is a preliminary, un-official assessment based on the provided data and is for informational purposes only. It does not represent a loan approval or denial.`;

  return report;
};



export const getAgronomicAdvice = async (
  messages: ChatMessage[],
  audience: Audience,
  dialect: string,
  isCondensed: boolean, flowType: FlowType
): Promise<GeminiResponse> => {

  const lastUserMessage = messages[messages.length - 1]?.content ?? '';
  const isRiskScoringMode = audience === Audience.RiskScoring;

  // If RiskScoring mode and the user explicitly typed a harvest trigger, bypass the model and compute now.
  if (isRiskScoringMode && /(^|\n)\s*harvest\s*score/i.test(lastUserMessage)) {
    const riskInput: RiskScoreInput = { triggerText: lastUserMessage };
    const result = calculateBaselineRiskScore(riskInput);
    const report = generateRiskScoreReport(result, riskInput);
    return { type: 'diagnosis', text: report };
  }

  // Dynamically generate the system instruction based on whether it's a risk score context.
  const systemInstruction = getSystemInstruction(audience, dialect, isCondensed, flowType);

  const isTechnicianLike = audience === Audience.Technician;

  const schema = isRiskScoringMode
    ? undefined // Let the model decide when to call the function, don't force a JSON response yet
    : isTechnicianLike
      ? TECHNICIAN_RESPONSE_SCHEMA
      : FARMER_RESPONSE_SCHEMA;

  const history = messages.slice(0, -1).map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  const contents = {
    role: 'user',
    parts: [{ text: lastUserMessage }],
  };

  const model = 'gemini-2.5-flash';
  
  const response = await ai.models.generateContent({
    model: model,
    contents: [...history, contents],
    config: {
      //maxOutputTokens: 5000,
      systemInstruction: {
        role: 'model',
        parts: [{ text: systemInstruction }],
      },
      ...(schema && {
        responseMimeType: 'application/json',
        responseSchema: schema,
      }),
      ...(isRiskScoringMode && {
        tools: [{ functionDeclarations: [calculateBaselineRiskScoreTool] }],
      }),
    },
  });

  // Handle function calls for risk scoring
  if (response.functionCalls) {
      const fc = response.functionCalls[0];

      if (fc.name === 'calculateBaselineRiskScore') {
          let riskInput = fc.args as RiskScoreInput;
          let fetchMessage = '';

          // Check if we need to fetch soil data: coordinates are present, but manual soil data is not.
          const hasCoords = riskInput.latitude != null && riskInput.longitude != null;
          const hasManualSoil = riskInput.sand != null && riskInput.silt != null && riskInput.clay != null;

          if (hasCoords && !hasManualSoil) {
              try {
                  const { latitude, longitude } = riskInput;
                  const soilGridsUrl = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${longitude}&lat=${latitude}&property=clay&property=sand&property=silt&depth=15-30cm&value=mean`;
                  const soilResponse = await fetch(soilGridsUrl);
                  if (!soilResponse.ok) {
                      throw new Error(`SoilGrids API request failed with status ${soilResponse.status}`);
                  }
                  const soilData = await soilResponse.json();
                  
                  const properties: Record<string, number> = {};
                  soilData.properties.layers.forEach((layer: any) => {
                      const propName = layer.name;
                      const meanValue = layer.depths[0].values.mean;
                      properties[propName] = meanValue;
                  });

                  const sand = properties.sand;
                  const silt = properties.silt;
                  const clay = properties.clay;
                  
                  if (sand === undefined || silt === undefined || clay === undefined) {
                      fetchMessage = `Could not retrieve complete soil data from SoilGrids for coordinates (${latitude}, ${longitude}). The report below is based on climate data only.\n\n`;
                  } else {
                      // Successfully fetched, add to our input object for the calculator
                      riskInput = { ...riskInput, sand, silt, clay };
                      fetchMessage = '';
                  }
              } catch (apiError) {
                  console.error("Error fetching from SoilGrids API:", apiError);
                  fetchMessage = `Sorry, an error occurred while fetching soil data. The report below is based on any other data you provided.\n\n`;
              }
          }

          const result = calculateBaselineRiskScore(riskInput);
          const report = generateRiskScoreReport(result, riskInput);
          
          return {
              type: 'diagnosis',
              text: fetchMessage + report,
          };
      }
  }

  // If this was a potential tool-use scenario and no function call was made,
  // it means the model is asking for more information. Treat it as a plain text response
  // and do not attempt to parse it as JSON.
  if (isRiskScoringMode) {
    return {
      type: 'diagnosis', // Using 'diagnosis' to prevent rendering choice buttons
      text: response.text,
    };
  }


  let jsonText = response.text;

  // Basic cleanup for JSON string
  jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    const parsedResponse = JSON.parse(jsonText);
    return {
      type: parsedResponse.type || 'diagnosis',
      text: parsedResponse.text || 'I could not generate a response.',
      choices: parsedResponse.choices || [],
    };
  } catch (e) {
    console.error("Failed to parse JSON response:", jsonText, e);
    // If JSON parsing fails, return the raw text. This can happen if the model fails to adhere to the schema.
    return {
      type: 'diagnosis',
      text: response.text || "I'm sorry, I encountered an issue generating a structured response. Here is the raw information:",
    };
  }
};