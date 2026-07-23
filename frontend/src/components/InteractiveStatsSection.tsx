import React, { useState, useMemo } from 'react';
import { MessageItem, FAQItem } from '../types';
import { exportMessagesAsCsv } from '../utils/exportUtils';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  TrendingUp,
  BarChart2,
  PieChart as PieChartIcon,
  Sparkles,
  Download,
  Calendar,
  CheckCircle2,
  HelpCircle,
  Bot,
  Zap
} from 'lucide-react';

interface InteractiveStatsSectionProps {
  messages: MessageItem[];
  faqs: FAQItem[];
}

// Custom Tooltip for Area/Bar Chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 font-sans">
        <p className="font-bold text-slate-300 font-mono mb-1">{label}</p>
        {payload.map((p: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: p.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
              {p.name} :
            </span>
            <span className="font-bold font-mono text-white">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const InteractiveStatsSection: React.FC<InteractiveStatsSectionProps> = ({ messages, faqs }) => {
  const [periodDays, setPeriodDays] = useState<7 | 30>(7);

  // Calculate volume per day
  const dailyData = useMemo(() => {
    const daysMap: Record<string, { date: string; fullDate: string; entrants: number; sortants: number; automated: number }> = {};

    const now = new Date();
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoKey = d.toISOString().split('T')[0];
      const dateLabel = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      daysMap[isoKey] = {
        date: dateLabel,
        fullDate: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
        entrants: 0,
        sortants: 0,
        automated: 0
      };
    }

    messages.forEach(m => {
      if (!m.created_at) return;
      const isoKey = new Date(m.created_at).toISOString().split('T')[0];
      if (daysMap[isoKey]) {
        if (m.direction === 'entrant') {
          daysMap[isoKey].entrants += 1;
        } else {
          daysMap[isoKey].sortants += 1;
          if (m.faqs_used) {
            try {
              const parsed = JSON.parse(m.faqs_used);
              if (Array.isArray(parsed) && parsed.length > 0) {
                daysMap[isoKey].automated += 1;
              }
            } catch {}
          }
        }
      }
    });

    return Object.values(daysMap);
  }, [messages, periodDays]);

  // Automated Response Rate calculation
  const automationStats = useMemo(() => {
    const totalOutbound = messages.filter(m => m.direction === 'sortant').length;
    let automatedCount = 0;

    messages.forEach(m => {
      if (m.direction === 'sortant' && m.faqs_used) {
        try {
          const parsed = JSON.parse(m.faqs_used);
          if (Array.isArray(parsed) && parsed.length > 0) {
            automatedCount += 1;
          }
        } catch {}
      }
    });

    const fallbackCount = Math.max(0, totalOutbound - automatedCount);
    const rate = totalOutbound > 0 ? Math.round((automatedCount / totalOutbound) * 100) : 100;

    return {
      totalOutbound,
      automatedCount,
      fallbackCount,
      rate,
      pieData: [
        { name: 'Réponses IA (FAQ)', value: automatedCount, color: '#25D366' },
        { name: 'Réponses Générales / Repli', value: fallbackCount, color: '#3B82F6' }
      ]
    };
  }, [messages]);

  // Top FAQs used calculation
  const topFaqs = useMemo(() => {
    const countsMap: Record<string, { question: string; count: number; response: string }> = {};

    messages.forEach(m => {
      if (m.direction === 'sortant' && m.faqs_used) {
        try {
          const parsed = JSON.parse(m.faqs_used);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any) => {
              const q = item.question || item.q;
              if (q) {
                if (!countsMap[q]) {
                  countsMap[q] = {
                    question: q,
                    count: 0,
                    response: item.response || item.r || ''
                  };
                }
                countsMap[q].count += 1;
              }
            });
          }
        } catch {}
      }
    });

    const sorted = Object.values(countsMap).sort((a, b) => b.count - a.count);
    const totalHits = sorted.reduce((sum, item) => sum + item.count, 0);

    return sorted.slice(0, 5).map(item => ({
      ...item,
      percentage: totalHits > 0 ? Math.round((item.count / totalHits) * 100) : 0
    }));
  }, [messages]);

  const handleExportGlobalMessages = () => {
    exportMessagesAsCsv(messages, undefined, 'export_messages_global_kwiko.csv');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-[#075E54] dark:text-[#25D366] rounded-xl">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
              Statistiques & Performance IA
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Analyse en temps réel de votre activité WhatsApp, taux de réponse IA et FAQs les plus sollicitées.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportGlobalMessages}
            disabled={messages.length === 0}
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700 disabled:opacity-50 cursor-pointer"
            title="Exporter l'historique complet des messages au format CSV"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-[#25D366]" />
            <span>Exporter tous les messages (CSV)</span>
          </button>
        </div>
      </div>

      {/* Grid 1: Daily Message Volume + Automation Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Volume Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#25D366]" />
                Volume quotidien des messages WhatsApp
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Comparatif des messages entrants (clients) et sortants (IA Kwiko)
              </p>
            </div>

            {/* Time period filter controls */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setPeriodDays(7)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  periodDays === 7
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                7 derniers jours
              </button>
              <button
                type="button"
                onClick={() => setPeriodDays(30)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  periodDays === 30
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                30 derniers jours
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEntrants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSortants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#25D366" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#25D366" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={(value) => (
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{value}</span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="entrants"
                  name="Entrants (Clients)"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEntrants)"
                />
                <Area
                  type="monotone"
                  dataKey="sortants"
                  name="Sortants (IA Kwiko)"
                  stroke="#25D366"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSortants)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Automation Rate Donut / Pie Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-[#075E54] dark:text-[#25D366]" />
                Taux de Réponse Automatisée
              </h3>
              <span className="text-xs font-black font-mono bg-emerald-50 dark:bg-emerald-950/60 text-[#075E54] dark:text-[#25D366] px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                {automationStats.rate}%
              </span>
            </div>

            <div className="py-2 flex flex-col items-center justify-center relative">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={automationStats.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {automationStats.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="text-center mt-1">
                <p className="text-2xl font-black text-slate-900 dark:text-white font-display">
                  {automationStats.automatedCount} / {automationStats.totalOutbound}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Réponses formulées avec la base FAQ
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#25D366]"></span>
                FAQ Reconnues
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {automationStats.automatedCount} msgs
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                Réponses de Repli / Générales
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {automationStats.fallbackCount} msgs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid 2: Top FAQs Used */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-[#25D366]" />
              Top des FAQ les Plus Utilisées
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Classement calculé en comptant les occurrences de chaque FAQ dans l'historique des réponses
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
            {topFaqs.length} FAQ actives sollicitées
          </span>
        </div>

        {topFaqs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs">
            Aucune statistique d'utilisation de FAQ disponible pour le moment.
          </div>
        ) : (
          <div className="space-y-4">
            {topFaqs.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2 min-w-0 pr-4">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#075E54] dark:text-[#25D366] font-bold text-[10px] flex items-center justify-center shrink-0 font-mono">
                      #{idx + 1}
                    </span>
                    <span className="text-slate-900 dark:text-white font-bold truncate">
                      {item.question}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{item.count} fois</span>
                    <span className="font-bold text-[#075E54] dark:text-[#25D366] bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#075E54] to-[#25D366] rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(item.percentage, 5)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
