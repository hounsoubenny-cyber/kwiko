import React, { useState, useEffect } from 'react';
import { getApiBaseUrl, getWhatsappVerifyToken, loadAppConfig } from '../services/config';
import { Copy, Check, ExternalLink, HelpCircle, AlertTriangle, ArrowRight, ChevronDown, ChevronUp, BookOpen, Key, Webhook, MessageSquare, CheckCircle2, ShieldCheck, Sparkles, Building2, Terminal } from 'lucide-react';

interface GettingStartedViewProps {
  onNavigateToSignup?: () => void;
  onNavigateToAbout?: () => void;
}

export const GettingStartedView: React.FC<GettingStartedViewProps> = ({
  onNavigateToSignup,
  onNavigateToAbout
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [baseUrl, setBaseUrl] = useState<string>(getApiBaseUrl());
  const [verifyToken, setVerifyToken] = useState<string>(getWhatsappVerifyToken());

  // Accordion toggle states for FAQ section
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    loadAppConfig().then(config => {
      setBaseUrl(config.API_BASE_URL);
      setVerifyToken(config.WHATSAPP_VERIFY_TOKEN);
    });
  }, []);

  const handleCopyToken = () => {
    navigator.clipboard.writeText(verifyToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const webhookUrl = `${cleanBase}/api/webhook`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
    {/* Header Banner */}
    <div className="bg-gradient-to-r from-[#075E54] via-[#096a5f] to-[#128C7E] dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-emerald-600/30 dark:border-slate-800">
    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none"></div>

    <div className="max-w-3xl space-y-4 relative z-10">
    <div className="inline-flex items-center gap-2 bg-[#25D366]/20 text-[#25D366] text-xs font-extrabold px-3.5 py-1 rounded-full border border-[#25D366]/40 font-mono">
    <BookOpen className="w-3.5 h-3.5" /> Guide de Démarrage
    </div>

    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight font-display">
    Bien démarrer avec Kwiko
    </h1>

    <p className="text-sm sm:text-base text-emerald-100/90 dark:text-slate-300 leading-relaxed font-normal">
    Trois étapes suffisent pour que Kwiko commence à répondre automatiquement à vos clients.
    </p>

    {onNavigateToSignup && (
      <div className="pt-2">
      <button
      onClick={onNavigateToSignup}
      className="px-5 py-3 bg-[#25D366] hover:bg-[#1ebf59] text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
      >
      <span>Créer mon compte maintenant</span>
      <ArrowRight className="w-4 h-4" />
      </button>
      </div>
    )}
    </div>
    </div>

    {/* Main Steps Container */}
    <div className="space-y-10">

    {/* Étape 1 */}
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4 transition-colors">
    <div className="flex items-center gap-3.5">
    <div className="w-11 h-11 rounded-2xl bg-[#075E54] dark:bg-[#25D366] text-white dark:text-slate-950 font-black text-lg flex items-center justify-center font-mono shrink-0 shadow-md">
    1
    </div>
    <div>
    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">
    Étape 1 — Créez votre compte
    </h2>
    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Identifiants de votre entreprise</p>
    </div>
    </div>

    <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed pl-0 sm:pl-14">
    Renseignez le nom de votre entreprise, votre email et un mot de passe. Vous pourrez modifier ces informations plus tard.
    </p>
    </div>

    {/* Étape 2 */}
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 transition-colors">
    <div className="flex items-center gap-3.5">
    <div className="w-11 h-11 rounded-2xl bg-[#075E54] dark:bg-[#25D366] text-white dark:text-slate-950 font-black text-lg flex items-center justify-center font-mono shrink-0 shadow-md">
    2
    </div>
    <div>
    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">
    Étape 2 — Connectez votre WhatsApp Business
    </h2>
    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Configuration de l'API Meta WhatsApp Business</p>
    </div>
    </div>

    <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
    Pour que Kwiko puisse recevoir et envoyer des messages en votre nom, vous devez le connecter à votre compte <strong>WhatsApp Business</strong> via Meta. Voici la marche à suivre, dans l'ordre :
    </p>

    {/* Sub-sections A to E */}
    <div className="space-y-6 pl-0 sm:pl-4">

    {/* A. Créer votre application Meta */}
    <div className="border-l-4 border-[#075E54] dark:border-[#25D366] pl-4 sm:pl-6 space-y-3">
    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-display flex items-center gap-2">
    <span className="bg-emerald-100 dark:bg-emerald-950 text-[#075E54] dark:text-[#25D366] text-xs font-black px-2.5 py-0.5 rounded-md font-mono">A</span>
    Créer votre application Meta
    </h3>

    <ol className="list-decimal list-inside text-sm sm:text-base text-slate-700 dark:text-slate-300 space-y-2.5 leading-relaxed">
    <li>
    Rendez-vous sur{' '}
    <a
    href="https://developers.facebook.com"
    target="_blank"
    rel="noopener noreferrer"
    className="text-[#075E54] dark:text-[#25D366] font-extrabold underline inline-flex items-center gap-1 hover:text-emerald-700"
    >
    developers.facebook.com <ExternalLink className="w-3.5 h-3.5" />
    </a>{' '}
    et connectez-vous avec un compte Facebook (idéalement celui de votre entreprise).
    </li>
    <li>Dans le tableau de bord, cliquez sur <strong>"Créer une application"</strong>.</li>
    <li>Choisissez le type d'application <strong>"Entreprise"</strong> (Business), donnez-lui un nom (ex. le nom de votre entreprise), puis validez.</li>
    <li>Dans la liste des produits à ajouter à votre application, repérez <strong>WhatsApp</strong> et cliquez sur <strong>"Configurer"</strong>.</li>
    </ol>
    </div>

    {/* B. Récupérer votre numéro WhatsApp Business */}
    <div className="border-l-4 border-[#075E54] dark:border-[#25D366] pl-4 sm:pl-6 space-y-3">
    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-display flex items-center gap-2">
    <span className="bg-emerald-100 dark:bg-emerald-950 text-[#075E54] dark:text-[#25D366] text-xs font-black px-2.5 py-0.5 rounded-md font-mono">B</span>
    Récupérer votre numéro WhatsApp Business
    </h3>

    <ol className="list-decimal list-inside text-sm sm:text-base text-slate-700 dark:text-slate-300 space-y-2.5 leading-relaxed" start={5}>
    <li>Dans la section <strong>WhatsApp &gt; Prise en main (Getting started)</strong>, Meta vous propose soit d'utiliser un <strong>numéro de test</strong> fourni gratuitement (pratique pour essayer Kwiko avant de vous engager), soit d'ajouter votre <strong>numéro professionnel réel</strong> (nécessite une vérification de votre entreprise auprès de Meta).</li>
    <li>Une fois un numéro configuré, notez son <strong>Identifiant de numéro de téléphone</strong> (<code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">Phone number ID</code>), visible dans cette même section — c'est un identifiant numérique, pas votre numéro de téléphone lui-même.</li>
    </ol>
    </div>

    {/* C. Générer un token d'accès */}
    <div className="border-l-4 border-[#075E54] dark:border-[#25D366] pl-4 sm:pl-6 space-y-3">
    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-display flex items-center gap-2">
    <span className="bg-emerald-100 dark:bg-emerald-950 text-[#075E54] dark:text-[#25D366] text-xs font-black px-2.5 py-0.5 rounded-md font-mono">C</span>
    Générer un token d'accès
    </h3>

    <ol className="list-decimal list-inside text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed" start={7}>
    <li>Toujours dans la section WhatsApp de votre application, générez un <strong>token d'accès</strong> (<code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono">Access Token</code>).</li>
    <li>
    ⚠️ Le token affiché par défaut est <strong>temporaire</strong> (24h). Pour un usage en production avec Kwiko, générez un <strong>token permanent</strong> : allez dans <strong>Paramètres de l'application &gt; Utilisateurs système</strong>, créez un utilisateur système, attribuez-lui les permissions <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">whatsapp_business_messaging</code> et <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">whatsapp_business_management</code>, puis générez un token à partir de cet utilisateur système (celui-ci n'expire pas, contrairement au token de test).
    </li>
    <li>Conservez précieusement ce <strong>Phone number ID</strong> et ce <strong>token</strong> : ce sont les deux informations à renseigner dans Kwiko (à l'inscription, ou plus tard dans vos paramètres).</li>
    </ol>
    </div>

    {/* D. Configurer le webhook (indispensable) */}
    <div className="border-l-4 border-[#25D366] pl-4 sm:pl-6 space-y-3 bg-emerald-50/50 dark:bg-slate-950/60 p-4.5 rounded-r-2xl">
    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-display flex items-center gap-2">
    <span className="bg-[#25D366] text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-md font-mono">D</span>
    Configurer le webhook (indispensable pour recevoir les messages)
    </h3>

    <ol className="list-decimal list-inside text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed" start={10}>
    <li>Dans votre application Meta, allez dans <strong>WhatsApp &gt; Configuration</strong>.</li>

    {/* DYNAMIC WEBHOOK DISPLAY */}
    <li className="space-y-2">
    <span>
    Dans le champ <strong>"URL de rappel" (Callback URL)</strong>, renseignez l'URL de webhook de Kwiko :
    </span>

    <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-800 font-mono text-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-inner my-2">
    <div className="flex items-center gap-2 overflow-x-auto break-all font-semibold text-[#25D366]">
    <Webhook className="w-4 h-4 shrink-0 text-[#25D366]" />
    <span>{webhookUrl}</span>
    </div>

    <button
    type="button"
    onClick={handleCopy}
    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
      copied
      ? 'bg-[#25D366] text-slate-950'
      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
    }`}
    >
    {copied ? (
      <>
      <Check className="w-3.5 h-3.5" />
      <span>Copié !</span>
      </>
    ) : (
      <>
      <Copy className="w-3.5 h-3.5" />
      <span>Copier l'URL</span>
      </>
    )}
    </button>
    </div>
    </li>

    <li className="space-y-2">
    <span>
    Dans le champ <strong>"Verify Token"</strong>, renseignez exactement cette valeur
    (la même pour tous les comptes Kwiko — elle ne sert qu'une seule fois, à cette étape de vérification) :
    </span>

    <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-800 font-mono text-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-inner my-2">
    <div className="flex items-center gap-2 overflow-x-auto break-all font-semibold text-[#25D366]">
    <ShieldCheck className="w-4 h-4 shrink-0 text-[#25D366]" />
    <span>{verifyToken}</span>
    </div>

    <button
    type="button"
    onClick={handleCopyToken}
    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
      copiedToken
      ? 'bg-[#25D366] text-slate-950'
      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
    }`}
    >
    {copiedToken ? (
      <>
      <Check className="w-3.5 h-3.5" />
      <span>Copié !</span>
      </>
    ) : (
      <>
      <Copy className="w-3.5 h-3.5" />
      <span>Copier</span>
      </>
    )}
    </button>
    </div>
    </li>
    <li>Cliquez sur <strong>"Vérifier et enregistrer"</strong> — Meta va contacter Kwiko une seule fois pour confirmer que l'URL est valide.</li>
    <li>Une fois la vérification réussie, abonnez-vous (bouton "Subscribe"/"S'abonner") au champ <code className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white px-1.5 py-0.5 rounded font-mono font-bold text-xs">messages</code> dans la liste des événements webhook disponibles. Sans cet abonnement, Meta ne transmettra aucun message entrant à Kwiko.</li>
    </ol>
    </div>

    {/* E. Vérifier que tout fonctionne */}
    <div className="border-l-4 border-[#075E54] dark:border-[#25D366] pl-4 sm:pl-6 space-y-3">
    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-display flex items-center gap-2">
    <span className="bg-emerald-100 dark:bg-emerald-950 text-[#075E54] dark:text-[#25D366] text-xs font-black px-2.5 py-0.5 rounded-md font-mono">E</span>
    Vérifier que tout fonctionne
    </h3>

    <ol className="list-decimal list-inside text-sm sm:text-base text-slate-700 dark:text-slate-300 space-y-2.5 leading-relaxed" start={15}>
    <li>Envoyez un message test depuis un téléphone vers votre numéro WhatsApp Business : vous devriez voir apparaître la conversation dans votre tableau de bord Kwiko sous "Conversations" ou "Contacts" en quelques secondes.</li>
    </ol>
    </div>

    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-400 italic flex items-center gap-2.5">
    <HelpCircle className="w-5 h-5 text-[#075E54] dark:text-[#25D366] shrink-0" />
    <span>Besoin d'aide pour cette étape ? Contactez notre support, nous pouvons vous accompagner dans la configuration initiale.</span>
    </div>
    </div>
    </div>

    {/* Étape 3 */}
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4 transition-colors">
    <div className="flex items-center gap-3.5">
    <div className="w-11 h-11 rounded-2xl bg-[#075E54] dark:bg-[#25D366] text-white dark:text-slate-950 font-black text-lg flex items-center justify-center font-mono shrink-0 shadow-md">
    3
    </div>
    <div>
    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">
    Étape 3 — Ajoutez vos questions fréquentes (FAQ)
    </h2>
    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Entraînement de la base de réponses Kwiko</p>
    </div>
    </div>

    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
    C'est l'étape la plus importante : plus vos FAQ sont complètes, plus Kwiko répondra précisément à vos clients.
    </p>

    <div className="space-y-3 pt-2">
    <p className="text-xs font-bold text-slate-900 dark:text-white">Deux façons de faire :</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
    <span className="text-xs font-bold text-[#075E54] dark:text-[#25D366] flex items-center gap-1.5">
    <CheckCircle2 className="w-4 h-4" /> Manuellement
    </span>
    <p className="text-xs text-slate-600 dark:text-slate-400">
    Une question à la fois, directement depuis l'interface de votre tableau de bord.
    </p>
    </div>

    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
    <span className="text-xs font-bold text-[#075E54] dark:text-[#25D366] flex items-center gap-1.5">
    <CheckCircle2 className="w-4 h-4" /> En une seule fois
    </span>
    <p className="text-xs text-slate-600 dark:text-slate-400">
    En important un fichier texte (.txt) contenant toutes vos questions-réponses au format :
    </p>
    </div>
    </div>

    {/* Example Text Format */}
    <div className="bg-slate-950 text-slate-200 p-4 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
    <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Exemple de fichier FAQ .txt :</div>
    <pre className="text-emerald-400 whitespace-pre-wrap">{`Q: Quels sont vos horaires ?
      R: Nous sommes ouverts de 8h à 18h, du lundi au samedi.

      Q: Livrez-vous en dehors de la ville ?
      R: Oui, sous 48h, avec des frais supplémentaires selon la distance.`}</pre>
      </div>

      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-[#075E54] dark:text-emerald-300 font-medium">
      💡 <strong>Conseil :</strong> commencez par les 5 à 10 questions que vos clients vous posent le plus souvent — vous pourrez toujours en ajouter davantage ensuite.
      </div>
      </div>
      </div>

      {/* Et ensuite ? */}
      <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-3 shadow-md border border-emerald-700/50">
      <h2 className="text-xl font-black font-display text-white flex items-center gap-2">
      <Sparkles className="w-5 h-5 text-[#25D366]" /> Et ensuite ?
      </h2>
      <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
      Une fois votre WhatsApp connecté et vos premières FAQ ajoutées, Kwiko commence immédiatement à répondre à vos clients. Vous pouvez suivre chaque conversation en temps réel depuis votre tableau de bord, et ajouter de nouvelles FAQ à tout moment dès que vous repérez une question à laquelle Kwiko n'a pas su répondre.
      </p>
      </div>

      {/* FAQ sur Kwiko lui-même */}
      <div className="space-y-4">
      <div className="space-y-1">
      <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">
      Questions fréquentes sur Kwiko lui-même
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400">Tout ce que vous devez savoir avant de vous lancer</p>
      </div>

      <div className="space-y-3">
      {[
        {
          q: "Est-ce que je perds le contrôle de mes conversations WhatsApp ?",
          a: "Non. Vous pouvez à tout moment consulter et reprendre la main sur une conversation directement depuis votre application WhatsApp Business habituelle."
        },
        {
          q: "Que se passe-t-il si Kwiko ne connaît pas la réponse ?",
          a: "Il répond honnêtement qu'il ne dispose pas de cette information et invite le client à vous contacter directement — aucune réponse n'est inventée."
        },
        {
          q: "Puis-je modifier mes FAQ après les avoir ajoutées ?",
          a: "Oui, à tout moment depuis la section \"Base de FAQ\" de votre tableau de bord."
        }
      ].map((faq, idx) => (
        <div
        key={idx}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all shadow-sm"
        >
        <button
        onClick={() => toggleFaq(idx)}
        className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
        >
        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-display">
        {faq.q}
        </span>
        {openFaq === idx ? (
          <ChevronUp className="w-4 h-4 text-[#075E54] dark:text-[#25D366] shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
        </button>

        {openFaq === idx && (
          <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/60 pt-3 leading-relaxed bg-slate-50/50 dark:bg-slate-950/30">
          {faq.a}
          </div>
        )}
        </div>
      ))}
      </div>
      </div>

      </div>
      </div>
  );
};
