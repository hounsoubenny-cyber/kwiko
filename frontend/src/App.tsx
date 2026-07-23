import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginView } from './views/LoginView';
import { SignupView } from './views/SignupView';
import { DashboardView } from './views/DashboardView';
import { FaqsView } from './views/FaqsView';
import { ContactsView } from './views/ContactsView';
import { ContactDetailView } from './views/ContactDetailView';
import { AboutView } from './views/AboutView';
import { GettingStartedView } from './views/GettingStartedView';
import { Header } from './components/Header';
import { PublicHeader } from './components/PublicHeader';
import { PublicFooter } from './components/PublicFooter';
import { DemoBanner } from './components/DemoBanner';
import { RateLimitBanner } from './components/RateLimitBanner';
import { getClientMeApi, setRateLimitHandler } from './services/api';
import { ClientMeResponse, ViewType } from './types';

function MainApp() {
  const { creds, isAuthenticated, isDemoMode } = useAuth();

  const [authView, setAuthView] = useState<'login' | 'signup' | 'about' | 'getting-started'>(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path === '/a-propos' || hash === '#a-propos') return 'about';
    if (path === '/demarrage' || hash === '#demarrage') return 'getting-started';
    return 'login';
  });

  const [currentView, setCurrentView] = useState<ViewType>(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path === '/a-propos' || hash === '#a-propos') return 'about';
    if (path === '/demarrage' || hash === '#demarrage') return 'getting-started';
    return 'dashboard';
  });

  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);

  const [clientData, setClientData] = useState<ClientMeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync browser path with view
  const updateUrlPath = (view: string) => {
    try {
      if (view === 'about') {
        window.history.pushState({}, '', '/a-propos');
      } else if (view === 'getting-started') {
        window.history.pushState({}, '', '/demarrage');
      } else {
        if (window.location.pathname === '/a-propos' || window.location.pathname === '/demarrage') {
          window.history.pushState({}, '', '/');
        }
      }
    } catch {
      // Ignore security errors in sandboxed iframes
    }
  };

  // Listen to popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/a-propos' || hash === '#a-propos') {
        setAuthView('about');
        setCurrentView('about');
      } else if (path === '/demarrage' || hash === '#demarrage') {
        setAuthView('getting-started');
        setCurrentView('getting-started');
      } else {
        setAuthView('login');
        setCurrentView('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Rate Limiting 429 Banner state
  const [rateLimitState, setRateLimitState] = useState<{ active: boolean; seconds: number; message?: string }>({
    active: false,
    seconds: 60
  });

  // Attach rate limit interceptor handler
  useEffect(() => {
    setRateLimitHandler((retryAfter, msg) => {
      setRateLimitState({
        active: true,
        seconds: retryAfter || 60,
        message: msg
      });
    });
  }, []);

  const refreshClientData = useCallback(async () => {
    if (!creds) return;
    setLoading(true);
    try {
      const res = await getClientMeApi(creds);
      setClientData(res);
    } catch (err: any) {
      console.error("Error fetching client data:", err);
    } finally {
      setLoading(false);
    }
  }, [creds]);

  useEffect(() => {
    if (isAuthenticated && creds) {
      refreshClientData();
    }
  }, [isAuthenticated, creds, refreshClientData]);

  const handleSelectContact = (contactId: number) => {
    setSelectedContactId(contactId);
    setCurrentView('contact-detail');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F0F4F2] dark:bg-[#0d1f1c] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-[#25D366]/30 transition-colors">
      <DemoBanner />

      {rateLimitState.active && (
        <RateLimitBanner
        seconds={rateLimitState.seconds}
        message={rateLimitState.message}
        onDismiss={() => setRateLimitState(prev => ({ ...prev, active: false }))}
        />
      )}

      {/* Public Header for unauthenticated views */}
      <PublicHeader
      currentView={authView}
      onNavigate={(view) => {
        setAuthView(view);
        updateUrlPath(view);
      }}
      />

      <div className="flex-1">
      {authView === 'login' && (
        <LoginView
        onNavigateToSignup={() => { setAuthView('signup'); updateUrlPath('signup'); }}
        onNavigateToAbout={() => { setAuthView('about'); updateUrlPath('about'); }}
        onNavigateToGettingStarted={() => { setAuthView('getting-started'); updateUrlPath('getting-started'); }}
        />
      )}

      {authView === 'signup' && (
        <SignupView
        onNavigateToLogin={() => { setAuthView('login'); updateUrlPath('login'); }}
        onNavigateToAbout={() => { setAuthView('about'); updateUrlPath('about'); }}
        onNavigateToGettingStarted={() => { setAuthView('getting-started'); updateUrlPath('getting-started'); }}
        />
      )}

      {authView === 'about' && (
        <AboutView
        onNavigateToSignup={() => { setAuthView('signup'); updateUrlPath('signup'); }}
        onNavigateToLogin={() => { setAuthView('login'); updateUrlPath('login'); }}
        onNavigateToGettingStarted={() => { setAuthView('getting-started'); updateUrlPath('getting-started'); }}
        />
      )}

      {authView === 'getting-started' && (
        <GettingStartedView
        onNavigateToSignup={() => { setAuthView('signup'); updateUrlPath('signup'); }}
        onNavigateToAbout={() => { setAuthView('about'); updateUrlPath('about'); }}
        />
      )}
      </div>

      <PublicFooter
      currentView={authView}
      onNavigate={(view) => {
        if (view === 'login' || view === 'signup' || view === 'about' || view === 'getting-started') {
          setAuthView(view);
          updateUrlPath(view);
        }
      }}
      isAuthenticated={false}
      />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-[#25D366]/30 transition-colors">
    <DemoBanner />

    {/* Rate limit 429 banner if triggered */}
    {rateLimitState.active && (
      <RateLimitBanner
      seconds={rateLimitState.seconds}
      message={rateLimitState.message}
      onDismiss={() => setRateLimitState(prev => ({ ...prev, active: false }))}
      />
    )}

    {/* Main App Navigation Header */}
    <Header
    currentView={currentView}
    setCurrentView={view => {
      setCurrentView(view);
      updateUrlPath(view);
      if (view !== 'contact-detail') {
        setSelectedContactId(null);
      }
    }}
    entrepriseName={clientData?.client?.entreprise_name}
    />

    {/* View router */}
    <main className="flex-1 pb-12">
    {currentView === 'dashboard' && (
      <DashboardView
      data={clientData}
      loading={loading}
      onNavigateToFaqs={() => { setCurrentView('faqs'); updateUrlPath('faqs'); }}
      onNavigateToContacts={() => { setCurrentView('contacts'); updateUrlPath('contacts'); }}
      onSelectContact={handleSelectContact}
      onRefresh={refreshClientData}
      />
    )}

    {currentView === 'faqs' && (
      <FaqsView
      faqs={clientData?.faqs || []}
      loading={loading}
      onRefresh={refreshClientData}
      />
    )}

    {currentView === 'contacts' && (
      <ContactsView
      contacts={clientData?.contact || []}
      messages={clientData?.messages || []}
      loading={loading}
      onSelectContact={handleSelectContact}
      />
    )}

    {currentView === 'contact-detail' && selectedContactId && (
      <ContactDetailView
      contactId={selectedContactId}
      onBack={() => {
        setCurrentView('contacts');
        setSelectedContactId(null);
        updateUrlPath('contacts');
      }}
      />
    )}

    {currentView === 'about' && (
      <AboutView
      onNavigateToGettingStarted={() => { setCurrentView('getting-started'); updateUrlPath('getting-started'); }}
      />
    )}

    {currentView === 'getting-started' && (
      <GettingStartedView
      onNavigateToAbout={() => { setCurrentView('about'); updateUrlPath('about'); }}
      />
    )}
    </main>

    <PublicFooter
    currentView={currentView}
    onNavigate={(view) => {
      if (view === 'about' || view === 'getting-started' || view === 'dashboard' || view === 'faqs' || view === 'contacts') {
        setCurrentView(view);
        updateUrlPath(view);
      }
    }}
    isAuthenticated={true}
    />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
    <MainApp />
    </AuthProvider>
    </ThemeProvider>
  );
}
