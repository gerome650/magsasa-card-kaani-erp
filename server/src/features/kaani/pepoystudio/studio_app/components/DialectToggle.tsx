
import React from 'react';
import { Dialect } from '../types';

interface DialectToggleProps {
  selectedDialect: Dialect;
  onDialectChange: (dialect: Dialect) => void;
  isVisible: boolean;
  isCondensed: boolean;
  onCondensedChange: (isCondensed: boolean) => void;
}

export const DialectToggle: React.FC<DialectToggleProps> = ({ selectedDialect, onDialectChange, isVisible, isCondensed, onCondensedChange }) => {

  if (!isVisible) {
    return null;
  }
  
  const condensedToggleButtonClasses = `w-6 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
      isCondensed
        ? 'bg-yellow-400 hover:bg-yellow-500 focus:ring-yellow-500'
        : 'bg-green-500 hover:bg-green-600 focus:ring-green-600'
  }`;

  return (
    <div className="flex items-center space-x-2 border-l border-gray-400/50 pl-3 ml-3 mt-2 sm:mt-0">
        <label htmlFor="dialect-select" className="text-sm font-semibold text-gray-600">Dialect:</label>
        <div className="relative">
            <select
              id="dialect-select"
              value={selectedDialect}
              onChange={(e) => onDialectChange(e.target.value as Dialect)}
              className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 hover:border-gray-300 px-3 py-1 pr-8 rounded-md leading-tight focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-xs font-semibold cursor-pointer"
            >
              {Object.values(Dialect).map((dialect) => (
                <option key={dialect} value={dialect}>
                  {dialect}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
        <button
          onClick={() => onCondensedChange(!isCondensed)}
          className={condensedToggleButtonClasses}
          aria-pressed={isCondensed}
          aria-label="Toggle condensed response mode"
        />
    </div>
  );
};