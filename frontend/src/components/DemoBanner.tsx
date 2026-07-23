import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, LogOut, Info } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { isDemoMode, logout } = useAuth();

  if (!isDemoMode) return null;

  return (
    <div className="bg-amber-500/10 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 border-b border-amber-500/30 px-4 py-2 text-xs font-semibold flex items-center justify-between gap-3 sticky top-0 z-50 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 font-mono">
          <Sparkles className="w-3 h-3" /> Mode Démo
        </span>
        <span className="hidden sm:inline font-medium">
          Aucune donnée réelle, aucun message ni frais WhatsApp n'est envoyé.
        </span>
        <span className="sm:hidden font-medium">Données virtuelles uniquement</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Quitter la démo</span>
        </button>
      </div>
    </div>
  );
};
