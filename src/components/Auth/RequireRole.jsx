import React, { useEffect, useState } from 'react';
import { authHelpers } from '../../config/supabase';
import LoadingSpinner from '../UI/LoadingSpinner';

const RequireRole = ({ children, roles = [], fallback = null }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authHelpers.getCurrentUser();
        setUser(currentUser);
        
        if (currentUser && roles.length > 0) {
          const userRole = authHelpers.getUserRole(currentUser);
          setHasAccess(roles.includes(userRole));
        } else {
          setHasAccess(!!currentUser);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [roles]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!hasAccess) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default RequireRole;