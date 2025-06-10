// quizappfd/src/components/Calculator.jsx
import React, { useState, useEffect } from 'react';
import Numpad from './Numpad'; // Import your existing Numpad component
import '../styles/Calculator.css'; // We'll create this CSS file

const Calculator = () => {
  const [displayValue, setDisplayValue] = useState('0'); // What's shown on the calculator screen
  const [operator, setOperator] = useState(null); // +, -, *, /
  const [prevValue, setPrevValue] = useState(null); // Value before an operator was pressed
  const [waitingForOperand, setWaitingForOperand] = useState(false); // True after an operator, expecting next number

  // Function to handle input from the Numpad
  const handleNumpadInput = (key) => {
    // Implement calculator logic here
    // This will involve updating displayValue, prevValue, operator, etc.
    // based on whether the key is a number, operator, 'C', 'B', or '.'

    if (key === 'C') {
      // Clear all state
      setDisplayValue('0');
      setOperator(null);
      setPrevValue(null);
      setWaitingForOperand(false);
      return;
    }

    if (key === 'B') {
      // Backspace logic
      setDisplayValue((currentValue) => {
        if (currentValue.length === 1) return '0';
        return currentValue.slice(0, -1);
      });
      return;
    }

    if (['+', '-', '*', '/', '='].includes(key)) {
      // Handle operator keys
      // This will involve performing calculations if prevValue and operator exist
      // and then setting the new operator and prevValue
      handleOperator(key);
      return;
    }

    // Handle number and decimal point input
    handleDigitOrDecimal(key);
  };

  const handleDigitOrDecimal = (digit) => {
    // Logic for adding digits to displayValue, handling initial '0', and decimal point
    if (waitingForOperand) {
      setDisplayValue(digit === '.' ? '0.' : digit);
      setWaitingForOperand(false);
    } else {
      if (digit === '.') {
        if (!displayValue.includes('.')) {
          setDisplayValue(displayValue + '.');
        }
      } else {
        setDisplayValue(displayValue === '0' ? digit : displayValue + digit);
      }
    }
  };

  const handleOperator = (nextOperator) => {
    const inputValue = parseFloat(displayValue);

    if (prevValue === null) {
      setPrevValue(inputValue);
    } else if (waitingForOperand) {
      // If we press an operator right after another operator, just update the operator
      setOperator(nextOperator);
      return;
    } else {
      const result = performCalculation[operator](prevValue, inputValue);
      setDisplayValue(String(result));
      setPrevValue(result);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator === '=' ? null : nextOperator); // Clear operator if '='
  };

  // Object mapping operators to functions
  const performCalculation = {
    '/': (firstOperand, secondOperand) => firstOperand / secondOperand,
    '*': (firstOperand, secondOperand) => firstOperand * secondOperand,
    '+': (firstOperand, secondOperand) => firstOperand + secondOperand,
    '-': (firstOperand, secondOperand) => firstOperand - secondOperand,
  };


  return (
    <div className="calculator-wrapper">
      <div className="calculator-display">{displayValue}</div>
      {/* You might want to add operator buttons here if they are separate from numpad */}
      <div className="calculator-operators">
        <button className="calc-operator-button" onClick={() => handleNumpadInput('+')}>+</button>
        <button className="calc-operator-button" onClick={() => handleNumpadInput('-')}>-</button>
        <button className="calc-operator-button" onClick={() => handleNumpadInput('*')}>*</button>
        <button className="calc-operator-button" onClick={() => handleNumpadInput('/')}>/</button>
        <button className="calc-operator-button calc-equals-button" onClick={() => handleNumpadInput('=')}>=</button>
      </div>
      <Numpad onInput={handleNumpadInput} />
    </div>
  );
};

export default Calculator;