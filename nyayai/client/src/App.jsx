import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CaseSetup from './pages/CaseSetup';
import Courtroom from './pages/Courtroom';
import Report from './pages/Report';
import LearnLaw from './pages/LearnLaw';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/new-case" element={<ProtectedRoute><CaseSetup /></ProtectedRoute>} />
        <Route path="/courtroom" element={<ProtectedRoute><Courtroom /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
        <Route path="/learn" element={<ProtectedRoute><LearnLaw /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
