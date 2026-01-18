
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="w-8 h-8 p-1">
        <div className="w-6 h-6 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
    </div>
  );
};
