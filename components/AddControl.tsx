import React, { useState } from 'react';
import type { AddMode } from '../types';

interface AddControlProps {
  addMode: AddMode;
  setAddMode: (mode: AddMode) => void;
}

const AddControl: React.FC<AddControlProps> = ({ addMode, setAddMode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (addMode) {
      setAddMode(null);
      setIsOpen(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleSelectMode = (mode: 'sensor' | 'confirmed' | 'reported') => {
    setAddMode(mode);
    setIsOpen(false);
  };

  const menuItems = [
    { mode: 'sensor' as const, label: 'Add Sensor', icon: <SensorIcon />, color: 'bg-blue-500 hover:bg-blue-600' },
    { mode: 'confirmed' as const, label: 'Add Confirmed Case', icon: <CaseIcon />, color: 'bg-red-500 hover:bg-red-600' },
    { mode: 'reported' as const, label: 'Add Reported Case', icon: <CaseIcon />, color: 'bg-yellow-500 hover:bg-yellow-600' },
  ];

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end">
      <div 
        className={`flex flex-col items-end transition-all duration-300 ease-in-out ${isOpen ? 'space-y-2 mb-2' : 'h-0 opacity-0 pointer-events-none'}`}
      >
        {menuItems.map(item => (
            <button
                key={item.mode}
                onClick={() => handleSelectMode(item.mode)}
                className={`flex items-center px-4 py-2 text-white rounded-lg shadow-md transition-all duration-200 ${item.color}`}
                title={item.label}
            >
               {item.icon}
               <span className="ml-2 whitespace-nowrap">{item.label}</span>
            </button>
        ))}
      </div>
      <button
        onClick={handleToggle}
        className={`w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg transition-transform duration-300 ease-in-out ${addMode ? 'bg-red-600 rotate-45' : 'bg-blue-600 hover:bg-blue-700'}`}
        title={addMode ? 'Cancel Add Mode' : 'Add New Item'}
      >
        <PlusIcon />
      </button>
    </div>
  );
};

// Icons
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);
const SensorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
);
const CaseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

export default AddControl;