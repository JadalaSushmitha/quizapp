// quizappfd/src/components/Numpad.jsx
import React from 'react';
import '../styles/Numpad.css'; // We'll create this CSS file

const Numpad = ({ onInput }) => {
  const keys = [
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    '.', '0', 'B', // B for Backspace
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
          {key === 'B' ? '⌫' : key} {/* Unicode for backspace symbol */}
        </button>
      ))}
    </div>
  );
};

export default Numpad;