import React, { useState } from 'react';
import { ContactItem, MessageItem } from '../types';
import { exportMessagesAsCsv, normalizeText } from '../utils/exportUtils';
import { Users, Search, PhoneCall, Calendar, ChevronRight, Download } from 'lucide-react';

interface ContactsViewProps {
  contacts: ContactItem[];
  messages: MessageItem[];
  loading: boolean;
  onSelectContact: (contactId: number) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  messages,
  loading,
  onSelectContact
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedQuery = normalizeText(searchQuery);

  const filteredContacts = contacts.filter(c => {
    if (!normalizedQuery) return true;
    const nameMatch = c.name && normalizeText(c.name).includes(normalizedQuery);
    const phoneMatch = normalizeText(c.whatsapp_num).includes(normalizedQuery);
    return nameMatch || phoneMatch;
  });

  const handleExportAllMessages = () => {
    const contactsMap = contacts.reduce((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {} as Record<number, ContactItem>);

    exportMessagesAsCsv(messages, contactsMap, 'messages_tous_contacts_kwiko.csv');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      {/* Header section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-[#075E54] dark:text-[#25D366] rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white font-display">Clients & Contacts WhatsApp</h1>
            <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 font-mono">
              {contacts.length} clients
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Liste de tous les clients finaux ayant interagi avec votre entreprise via WhatsApp Business.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Export button */}
          <button
            type="button"
            onClick={handleExportAllMessages}
            disabled={messages.length === 0}
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700 disabled:opacity-50 cursor-pointer shrink-0"
            title="Exporter l'historique de tous les messages au format CSV"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-[#25D366]" />
            <span>Exporter tous les messages CSV</span>
          </button>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Nom ou numéro (+229...)"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Contacts List */}
      {filteredContacts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Aucun contact trouvé</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? "Aucun contact ne correspond à votre recherche."
              : "Aucun client ne vous a encore contacté sur votre ligne WhatsApp."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map(c => {
            const contactMsgs = messages.filter(m => m.contact_id === c.id);
            const lastMsg = contactMsgs[contactMsgs.length - 1];

            return (
              <div
                key={c.id}
                onClick={() => onSelectContact(c.id)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#25D366]/60 dark:hover:border-[#25D366]/60 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#075E54] to-[#128C7E] text-white font-bold text-base flex items-center justify-center shadow-sm font-display">
                        {c.name ? c.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#075E54] dark:group-hover:text-[#25D366] transition-colors font-display">
                          {c.name || "Client WhatsApp"}
                        </h3>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <PhoneCall className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {c.whatsapp_num}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-[#25D366] group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-3 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                      Dernier message
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 truncate font-normal">
                      {lastMsg ? lastMsg.contenu : "Conversation vide"}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" />
                    Inscrit le {new Date(c.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="font-bold text-[#075E54] dark:text-[#25D366] bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {contactMsgs.length} message(s)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
