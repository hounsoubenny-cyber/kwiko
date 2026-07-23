import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, X } from 'lucide-react';

interface RateLimitBannerProps {
  seconds: number;
  message?: string;
  onDismiss: () => void;
}

export const RateLimitBanner: React.FC<RateLimitBannerProps> = ({ seconds, message, onDismiss }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onDismiss();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onDismiss]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl bg-amber-50 border-2 border-amber-500 rounded-xl p-4 shadow-2xl flex items-start gap-3 transition-all animate-bounce-short">
      <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="flex-1 text-sm text-amber-950">
        <h4 className="font-bold text-base flex items-center gap-2">
          <span>Trop de requêtes ! (Limite de débit 429)</span>
        </h4>
        <p className="mt-1 text-amber-900 font-medium">
          {message || "20 requêtes max par minute."}
        </p>
        <div className="mt-2 inline-flex items-center gap-2 bg-amber-200/80 px-3 py-1 rounded-full text-xs font-bold text-amber-900 border border-amber-400">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          <span>Réessayez dans {timeLeft}s</span>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-amber-700 hover:text-amber-900 p-1 rounded-lg hover:bg-amber-100 transition-colors"
        title="Fermer"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
