import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const AuthGuard = ({ children, redirectTo = '/login' }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (isAuthenticated && user) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default AuthGuard;