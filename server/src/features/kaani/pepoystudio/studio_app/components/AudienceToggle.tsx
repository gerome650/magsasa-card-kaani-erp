import React from 'react';
import { Audience } from '../types';

interface AudienceToggleProps {
  selectedAudience: Audience;
  onAudienceChange: (audience: Audience) => void;
}

export const AudienceToggle: React.FC<AudienceToggleProps> = ({ selectedAudience, onAudienceChange }) => {
  const getButtonClasses = (audience: Audience) => {
    const baseClasses = 'px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500';
    if (selectedAudience === audience) {
      return `${baseClasses} bg-green-700 text-white shadow`;
    }
    return `${baseClasses} bg-gray-200 text-gray-700 hover:bg-gray-300`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center">
      <div className="flex items-center space-x-2 flex-wrap gap-y-2">
        <button
          onClick={() => onAudienceChange(Audience.Farmer)}
          className={getButtonClasses(Audience.Farmer)}
        >
          Farmer/A.O.
        </button>
        <button
          onClick={() => onAudienceChange(Audience.Technician)}
          className={getButtonClasses(Audience.Technician)}
        >
          Technician
        </button>
        <span className="text-gray-400 mx-1 hidden sm:inline">/</span>
        <button
          onClick={() => onAudienceChange(Audience.LoanMatching)}
          className={getButtonClasses(Audience.LoanMatching)}
        >
          Loan Matching
        </button>
        <button
          onClick={() => onAudienceChange(Audience.RiskScoring)}
          className={getButtonClasses(Audience.RiskScoring)}
        >
          Risk Scoring
        </button>
      </div>
    </div>
  );
};
