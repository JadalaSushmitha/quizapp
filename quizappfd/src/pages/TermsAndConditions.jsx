import React from 'react';
import '../styles/TermsAndConditions.css';

const TermsAndConditions = () => {
  return (
    <div className="terms-container">
      <h1>Terms and Conditions</h1>
      <p>
        By registering and using this portal, you agree to the following terms and conditions.
      </p>
      <h2>User Responsibilities</h2>
      <ul>
        <li>Provide accurate registration details.</li>
        <li>Do not share your login credentials.</li>
        <li>Complete tests within the allotted time.</li>
      </ul>
      <h2>Test Integrity</h2>
      <p>
        Any attempt to cheat or manipulate test results will lead to permanent disqualification and data removal.
      </p>
      <h2>Changes to Terms</h2>
      <p>
        We reserve the right to update these terms. Continued use implies acceptance of the updated terms.
      </p>
    </div>
  );
};

export default TermsAndConditions;
