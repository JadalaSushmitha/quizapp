import { useState } from 'react';
import "./styles/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MyProfile from "./pages/MyProfile";
import ChangePassword from "./pages/ChangePassword";
import TestPage from "./pages/TestPage";
import ResultPage from "./pages/ResultPage";

function App() {
  const [user, setUser] = useState(null); // Create user state here

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login setUser={setUser} />} /> {/* Pass setUser here */}
        <Route path="/dashboard/:id" element={<Dashboard />} />
        <Route path="/profile/:id" element={<MyProfile />} /> 
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/test/:testId" element={<TestPage />} />
        <Route path="/result/:userId" element={<ResultPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
