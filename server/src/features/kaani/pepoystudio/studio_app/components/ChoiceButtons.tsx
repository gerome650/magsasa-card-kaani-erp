

import React from 'react';
import { Audience } from '../types';

interface ChoiceButtonsProps {
  choices: string[];
  onSelect: (choice: string) => void;
  audience: Audience;
}

export const ChoiceButtons: React.FC<ChoiceButtonsProps> = ({ choices, onSelect, audience }) => {
  const subtext = audience === Audience.Farmer
    ? "Maaari mo ring i-type ang iyong sagot kung wala ito sa mga pagpipilian."
    : "You can also type your answer if it's not in the choices.";
  
  const subtextClassName = `text-xs text-gray-500 mt-2 italic ${
    audience === Audience.Farmer ? 'font-semibold' : ''
  }`;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => onSelect(choice)}
            className="px-4 py-2 text-sm font-semibold rounded-full border border-green-600 text-green-700 bg-white hover:bg-green-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            aria-label={`Select option: ${choice}`}
          >
            {choice}
          </button>
        ))}
      </div>
      <p className={subtextClassName}>
        {subtext}
      </p>
    </div>
  );
};
