import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

// This component is for protecting routes that should only be accessed when NOT authenticated
// Like login/register pages - redirects to home if already logged in
const AuthGuard = ({ children, redirectTo = "/" }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const location = useLocation();

  // Use useEffect to prevent infinite updates
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setShouldRedirect(true);
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  // If authenticated, redirect away from login/register pages
  if (shouldRedirect) {
    // Use the state property to pass additional data with redirect
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // If not authenticated, show the login/register page
  return children;
};

export default AuthGuard;
