import React from 'react';
import { Sparkles, HelpCircle, Info, ArrowLeft } from 'lucide-react';
import { ViewType } from '../types';

interface PublicFooterProps {
  currentView?: ViewType | 'login' | 'signup';
  onNavigate: (view: ViewType | 'login' | 'signup') => void;
  isAuthenticated?: boolean;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  currentView,
  onNavigate,
  isAuthenticated = false
}) => {
  return (
    <footer className="mt-auto py-6 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm text-slate-500 dark:text-slate-400 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left: Brand & Copyright */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#25D366] text-slate-950 font-black flex items-center justify-center text-[10px] font-display">
            K
          </div>
          <span className="font-bold text-slate-700 dark:text-slate-300 font-display">Kwiko</span>
          <span>© {new Date().getFullYear()} — Assistant WhatsApp IA PME</span>
        </div>

        {/* Center/Right: Static pages navigation */}
        <div className="flex items-center flex-wrap justify-center gap-4 text-xs font-medium">
          {(!isAuthenticated && (currentView === 'about' || currentView === 'getting-started')) && (
            <button
              onClick={() => onNavigate('login')}
              className="text-[#075E54] dark:text-[#25D366] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à la connexion</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('about')}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentView === 'about'
                ? 'text-[#075E54] dark:text-[#25D366] font-bold underline'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>À propos de Kwiko</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          <button
            onClick={() => onNavigate('getting-started')}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentView === 'getting-started'
                ? 'text-[#075E54] dark:text-[#25D366] font-bold underline'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Bien démarrer</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
