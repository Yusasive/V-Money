import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../UI/LoadingSpinner';

const ProtectedRoute = ({ 
  children, 
  roles = [], 
  requireApproval = true,
  fallbackPath = '/login' 
}) => {
  const { user, isAuthenticated, isLoading, sessionExpired } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner size="lg" text="Verifying authentication..." />;
  }

  // Handle session expiration
  if (sessionExpired) {
    return (
      <Navigate 
        to="/login?reason=expired" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check role requirements
  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Required roles: {roles.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  // Check approval status if required
  if (requireApproval && user.status !== 'approved' && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Account Pending Approval
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your account is currently pending admin approval. You'll receive an email notification once your account is approved.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Current status: <span className="font-medium capitalize">{user.status}</span>
          </p>
        </div>
      </div>
    );
  }

  // Render protected content
  return children;
};

export default ProtectedRoute;