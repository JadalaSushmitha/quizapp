// quizappfd/src/components/Numpad.jsx
import React from 'react';
import '../styles/Numpad.css';

const Numpad = ({ onInput }) => {
  const keys = [
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    '0', '.', 'B', // Rearranged for zero to be first in its row
    'C' // C for Clear
  ];

  return (
    <div className="numpad-container">
      {keys.map((key) => (
        <button
          key={key}
          className={`numpad-button ${key === 'C' ? 'numpad-clear' : ''} ${key === 'B' ? 'numpad-backspace' : ''}`}
          onClick={() => onInput(key)}
        >
          {key === 'B' ? '⌫' : key}
        </button>
      ))}
    </div>
  );
};

export default Numpad;