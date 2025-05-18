import React from 'react';
import '../styles/ContactUs.css'; 

function ContactUs() {
  return (
    <div className="contact-us-container">
      <h2>Contact Us</h2>
      <p>Have questions or need assistance? Feel free to reach out to us!</p>
      <div className="contact-details">
        <div className="detail-item">
          <i className="fas fa-envelope"></i> {/* icon */}
          <strong>Email:</strong> <a href="mailto:support@nmatrix.com">support@nmatrix.com</a>
        </div>
        <div className="detail-item">
          <i className="fas fa-phone"></i> {/*icon */}
          <strong>Phone:</strong> +91 8765432109
        </div>
        <div className="detail-item">
          <i className="fas fa-map-marker-alt"></i> {/* icon */}
          <strong>Address:</strong> H. No 2-2-1118/a/3, Flat No.302, Sri Sai Laks, New Nallakunta, Hyderabad, Musheerabad, Telangana, India - 500044        </div>
      </div>
      <p className="copyright">&copy; 2025 nDMatrix. All rights reserved.</p>
    </div>
  );
}

export default ContactUs;