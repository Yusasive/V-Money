import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../UI/LoadingSpinner';
import Badge from '../UI/Badge';

const ProtectedRoute = ({ 
  children, 
  roles = [], 
  requireApproval = true,
  fallbackPath = '/login' 
}) => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    sessionExpired, 
    isAccountActive,
    getSessionInfo 
  } = useAuth();
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
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-500">
            Required roles: {roles.join(', ')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Your role: <Badge variant="default" size="sm">{user.role}</Badge>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check approval status if required
  if (requireApproval && user.status !== 'approved' && user.role !== 'admin') {
    const getStatusMessage = () => {
      switch (user.status) {
        case 'pending':
          return "Your account is currently pending admin approval. You'll receive an email notification once your account is approved.";
        case 'rejected':
          return "Your account has been rejected. Please contact support for more information or create a new account.";
        case 'suspended':
          return "Your account has been suspended. Please contact support to resolve this issue.";
        default:
          return "Your account status prevents access to this page.";
      }
    };

    const getStatusVariant = () => {
      switch (user.status) {
        case 'pending': return 'warning';
        case 'rejected': return 'danger';
        case 'suspended': return 'danger';
        default: return 'default';
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">
            {user.status === 'pending' ? '⏳' : user.status === 'rejected' ? '❌' : '🚫'}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {user.status === 'pending' ? 'Account Pending Approval' : 
             user.status === 'rejected' ? 'Account Rejected' : 
             user.status === 'suspended' ? 'Account Suspended' : 'Account Issue'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {getStatusMessage()}
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Current status: <Badge variant={getStatusVariant()} size="sm">{user.status}</Badge>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Account created: {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          {user.status === 'rejected' && (
            <div className="mt-6">
              <button
                onClick={() => window.location.href = '/register'}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create New Account
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show session warning if expiring soon
  const sessionInfo = getSessionInfo();
  const showSessionWarning = sessionInfo?.isExpiringSoon;

  // Render protected content
  return (
    <>
      {showSessionWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <p className="text-sm text-amber-800">
              ⚠️ Your session will expire in {Math.round(sessionInfo.timeUntilExpiry / (1000 * 60))} minutes.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-amber-600 hover:text-amber-800 underline"
            >
              Extend Session
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  );
};

export default ProtectedRoute;