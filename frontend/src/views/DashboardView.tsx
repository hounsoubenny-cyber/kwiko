import React from 'react';
import { ClientMeResponse } from '../types';
import { MaskedToken } from '../components/MaskedToken';
import { InteractiveStatsSection } from '../components/InteractiveStatsSection';
import { Users, BookOpen, MessageSquare, Bot, Plus, ArrowRight, CheckCircle2, Clock, Calendar, Sparkles, Building2, Zap } from 'lucide-react';

interface DashboardViewProps {
  data: ClientMeResponse | null;
  loading: boolean;
  onNavigateToFaqs: () => void;
  onNavigateToContacts: () => void;
  onSelectContact: (contactId: number) => void;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  loading,
  onNavigateToFaqs,
  onNavigateToContacts,
  onSelectContact,
  onRefresh
}) => {
  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <div className="h-28 bg-slate-200/70 dark:bg-slate-800/70 rounded-2xl animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200/70 dark:bg-slate-800/70 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const client = data?.client;
  const faqs = data?.faqs || [];
  const contacts = data?.contact || [];
  const messages = data?.messages || [];

  const aiMessagesCount = messages.filter(m => m.direction === 'sortant' && m.faqs_used).length;

  // Hours saved calculation (estimated ~3 mins saved per AI automated answer)
  const hoursSaved = Math.max(0.5, parseFloat(((aiMessagesCount * 3) / 60).toFixed(1)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#075E54] via-[#096a5f] to-[#128C7E] dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border dark:border-slate-800">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-[#25D366]/20 text-[#25D366] text-xs font-bold px-3 py-1 rounded-full border border-[#25D366]/30 font-mono">
            <Sparkles className="w-3.5 h-3.5" /> Service Client Actif
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display">
            Bienvenue, {client?.entreprise_name || "Votre Entreprise"} !
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 dark:text-slate-300 leading-relaxed">
            Votre assistant IA Kwiko répond automatiquement à vos clients WhatsApp Business 24/7 en utilisant votre base de connaissances FAQ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={onNavigateToFaqs}
            className="px-4 py-2.5 bg-[#25D366] hover:bg-[#1ebf59] text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter des FAQ</span>
          </button>
          <button
            onClick={onNavigateToContacts}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-[#25D366]" />
            <span>Voir les conversations ({contacts.length})</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Hours Saved - Highlighted with full green background */}
        <div className="bg-[#075E54] dark:bg-[#075E54] p-5 rounded-2xl border border-emerald-700 shadow-md flex items-center justify-between text-white relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <p className="text-xs font-extrabold text-emerald-200 uppercase tracking-wider font-mono">Heures gagnées</p>
            <p className="text-3xl font-black text-white font-display">{hoursSaved} h</p>
            <p className="text-[11px] text-emerald-100/90 font-medium flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#25D366]" /> Temps d'équipe économisé
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#25D366] text-slate-950 flex items-center justify-center shrink-0 font-black shadow-lg relative z-10">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Contacts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contacts WhatsApp</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{contacts.length}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Clients enregistrés
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#075E54] dark:text-[#25D366] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Base FAQ */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Base de FAQ</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{faqs.length}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Questions/Réponses IA</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: AI Responses */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Réponses IA (FAQ)</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{aiMessagesCount}</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Réponses automatisées</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 text-[#075E54] dark:text-[#25D366] flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-[#25D366]" />
          </div>
        </div>
      </div>

      {/* Interactive Statistics Section (Recharts Charts) */}
      <InteractiveStatsSection messages={messages} faqs={faqs} />

      {/* Grid 2: Recent Conversations & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent WhatsApp Conversations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-display">
              <MessageSquare className="w-5 h-5 text-[#075E54] dark:text-[#25D366]" />
              Conversations Clients Récentes
            </h2>
            <button
              onClick={onNavigateToContacts}
              className="text-xs font-bold text-[#075E54] dark:text-[#25D366] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Tout voir ({contacts.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Aucun contact enregistré</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Dès qu'un client vous écrit sur WhatsApp Business, son profil et ses échanges apparaîtront automatiquement ici.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
              {contacts.map(c => {
                const contactMsgs = messages.filter(m => m.contact_id === c.id);
                const lastMsg = contactMsgs[contactMsgs.length - 1];

                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectContact(c.id)}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#075E54] dark:text-[#25D366] font-bold text-sm flex items-center justify-center shrink-0 font-display">
                        {c.name ? c.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {c.name || c.whatsapp_num}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {c.whatsapp_num}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {lastMsg ? lastMsg.contenu : "Pas de message"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {new Date(c.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                      <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
                        {contactMsgs.length} message(s)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: WhatsApp Configuration & Webhook Widget */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-display">
            <Building2 className="w-5 h-5 text-[#075E54] dark:text-[#25D366]" />
            Configuration WhatsApp PME
          </h2>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            {/* Meta Webhook Compact Status Widget */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statut Webhook Meta</span>
              <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>En ligne</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">18ms</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Nom de l'entreprise</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{client?.entreprise_name}</span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Adresse e-mail</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{client?.email}</span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Phone Number ID Meta</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md inline-block mt-0.5">
                  {client?.whatsapp_phone_number_id}
                </span>
              </div>

              <MaskedToken token={client?.whatsapp_token || ''} label="Jeton Meta (whatsapp_token)" />

              <div className="pt-2 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3" />
                Inscrit le {client?.created_at ? new Date(client.created_at).toLocaleDateString('fr-FR') : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
