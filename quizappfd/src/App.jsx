import { useState } from 'react';
import "./styles/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import PrivacyPage from './pages/PrivacyPolicy';
import TermsPage from './pages/TermsAndConditions';
import ContactPage from './pages/ContactUs';
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from "./pages/Dashboard";
import MyProfile from "./pages/MyProfile";
import ChangePassword from "./pages/ChangePassword";
import Courses from './pages/Courses';
import InstructionPopup from "./pages/InstructionPopup";
import TestPage from "./pages/TestPage";
import ResultPage from "./pages/ResultPage";
import SolutionPage from "./pages/SolutionPage";
import SuperSecretAdmin from './pages/SuperSecretAdmin';

function App() {
  const [user, setUser] = useState(null); // Create user state here

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login setUser={setUser} />} /> {/* Pass setUser here */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard/:id" element={<Dashboard />} />
        <Route path="/profile/:id" element={<MyProfile />} /> 
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/instructions/:testId" element={<InstructionPopup />} />
        <Route path="/test/:testId" element={<TestPage />} />
        <Route path="/result/:resultId" element={<ResultPage />} />
        <Route path="/solution/:resultId" element={<SolutionPage />} />
        <Route path="/super-access-8934" element={<SuperSecretAdmin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
