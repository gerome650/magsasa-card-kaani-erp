import React from 'react';

const LeafIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-green-300" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h10a3 3 0 013 3v4.293zM5 5a1 1 0 00-1 1v4.586l6 6 6-6V6a1 1 0 00-1-1H5z" />
        <path d="M10 11a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
);

interface HeaderProps {
    onShowFormats: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onShowFormats }) => {
  return (
    <header className="bg-green-800 text-white p-4 shadow-md w-full z-10">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
         <div className="flex items-center">
            <LeafIcon />
            <h1 className="text-xl md:text-2xl font-bold">KaAni</h1>
         </div>
         <button 
            onClick={onShowFormats} 
            className="px-3 py-1 text-xs font-semibold bg-green-600 rounded-md hover:bg-green-500 transition-colors"
            >
            Sample Formats
        </button>
      </div>
    </header>
  );
};