import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { signupApi } from '../services/api';
import { Building2, Mail, KeyRound, PhoneCall, Key, ArrowRight, ArrowLeft, Loader2, AlertCircle, Sparkles, Upload, Plus, Trash2, Check, ListFilter, CheckCircle2, Sun, Moon } from 'lucide-react';

interface SignupViewProps {
  onNavigateToLogin: () => void;
  onNavigateToAbout?: () => void;
  onNavigateToGettingStarted?: () => void;
}

interface FaqPair {
  id: string;
  question: string;
  response: string;
}

export const SignupView: React.FC<SignupViewProps> = ({
  onNavigateToLogin,
  onNavigateToAbout,
  onNavigateToGettingStarted
}) => {
  const { setAuthSession } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Wizard state: 1 or 2
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [entrepriseName, setEntrepriseName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');
  const [whatsappToken, setWhatsappToken] = useState('');

  // Step 2 fields
  const [mode, setMode] = useState<'form' | 'file'>('form');

  // Form Mode State: Array of editable Q/A pairs
  const [faqPairs, setFaqPairs] = useState<FaqPair[]>([
    { id: '1', question: "Quels sont vos horaires d'ouverture ?", response: "Du Lundi au Samedi de 08h00 à 19h00." },
    { id: '2', question: "Livrez-vous à Cotonou ?", response: "Oui, livraison en 3h à Cotonou (1 000 FCFA)." }
  ]);

  // File Mode State
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [whatsappPhoneIdError, setWhatsappPhoneIdError] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const whatsappPhoneIdInputRef = useRef<HTMLInputElement>(null);

  // Client-side validation of raw Q:/R: text format
  const parseAndValidateRawFaq = (text: string): { valid: boolean; message?: string; count?: number; parsed?: { question: string; response: string }[] } => {
    if (!text || !text.trim()) return { valid: true, count: 0, parsed: [] };

    const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    if (blocks.length === 0) return { valid: false, message: "Le fichier ne contient aucun bloc de texte." };

    const parsed: { question: string; response: string }[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      let q = '';
      let r = '';

      for (const line of lines) {
        if (/^Q\s*:/i.test(line)) {
          q = line.replace(/^Q\s*:/i, '').trim();
        } else if (/^R\s*:/i.test(line)) {
          r = line.replace(/^R\s*:/i, '').trim();
        } else if (q && !r) {
          q += ' ' + line;
        } else if (r) {
          r += ' ' + line;
        }
      }

      if (!q || !r) {
        return {
          valid: false,
          message: `Erreur dans le bloc #${i + 1} : Chaque bloc doit impérativement posséder une ligne 'Q:' (Question) et une ligne 'R:' (Réponse).`
        };
      }

      parsed.push({ question: q, response: r });
    }

    return { valid: true, count: parsed.length, parsed };
  };

  const buildRawTextFromPairs = (): string | null => {
    const validPairs = faqPairs.filter(p => p.question.trim() && p.response.trim());
    if (validPairs.length === 0) return null;

    return validPairs
    .map(p => `Q: ${p.question.trim()}\nR: ${p.response.trim()}`)
    .join('\n\n');
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setEmailError(null);
    setWhatsappPhoneIdError(null);
    if (!entrepriseName.trim() || !email.trim() || !password || !whatsappPhoneId.trim() || !whatsappToken.trim()) {
      setErrorMsg("Veuillez remplir tous les champs obligatoires de l'étape 1.");
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleAddPair = () => {
    setFaqPairs(prev => [
      ...prev,
      { id: Date.now().toString(), question: '', response: '' }
    ]);
  };

  const handleUpdatePair = (id: string, field: 'question' | 'response', value: string) => {
    setFaqPairs(prev =>
    prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleRemovePair = (id: string) => {
    setFaqPairs(prev => prev.filter(p => p.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      setErrorMsg("Veuillez sélectionner un fichier au format texte (.txt).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      setFileName(file.name);
      setErrorMsg(null);
    };
    reader.readAsText(file);
  };

  const handleFinalSubmit = async (skipFaqs: boolean = false) => {
    setErrorMsg(null);
    setEmailError(null);
    setWhatsappPhoneIdError(null);
    let finalFaqsText: string | null = null;

    if (!skipFaqs) {
      if (mode === 'form') {
        finalFaqsText = buildRawTextFromPairs();
      } else {
        if (!fileContent.trim()) {
          setErrorMsg("Veuillez importer un fichier .txt ou utiliser le mode Formulaire.");
          return;
        }
        const validation = parseAndValidateRawFaq(fileContent);
        if (!validation.valid) {
          setErrorMsg(validation.message || "Le fichier importé est invalide.");
          return;
        }
        finalFaqsText = fileContent.trim();
      }
    }

    setLoading(true);

    try {
      const res = await signupApi({
        entreprise_name: entrepriseName.trim(),
                                  email: email.trim(),
                                  password,
                                  whatsapp_phone_number_id: whatsappPhoneId.trim(),
                                  whatsapp_token: whatsappToken.trim(),
                                  faqs: finalFaqsText
      });

      setAuthSession({
        email: email.trim(),
                     password,
                     token: res.access_token
      }, res.entreprise_name);
    } catch (err: any) {
      const msg = err.message || "Erreur lors de la création du compte.";

      const isWhatsappError =
      msg.includes("Ce numéro WhatsApp Business est déjà associé") ||
      /whatsapp_phone_number_id|numéro.*whatsapp|whatsapp.*numéro/i.test(msg) ||
      (/whatsapp/i.test(msg) && !/jeton/i.test(msg));

      const isEmailError =
      !isWhatsappError &&
      (/email|e-mail/i.test(msg) || /adresse email/i.test(msg));

      if (isWhatsappError) {
        setWhatsappPhoneIdError(msg);
        setErrorMsg(null);
        setStep(1);
        setTimeout(() => {
          whatsappPhoneIdInputRef.current?.focus();
        }, 50);
      } else if (isEmailError) {
        setEmailError(msg);
        setErrorMsg(null);
        setStep(1);
        setTimeout(() => {
          emailInputRef.current?.focus();
        }, 50);
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const fileValidation = parseAndValidateRawFaq(fileContent);

  return (
    <div className="min-h-screen bg-[#F0F4F2] dark:bg-[#0d1f1c] text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-y-auto font-sans transition-colors">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 dark:opacity-60 pointer-events-none"></div>

    {/* Background Ambient Glow */}
    <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#25D366]/15 dark:bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none"></div>
    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#075E54]/15 dark:bg-[#075E54]/20 rounded-full blur-3xl pointer-events-none"></div>

    {/* Top Bar for Theme Toggle */}
    <div className="absolute top-4 right-4 z-20">
    <button
    type="button"
    onClick={toggleTheme}
    className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all shadow-md cursor-pointer flex items-center gap-2 text-xs font-semibold"
    title={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
    >
    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-emerald-400" />}
    <span className="hidden sm:inline">{theme === 'dark' ? 'Clair' : 'Sombre'}</span>
    </button>
    </div>

    <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[24px] rounded-tr-[4px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 z-10 transition-colors">

    {/* Header with Wizard Progress */}
    <div className="bg-[#075E54] dark:bg-slate-950 text-white p-6 sm:p-8 border-b border-[#054c44] dark:border-slate-800">
    <div className="flex items-center justify-between gap-4 mb-4">
    <div className="flex items-center gap-3">
    <div className="w-11 h-11 rounded-2xl bg-[#25D366] text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg font-display">
    K
    </div>
    <div>
    <h1 className="text-xl sm:text-2xl font-black tracking-tight font-display">Kwiko SaaS</h1>
    <p className="text-xs text-emerald-100/90 dark:text-slate-400">
    Automatisation WhatsApp Business
    </p>
    </div>
    </div>

    <div className="flex items-center gap-2 bg-[#054c44] dark:bg-slate-900 px-3 py-1.5 rounded-full border border-emerald-400/30 dark:border-slate-800 text-xs font-bold font-mono">
    <span className={step === 1 ? 'text-[#25D366]' : 'text-emerald-200 dark:text-slate-400'}>Étape 1</span>
    <span className="text-emerald-500 dark:text-slate-600">/</span>
    <span className={step === 2 ? 'text-[#25D366]' : 'text-emerald-200 dark:text-slate-400'}>Étape 2</span>
    </div>
    </div>

    <div className="w-full bg-[#054c44] dark:bg-slate-800 h-2 rounded-full overflow-hidden">
    <div
    className="bg-[#25D366] h-full transition-all duration-300 rounded-full"
    style={{ width: step === 1 ? '50%' : '100%' }}
    ></div>
    </div>
    </div>

    {/* Form Body */}
    <div className="p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900">
    {errorMsg && (
      <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium rounded-xl p-3.5 flex items-start gap-2.5">
      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
      <span>{errorMsg}</span>
      </div>
    )}

    {step === 1 && (
      <form onSubmit={handleStep1Next} className="space-y-5">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
      <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">Étape 1 : Identifiants & API Meta WhatsApp</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400">Renseignez le nom de votre entreprise et vos clés Meta Developers.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
      Nom de votre entreprise <span className="text-red-500">*</span>
      </label>
      <div className="relative">
      <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
      <input
      type="text"
      required
      value={entrepriseName}
      onChange={e => setEntrepriseName(e.target.value)}
      placeholder="Ex: Boutique Elegance Cotonou"
      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] transition-all"
      />
      </div>
      </div>

      <div>
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
      Adresse E-mail <span className="text-red-500">*</span>
      </label>
      <div className="relative">
      <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
      <input
      ref={emailInputRef}
      type="email"
      required
      value={email}
      onChange={e => {
        setEmail(e.target.value);
        if (emailError) setEmailError(null);
      }}
      placeholder="contact@elegance.bj"
      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${
        emailError
        ? 'border-red-500 focus:ring-red-500'
        : 'border-slate-200 dark:border-slate-800 focus:ring-[#25D366]'
      } rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 transition-all`}
      />
      </div>
      {emailError && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{emailError}</span>
        </p>
      )}
      </div>

      <div className="sm:col-span-2">
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
      Mot de passe <span className="text-red-500">*</span>
      </label>
      <div className="relative">
      <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
      <input
      type="password"
      required
      value={password}
      onChange={e => setPassword(e.target.value)}
      placeholder="••••••••••••"
      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] transition-all"
      />
      </div>
      </div>

      <div>
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
      WhatsApp Phone ID <span className="text-red-500">*</span>
      </label>
      <div className="relative">
      <PhoneCall className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
      <input
      ref={whatsappPhoneIdInputRef}
      type="text"
      required
      value={whatsappPhoneId}
      onChange={e => {
        setWhatsappPhoneId(e.target.value);
        if (whatsappPhoneIdError) setWhatsappPhoneIdError(null);
      }}
      placeholder="Ex: 102938475610293"
      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${
        whatsappPhoneIdError
        ? 'border-red-500 focus:ring-red-500'
        : 'border-slate-200 dark:border-slate-800 focus:ring-[#25D366]'
      } rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 transition-all`}
      />
      </div>
      {whatsappPhoneIdError && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{whatsappPhoneIdError}</span>
        </p>
      )}
      </div>

      <div>
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
      Jeton Meta WhatsApp <span className="text-red-500">*</span>
      </label>
      <div className="relative">
      <Key className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
      <input
      type="password"
      required
      value={whatsappToken}
      onChange={e => setWhatsappToken(e.target.value)}
      placeholder="EAAG..."
      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#25D366] transition-all"
      />
      </div>
      </div>
      </div>

      <div className="pt-3">
      <button
      type="submit"
      className="w-full py-3.5 bg-[#075E54] dark:bg-[#25D366] hover:bg-[#064e46] dark:hover:bg-[#1ebf59] text-white dark:text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
      <span>Étape suivante : FAQ initiales</span>
      <ArrowRight className="w-4 h-4" />
      </button>
      </div>
      </form>
    )}

    {step === 2 && (
      <div className="space-y-5">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
      <div>
      <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">Étape 2 : FAQ Initiales (Optionnel)</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400">Ajoutez votre base de connaissances pour entraîner immédiatement l'IA.</p>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-[#075E54] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full">
      Optionnel
      </span>
      </div>

      <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl text-xs font-bold">
      <button
      type="button"
      onClick={() => { setMode('form'); setErrorMsg(null); }}
      className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
        mode === 'form'
        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
      }`}
      >
      <ListFilter className="w-3.5 h-3.5 text-[#075E54] dark:text-[#25D366]" />
      <span>Formulaire interactif</span>
      </button>

      <button
      type="button"
      onClick={() => { setMode('file'); setErrorMsg(null); }}
      className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
        mode === 'file'
        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
      }`}
      >
      <Upload className="w-3.5 h-3.5 text-[#075E54] dark:text-[#25D366]" />
      <span>Fichier .txt</span>
      </button>
      </div>

      {mode === 'form' && (
        <div className="space-y-4">
        <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Paires Question / Réponse ({faqPairs.length})</span>
        <button
        type="button"
        onClick={handleAddPair}
        className="text-xs font-bold text-[#075E54] dark:text-[#25D366] flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
        >
        <Plus className="w-3.5 h-3.5" />
        Ajouter une Q/R
        </button>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {faqPairs.map((pair, idx) => (
          <div key={pair.id} className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 relative group">
          <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#075E54] dark:text-[#25D366] uppercase tracking-wider">
          FAQ #{idx + 1}
          </span>
          {faqPairs.length > 1 && (
            <button
            type="button"
            onClick={() => handleRemovePair(pair.id)}
            className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
            title="Supprimer cette FAQ"
            >
            <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          </div>

          <div>
          <input
          type="text"
          value={pair.question}
          onChange={e => handleUpdatePair(pair.id, 'question', e.target.value)}
          placeholder="Ex: Quels sont vos moyens de paiement ?"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#25D366] focus:outline-none"
          />
          </div>

          <div>
          <textarea
          rows={2}
          value={pair.response}
          onChange={e => handleUpdatePair(pair.id, 'response', e.target.value)}
          placeholder="Ex: Espèces à la livraison, MTN MoMo et Wave."
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#25D366] focus:outline-none"
          />
          </div>
          </div>
        ))}
        </div>
        </div>
      )}

      {mode === 'file' && (
        <div className="space-y-3">
        <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#075E54] dark:hover:border-[#25D366] rounded-2xl bg-slate-50 dark:bg-slate-950 text-center transition-all cursor-pointer"
        onClick={() => fileInputRef.current?.click()}>
        <input
        type="file"
        ref={fileInputRef}
        accept=".txt"
        onChange={handleFileUpload}
        className="hidden"
        />
        <Upload className="w-8 h-8 text-[#075E54] dark:text-[#25D366] mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
        {fileName ? fileName : "Cliquez pour téléverser votre fichier .txt"}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
        Format exigé : Blocs séparés par une ligne vide avec <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">Q:</code> et <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">R:</code>
        </p>
        </div>

        {fileContent && (
          <div className="mt-2">
          {fileValidation.valid ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-[#25D366]" />
            <span>Fichier valide ! {fileValidation.count} FAQ détectée(s)</span>
            </div>

            <div className="max-h-36 overflow-y-auto bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-100 dark:border-slate-800 text-[11px] space-y-1.5 font-mono text-slate-700 dark:text-slate-300">
            {fileValidation.parsed?.map((p, i) => (
              <div key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0 pb-1">
              <span className="font-bold text-[#075E54] dark:text-[#25D366]">Q: {p.question}</span>
              <p className="text-slate-600 dark:text-slate-400">R: {p.response}</p>
              </div>
            ))}
            </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3 rounded-xl flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <span>{fileValidation.message}</span>
            </div>
          )}
          </div>
        )}
        </div>
      )}

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
      <div className="flex items-center justify-between gap-3">
      <button
      type="button"
      onClick={() => { setStep(1); setErrorMsg(null); }}
      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
      >
      <ArrowLeft className="w-3.5 h-3.5" />
      <span>Précédent</span>
      </button>

      <div className="flex items-center gap-2">
      <button
      type="button"
      disabled={loading}
      onClick={() => handleFinalSubmit(true)}
      className="px-4 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
      >
      Passer cette étape
      </button>

      <button
      type="button"
      disabled={loading || (mode === 'file' && !!fileContent && !fileValidation.valid)}
      onClick={() => handleFinalSubmit(false)}
      className="px-5 py-2.5 bg-[#25D366] hover:bg-[#1ebf59] text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
      >
      {loading ? (
        <>
        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
        <span>Création...</span>
        </>
      ) : (
        <>
        <span>Terminer l'inscription</span>
        <Check className="w-4 h-4" />
        </>
      )}
      </button>
      </div>
      </div>
      </div>
      </div>
    )}

    <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
    <div>
    Déjà inscrit ?{' '}
    <button
    type="button"
    onClick={onNavigateToLogin}
    className="text-[#075E54] dark:text-[#25D366] font-bold underline transition-colors cursor-pointer"
    >
    Se connecter à votre compte
    </button>
    </div>

    <div className="flex items-center justify-center gap-3 pt-1 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px] font-medium text-slate-500 dark:text-slate-400">
    {onNavigateToAbout && (
      <button
      type="button"
      onClick={onNavigateToAbout}
      className="hover:text-[#075E54] dark:hover:text-[#25D366] transition-colors cursor-pointer"
      >
      À propos de Kwiko
      </button>
    )}
    <span>•</span>
    {onNavigateToGettingStarted && (
      <button
      type="button"
      onClick={onNavigateToGettingStarted}
      className="hover:text-[#075E54] dark:hover:text-[#25D366] transition-colors cursor-pointer"
      >
      Bien démarrer
      </button>
    )}
    </div>
    </div>
    </div>
    </div>
    </div>
  );
};
