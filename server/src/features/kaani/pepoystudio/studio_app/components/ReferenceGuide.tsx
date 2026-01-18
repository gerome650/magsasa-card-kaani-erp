import React from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

const farmerDiagnosisContent = `**Posibleng Problema:** Cucumber Beetle

**Paliwanag:** Base sa inyong paglalarawan na may malalaking kagat o butas sa labas ng bunga ng inyong kalabasa, pero walang uod sa loob, malamang po na ang inyong problema ay gawa ng Cucumber Beetle. Ang mga insektong ito ay kumakain ng bunga, dahon, at bulaklak.

**Mga Sunod-sunod na Hakbang (Step-by-Step Guide):**
1.  **Manual na Pag-alis:** Kung hindi pa marami, isa-isahin pong alisin ang mga beetle sa halaman gamit ang kamay at ilagay sa isang lalagyan na may sabon at tubig. Gawin ito sa umaga habang mabagal pa sila.
2.  **Gumamit ng Organic Spray:** Paghaluin ang 1 kutsarang neem oil at 1 kutsaritang sabon (dishwashing liquid) sa 1 litrong tubig. I-spray ito sa apektadong halaman tuwing hapon, isang beses sa isang linggo.
3.  **Maglagay ng Yellow Sticky Traps:** Mahilig dumikit ang mga beetle sa kulay dilaw. Makakabili nito sa mga tindahan ng gamit pang-agri.
4.  **Kung Hindi Umepekto (Kemikal na Solusyon):** Bilang huling paraan, maaari pong gumamit ng pestisidyo na may sangkap na 'Carbaryl' (isang sikat na brand ay 'Sevin'). Maghalo ng 1-2 kutsara sa isang 16-litrong sprayer ng tubig.
    -   **Babala sa Kaligtasan:** Laging magsuot ng proteksyon tulad ng mask, gloves, at mahabang manggas kapag gagamit nito. Huwag mag-spray malapit sa mga bubuyog at iwasang maabot ng bata. Sundin ang nakasulat sa pakete para sa tamang Pre-Harvest Interval (PHI) o araw na dapat hintayin bago anihin.

**Pag-iwas sa Hinaharap (Prevention):**
*   Magtanim ng mga "trap crop" tulad ng squash sa paligid ng inyong kalabasa. Mas gusto ng mga beetle ang squash, kaya doon sila pupunta at hindi sa inyong pangunahing tanim.
*   Panatilihing malinis ang paligid ng taniman mula sa mga damo na pwede nilang pagtaguan.`;

const technicianFertilizerPlan = `**FERTILIZATION PROGRAM: Corn (Mais)**

**I. SOIL ANALYSIS RECOMMENDATION**
A soil analysis is strongly recommended to determine precise nutrient requirements. The following program is a general recommendation for a typical clay loam soil with moderate organic matter.

**II. STAGE-BY-STAGE FERTILIZER APPLICATION**

| Crop Stage | Days After Planting (DAP) | Fertilizer Recommendation | Amount (per hectare) | Application Method |
| :--- | :--- | :--- | :--- | :--- |
| Basal | 0 (At Planting) | 14-14-14 (Complete) | 4 bags (200 kg) | Incorporated into soil |
| 1st Sidedress | 25-30 | 46-0-0 (Urea) | 2-3 bags (100-150 kg) | Sidedress 6cm from base |
| 2nd Sidedress | 45-50 (Tasseling) | 0-0-60 (MOP) | 1 bag (50 kg) | Sidedress |

**III. NOTES ON ORGANIC ALTERNATIVES**
*   Basal application can be supplemented with 2-3 tons/ha of well-composted chicken manure.
*   Foliar sprays of Fermented Plant Juice (FPJ) can be applied every 10-14 days during the vegetative stage to boost nitrogen.

**IV. GENERAL REMINDERS**
*   Ensure soil is moist before fertilizer application to prevent root burn.
*   Split application of Nitrogen (Urea) is crucial to minimize leaching losses.`;

const loanMatchingRecommendation = `**Loan Program Profile**

**Pangalan ng Programa:** Agricultural and Fishers Financing Program (AFFP)

**Layunin:** Magbigay ng pormal na pautang sa mga hindi pa nababangko na Small Farmers and Fishers (SFFs) para sa kanilang produksyon at pangkabuhayan. Ito ay isang joint program ng LBP, DA, at ACPC.

**Sino ang Pwedeng Umasa (Eligible Borrowers):**
*   Mga indibidwal na Small Farmers and Fishers (SFFs).

**Mga Pangunahing Kondisyon (Key Conditions):**
*   Dapat ay nakikibahagi sa isang proyektong pang-agrikultura o pangisdaan na may tiyak na merkado para sa ani.
*   **Kritikal:** Dapat ay nakarehistro sa RSBSA (Registry System for Basic Sectors in Agriculture) o FishR.
*   Dapat ay 18 taong gulang pataas.

**Mahalagang Paalala**
Ang impormasyong ito ay paunang gabay lamang. Para sa opisyal na listahan ng mga requirement at proseso ng aplikasyon, mangyaring makipag-ugnayan sa pinakamalapit na branch ng Landbank.`;

const riskScoringReport = `### KaAni Risk Score Report

**Location:** 14.0901° N, 121.0552° E
**Climate Type:** Type I — Two Pronounced Seasons (Dry: Nov–Apr; Wet: May–Oct)
**Crop Cycle:** May – August
**Computation Date:** October 26, 2023

#### OVERALL BASELINE RISK SCORE

| Component | Score | Tier | Weight |
| :--- | :--- | :--- | :--- |
| Climate Score | 620 | Moderately High | 60% |
| Soil Score | 510 | Moderate | 40% |
| **Overall Baseline Score** | **576** | **Moderately High Risk** | — |

**Interpretation:** The overall baseline risk indicates that the field faces significant environmental and structural stress. This is driven by both wet-season climate patterns and soil properties that increase water-related risks.

---

#### CLIMATE RISK ANALYSIS

| Month | Rainfall (mm) | Rainy Days | Limiting Factor | Monthly Score | Tier | Risk Level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| May | 136 | 9 | Rainfall | 315 | 3 | Moderately Low |
| June | 220 | 13 | Rainy Days | 490 | 4 | Moderate |
| July | 374 | 18 | Rainy Days | 750 | 6 | High |
| August | 301 | 17 | Rainy Days | 680 | 5 | Moderately High |

**Climate Average Score:** 620 → **Moderately High Risk** (Tier 5)
**Dominant Hazard:** Persistent wetness, high rainfall and humidity, Type I pattern.

---

**Disclaimer:** This is a preliminary, un-official assessment based on the provided data and is for informational purposes only. It does not represent a loan approval or denial.`;


const MockChoiceButtons: React.FC<{ choices: string[] }> = ({ choices }) => (
    <div className="mt-3">
        <div className="flex flex-wrap gap-2">
            {choices.map((choice, index) => (
                <button
                    key={index}
                    className="px-4 py-2 text-sm font-semibold rounded-full border border-green-600 text-green-700 bg-white"
                    aria-label={`Select option: ${choice}`}
                >
                    {choice}
                </button>
            ))}
        </div>
    </div>
);

const FormatSample: React.FC<{ title: string; content: string; choices?: string[] }> = ({ title, content, choices }) => (
    <div className="mb-8 p-4 border rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-bold text-green-800 border-b pb-2 mb-3">{title}</h3>
        <div className="bg-gray-100/80 p-4 rounded-md">
            <MarkdownRenderer content={content} />
            {choices && <MockChoiceButtons choices={choices} />}
        </div>
    </div>
);


interface ReferenceGuideProps {
  onClose: () => void;
}

export const ReferenceGuide: React.FC<ReferenceGuideProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Sample Output Formats</h2>
          <button onClick={onClose} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-300">Close</button>
        </div>
        <div className="flex-grow p-6 overflow-y-auto">
            
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Farmer Audience</h2>
                <FormatSample 
                    title="Clarification Question"
                    content="Para matukoy ang problema, kailangan ko po ng kaunting impormasyon. Anong uri ng tanim ang may problema?"
                    choices={["Palay", "Mais", "Gulay", "Punong-prutas"]}
                />
                <FormatSample 
                    title="Problem Diagnosis Report"
                    content={farmerDiagnosisContent}
                />
            </div>

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Technician Audience</h2>
                <FormatSample 
                    title="Fertilization Program (with Table)"
                    content={technicianFertilizerPlan}
                />
            </div>
            
             <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Loan Matching Audience</h2>
                 <FormatSample 
                    title="Screening Question"
                    content="Ano po ang pangunahing layunin ng inyong uutangin?"
                    choices={["Pang-gastos sa produksyon", "Pagbili ng makinarya", "Pangkalahatang suporta"]}
                />
                <FormatSample 
                    title="Final Loan Recommendation"
                    content={loanMatchingRecommendation}
                />
            </div>

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Risk Scoring Audience</h2>
                <FormatSample 
                    title="Risk Score Report"
                    content={riskScoringReport}
                />
            </div>

        </div>
      </div>
    </div>
  );
};