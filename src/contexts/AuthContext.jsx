import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authApi } from '../api/client';
import toast from 'react-hot-toast';

// Auth state structure
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  sessionExpired: false,
  lastActivity: null,
  sessionTimeout: null
};

// Auth actions
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  RESET_SESSION_EXPIRED: 'RESET_SESSION_EXPIRED',
  UPDATE_ACTIVITY: 'UPDATE_ACTIVITY'
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        sessionExpired: false,
        lastActivity: Date.now()
      };
      
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false
      };
      
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        lastActivity: Date.now()
      };
      
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
      
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    case AUTH_ACTIONS.SESSION_EXPIRED:
      return {
        ...state,
        sessionExpired: true,
        isAuthenticated: false,
        user: null,
        token: null
      };
      
    case AUTH_ACTIONS.RESET_SESSION_EXPIRED:
      return {
        ...state,
        sessionExpired: false
      };
      
    case AUTH_ACTIONS.UPDATE_ACTIVITY:
      return {
        ...state,
        lastActivity: Date.now()
      };
      
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Session timeout duration (30 minutes of inactivity)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Activity tracking
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const updateActivity = () => {
      dispatch({ type: AUTH_ACTIONS.UPDATE_ACTIVITY });
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [state.isAuthenticated]);

  // Session timeout management
  useEffect(() => {
    if (!state.isAuthenticated || !state.lastActivity) return;

    const checkSession = () => {
      const now = Date.now();
      const timeSinceActivity = now - state.lastActivity;
      
      if (timeSinceActivity > SESSION_TIMEOUT) {
        dispatch({ type: AUTH_ACTIONS.SESSION_EXPIRED });
        localStorage.removeItem('authToken');
        toast.error('Session expired due to inactivity');
      }
    };

    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [state.isAuthenticated, state.lastActivity]);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          return;
        }

        // Check if token is expired before making request
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp * 1000 < Date.now()) {
            localStorage.removeItem('authToken');
            dispatch({ type: AUTH_ACTIONS.SESSION_EXPIRED });
            return;
          }
        } catch (e) {
          // Invalid token format
          localStorage.removeItem('authToken');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
          return;
        }

        // Verify token with server
        const response = await authApi.me();
        const user = response.data.user;
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token }
        });
      } catch (error) {
        // Handle different error types
        if (error.response?.status === 401) {
          const message = error.response?.data?.message;
          if (message === 'Token expired') {
            dispatch({ type: AUTH_ACTIONS.SESSION_EXPIRED });
            toast.error('Your session has expired. Please sign in again.');
          } else {
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
          }
          localStorage.removeItem('authToken');
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: 'Failed to verify authentication' });
        }
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await authApi.login(credentials);
      const { user, access_token } = response.data;
      
      // Validate response data
      if (!user || !access_token) {
        throw new Error('Invalid login response');
      }
      
      // Store token
      localStorage.setItem('authToken', access_token);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token: access_token }
      });
      
      toast.success('Login successful!');
      return { user, token: access_token };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      toast.error(message);
      throw error;
    }
  };

  // Logout function
  const logout = async (showToast = true) => {
    try {
      // Call server logout to invalidate session
      if (state.isAuthenticated) {
        await authApi.logout();
      }
    } catch (error) {
      // Continue with logout even if server call fails
      console.error('Server logout failed:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('authToken');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      
      if (showToast) {
        toast.success('Logged out successfully');
      }
    }
  };

  // Logout from all devices
  const logoutAll = async () => {
    try {
      if (authApi.logoutAll) {
        await authApi.logoutAll();
      } else {
        await authApi.logout();
      }
      localStorage.removeItem('authToken');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.success('Logged out from all devices');
    } catch (error) {
      console.error('Logout all failed:', error);
      // Still clear local state
      localStorage.removeItem('authToken');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.error('Logout failed, but cleared local session');
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      // Validate required fields
      const requiredFields = ['fullName', 'email', 'phone', 'username', 'password'];
      const missingFields = requiredFields.filter(field => !userData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      const response = await authApi.register(userData);
      
      // Don't auto-login after registration since approval is required
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      toast.success('Registration successful! Please wait for admin approval.');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: message });
      toast.error(message);
      throw error;
    }
  };

  // Update user data
  const updateUser = async (userData) => {
    try {
      const response = await authApi.me(); // Refresh user data
      const user = response.data.user;
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      dispatch({ type: AUTH_ACTIONS.UPDATE_ACTIVITY });
      return user;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  // Refresh token if needed
  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return false;
      
      // Check if token expires soon (within 1 hour)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresIn = payload.exp * 1000 - Date.now();
      
      if (expiresIn < 60 * 60 * 1000) { // Less than 1 hour
        const response = await authApi.me();
        const user = response.data.user;
        
        // Generate new token (this would need server support)
        // For now, just update user data
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // Clear session expired flag
  const clearSessionExpired = () => {
    dispatch({ type: AUTH_ACTIONS.RESET_SESSION_EXPIRED });
  };

  // Check if user has specific role
  const hasRole = (roles) => {
    if (!state.user) return false;
    if (typeof roles === 'string') return state.user.role === roles;
    if (Array.isArray(roles)) return roles.includes(state.user.role);
    return false;
  };

  // Check if user has permission
  const hasPermission = (permission) => {
    if (!state.user) return false;
    
    // Define role-based permissions
    const permissions = {
      admin: ['*'], // Admin has all permissions
      staff: ['manage_tasks', 'manage_disputes', 'manage_merchants', 'view_analytics'],
      aggregator: ['view_tasks', 'respond_disputes', 'manage_profile'],
      merchant: ['manage_profile', 'view_transactions']
    };
    
    const userPermissions = permissions[state.user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  // Check if user account is fully active
  const isAccountActive = () => {
    if (!state.user) return false;
    return state.user.status === 'approved' && state.isAuthenticated;
  };

  // Check if user needs onboarding
  const needsOnboarding = () => {
    if (!state.user) return false;
    return !state.user.onboardingData && ['aggregator', 'staff'].includes(state.user.role);
  };

  // Get dashboard route based on user role
  const getDashboardRoute = () => {
    if (!state.user) return '/login';
    
    switch (state.user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'staff':
        return '/staff/dashboard';
      case 'aggregator':
        return '/aggregator/dashboard';
      case 'merchant':
        return '/merchant/dashboard';
      default:
        return '/';
    }
  };

  // Get appropriate login route based on context
  const getLoginRoute = () => {
    // Check if we're in admin context
    if (window.location.pathname.startsWith('/admin')) {
      return '/admin/login';
    }
    return '/login';
  };

  // Session management utilities
  const getSessionInfo = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        issuedAt: new Date(payload.iat * 1000),
        expiresAt: new Date(payload.exp * 1000),
        timeUntilExpiry: payload.exp * 1000 - Date.now(),
        isExpiringSoon: (payload.exp * 1000 - Date.now()) < 60 * 60 * 1000 // Less than 1 hour
      };
    } catch (e) {
      return null;
    }
  };

  const value = {
    // State
    ...state,
    
    // Actions
    login,
    logout,
    logoutAll,
    register,
    updateUser,
    refreshToken,
    clearSessionExpired,
    
    // Utilities
    hasRole,
    hasPermission,
    isAccountActive,
    needsOnboarding,
    getDashboardRoute,
    getLoginRoute,
    getSessionInfo
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;