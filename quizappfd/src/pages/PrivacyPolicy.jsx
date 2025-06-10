import React from 'react';
import '../styles/PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy-page">
      <div className="policy-content">
        <h1 className="policy-title">Privacy Policy</h1>
        <section className="policy-section">
          <h2>Information Collection</h2>
          <p>
            We collect your Full Name, Email Address, Phone Number, College Name, College ID, Profile Picture, and ID Card strictly for registration and exam purposes.
          </p>
        </section>

        <section className="policy-section">
          <h2>Use of Information</h2>
          <p>
            Your information is used only to manage your test registration, verification, and results. We do not sell or share your data with third parties.
          </p>
        </section>

        <section className="policy-section">
          <h2>Security</h2>
          <p>
            We use encryption, secure servers, and authentication tokens to protect your data.
          </p>
        </section>

        <div className="contact-info">
          <p>
            For any questions, contact us at <a href="mailto:support@ndmatrix.com">support@ndmatrix.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;