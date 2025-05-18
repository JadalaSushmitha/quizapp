import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/homepage.css';
import heroImage from '../assets/hero-student.jpg';
import featureIcon1 from '../assets/icon1.png';
import featureIcon2 from '../assets/icon2.png';
import featureIcon3 from '../assets/icon3.png';
import featureIcon4 from '../assets/icon4.png';
import BackToTopButton from './BackToTopButton.jsx';

const HomePage = () => {
  useEffect(() => {
    const handleScroll = () => {
      const backToTopButton = document.getElementById('back-to-top');
      const header = document.querySelector('.homepage-header');

      if (window.scrollY > 200) {
        backToTopButton.classList.add('show');
      } else {
        backToTopButton.classList.remove('show');
      }
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="homepage-container">
      <header className="homepage-header">
        <h1 className="logo">ExamEdge Portal</h1>
        <nav>
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/register" className="nav-btn">Register</Link>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-content">

            <h2 className="hero-title">Prepare for GATE with Real-Time Online Tests</h2>
<p className="hero-subtitle">Simulate actual GATE exam environment, manage time, and analyze performance with detailed solutions and reports.</p>
<div className="hero-buttons">
  <Link to="/register" className="btn primary-btn">Start </Link>
  <Link to="/demo" className="btn outline-btn">Try a Demo</Link>
</div>

          {/* <h2 className="hero-title">Master Competitive Exam Online</h2>
          <p className="hero-subtitle">Practice smarter, get results.</p>
          <div className="hero-buttons">
            <Link to="/register" className="btn primary-btn">Start Free</Link>
            <Link to="/demo" className="btn outline-btn">Try Demo</Link>
          </div>
          <ul className="hero-benefits">
            <li>🚀 AI analysis</li>
            <li>📊 Performance reports</li>
            <li>🧠 High-yield questions</li>
          </ul> */}
        </div>
        <div className="hero-image">
          <img src={heroImage} alt="Student" />
        </div>
      </section>

      <section className="features-section">
        <h3 className="section-title">Key Features</h3>
        <div className="features-grid">
          {[
            { icon: featureIcon1, title: 'Real Exam Simulation', desc: 'Mimics official exam.' },
            { icon: featureIcon2, title: 'Progress Analytics', desc: 'Track your progress.' },
            { icon: featureIcon3, title: 'Curated Content', desc: 'Expert-designed questions.' },
            { icon: featureIcon4, title: 'Access Anytime', desc: 'Learn on any device.' },
          ].map((item, i) => (
            <div className="feature-card" key={i}>
              <img src={item.icon} alt={item.title} className="feature-icon" />
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="testimonials-section">
        <h3 className="section-title">Student Success</h3>
        <div className="testimonials">
          <div className="testimonial">
            <p>"The mock tests matched the real exam pattern perfectly. Practicing here gave me the confidence I needed on exam day."</p>
            <span>Priya Mehta, AIR 128 (GATE 2025)</span>
          </div>
          <div className="testimonial">
            <p>""I was struggling with time management. These real-time tests helped me improve speed and accuracy significantly."</p>
            <span>Ankit Sharma, Cleared SSC CGL 2024</span>
          </div>
        </div>
      </section>

      <section className="cta-section">
  <h3 className="section-title">Join Thousands of Successful Aspirants</h3>
  <p className="cta-subtext">Start your journey toward cracking competitive exams with expert-curated mock tests and real-time exam experience.</p>
  <Link to="/register" className="btn primary-btn large">Get Started Now</Link>
</section>


      <footer className="homepage-footer">
        <p>&copy; 2025 ExamEdge Portal</p>
        <div className="footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/contact">ContactUs</Link>
        </div>
        <BackToTopButton scrollToTop={scrollToTop} /> 
      </footer>
    </div>
  );
};

export default HomePage;
