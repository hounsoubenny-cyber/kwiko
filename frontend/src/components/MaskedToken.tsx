import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check, ShieldCheck } from 'lucide-react';

interface MaskedTokenProps {
  token: string;
  label?: string;
}

export const MaskedToken: React.FC<MaskedTokenProps> = ({ token, label = "Token WhatsApp Meta" }) => {
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);

  const getMaskedString = (str: string) => {
    if (!str) return '••••••••••••••••••••••••••••••••';
    if (str.length <= 8) return '••••••••••••••••';
    return `${str.substring(0, 4)}••••••••••••••••${str.substring(str.length - 4)}`;
  };

  const handleCopy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
        <span className="flex items-center gap-1.5 text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          {label}
        </span>
        <span className="text-[10px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full font-mono">
          Masqué par sécurité
        </span>
      </div>

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs text-slate-800">
        <div className="flex-1 truncate tracking-wider">
          {showToken ? token : getMaskedString(token)}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            title={showToken ? "Masquer le token" : "Afficher le token"}
          >
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Copier le token"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
