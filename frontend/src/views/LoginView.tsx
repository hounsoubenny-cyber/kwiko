import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { loginApi, getClientMeApi } from '../services/api';
import { ArrowRight, ShieldCheck, Sparkles, Loader2, AlertCircle, KeyRound, Mail, Play } from 'lucide-react';

interface LoginViewProps {
  onNavigateToSignup: () => void;
  onNavigateToAbout?: () => void;
  onNavigateToGettingStarted?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onNavigateToSignup,
  onNavigateToAbout,
  onNavigateToGettingStarted
}) => {
  const { setAuthSession, enterDemoMode } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Veuillez saisir votre adresse e-mail et votre mot de passe.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await loginApi({ email: email.trim(), password });

      let companyName = "Entreprise PME";
      try {
        const me = await getClientMeApi({
          email: email.trim(),
                                        password,
                                        token: res.access_token
        });
        if (me?.client?.entreprise_name) {
          companyName = me.client.entreprise_name;
        }
      } catch {
        // Fallback
      }

      setAuthSession({
        email: email.trim(),
                     password,
                     token: res.access_token
      }, companyName);
    } catch (err: any) {
      setErrorMsg(err.message || "Impossible de se connecter au compte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F2] dark:bg-[#0d1f1c] text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans transition-colors">
    {/* Background Grid Pattern */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 dark:opacity-60 pointer-events-none"></div>

    {/* Background Ambient Glow */}
    <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#25D366]/15 dark:bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none"></div>
    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#075E54]/15 dark:bg-[#075E54]/20 rounded-full blur-3xl pointer-events-none"></div>

    {/* Top Accent Bar */}
    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#075E54] via-[#25D366] to-[#075E54]"></div>

    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 transition-colors my-8">

    {/* Header Banner */}
    <div className="bg-[#075E54] dark:bg-slate-950 text-white p-6 sm:p-8 text-center border-b border-[#054c44] dark:border-slate-800 relative">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#25D366] text-slate-950 shadow-lg mb-3 text-3xl font-black font-display">
    K
    </div>
    <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center justify-center gap-2 font-display text-white">
    Kwiko
    <span className="text-[10px] uppercase tracking-wider font-extrabold bg-[#25D366]/20 text-[#25D366] px-2.5 py-0.5 rounded-full border border-[#25D366]/40 font-mono">
    WhatsApp Pro
    </span>
    </h1>
    <p className="text-xs sm:text-sm text-emerald-100 dark:text-slate-300 mt-1 max-w-xs mx-auto font-medium">
    Automatisation IA du service client WhatsApp Business
    </p>
    </div>

    {/* PROMINENT DEMO MODE BUTTON */}
    <div className="p-4 sm:p-6 bg-emerald-500/10 dark:bg-emerald-500/15 border-b border-emerald-500/20 text-center space-y-2">
    <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1.5">
    <Sparkles className="w-4 h-4 text-[#25D366]" />
    <span>Tester immédiatement sans serveur ni backend</span>
    </div>
    <button
    type="button"
    onClick={enterDemoMode}
    className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#1ebf59] text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-[#25D366]/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5"
    >
    <Play className="w-4 h-4 fill-slate-950" />
    <span>Essayer la démo (Mode 100% Hors-ligne)</span>
    </button>
    <p className="text-[11px] text-slate-600 dark:text-slate-400">
    Données de test incluses (Boutique SARL, 15 FAQs, contacts & conversations).
    </p>
    </div>

    {/* Login Form */}
    <div className="p-6 sm:p-8 space-y-5 bg-white dark:bg-slate-900">
    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ou connectez votre compte</span>
    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
    </div>

    {errorMsg && (
      <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl p-3.5 flex items-start gap-2.5">
      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
      <span>{errorMsg}</span>
      </div>
    )}

    <form onSubmit={handleSubmit} className="space-y-4">
    <div>
    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
    Adresse E-mail
    </label>
    <div className="relative">
    <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-3.5" />
    <input
    type="email"
    required
    value={email}
    onChange={e => setEmail(e.target.value)}
    placeholder="votre-entreprise@domaine.com"
    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] transition-all"
    />
    </div>
    </div>

    <div>
    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
    Mot de passe
    </label>
    <div className="relative">
    <KeyRound className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-3.5" />
    <input
    type="password"
    required
    value={password}
    onChange={e => setPassword(e.target.value)}
    placeholder="••••••••••••"
    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] transition-all"
    />
    </div>
    </div>

    <button
    type="submit"
    disabled={loading}
    className="w-full py-3.5 bg-[#075E54] dark:bg-[#25D366] hover:bg-[#054c44] dark:hover:bg-[#1ebf59] text-white dark:text-slate-950 font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
    >
    {loading ? (
      <>
      <Loader2 className="w-4 h-4 animate-spin text-white dark:text-slate-950" />
      <span>Connexion en cours...</span>
      </>
    ) : (
      <>
      <span>Connexion à l'Espace Client</span>
      <ArrowRight className="w-4 h-4" />
      </>
    )}
    </button>
    </form>

    <div className="pt-2 text-center text-xs text-slate-600 dark:text-slate-300">
    Pas encore de compte ?{' '}
    <button
    type="button"
    onClick={onNavigateToSignup}
    className="text-[#075E54] dark:text-[#25D366] font-extrabold hover:underline text-sm ml-1 transition-colors cursor-pointer"
    >
    Inscrire votre entreprise
    </button>
    </div>
    </div>

    {/* Footer info & static page links */}
    <div className="bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-6 py-4 text-center text-xs text-slate-600 dark:text-slate-400 space-y-2">
    <div className="flex items-center justify-center gap-1.5 font-medium">
    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
    <span>Meta WhatsApp Cloud API Gateway • SSL 256-bit</span>
    </div>

    <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
    {onNavigateToAbout && (
      <button
      type="button"
      onClick={onNavigateToAbout}
      className="hover:text-[#075E54] dark:hover:text-[#25D366] transition-colors cursor-pointer underline"
      >
      À propos de Kwiko
      </button>
    )}
    <span>•</span>
    {onNavigateToGettingStarted && (
      <button
      type="button"
      onClick={onNavigateToGettingStarted}
      className="hover:text-[#075E54] dark:hover:text-[#25D366] transition-colors cursor-pointer underline"
      >
      Bien démarrer
      </button>
    )}
    </div>
    </div>
    </div>
    </div>
  );
};
