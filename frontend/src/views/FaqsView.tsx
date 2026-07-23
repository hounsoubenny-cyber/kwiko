import React, { useState } from 'react';
import { FAQItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { addFaqsApi } from '../services/api';
import { exportFaqsAsCsv, exportFaqsAsTxt, normalizeText } from '../utils/exportUtils';
import {
  BookOpen,
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  FileText,
  Check,
  Download,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface FaqsViewProps {
  faqs: FAQItem[];
  loading: boolean;
  onRefresh: () => void;
}

export const FaqsView: React.FC<FaqsViewProps> = ({ faqs, loading, onRefresh }) => {
  const { creds } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [faqsInput, setFaqsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const validateFaqBlocks = (text: string): { valid: boolean; message?: string } => {
    if (!text || !text.trim()) return { valid: false, message: "Veuillez entrer au moins un bloc FAQ." };

    const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    if (blocks.length === 0) return { valid: false, message: "Aucun bloc FAQ détecté." };

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const hasQ = /^Q\s*:/m.test(block);
      const hasR = /^R\s*:/m.test(block);
      if (!hasQ || !hasR) {
        return {
          valid: false,
          message: `Bloc #${i + 1} invalide. Chaque bloc doit obligatoirement inclure 'Q:' pour la question et 'R:' pour la réponse.`
        };
      }
    }
    return { valid: true };
  };

  const validation = validateFaqBlocks(faqsInput);

  const handleInsertSample = () => {
    const sample = `Q: Livrez-vous les week-ends ?
R: Oui, nous livrons le samedi de 08h à 17h. Fermé le dimanche.

Q: Puis-je retourner un article non conforme ?
R: Oui, retour gratuit sous 48 heures sur présentation du reçu.`;
    setFaqsInput(sample);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creds) return;

    if (!validation.valid) {
      setErrorMsg(validation.message || "Format des FAQ invalide.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await addFaqsApi(faqsInput.trim(), {
        email: creds.email,
        password: creds.password
      });

      setSuccessMsg("Paire(s) FAQ ajoutée(s) avec succès !");
      setFaqsInput('');
      setShowAddForm(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'ajout des FAQ.");
    } finally {
      setSubmitting(false);
    }
  };

  const normalizedQuery = normalizeText(searchQuery);

  const filteredFaqs = faqs.filter(f => {
    if (!normalizedQuery) return true;
    const q = normalizeText(f.question);
    const r = normalizeText(f.response);
    return q.includes(normalizedQuery) || r.includes(normalizedQuery);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-[#075E54] dark:text-[#25D366] rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white font-display">Base de Connaissances FAQ</h1>
            <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 font-mono">
              {faqs.length} FAQ
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ces questions-réponses servent de référence pour l'IA Kwiko afin d'automatiser vos réponses sur WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export button with dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={faqs.length === 0}
              className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-[#25D366]" />
              <span>Exporter</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    exportFaqsAsTxt(faqs);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-[#25D366]" />
                  <div>
                    <div className="font-bold">Format Texte (.txt)</div>
                    <div className="text-[10px] text-slate-500">Blocs Q: / R: réimportables</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportFaqsAsCsv(faqs);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors cursor-pointer mt-1"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="font-bold">Tableur Excel (.csv)</div>
                    <div className="text-[10px] text-slate-500">Colonnes Question, Réponse, Date</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="px-4 py-2.5 bg-[#25D366] hover:bg-[#1ebf59] active:bg-[#18a64d] text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? "Fermer le formulaire" : "Ajouter de nouvelles FAQ"}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#25D366]" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer">Fermer</button>
        </div>
      )}

      {/* Form Add Panel */}
      {showAddForm && (
        <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-6 shadow-2xl border border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#25D366]" />
              <h2 className="text-base font-bold text-white font-display">Ajouter des FAQ à la base de connaissances</h2>
            </div>
            <button
              type="button"
              onClick={handleInsertSample}
              className="text-xs font-bold text-[#25D366] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Insérer un modèle exemple
            </button>
          </div>

          {errorMsg && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-medium rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                Blocs FAQ (Format Q: / R:)
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Tapez vos questions/réponses au format suivant, en laissant une ligne vide entre chaque bloc :
              </p>
              <textarea
                rows={6}
                required
                value={faqsInput}
                onChange={e => setFaqsInput(e.target.value)}
                placeholder={`Q: Quels sont vos moyens de paiement ?\nR: Espèces à la livraison, MTN MoMo et Wave.\n\nQ: Quel est le délai de livraison ?\nR: Moins de 3 heures à Cotonou.`}
                className="w-full p-4 bg-slate-950 dark:bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-emerald-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#25D366]"
              />
            </div>

            {faqsInput.trim() && (
              <div className="text-xs font-mono">
                {validation.valid ? (
                  <span className="text-[#25D366] font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Format des FAQ valide
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {validation.message}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || !validation.valid}
                className="px-5 py-2 bg-[#25D366] hover:bg-[#1ebf59] active:bg-[#18a64d] text-slate-950 text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <span>Ajouter à la base Kwiko</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Real-time search bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Rechercher en temps réel dans votre base FAQ (questions et réponses)..."
          className="w-full pl-11 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#25D366] shadow-sm transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            title="Effacer la recherche"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* FAQ Cards Grid / Empty Search State */}
      {filteredFaqs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {searchQuery ? "Aucune FAQ ne correspond à votre recherche" : "Aucune FAQ enregistrée"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `Aucun résultat pour "${searchQuery}". Essayez avec d'autres mots-clés ou réinitialisez la recherche.`
              : "Ajoutez vos premières questions-réponses pour alimenter l'IA de votre compte WhatsApp."}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer mt-2"
            >
              <X className="w-3.5 h-3.5" />
              Réinitialiser la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFaqs.map((faq, idx) => (
            <div
              key={faq.id || idx}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold bg-[#075E54]/10 dark:bg-[#25D366]/10 text-[#075E54] dark:text-[#25D366] px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    FAQ #{faq.id || idx + 1}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(faq.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                    Question client
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug font-display">
                    {faq.question}
                  </h3>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3 text-[#25D366]" />
                    Réponse IA programmée
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 font-normal">
                    {faq.response}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
