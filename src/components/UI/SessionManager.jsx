import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from './Button';
import Modal from './Modal';

const SessionManager = () => {
  const { 
    isAuthenticated, 
    getSessionInfo, 
    logout, 
    updateUser 
  } = useAuth();
  
  const [showWarning, setShowWarning] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [autoLogoutTimer, setAutoLogoutTimer] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSession = () => {
      const info = getSessionInfo();
      setSessionInfo(info);
      
      if (info?.isExpiringSoon && !showWarning) {
        setShowWarning(true);
        
        // Auto logout in 5 minutes if no action
        const timer = setTimeout(() => {
          logout(false);
        }, 5 * 60 * 1000);
        
        setAutoLogoutTimer(timer);
      }
    };

    // Check immediately and then every minute
    checkSession();
    const interval = setInterval(checkSession, 60000);

    return () => {
      clearInterval(interval);
      if (autoLogoutTimer) {
        clearTimeout(autoLogoutTimer);
      }
    };
  }, [isAuthenticated, showWarning, logout, getSessionInfo, autoLogoutTimer]);

  const handleExtendSession = async () => {
    try {
      await updateUser();
      setShowWarning(false);
      
      if (autoLogoutTimer) {
        clearTimeout(autoLogoutTimer);
        setAutoLogoutTimer(null);
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  };

  const handleLogoutNow = () => {
    logout();
  };

  if (!isAuthenticated || !showWarning) {
    return null;
  }

  const timeUntilExpiry = sessionInfo?.timeUntilExpiry || 0;
  const minutesLeft = Math.max(0, Math.floor(timeUntilExpiry / (1000 * 60)));

  return (
    <AnimatePresence>
      <Modal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
        title="Session Expiring Soon"
        size="md"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200">
                Session Timeout Warning
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Your session will expire in {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''} due to inactivity.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Session started: {sessionInfo?.issuedAt?.toLocaleTimeString()}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Shield className="h-4 w-4" />
              <span>For your security, inactive sessions are automatically logged out</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleLogoutNow}
              className="flex-1"
            >
              Logout Now
            </Button>
            <Button
              variant="primary"
              onClick={handleExtendSession}
              icon={RefreshCw}
              className="flex-1"
            >
              Stay Logged In
            </Button>
          </div>
        </div>
      </Modal>
    </AnimatePresence>
  );
};

export default SessionManager;