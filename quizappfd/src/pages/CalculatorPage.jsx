import React from 'react';
import Calculator from '../components/Calculator';
import '../styles/CalculatorPage.css';

const CalculatorPage = () => {
  return (
    <div className="calculator-page">
      <div className="calculator-page-header">
        <h1>Scientific Calculator</h1>
        <p>A powerful calculator for all your mathematical needs</p>
      </div>
      
      <div className="calculator-page-content">
        <div className="calculator-features">
          <div className="feature-card">
            <div className="feature-icon">🧮</div>
            <h3>Advanced Functions</h3>
            <p>Square roots, percentages, memory functions and more</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Calculation History</h3>
            <p>Keep track of your recent calculations</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Responsive Design</h3>
            <p>Works perfectly on all devices</p>
          </div>
        </div>
        
        <Calculator />
      </div>
    </div>
  );
};

export default CalculatorPage;