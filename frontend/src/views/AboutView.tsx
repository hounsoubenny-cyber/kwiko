import React from 'react';
import { Sparkles, ShieldCheck, Zap, Users, CheckCircle2, ArrowRight, Bot, Clock, Lock, MessageSquare, Building2, HelpCircle } from 'lucide-react';

interface AboutViewProps {
  onNavigateToSignup?: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToGettingStarted?: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({
  onNavigateToSignup,
  onNavigateToLogin,
  onNavigateToGettingStarted
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#075E54] via-[#096a5f] to-[#128C7E] dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-emerald-600/30 dark:border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#25D366]/20 text-[#25D366] text-xs font-extrabold px-3.5 py-1 rounded-full border border-[#25D366]/40 font-mono">
            <Sparkles className="w-3.5 h-3.5" /> À propos de Kwiko
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight font-display">
            Kwiko — l'assistant WhatsApp qui répond à votre place
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 dark:text-slate-300 leading-relaxed font-normal">
            Kwiko permet à votre entreprise de répondre automatiquement à ses clients sur WhatsApp, 24h/24, en s'appuyant uniquement sur les informations que <strong className="text-white font-semibold underline decoration-[#25D366] underline-offset-4">vous</strong> avez définies. Pas de robot qui invente des réponses : Kwiko répond avec vos vrais horaires, vos vrais tarifs, vos vraies conditions de livraison.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-3">
            {onNavigateToGettingStarted && (
              <button
                onClick={onNavigateToGettingStarted}
                className="px-5 py-3 bg-[#25D366] hover:bg-[#1ebf59] text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Guide de démarrage rapide</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {onNavigateToSignup && (
              <button
                onClick={onNavigateToSignup}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-all cursor-pointer"
              >
                Inscrire votre PME
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Le problème qu'on résout */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-2xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">Le problème que nous résolvons</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Pourquoi Kwiko a été pensé pour les PME</p>
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
          Beaucoup de PME reçoivent les mêmes questions en boucle sur WhatsApp — horaires, zones de livraison, tarifs, disponibilité — mais n'ont ni le temps ni l'équipe pour répondre instantanément à chaque message. Résultat : des clients qui attendent, voire qui partent voir ailleurs.
        </p>
      </div>

      {/* Comment ça fonctionne */}
      <div className="space-y-6">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">Comment ça fonctionne, en résumé</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Un fonctionnement en 5 étapes claires et maîtrisées</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              step: "01",
              title: "Création de compte",
              desc: "Vous créez votre compte et connectez votre numéro WhatsApp Business via l'API Meta."
            },
            {
              step: "02",
              title: "Renseignez vos FAQ",
              desc: "Vous renseignez vos questions-réponses fréquentes (horaires, tarifs, livraison, etc.)."
            },
            {
              step: "03",
              title: "Réponse automatique",
              desc: "Kwiko cherche la réponse la plus pertinente dans vos FAQ et répond naturellement."
            },
            {
              step: "04",
              title: "Honnêteté garantie",
              desc: "Si l'info manque, Kwiko le dit honnêtement et invite le client à vous contacter direct."
            },
            {
              step: "05",
              title: "Suivi en direct",
              desc: "Vous gardez un œil sur tout depuis votre tableau de bord : conversations, contacts, stats."
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 relative flex flex-col justify-between">
              <span className="text-2xl font-black text-[#075E54] dark:text-[#25D366] font-mono">
                {item.step}
              </span>
              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-display">{item.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nos principes */}
      <div className="space-y-6">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">Nos principes fondamentaux</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">La promesse de Kwiko pour préserver la confiance de vos clients</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2.5 text-[#075E54] dark:text-[#25D366]">
              <Sparkles className="w-5 h-5 text-[#25D366]" />
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display">Transparence</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Chaque réponse automatique indique la FAQ sur laquelle elle s'appuie, permettant un contrôle de qualité permanent.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2.5 text-[#075E54] dark:text-[#25D366]">
              <ShieldCheck className="w-5 h-5 text-[#25D366]" />
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display">Fiabilité</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Kwiko ne répond jamais en dehors de ce que vous lui avez fourni. Aucune hallucination d'IA ni promesse irréaliste.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2.5 text-[#075E54] dark:text-[#25D366]">
              <Zap className="w-5 h-5 text-[#25D366]" />
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display">Simplicité</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Pensé pour des PME sans équipe technique — tout se fait depuis un tableau de bord clair et intuitif.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2.5 text-[#075E54] dark:text-[#25D366]">
              <Lock className="w-5 h-5 text-[#25D366]" />
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display">Contrôle total</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Vous gardez la main à tout moment via votre application WhatsApp Business habituelle sur votre téléphone.
            </p>
          </div>
        </div>
      </div>

      {/* Pour qui ? */}
      <div className="bg-emerald-50/80 dark:bg-slate-900/90 border border-emerald-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-3 text-[#075E54] dark:text-[#25D366]">
          <Building2 className="w-6 h-6" />
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">Pour qui est fait Kwiko ?</h2>
        </div>
        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
          Commerces, boutiques, restaurants, prestataires de services — toute entreprise qui reçoit un volume régulier de questions répétitives sur WhatsApp et souhaite gagner du temps sans perdre en qualité de réponse.
        </p>
      </div>

      {/* Footer callout */}
      <div className="text-center pt-4 space-y-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">Prêt à automatiser vos réponses clients ?</p>
        <div className="flex items-center justify-center gap-3">
          {onNavigateToGettingStarted && (
            <button
              onClick={onNavigateToGettingStarted}
              className="px-5 py-2.5 bg-[#075E54] dark:bg-[#25D366] hover:bg-[#054c44] dark:hover:bg-[#1ebf59] text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Consulter le guide étape par étape</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
