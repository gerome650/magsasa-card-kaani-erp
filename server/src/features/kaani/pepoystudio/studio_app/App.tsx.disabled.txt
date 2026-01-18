
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { AudienceToggle } from './components/AudienceToggle';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { translateContent } from './services/geminiService'; // Helper kept
import { 
  sendToKaAni, 
  getKaAniHistory, 
  resetKaAni, 
  configureKaAni, 
  addMessageToKaAni 
} from './services/agentClient';
import { Audience, ChatMessage, FlowState, FlowType, Dialect } from './types';
import { ReferenceGuide } from './components/ReferenceGuide';
import { DialectToggle } from './components/DialectToggle';

// The decision tree for the Planting Guidance feature in English.
const PLANTING_GUIDE_FLOW_EN = {
  start: {
    id: 'start',
    question: "What is your primary goal today?",
    choices: [
      { text: "Diagnose a problem with an existing plant.", nextId: 'start_diagnose_flow' },
      { text: "Get guidance for planting something new.", nextId: 'crop_preference' }
    ]
  },
  crop_preference: {
    id: 'crop_preference',
    question: "Great! Do you already have a specific crop in mind you'd like to plant?",
    choices: [
      { text: "Yes, I have a specific crop in mind.", nextId: 'get_crop_name' },
      { text: "No, I need some recommendations.", nextId: 'sunlight' }
    ]
  },
  get_crop_name: {
      id: 'get_crop_name',
      question: "Great. Please type the name of the crop you would like to plant."
  },
  scale: {
      id: 'scale',
      question: "Is this for a personal backyard garden or for a larger, commercial farm?",
      choices: [
          { text: "Backyard Garden (Personal Use)", nextId: 'experience' },
          { text: "Commercial Farm (Larger Scale)", nextId: 'experience' }
      ]
  },
  experience: {
      id: 'experience',
      question: "Do you have prior experience growing this, or is this your first time?",
      choices: [
          { text: "This is my first time.", nextId: 'sunlight_specific' },
          { text: "I have experience.", nextId: 'sunlight_specific' }
      ]
  },
  sunlight_specific: {
      id: 'sunlight_specific',
      question: "Considering your planned date of planting does the planting area receive full sun for most of the day?",
      choices: [
          { text: "Yes, full sun all day", nextId: 'soil_type' },
          { text: "Partial sun (half day)", nextId: 'soil_type' },
          { text: "Mostly shady", nextId: 'soil_type' }
      ]
  },
  sunlight: {
    id: 'sunlight',
    question: "Considering your planting date, how many hours of direct, unobstructed sunlight does the planting area receive on a typical day?",
    choices: [
      { text: "Full Sun (6+ hours)", nextId: 'drainage' },
      { text: "Partial Sun/Shade (4-6 hours)", nextId: 'drainage' },
      { text: "Full Shade (Less than 4 hours)", nextId: 'drainage' }
    ]
  },
  drainage: {
    id: 'drainage',
    question: "After a heavy rain, how does the area handle water?",
    choices: [
      { text: "Water drains away within a few hours, leaving the soil moist.", nextId: 'soil_type' },
      { text: "Puddles form and remain for many hours or even days.", nextId: 'soil_type' },
      { text: "Water seems to run off or disappear almost immediately.", nextId: 'soil_type' }
    ]
  },
  soil_type: {
    id: 'soil_type',
    question: "What is the soil like in your planting area?",
    choices: [
      { text: "Sandy (Buhangin)", nextId: 'location' },
      { text: "Clay (Malagkit / Siksik)", nextId: 'location' },
      { text: "Loam (Balanced, not too sandy or sticky)", nextId: 'location' }
    ]
  },
  location: {
      id: 'location',
      question: "Where is your farm located? Please type your **Municipality, Province** (e.g., Santo Tomas, Batangas)."
  },
  planting_time: {
    id: 'planting_time',
    question: "When do you plan to plant?",
    choices: [
      { text: "This month", nextId: 'goal' },
      { text: "Next month", nextId: 'goal' },
      { text: "In 2-3 months", nextId: 'goal' }
    ]
  },
   planting_time_specific: {
    id: 'planting_time_specific',
    question: "When do you plan to plant?",
    choices: [
      { text: "This month", nextId: 'end_generate_specific_guide' },
      { text: "Next month", nextId: 'end_generate_specific_guide' },
      { text: "In 2-3 months", nextId: 'end_generate_specific_guide' }
    ]
  },
  goal: {
    id: 'goal',
    question: "What type of plant are you primarily interested in growing?",
    choices: [
      { text: "Vegetables/Herbs", nextId: 'end_recommend' },
      { text: "Fruits (Trees/Bushes)", nextId: 'end_recommend' },
      { text: "Flowers (Annuals/Perennials)", nextId: 'end_recommend' },
      { text: "Trees (Shade/Ornamental)", nextId: 'end_recommend' },
      { text: "Shrubs/Hedges", nextId: 'end_recommend' }
    ]
  }
};

// The decision tree for the Planting Guidance feature in Tagalog.
const PLANTING_GUIDE_FLOW_TL = {
  start: {
    id: 'start',
    question: "Ano po ang pangunahin ninyong kailangan ngayon?",
    choices: [
      { text: "Magpatingin ng problema sa kasalukuyang tanim.", nextId: 'start_diagnose_flow' },
      { text: "Humingi ng gabay para sa bagong itatanim.", nextId: 'get_crop_name' }
    ]
  },
  get_crop_name: {
      id: 'get_crop_name',
      question: "Sige po. Paki-type ang pangalan ng halaman na gusto ninyong itanim."
  },
  scale: {
    id: 'scale',
    question: "Para po ba ito sa pansariling konsumo sa bakuran, o para sa mas malakihang taniman na pang-komersyal?",
    choices: [
        { text: "Sa bakuran lang (pansariling konsumo)", nextId: 'experience' },
        { text: "Pang-komersyal (mas malakihan)", nextId: 'experience' }
    ]
  },
  experience: {
      id: 'experience',
      question: "May karanasan na po ba kayo sa pagtatanim nito, o ito po ang unang beses ninyo?",
      choices: [
          { text: "Unang beses ko pa lang", nextId: 'sunlight_specific' },
          { text: "May karanasan na ako", nextId: 'sunlight_specific' }
      ]
  },
  sunlight_specific: {
      id: 'sunlight_specific',
      question: "Base sa petsa ng iyong pinaplanong pagtatanim, ang lugar po ba na pagtataniman ay nasisikatan ng araw buong maghapon?",
      choices: [
          { text: "Opo, buong araw", nextId: 'soil_type' },
          { text: "Bahagya lang (kalahating araw)", nextId: 'soil_type' },
          { text: "Kadalasan ay malilim", nextId: 'soil_type' }
      ]
  },
  sunlight: {
    id: 'sunlight',
    question: "Ilang oras po nasisikatan ng araw nang direkta ang pagtataniman sa isang karaniwang araw?",
    choices: [
      { text: "Buong Araw (6+ oras)", nextId: 'drainage' },
      { text: "Bahagyang Maaraw/Malilim (4-6 oras)", nextId: 'drainage' },
      { text: "Laging Malilim (Wala pang 4 na oras)", nextId: 'drainage' }
    ]
  },
  drainage: {
    id: 'drainage',
    question: "Pagkatapos ng malakas na ulan, ano po ang nangyayari sa tubig sa lugar?",
    choices: [
      { text: "Nawawala ang tubig pagkalipas ng ilang oras, naiiwang mamasa-masa ang lupa.", nextId: 'soil_type' },
      { text: "Nagkakaroon ng sanaw na nagtatagal ng maraming oras o araw.", nextId: 'soil_type' },
      { text: "Tila umaagos o nawawala agad ang tubig.", nextId: 'soil_type' }
    ]
  },
  soil_type: {
    id: 'soil_type',
    question: "Ano po ang uri ng lupa sa inyong pagtataniman?",
    choices: [
      { text: "Mabuhangin (Sandy)", nextId: 'get_area_size' },
      { text: "Malagkit at siksik (Clay)", nextId: 'get_area_size' },
      { text: "Loam (Sakto lang, hindi gaanong mabuhangin o malagkit)", nextId: 'get_area_size' }
    ]
  },
  get_area_size: {
    id: 'get_area_size',
    question: "Paki-type ang sukat ng area (hal. 350 m² o 1.2 ha).",
    nextId: 'location'
  },
  location: {
    id: 'location',
    question: "Saan po matatagpuan ang inyong taniman at kailan nyo po plano magtanim? Paki-type ang **Barangay, Munisipyo, Probinsya, Buwan** (hal. Bgy Poblacion, Sto. Tomas, Batangas, Enero).",
    nextId: 'end_recommend'
  }
};

const DIAGNOSIS_FLOW_EN = {
  start: {
    id: 'start',
    question: "What is the general type of plant that has a problem?",
    choices: [
      { text: "Rice", nextId: 'problem_location' },
      { text: "Corn", nextId: 'problem_location' },
      { text: "Vegetable (e.g., Tomato, Eggplant, Pechay)", nextId: 'problem_location' },
      { text: "Fruit Tree (e.g., Mango, Banana)", nextId: 'problem_location' },
      { text: "Root Crop (e.g., Sweet Potato, Potato)", nextId: 'problem_location' }
    ]
  },
  problem_location: {
    id: 'problem_location',
    question: "On which part of the plant did you first notice the problem?",
    choices: [
      { text: "Leaves", nextId: 'symptoms_leaf' },
      { text: "Stem or Trunk", nextId: 'symptoms_stem' },
      { text: "Fruits or Flowers", nextId: 'symptoms_fruit' },
      { text: "Roots or surrounding soil", nextId: 'symptoms_root' }
    ]
  },
  symptoms_leaf: {
    id: 'symptoms_leaf',
    question: "What is most noticeable about the leaves?",
    choices: [
      { text: "There are holes or they look eaten.", nextId: 'insect_presence' },
      { text: "They are yellow, red, or discolored.", nextId: 'insect_presence' },
      { text: "There are spots, mold, or a powdery substance.", nextId: 'insect_presence' },
      { text: "They are curling, wrinkled, or growing abnormally.", nextId: 'insect_presence' }
    ]
  },
  symptoms_stem: {
    id: 'symptoms_stem',
    question: "What is the problem with the stem or trunk?",
    choices: [
      { text: "It's soft, rotting, or has lesions.", nextId: 'insect_presence' },
      { text: "There are holes or tunnels inside.", nextId: 'insect_presence' },
      { text: "It has a strange color or a substance is oozing out.", nextId: 'insect_presence' }
    ]
  },
  symptoms_fruit: {
    id: 'symptoms_fruit',
    question: "What is the problem with the fruits or flowers?",
    choices: [
      { text: "There are holes or worms inside.", nextId: 'insect_presence' },
      { text: "They are rotting, have mold, or blemishes.", nextId: 'insect_presence' },
      { text: "They are falling off before they ripen.", nextId: 'insect_presence' },
      { text: "They are misshapen or deformed.", nextId: 'insect_presence' }
    ]
  },
  symptoms_root: {
    id: 'symptoms_root',
    question: "What have you noticed about the overall health of the plant?",
    choices: [
      { text: "The entire plant is suddenly wilting.", nextId: 'insect_presence' },
      { text: "It's stunted or growing very slowly.", nextId: 'insect_presence' },
      { text: "The base of the stem near the soil is black and rotting.", nextId: 'insect_presence' }
    ]
  },
  insect_presence: {
    id: 'insect_presence',
    question: "Do you see any insects, worms, spiders, or webs on the plant or under the leaves?",
    choices: [
      { text: "Yes, I see some.", nextId: 'end_diagnose' },
      { text: "No, I can't see any.", nextId: 'end_diagnose' }
    ]
  }
};

const DIAGNOSIS_FLOW_TL = {
  start: {
    id: 'start',
    question: "Anong pangkalahatang uri ng halaman ang may problema?",
    choices: [
      { text: "Palay", nextId: 'problem_location' },
      { text: "Mais", nextId: 'problem_location' },
      { text: "Gulay (Hal. Kamatis, Talong, Pechay)", nextId: 'problem_location' },
      { text: "Punong Prutas (Hal. Mangga, Saging)", nextId: 'problem_location' },
      { text: "Root Crop (Hal. Kamote, Patatas)", nextId: 'problem_location' }
    ]
  },
  problem_location: {
    id: 'problem_location',
    question: "Saang bahagi ng halaman ninyo unang napansin ang problema?",
    choices: [
      { text: "Mga Dahon", nextId: 'symptoms_leaf' },
      { text: "Tangkay o Katawan ng Puno", nextId: 'symptoms_stem' },
      { text: "Mga Bunga o Bulaklak", nextId: 'symptoms_fruit' },
      { text: "Ugat o Lupa sa paligid", nextId: 'symptoms_root' }
    ]
  },
  symptoms_leaf: {
    id: 'symptoms_leaf',
    question: "Ano ang pinaka-kapansin-pansin sa mga dahon?",
    choices: [
      { text: "May mga butas o mukhang kinakain.", nextId: 'insect_presence' },
      { text: "Naninilaw, namumula, o may ibang kulay.", nextId: 'insect_presence' },
      { text: "May mga batik, amag, o parang pulbos.", nextId: 'insect_presence' },
      { text: "Kulot, kulubot, o hindi normal ang pagtubo.", nextId: 'insect_presence' }
    ]
  },
  symptoms_stem: {
    id: 'symptoms_stem',
    question: "Ano ang problema sa tangkay o katawan?",
    choices: [
      { text: "Malambot, nabubulok, o may sugat.", nextId: 'insect_presence' },
      { text: "May mga butas o tunnel sa loob.", nextId: 'insect_presence' },
      { text: "May kakaibang kulay o substansya na dumadaloy.", nextId: 'insect_presence' }
    ]
  },
  symptoms_fruit: {
    id: 'symptoms_fruit',
    question: "Ano ang problema sa mga bunga o bulaklak?",
    choices: [
      { text: "May mga butas o may uod sa loob.", nextId: 'insect_presence' },
      { text: "Nabubulok, may amag, o mantsa.", nextId: 'insect_presence' },
      { text: "Nalalaglag bago pa man mahinog.", nextId: 'insect_presence' },
      { text: "Hindi normal ang hugis o itsura.", nextId: 'insect_presence' }
    ]
  },
  symptoms_root: {
    id: 'symptoms_root',
    question: "Ano ang napansin ninyo sa pangkalahatang kalusugan ng halaman?",
    choices: [
      { text: "Biglaang nalalanta ang buong halaman.", nextId: 'insect_presence' },
      { text: "Bansot o mabagal ang paglaki.", nextId: 'insect_presence' },
      { text: "Nangingitim at nabubulok ang puno malapit sa lupa.", nextId: 'insect_presence' }
    ]
  },
  insect_presence: {
    id: 'insect_presence',
    question: "May nakikita po ba kayong mga insekto, uod, gagamba, o sapot sa halaman o sa ilalim ng dahon?",
    choices: [
      { text: "Opo, mayroon.", nextId: 'end_diagnose' },
      { text: "Wala po akong makita.", nextId: 'end_diagnose' }
    ]
  }
};


const getFlow = (type: FlowType, audience: Audience) => {
  const isFarmer = audience === Audience.Farmer;
  if (type === 'planting_guide') {
    return isFarmer ? PLANTING_GUIDE_FLOW_TL : PLANTING_GUIDE_FLOW_EN;
  }
  if (type === 'diagnosis_guide') {
    return isFarmer ? DIAGNOSIS_FLOW_TL : DIAGNOSIS_FLOW_EN;
  }
  // Default fallback
  return PLANTING_GUIDE_FLOW_EN;
}


const App: React.FC = () => {
  const [audience, setAudience] = useState<Audience>(Audience.Farmer);
  const [dialect, setDialect] = useState<Dialect>(Dialect.Tagalog);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAwaitingChoice, setIsAwaitingChoice] = useState<boolean>(false);
  const [flowState, setFlowState] = useState<FlowState>({ type: 'planting_guide', stepId: 'start', answers: {} });
  const [showReferenceGuide, setShowReferenceGuide] = useState<boolean>(false);
  const [isCondensedMode, setIsCondensedMode] = useState<boolean>(true); //false to make green default

  // Configure the Agent whenever preferences change
  useEffect(() => {
    configureKaAni({
      audience,
      dialect,
      isCondensed: isCondensedMode,
    });
  }, [audience, dialect, isCondensedMode]);

  // Renamed to handle text input instead of full message array
  const processAIResponse = useCallback(async (inputText: string, flowTypeForCall: FlowType) => {
    setIsLoading(true);
    setError(null);
    setIsAwaitingChoice(false);

    // Ensure agent has correct flow type
    configureKaAni({ flowType: flowTypeForCall });

    try {
      // Use the Agent Client instead of direct Service call
      const response = await sendToKaAni(inputText);
      
      // Sync UI state with Agent history
      setMessages(getKaAniHistory());

      if (response.type === 'question' && response.choices && response.choices.length > 0) {
        setIsAwaitingChoice(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      const newErrorMessage: ChatMessage = { role: 'model', content: `Sorry, I encountered an error: ${errorMessage}` };
      setMessages(prevMessages => [...prevMessages, newErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const presentNewStep = useCallback(async (step: { id: string; question: string; choices?: { text: string; nextId: string }[] }) => {
    const choicesText = step.choices?.map(c => c.text);

    let nextMessage: ChatMessage = { role: 'model', content: step.question, choices: choicesText };

    if (audience === Audience.Farmer && dialect !== Dialect.Tagalog && choicesText) {
      setIsLoading(true);
      try {
        const translatedContent = await translateContent({ question: step.question, choices: choicesText }, dialect);
        nextMessage = {
          role: 'model',
          content: translatedContent.question,
          choices: translatedContent.choices,
          originalChoices: choicesText,
        };
      } catch (e) {
        console.error("Translation failed, falling back to original content.", e);
      } finally {
        setIsLoading(false);
      }
    }
    
    setMessages(prev => [...prev, nextMessage]);
    // Sync the deterministic step to the Agent history
    addMessageToKaAni(nextMessage);
    setIsAwaitingChoice(!!choicesText);
  }, [audience, dialect]);


  const resetFlow = useCallback(() => {
    // Reset agent history
    resetKaAni();
    setMessages([]);
    setError(null);
    setIsAwaitingChoice(false);

    if (audience === Audience.Farmer || audience === Audience.Technician) {
      const flow = getFlow('planting_guide', audience);
      const startStep = flow.start;
      presentNewStep(startStep);
      setFlowState({ type: 'planting_guide', stepId: 'start', answers: {} });
    } else if (audience === Audience.RiskScoring) {
        const initialMessage: ChatMessage = {
            role: 'model',
            content: "Welcome to the Risk Scoring tool. To provide a preliminary risk assessment, please provide the following:\n\n*   **Coordinates:** The farm's latitude and longitude.\n* **Province:** For yield benchmark\n*   **Soil Data (Optional):** The percentages of sand, silt, and clay.\n*   **Crop Data:** Crop type + Crop cycle (Planting date - Harvest date)\n* **Projected Harvest:** Ex. 4.2 MT / Ha"
        };
        setMessages([initialMessage]);
        // Sync initial message to Agent
        addMessageToKaAni(initialMessage);
        setFlowState({ type: 'chat', stepId: 'start', answers: {} });
    } else {
      setFlowState({ type: 'chat', stepId: 'start', answers: {} });
    }
  }, [audience, presentNewStep]);

  useEffect(() => {
    resetFlow();
  }, [audience, dialect]);

 const handleChoiceSelected = useCallback(async (choice: string) => {
    const userChoiceMessage: ChatMessage = { role: 'user', content: choice };
    const lastModelMessage = messages[messages.length - 1];

    let originalChoice = choice;
    if (lastModelMessage?.originalChoices && lastModelMessage?.choices) {
        const choiceIndex = lastModelMessage.choices.indexOf(choice);
        if (choiceIndex > -1) {
            originalChoice = lastModelMessage.originalChoices[choiceIndex];
        }
    }

    setMessages(prev => [...prev, userChoiceMessage]);
    // Sync user choice to Agent
    addMessageToKaAni(userChoiceMessage);
    
    setIsAwaitingChoice(false);

    if (flowState.type === 'chat') {
        // In chat flow, user choice is treated as input to AI
        // Note: since we manually added the choice message above, 
        // we might ideally just trigger response generation. 
        // However, sendToKaAni expects text input to add.
        // Since we ALREADY added the message manually via addMessageToKaAni,
        // calling sendToKaAni(choice) would duplicate it in Agent history.
        // FIX: For chat flow here, we should probably just call sendToKaAni WITHOUT manual add?
        // But standardizing is better. Let's revert manual add for CHAT flow logic specifically?
        // Or simpler: reset Agent's last message? No.
        
        // CORRECT APPROACH: `sendToKaAni` adds the user message. 
        // If we want to use `sendToKaAni`, we should NOT call `addMessageToKaAni` for the trigger message.
        // But we already did. 
        // Let's adjust: We pass an empty string? No.
        // We'll use a pattern: for AI triggers, we DON'T manual add. For Flow steps, we DO.
        // Since we can't easily undo, let's assume for now we just pass a prompt to AI that includes context if needed,
        // or we rely on the fact that "Chat" flow usually implies typing. 
        // Buttons in chat flow are rare unless suggested choices.
        
        // Actually, existing app logic uses `processAIResponse([...messages, userChoiceMessage])`.
        // If `processAIResponse` calls `sendToKaAni(lastMessage)`, then:
        // If `flowState.type === 'chat'`, we want the Agent to reply to `choice`.
        // But `choice` is already in history.
        // We can assume the Agent needs to reply to the last message in history.
        // `KaAniAgent`'s `send` method takes text and adds it.
        // We cannot trigger a reply without adding text with current `KaAniAgent`.
        // Let's modify `processAIResponse` usage here.
        // If we are in chat, let's just treat the choice as the text to send.
        // So we REMOVE `addMessageToKaAni(userChoiceMessage)` above?
        // No, because we need it for the decision tree logic below.
        
        // Workaround: If flow is chat, we assume `processAIResponse` will handle sending.
        // But `processAIResponse` uses `sendToKaAni`.
        // Let's remove the manual add for the Chat case? No, `flowState` check is down here.
        // Let's execute `sendToKaAni(choice)` and let it duplicate? Bad.
        
        // Better: Refactor. We won't call `addMessageToKaAni` immediately. 
        // We defer it.
    }
    
    // NOTE: Re-structuring logic to avoid duplication in Agent history.
    // Logic: If next step is AI, we let AI Agent add the prompt/message.
    // If next step is deterministic, we manual add.
    
    // Check flow first
    if (flowState.type === 'chat') {
       // It's chat. We want to send this to AI.
       // We do NOT manual sync. We let processAIResponse do it.
       await processAIResponse(choice, 'chat');
       return; 
    }
    
    // It is a decision tree flow. We DO manual sync because we might not call AI yet.
    // Wait, we added `userChoiceMessage` to local `messages`. We must sync it.
    // UNLESS we are about to switch to 'chat' and trigger AI.
    
    const flow = getFlow(flowState.type, audience);
    const currentStep = flow[flowState.stepId as keyof typeof flow];
    const selectedOption = 'choices' in currentStep ? currentStep.choices.find(c => c.text === originalChoice) : undefined;

    if (selectedOption) {
        const nextStepId = selectedOption.nextId;
        
        // Case: Switching to Diagnosis Flow
        if (nextStepId === 'start_diagnose_flow') {
             // We manually sync the user choice "Diagnose..."
             addMessageToKaAni(userChoiceMessage);
             
            const diagnosisFlow = getFlow('diagnosis_guide', audience);
            const startStep = diagnosisFlow.start;
            await presentNewStep(startStep);
            setFlowState({ type: 'diagnosis_guide', stepId: 'start', answers: { 'initial_goal': originalChoice } });
            return;
        }

        // Case: End of Diagnosis -> AI Analysis
        if (nextStepId === 'end_diagnose') {
            // We manually sync the choice "Yes/No"
            addMessageToKaAni(userChoiceMessage);
            
            const newAnswers = { ...flowState.answers, [currentStep.id]: originalChoice };
            const finalAnswers = newAnswers;
            const prompt = audience === Audience.Farmer
                ? `DIAGNOSIS REQUEST (Tagalog): Tulungan akong matukoy ang problema sa aking tanim. Ito ang mga detalye:
- Uri ng Halaman: ${finalAnswers.start || 'Hindi tinukoy'}
- Lokasyon ng Problema: ${finalAnswers.problem_location || 'Hindi tinukoy'}
- Sintomas: ${finalAnswers.symptoms_leaf || finalAnswers.symptoms_stem || finalAnswers.symptoms_fruit || finalAnswers.symptoms_root || 'Hindi tinukoy'}
- Presensya ng Insekto: ${finalAnswers.insect_presence || 'Hindi tinukoy'}`
                : `DIAGNOSIS REQUEST: Help me diagnose a problem with my crop. Here are the details:
- Plant Type: ${finalAnswers.start || 'Not specified'}
- Problem Location: ${finalAnswers.problem_location || 'Not specified'}
- Symptom: ${finalAnswers.symptoms_leaf || finalAnswers.symptoms_stem || finalAnswers.symptoms_fruit || finalAnswers.symptoms_root || 'Not specified'}
- Insect Presence: ${finalAnswers.insect_presence || 'Not specified'}`;
            
            setFlowState({ type: 'chat', stepId: 'start', answers: {} });
            
            // Send prompt to AI. This adds prompt to history.
            // The previous user choice is already in history (manually added).
            await processAIResponse(prompt, 'chat');
            return;
        }
        
        // Case: Asking for Typed Input
        if (nextStepId === 'location' || nextStepId === 'get_crop_name') {
            addMessageToKaAni(userChoiceMessage);
            const nextStep = flow[nextStepId as keyof typeof flow];
            const nextModelMessage: ChatMessage = { role: 'model', content: nextStep.question };
            setMessages(prev => [...prev, nextModelMessage]);
            addMessageToKaAni(nextModelMessage); // Sync model msg
            
            const awaitingStepId = nextStepId === 'location' ? 'awaiting_location' : 'awaiting_crop_name';
            const newAnswers = { ...flowState.answers, [currentStep.id]: originalChoice };
            setFlowState({ type: 'planting_guide', stepId: awaitingStepId, answers: newAnswers });
            setIsAwaitingChoice(false);
            return;
        }

        // Case: End Planting Guide -> AI Generation
        if (nextStepId === 'end_generate_specific_guide') {
            addMessageToKaAni(userChoiceMessage);
            const newAnswers = { ...flowState.answers, [currentStep.id]: originalChoice };
            const finalAnswers = newAnswers;
            const prompt = audience === Audience.Farmer
                ? `PLANTING GUIDE REQUEST (Tagalog): Magbigay ng kumpletong gabay sa pagtatanim para sa "${finalAnswers.cropName}". Ito ang mga detalye:
- Lugar: ${finalAnswers.scale}
- Karanasan: ${finalAnswers.experience}
- Sikat ng Araw: ${finalAnswers.sunlight_specific}
- Uri ng Lupa: ${finalAnswers.soil_type}
- Lokasyon: ${finalAnswers.location}
- Panahon ng Pagtatanim: ${finalAnswers.planting_time_specific}`
                : `PLANTING GUIDE REQUEST: Provide a complete planting guide for "${finalAnswers.cropName}". Here are the details:
- Scale: ${finalAnswers.scale}
- Experience: ${finalAnswers.experience}
- Sunlight: ${finalAnswers.sunlight_specific}
- Soil Type: ${finalAnswers.soil_type}
- Location: ${finalAnswers.location}
- Planting Time: ${finalAnswers.planting_time_specific}`;
            
            setFlowState({ type: 'chat', stepId: 'start', answers: {} });
            await processAIResponse(prompt, 'chat');
            return;
        }

        // Case: End Recommend -> AI Generation
        if (nextStepId === 'end_recommend') {
            addMessageToKaAni(userChoiceMessage);
            const newAnswers = { ...flowState.answers, [currentStep.id]: originalChoice };
            const finalAnswers = newAnswers;
            const prompt = audience === Audience.Farmer
                ? `PLANTING GUIDE REQUEST (Tagalog): Kailangan ko ng payo sa pagtatanim. Ito ang mga kondisyon:
- Sikat ng Araw: ${finalAnswers.sunlight}
- Daloy ng Tubig (Drainage): ${finalAnswers.drainage}
- Uri ng Lupa (Soil Type): ${finalAnswers.soil_type}
- Lokasyon: ${finalAnswers.location}
- Panahon ng Pagtatanim: ${finalAnswers.planting_time}
- Layunin (Goal): ${finalAnswers.goal}`
                : `PLANTING GUIDE REQUEST: I need planting advice. Here are the conditions:
- Sunlight: ${finalAnswers.sunlight}
- Drainage: ${finalAnswers.drainage}
- Soil Type: ${finalAnswers.soil_type}
- Location: ${finalAnswers.location}
- Planting Time: ${finalAnswers.planting_time}
- Goal: ${finalAnswers.goal}`;
            
            setFlowState({ type: 'chat', stepId: 'start', answers: {} });
            await processAIResponse(prompt, 'chat');
            return;
        }

        // Standard Step Transition
        addMessageToKaAni(userChoiceMessage);
        const newAnswers = { ...flowState.answers, [currentStep.id]: originalChoice };
        const nextStep = flow[nextStepId as keyof typeof flow];
        if (nextStep) {
            await presentNewStep(nextStep);
            setFlowState({ type: flowState.type, stepId: nextStepId, answers: newAnswers });
        } else {
            setFlowState({ type: 'chat', stepId: 'start', answers: {} });
            await processAIResponse(originalChoice, 'chat');
        }
    } else {
        // Fallback if choice not found (unlikely with buttons)
        setFlowState({ type: 'chat', stepId: 'start', answers: {} });
        await processAIResponse(choice, 'chat');
    }
  }, [messages, processAIResponse, flowState, audience, presentNewStep]);
  
  const handleSendMessage = useCallback(async (inputText: string) => {
    if (!inputText.trim() || isLoading) return;

    // If we're awaiting a choice, try to match typed text to one of the buttons first
    if (isAwaitingChoice && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const choices = lastMessage.choices || [];
      const matchedChoice = choices.find(
        choice => choice.trim().toLowerCase() === inputText.trim().toLowerCase()
      );

      if (matchedChoice) {
        handleChoiceSelected(matchedChoice);
        return;
      }
    }

    // Normal Message Handling
    // NOTE: For Chat flow, processAIResponse handles adding user msg.
    // But for "Decision Tree Input" (like Crop Name), we handle manually.
    
    const flow = getFlow(flowState.type === 'diagnosis_guide' ? 'diagnosis_guide' : 'planting_guide', audience);

    // 1) Awaiting crop name
    if (flowState.type === 'planting_guide' && flowState.stepId === 'awaiting_crop_name') {
      const newUserMessage: ChatMessage = { role: 'user', content: inputText };
      setMessages(prev => [...prev, newUserMessage]);
      addMessageToKaAni(newUserMessage); // Sync
      
      const newAnswers = { ...flowState.answers, cropName: inputText };
      const nextStepId = 'scale';
      const nextStep = flow[nextStepId as keyof typeof flow];
      if (nextStep) {
        await presentNewStep(nextStep);
        setFlowState({ type: 'planting_guide', stepId: nextStepId, answers: newAnswers });
        return;
      }
    }

    // 2) Tagalog planting flow: handle free-text area size
    if (flowState.type === 'planting_guide' && flowState.stepId === 'get_area_size') {
      const newUserMessage: ChatMessage = { role: 'user', content: inputText };
      setMessages(prev => [...prev, newUserMessage]);
      addMessageToKaAni(newUserMessage); // Sync

      const newAnswers = { ...flowState.answers, get_area_size: inputText };
      const nextStep = (flow as any).location;
      if (nextStep) {
        const nextModelMessage: ChatMessage = { role: 'model', content: nextStep.question };
        setMessages(prev => [...prev, nextModelMessage]);
        addMessageToKaAni(nextModelMessage); // Sync model msg
        setFlowState({ type: 'planting_guide', stepId: 'awaiting_location', answers: newAnswers });
        return;
      }
    }

    // 3) Awaiting location
    if (flowState.type === 'planting_guide' && flowState.stepId === 'awaiting_location') {
      const newUserMessage: ChatMessage = { role: 'user', content: inputText };
      setMessages(prev => [...prev, newUserMessage]);
      addMessageToKaAni(newUserMessage); // Sync

      const newAnswers: Record<string, string> = { ...flowState.answers, location: inputText };

      const finalAnswers = newAnswers;

      // Farmer → Tagalog planting guide flow (PLANTING_GUIDE_FLOW_TL)
      if (audience === Audience.Farmer) {
        const prompt = `PLANTING GUIDE REQUEST (Tagalog): Magbigay ng kumpletong gabay sa pagtatanim para sa "${finalAnswers['cropName'] || 'hindi tinukoy na tanim'}". Ito ang aking sitwasyon:
  - Sukat ng Lupa: ${finalAnswers['get_area_size'] || 'Hindi tinukoy'}
  - Sukat / Scale: ${finalAnswers['scale'] || 'Hindi tinukoy'}
  - Karanasan: ${finalAnswers['experience'] || 'Hindi tinukoy'}
  - Sikat ng Araw sa Lugar: ${finalAnswers['sunlight_specific'] || 'Hindi tinukoy'}
  - Uri ng Lupa: ${finalAnswers['soil_type'] || 'Hindi tinukoy'}
  - Lokasyon at Buwan ng Pagtatanim: ${finalAnswers['location'] || 'Hindi tinukoy'}`;

        setFlowState({ type: 'chat', stepId: 'start', answers: {} });
        await processAIResponse(prompt, 'chat');
        return;
      }

      // Technician / English flow
      const isSpecificCropFlow = 'cropName' in newAnswers;
      const nextStepId = isSpecificCropFlow ? 'planting_time_specific' : 'planting_time';
      const nextStep = (flow as any)[nextStepId];

      if (nextStep) {
        await presentNewStep(nextStep);
        setFlowState({ type: 'planting_guide', stepId: nextStepId, answers: newAnswers });
        return;
      }
    }

    // 4) Fallback: switch to free chat / diagnosis chat
    const nextFlowType = flowState.type === 'diagnosis_guide' ? 'diagnosis_chat' : 'chat';
    setFlowState({ type: nextFlowType, stepId: 'start', answers: {} });
    await processAIResponse(inputText, nextFlowType);
    
  }, [messages, isLoading, processAIResponse, isAwaitingChoice, handleChoiceSelected, flowState, audience, presentNewStep]);



  const getPlaceholderText = () => {
    if (flowState.type === 'planting_guide' && flowState.stepId === 'awaiting_crop_name') {
        return audience === Audience.Farmer
            ? "I-type ang pangalan ng iyong tanim dito..."
            : "Type the name of your crop here...";
    }
    if (flowState.type === 'planting_guide' && flowState.stepId === 'awaiting_location') {
        return audience === Audience.Farmer
            ? "I-type ang iyong Munisipyo, Probinsya..."
            : "Type your Municipality, Province...";
    }
    if (isAwaitingChoice) {
      if (audience === Audience.Farmer) {
        switch(dialect) {
          case Dialect.Cebuano: return "Pilia ang opsyon sa taas o i-type imong tubag...";
          case Dialect.Ilonggo: return "Pilia ang opsyon sa babaw ukon i-type imo sabat...";
          default: return "Pumili ng opsyon sa itaas o i-type ang iyong sagot...";
        }
      }
      return "Select an option above or type a reply...";
    }
    switch(audience) {
      case Audience.Farmer:
        return "Ilarawan ang problema sa tanim o pumili ng opsyon...";
      case Audience.Technician:
        return "Describe the crop issue or select an option...";
      case Audience.LoanMatching:
        return "Type your response here...";
      case Audience.RiskScoring:
        return "Enter coordinates, soil, or climate data...";
      default:
        return "Type your message...";
    }
  };

  return (
    <div
      className="flex flex-col h-screen font-sans bg-cover bg-center"
      style={{ backgroundImage: "url('https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')" }}
    >
      <Header onShowFormats={() => setShowReferenceGuide(true)} />
      {showReferenceGuide && <ReferenceGuide onClose={() => setShowReferenceGuide(false)} />}
      <div className="flex-grow flex flex-col items-center justify-center w-full p-4 overflow-hidden">
        <div className="p-2 bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 w-full max-w-5xl h-full flex flex-col">
          <div className="w-full h-full flex flex-col bg-white/80 rounded-2xl shadow-inner overflow-hidden">
            <div className="p-4 border-b border-gray-200/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                    <AudienceToggle selectedAudience={audience} onAudienceChange={setAudience} />
                    <DialectToggle 
                        selectedDialect={dialect} 
                        onDialectChange={setDialect} 
                        isVisible={audience === Audience.Farmer}
                        isCondensed={isCondensedMode}
                        onCondensedChange={setIsCondensedMode}
                    />
                </div>
            </div>
            <ChatWindow
              messages={messages}
              isLoading={isLoading}
              isAwaitingChoice={isAwaitingChoice}
              onChoiceSelected={handleChoiceSelected}
              audience={audience}
            />
            <div className="p-4 border-t border-gray-200/50">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder={getPlaceholderText()}
                isAwaitingChoice={isAwaitingChoice}
              />
            </div>
          </div>
        </div>
      </div>
       <footer className="text-center text-sm text-white py-2 [text-shadow:0_1px_3px_rgb(0_0_0_/_0.5)]">
            <p>Powered by AgSense. KaAni is a Diagnostic tool meant to supplement Farmer and Agricultural professional knowledge</p>
        </footer>
    </div>
  );
};

export default App;
