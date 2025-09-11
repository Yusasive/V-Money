import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Navigate } from "react-router-dom";

// This component is for protecting routes that should only be accessed when NOT authenticated
// Like login/register pages - redirects to home if already logged in
const AuthGuard = ({ children, redirectTo = "/" }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a loading spinner
  }

  // If authenticated, redirect away from login/register pages
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // If not authenticated, show the login/register page
  return children;
};

export default AuthGuard;
