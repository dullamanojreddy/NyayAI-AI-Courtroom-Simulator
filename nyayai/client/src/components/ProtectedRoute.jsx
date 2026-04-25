import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('nyayai_token');
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

export default ProtectedRoute;
