import React from 'react';
import '../styles/BackToTopButton.css'; 

const BackToTopButton = ({ scrollToTop }) => {
  return (
    <div id="back-to-top" onClick={scrollToTop} title="Back to Top">
      <i className="fas fa-chevron-up"></i>
    </div>
  );
};

export default BackToTopButton;