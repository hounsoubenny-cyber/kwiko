import React, { useState, useEffect } from 'react';
import { ContactItem, MessageItem, FaqUsed } from '../types';
import { useAuth } from '../context/AuthContext';
import { getContactDetailsApi } from '../services/api';
import { exportMessagesAsCsv } from '../utils/exportUtils';
import { ArrowLeft, PhoneCall, Bot, Sparkles, CheckCheck, BookOpen, X, Loader2, AlertCircle, ShieldCheck, Download, FileSpreadsheet } from 'lucide-react';

interface ContactDetailViewProps {
  contactId: number;
  onBack: () => void;
}

export const ContactDetailView: React.FC<ContactDetailViewProps> = ({ contactId, onBack }) => {
  const { creds } = useAuth();

  const [contact, setContact] = useState<ContactItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // FAQ Modal state for inspecting RAG sources
  const [selectedFaqs, setSelectedFaqs] = useState<FaqUsed[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadContactData() {
      if (!creds) return;
      setLoading(true);
      setErrorMsg(null);

      try {
        const data = await getContactDetailsApi(creds, contactId);
        if (isMounted) {
          setContact(data.contact);
          // Sort messages by creation date ascending
          const sorted = [...data.messages].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          setMessages(sorted);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || "Impossible de charger la conversation.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadContactData();
    return () => { isMounted = false; };
  }, [contactId, creds]);

  // Helper to safely parse faqs_used JSON string
  const parseFaqsUsed = (raw: string | null): FaqUsed[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn("Failed to parse faqs_used:", e);
    }
    return [];
  };

  const handleExportConversation = () => {
    const contactName = contact?.name ? contact.name.replace(/\s+/g, '_') : `contact_${contactId}`;
    exportMessagesAsCsv(messages, undefined, `conversation_${contactName}.csv`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4 font-sans">
      {/* Back & Contact Info Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 sticky top-16 z-20 transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Retour à la liste des contacts"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#075E54] to-[#128C7E] text-white font-bold text-sm flex items-center justify-center font-display">
            {contact?.name ? contact.name.charAt(0).toUpperCase() : '?'}
          </div>

          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white font-display">
              {contact?.name || "Client WhatsApp"}
            </h1>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <PhoneCall className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              {contact?.whatsapp_num}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportConversation}
            disabled={messages.length === 0}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 disabled:opacity-50 cursor-pointer"
            title="Télécharger cette conversation au format CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-[#25D366]" />
            <span>Exporter CSV</span>
          </button>

          <span className="bg-emerald-50 dark:bg-emerald-950/60 text-[#075E54] dark:text-[#25D366] border border-emerald-200 dark:border-emerald-800 font-bold px-2.5 py-1 rounded-full text-[11px] hidden sm:inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#25D366]" />
            Assistant IA Actif
          </span>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#E5DDD5] dark:bg-slate-950 rounded-2xl p-12 text-center space-y-3 min-h-[400px] flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#075E54] dark:text-[#25D366]" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Chargement de la conversation WhatsApp...</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mx-auto" />
          <p className="text-xs font-bold text-red-800 dark:text-red-200">{errorMsg}</p>
          <button
            onClick={onBack}
            className="text-xs font-bold text-[#075E54] dark:text-[#25D366] underline hover:text-[#25D366] cursor-pointer"
          >
            Retourner aux contacts
          </button>
        </div>
      ) : (
        /* WhatsApp Chat Canvas */
        <div className="bg-[#E5DDD5] dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl p-4 sm:p-6 min-h-[500px] flex flex-col justify-between space-y-6 shadow-inner relative overflow-hidden transition-colors">
          <div className="space-y-4">
            <div className="text-center">
              <span className="bg-white/80 dark:bg-slate-900/90 backdrop-blur text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-3 py-1 rounded-full shadow-sm border dark:border-slate-800">
                Conversation WhatsApp gérée par Kwiko IA
              </span>
            </div>

            {messages.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
                Aucun message échangé pour le moment.
              </div>
            ) : (
              messages.map(msg => {
                const isIncoming = msg.direction === 'entrant';
                const usedFaqs = parseFaqsUsed(msg.faqs_used);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isIncoming ? 'items-start' : 'items-end'} space-y-1`}
                  >
                    {/* Chat Bubble */}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed relative ${
                        isIncoming
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-tl-none border border-slate-200 dark:border-slate-800'
                          : 'bg-[#DCF8C6] dark:bg-[#075E54] text-slate-950 dark:text-white rounded-tr-none border border-emerald-300 dark:border-emerald-700'
                      }`}
                    >
                      {/* Sender Tag */}
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-300 mb-1 flex items-center justify-between gap-3 font-mono">
                        <span>{isIncoming ? (contact?.name || "Client") : "IA Kwiko (Automatique)"}</span>
                        {!isIncoming && (
                          <span className="text-[#075E54] dark:text-[#25D366] font-semibold flex items-center gap-0.5">
                            <Bot className="w-3 h-3 text-[#25D366]" /> Kwiko RAG
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <p className="whitespace-pre-wrap font-sans text-xs">
                        {msg.contenu}
                      </p>

                      {/* AI FAQ Badge if used */}
                      {!isIncoming && usedFaqs.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-emerald-300/60 dark:border-emerald-800">
                          <button
                            type="button"
                            onClick={() => setSelectedFaqs(usedFaqs)}
                            className="inline-flex items-center gap-1.5 bg-[#075E54] dark:bg-[#25D366] hover:bg-[#054c44] dark:hover:bg-[#1ebf59] text-white dark:text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-[#25D366] dark:text-slate-950" />
                            <span>🤖 Réponse IA basée sur {usedFaqs.length} FAQ</span>
                          </button>
                        </div>
                      )}

                      {/* Timestamp & double tick */}
                      <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-slate-400 dark:text-slate-300 font-mono">
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {!isIncoming && <CheckCheck className="w-3 h-3 text-emerald-600 dark:text-[#25D366]" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-xl p-3 text-center text-[11px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Mode consultation seule — Les réponses sont générées et envoyées automatiquement par le serveur Kwiko via WhatsApp Webhook Meta.</span>
          </div>
        </div>
      )}

      {/* RAG FAQ Modal Inspection Drawer */}
      {selectedFaqs && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-[#075E54] dark:text-[#25D366]">
                <BookOpen className="w-5 h-5 text-[#25D366]" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                  FAQ(s) utilisées pour générer cette réponse
                </h3>
              </div>
              <button
                onClick={() => setSelectedFaqs(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              L'IA Kwiko a extrait ces éléments de votre base de connaissances pour élaborer une réponse précise au client final :
            </p>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {selectedFaqs.map((item, idx) => (
                <div key={idx} className="bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block font-mono">
                      Question source FAQ #{item.id || idx + 1}
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{item.question}</p>
                  </div>
                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block font-mono">
                      Réponse originale enregistrée
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{item.response}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedFaqs(null)}
                className="px-4 py-2 bg-[#075E54] dark:bg-[#25D366] hover:bg-[#054c44] dark:hover:bg-[#1ebf59] text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
