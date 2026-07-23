import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Sparkles, Building2, BookOpen, LayoutDashboard, Users, Sun, Moon, Info, HelpCircle } from 'lucide-react';
import { ViewType } from '../types';

interface HeaderProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  entrepriseName?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, entrepriseName }) => {
  const { creds, companyName, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const displayCompany = entrepriseName || companyName || "Mon Entreprise PME";

  return (
    <header className="bg-[#075E54] dark:bg-slate-900 text-white shadow-lg border-b border-[#128C7E] dark:border-slate-800 sticky top-0 z-30 transition-all duration-200 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[72px] py-2 gap-4">
          {/* Brand Logo */}
          <div 
            className="flex items-center gap-3.5 cursor-pointer group shrink-0" 
            onClick={() => setCurrentView('dashboard')}
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#25D366] to-[#1ebf59] flex items-center justify-center text-slate-950 font-black text-2xl tracking-tight shadow-md shadow-[#25D366]/20 group-hover:scale-105 transition-transform font-display">
              K
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl tracking-tight text-white font-display group-hover:text-emerald-200 transition-colors">Kwiko</span>
                <span className="bg-[#25D366]/20 text-[#25D366] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#25D366]/40 flex items-center gap-1 font-mono shadow-sm">
                  <Sparkles className="w-3 h-3" /> IA WhatsApp
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/80 dark:text-slate-400 font-medium">Service Client Automatisé PME</p>
            </div>
          </div>

          {/* Desktop Nav items */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-[#054c44]/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-[#128C7E]/60 dark:border-slate-700/80 shadow-inner">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-[#25D366] text-slate-950 shadow-md scale-[1.02]'
                  : 'text-emerald-100 dark:text-slate-300 hover:text-white hover:bg-[#075E54] dark:hover:bg-slate-700/80'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Tableau de bord
            </button>

            <button
              onClick={() => setCurrentView('faqs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'faqs'
                  ? 'bg-[#25D366] text-slate-950 shadow-md scale-[1.02]'
                  : 'text-emerald-100 dark:text-slate-300 hover:text-white hover:bg-[#075E54] dark:hover:bg-slate-700/80'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Base FAQ
            </button>

            <button
              onClick={() => setCurrentView('contacts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'contacts' || currentView === 'contact-detail'
                  ? 'bg-[#25D366] text-slate-950 shadow-md scale-[1.02]'
                  : 'text-emerald-100 dark:text-slate-300 hover:text-white hover:bg-[#075E54] dark:hover:bg-slate-700/80'
              }`}
            >
              <Users className="w-4 h-4" />
              Contacts & Chats
            </button>

            <span className="w-px h-6 bg-[#128C7E] dark:bg-slate-700/80 mx-1"></span>

            <button
              onClick={() => setCurrentView('about')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'about'
                  ? 'bg-[#25D366] text-slate-950 shadow-md scale-[1.02]'
                  : 'text-emerald-100 dark:text-slate-300 hover:text-white hover:bg-[#075E54] dark:hover:bg-slate-700/80'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              À propos
            </button>

            <button
              onClick={() => setCurrentView('getting-started')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'getting-started'
                  ? 'bg-[#25D366] text-slate-950 shadow-md scale-[1.02]'
                  : 'text-emerald-100 dark:text-slate-300 hover:text-white hover:bg-[#075E54] dark:hover:bg-slate-700/80'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Guide
            </button>
          </nav>

          {/* Compact Tablet Nav items (md to lg) */}
          <nav className="hidden md:flex lg:hidden items-center gap-1 bg-[#054c44]/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-[#128C7E]/60 dark:border-slate-700">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'dashboard' ? 'bg-[#25D366] text-slate-950 shadow-sm' : 'text-emerald-100 dark:text-slate-300 hover:bg-[#075E54]'
              }`}
              title="Tableau de bord"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentView('faqs')}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'faqs' ? 'bg-[#25D366] text-slate-950 shadow-sm' : 'text-emerald-100 dark:text-slate-300 hover:bg-[#075E54]'
              }`}
              title="Base FAQ"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentView('contacts')}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'contacts' || currentView === 'contact-detail' ? 'bg-[#25D366] text-slate-950 shadow-sm' : 'text-emerald-100 dark:text-slate-300 hover:bg-[#075E54]'
              }`}
              title="Contacts & Chats"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentView('about')}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'about' ? 'bg-[#25D366] text-slate-950 shadow-sm' : 'text-emerald-100 dark:text-slate-300 hover:bg-[#075E54]'
              }`}
              title="À propos"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentView('getting-started')}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'getting-started' ? 'bg-[#25D366] text-slate-950 shadow-sm' : 'text-emerald-100 dark:text-slate-300 hover:bg-[#075E54]'
              }`}
              title="Bien démarrer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </nav>

          {/* Right Controls: Dark Mode Toggle, User profile & Logout */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl bg-[#054c44] dark:bg-slate-800 text-emerald-100 dark:text-amber-300 hover:text-white hover:bg-[#075E54] dark:hover:bg-slate-700 border border-[#128C7E]/60 dark:border-slate-700/80 transition-all cursor-pointer shadow-sm active:scale-95"
              title={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-emerald-200" />}
            </button>

            {/* Company Info Badge */}
            <div className="hidden xl:flex items-center gap-2.5 bg-[#054c44]/80 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-2xl border border-[#128C7E]/50 dark:border-slate-700/80">
              <div className="w-8 h-8 rounded-xl bg-[#075E54] dark:bg-slate-700 border border-[#128C7E] dark:border-slate-600 flex items-center justify-center text-emerald-300 dark:text-emerald-400 font-bold shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white truncate max-w-[150px] leading-tight">
                  {displayCompany}
                </div>
                <div className="text-[10px] text-emerald-200/80 dark:text-slate-400 truncate max-w-[150px] font-mono leading-tight">
                  {creds?.email}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-3.5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 hover:text-white rounded-xl text-xs font-bold border border-red-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4 text-red-300" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center justify-around bg-[#054c44] dark:bg-slate-950 border-t border-[#128C7E]/50 dark:border-slate-800 px-3 py-2.5">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
            currentView === 'dashboard' ? 'text-[#25D366] bg-[#075E54]/60 dark:bg-slate-800' : 'text-emerald-100/70 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Accueil</span>
        </button>
        <button
          onClick={() => setCurrentView('faqs')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
            currentView === 'faqs' ? 'text-[#25D366] bg-[#075E54]/60 dark:bg-slate-800' : 'text-emerald-100/70 dark:text-slate-400'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>FAQs</span>
        </button>
        <button
          onClick={() => setCurrentView('contacts')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
            currentView === 'contacts' || currentView === 'contact-detail' ? 'text-[#25D366] bg-[#075E54]/60 dark:bg-slate-800' : 'text-emerald-100/70 dark:text-slate-400'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Contacts</span>
        </button>
        <button
          onClick={() => setCurrentView('about')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
            currentView === 'about' ? 'text-[#25D366] bg-[#075E54]/60 dark:bg-slate-800' : 'text-emerald-100/70 dark:text-slate-400'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>À propos</span>
        </button>
        <button
          onClick={() => setCurrentView('getting-started')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
            currentView === 'getting-started' ? 'text-[#25D366] bg-[#075E54]/60 dark:bg-slate-800' : 'text-emerald-100/70 dark:text-slate-400'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Guide</span>
        </button>
      </div>
    </header>
  );
};
