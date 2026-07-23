import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Sparkles, HelpCircle, Info, LogIn, UserPlus } from 'lucide-react';

interface PublicHeaderProps {
  currentView: string;
  onNavigate: (view: 'login' | 'signup' | 'about' | 'getting-started') => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ currentView, onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const { enterDemoMode } = useAuth();

  return (
    <header className="bg-[#075E54] dark:bg-slate-900 text-white border-b border-[#128C7E] dark:border-slate-800 sticky top-0 z-40 backdrop-blur-md transition-colors shadow-md">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between min-h-[72px] py-2 gap-4">
    {/* Logo */}
    <div
    className="flex items-center gap-3.5 cursor-pointer group shrink-0"
    onClick={() => onNavigate('login')}
    >
    <div className="w-10 h-10 rounded-2xl bg-[#25D366] flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-[#25D366]/20 group-hover:scale-105 transition-transform font-display">
    K
    </div>
    <div className="space-y-0.5">
    <div className="flex items-center gap-2">
    <span className="font-extrabold text-xl tracking-wide text-white font-display group-hover:text-emerald-300 transition-colors">Kwiko</span>
    <span className="bg-[#25D366]/20 text-[#25D366] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#25D366]/40 font-mono hidden sm:inline-flex items-center gap-1">
    <Sparkles className="w-3 h-3 text-[#25D366]" /> IA WhatsApp
    </span>
    </div>
    </div>
    </div>

    {/* Navigation Links */}
    <nav className="flex items-center gap-2 sm:gap-3">
    <button
    type="button"
    onClick={() => onNavigate('about')}
    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
      currentView === 'about'
      ? 'bg-[#25D366] text-slate-950 shadow-md font-black'
      : 'text-emerald-100 dark:text-slate-300 hover:text-white hover:bg-[#054c44] dark:hover:bg-slate-800'
    }`}
    >
    <Info className="w-4 h-4" />
    <span className="hidden sm:inline">À propos</span>
    </button>

    <button
    type="button"
    onClick={() => onNavigate('getting-started')}
    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
      currentView === 'getting-started'
      ? 'bg-[#25D366] text-slate-950 shadow-md font-black'
      : 'text-emerald-100 dark:text-slate-300 hover:text-white hover:bg-[#054c44] dark:hover:bg-slate-800'
    }`}
    >
    <HelpCircle className="w-4 h-4" />
    <span className="hidden sm:inline">Guide</span>
    </button>

    <button
    type="button"
    onClick={() => onNavigate('login')}
    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
      currentView === 'login'
      ? 'bg-[#25D366] text-slate-950 font-black shadow-md'
      : 'text-emerald-100 dark:text-slate-200 hover:text-white hover:bg-[#054c44] dark:hover:bg-slate-800'
    }`}
    >
    <LogIn className="w-4 h-4" />
    <span>Connexion</span>
    </button>

    <button
    type="button"
    onClick={() => onNavigate('signup')}
    className={`hidden md:flex px-4 py-2 rounded-xl text-xs font-bold transition-all items-center gap-2 cursor-pointer ${
      currentView === 'signup'
      ? 'bg-[#25D366] text-slate-950 font-black shadow-md'
      : 'text-emerald-100 dark:text-slate-200 hover:text-white hover:bg-[#054c44] dark:hover:bg-slate-800'
    }`}
    >
    <UserPlus className="w-4 h-4" />
    <span>Inscription</span>
    </button>

    {/* Demo Button in Header */}
    <button
    type="button"
    onClick={enterDemoMode}
    className="bg-[#25D366]/20 hover:bg-[#25D366]/30 text-white dark:text-[#25D366] border border-[#25D366]/40 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
    title="Tester Kwiko immédiatement sans backend"
    >
    <Sparkles className="w-4 h-4 text-[#25D366]" />
    <span className="hidden md:inline">Mode Démo</span>
    </button>

    {/* Theme Switcher Button */}
    <button
    type="button"
    onClick={toggleTheme}
    className="p-2.5 rounded-2xl bg-[#054c44] dark:bg-slate-800 hover:bg-[#043d37] dark:hover:bg-slate-700 text-amber-300 border border-[#128C7E]/60 dark:border-slate-700 transition-all cursor-pointer ml-1 shadow-sm active:scale-95"
    title={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
    >
    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-emerald-400" />}
    </button>
    </nav>
    </div>
    </div>
    </header>
  );
};
