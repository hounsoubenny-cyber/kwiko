import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthCredentials, AUTH_SESSION_KEY } from '../types';
import { resetDemoState } from '../demo/demoApiClient';
import { setTokenUpdateHandler, setLogoutHandler } from '../services/api';

interface AuthContextType {
  creds: AuthCredentials | null;
  companyName: string | null;
  setAuthSession: (creds: AuthCredentials, companyName?: string) => void;
  enterDemoMode: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [creds, setCreds] = useState<AuthCredentials | null>(() => {
    try {
      const saved = sessionStorage.getItem(AUTH_SESSION_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error reading session storage:", e);
    }
    return null;
  });

  const [companyName, setCompanyName] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('kwiko_company_name') || null;
    } catch {
      return null;
    }
  });

  const setAuthSession = (newCreds: AuthCredentials, name?: string) => {
    setCreds(newCreds);
    try {
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(newCreds));
      if (name) {
        setCompanyName(name);
        sessionStorage.setItem('kwiko_company_name', name);
      }
    } catch (e) {
      console.error("Error writing to session storage:", e);
    }
  };

  const enterDemoMode = () => {
    resetDemoState();
    const demoCreds: AuthCredentials = {
      email: 'demo@kwiko.app',
      password: 'demo_password',
      token: 'kwiko_demo_token_123',
      isDemo: true
    };
    const demoCompany = 'Boutique Démo Kwiko SARL';
    setAuthSession(demoCreds, demoCompany);
  };

  const logout = () => {
    setCreds(null);
    setCompanyName(null);
    resetDemoState();
    try {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      sessionStorage.removeItem('kwiko_company_name');
    } catch (e) {
      console.error("Error clearing session storage:", e);
    }
  };

  useEffect(() => {
    setTokenUpdateHandler((newToken: string) => {
      setCreds(prev => {
        if (!prev) return prev;
        const updated = { ...prev, token: newToken };
        try {
          sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error("Error writing updated token to session storage:", e);
        }
        return updated;
      });
    });

    setLogoutHandler(() => {
      logout();
    });
  }, []);

  return (
    <AuthContext.Provider
    value={{
      creds,
      companyName,
      setAuthSession,
      enterDemoMode,
      logout,
      isAuthenticated: !!creds,
      isDemoMode: !!creds?.isDemo
    }}
    >
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
