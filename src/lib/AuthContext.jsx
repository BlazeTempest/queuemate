import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setAuthError(null);
    
    try {
      // 1. Simulate fetching app settings (takes 500ms)
      await new Promise(resolve => setTimeout(resolve, 500));
      setAppPublicSettings({ 
        id: 'local-dev', 
        public_settings: { appName: 'Queuemate Local' } 
      });
      
      // 2. Check if a user is logged in
      await checkUserAuth();
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.error('App state check failed:', error);
      setAuthError({ type: 'unknown', message: 'Failed to load app settings' });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    
    // Simulate network delay for checking auth (takes 500ms)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check local storage to see if we "mock logged in" previously
    const isMockLoggedIn = localStorage.getItem('mock_auth_token');
    
    if (isMockLoggedIn) {
      // Provide dummy user data for your UI to use
      setUser({
        id: 'user_123',
        name: 'Demo User',
        email: 'student@example.com',
        role: 'user'
      });
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    
    setIsLoadingAuth(false);
  };

  const logout = (shouldRedirect = true) => {
    // Clear our mock local storage token
    localStorage.removeItem('mock_auth_token');
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      window.location.href = '/'; 
    }
  };

  const navigateToLogin = () => {
    // For pure frontend testing, instead of navigating away, 
    // we will just instantly log the user in and refresh the page to update the UI.
    // (In a real app, you would use React Router's useNavigate here to go to a /login page)
    localStorage.setItem('mock_auth_token', 'true');
    window.location.reload(); 
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};