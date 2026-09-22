'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  ExternalLink,
  Filter,
  Loader2,
  Search,
  Sparkles,
  Award,
  ArrowRight,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import AppShell from '@/components/ui/AppShell';
import { getSchemes } from '@/lib/api';
import { useTranslation } from '@/stores/languageStore';
import StatusBadge from '@/components/ui/StatusBadge';
import { useSpeech } from '@/hooks/useSpeech';

export interface GovernmentScheme {
  id: string;
  name: string;
  description?: string;
  agency_name?: string;
  scheme_type?: string;
  max_subsidy_percentage?: number;
  max_loan_amount?: number;
  target_sectors?: string[];
}

const FALLBACK_SCHEMES: GovernmentScheme[] = [
  {
    id: 'pmegp',
    name: 'Prime Minister Employment Generation Programme (PMEGP)',
    description:
      'Credit-linked subsidy programme for setting up new micro-enterprises in non-farm sector. Margin money subsidy up to 35% in rural areas.',
    agency_name: 'KVIC / Ministry of MSME',
    scheme_type: 'subsidy',
    max_subsidy_percentage: 35,
    max_loan_amount: 5000000,
    target_sectors: ['manufacturing', 'services', 'agro_processing'],
  },
  {
    id: 'mudra',
    name: 'Pradhan Mantri MUDRA Yojana (PMMY)',
    description:
      'Collateral-free institutional loans up to ₹10 Lakh for micro and small enterprises (Shishu up to ₹50k, Kishor up to ₹5L, Tarun up to ₹10L).',
    agency_name: 'MUDRA / Department of Financial Services',
    scheme_type: 'loan',
    max_subsidy_percentage: 0,
    max_loan_amount: 1000000,
    target_sectors: ['manufacturing', 'services', 'retail', 'trading'],
  },
  {
    id: 'stand-up-india',
    name: 'Stand-Up India Scheme',
    description:
      'Facilitates bank loans between ₹10 Lakh and ₹1 Crore to at least one SC/ST and at least one woman borrower per bank branch for setting up greenfield enterprises.',
    agency_name: 'SIDBI / Ministry of Finance',
    scheme_type: 'loan',
    max_subsidy_percentage: 0,
    max_loan_amount: 10000000,
    target_sectors: ['manufacturing', 'services', 'trading', 'agriculture_allied'],
  },
  {
    id: 'pmfme',
    name: 'PM Formalisation of Micro Food Processing Enterprises (PMFME)',
    description:
      'Credit-linked capital subsidy at 35% of eligible project cost with a maximum ceiling of ₹10 Lakh per unit for individual micro food processing units.',
    agency_name: 'Ministry of Food Processing Industries (MoFPI)',
    scheme_type: 'subsidy',
    max_subsidy_percentage: 35,
    max_loan_amount: 1000000,
    target_sectors: ['agro_processing', 'food_processing'],
  },
  {
    id: 'kcc',
    name: 'Kisan Credit Card (KCC) Scheme',
    description:
      'Short-term credit for crop cultivation, post-harvest expenses, animal husbandry, and fisheries with 3% prompt repayment interest subvention.',
    agency_name: 'NABARD / Ministry of Agriculture',
    scheme_type: 'interest_subvention',
    max_subsidy_percentage: 3,
    max_loan_amount: 300000,
    target_sectors: ['agriculture', 'dairy', 'poultry', 'fisheries'],
  },
];

export default function SchemesPage() {
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const { t } = useTranslation();

  const {
    isListening,
    isSTTSupported,
    toggleListening,
    isSpeaking,
    speakingId,
    toggleSpeak,
  } = useSpeech();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getSchemes();
        const activeList = data.length > 0 ? data : FALLBACK_SCHEMES;
        setSchemes(activeList);
        if (typeof window !== 'undefined' && data.length > 0) {
          localStorage.setItem('udyam_cached_schemes', JSON.stringify(data));
        }
      } catch (err) {
        console.warn('API error, using cached or fallback schemes directory:', err);
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('udyam_cached_schemes');
          if (cached) {
            try {
              setSchemes(JSON.parse(cached));
              return;
            } catch (e) {
              console.warn('Could not parse cached schemes:', e);
            }
          }
        }
        setSchemes(FALLBACK_SCHEMES);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleVoiceSearch = () => {
    toggleListening((spokenText) => {
      setQuery(spokenText);
    });
  };

  const filteredSchemes = schemes.filter((s) => {
    const searchStr = `${s.name} ${s.description || ''} ${s.agency_name || ''}`.toLowerCase();
    const matchesQuery = searchStr.includes(query.toLowerCase());
    const matchesType = selectedType === 'all' || s.scheme_type === selectedType;
    return matchesQuery && matchesType;
  });

  return (
    <AppShell>
      <div className="flex-1 w-full flex flex-col gap-8">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1A1D24] via-[#222731] to-[#2B323F] text-white p-6 sm:p-8 lg:p-9 shadow-md border border-neutral-800/60 animate-fade-in-up">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.04] rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md text-white border border-white/15 rounded-full text-xs font-semibold mb-4 transition-transform hover:scale-105">
                <Sparkles className="h-3.5 w-3.5 text-slate-300 animate-pulse" /> {t('schemes.badge')}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">{t('schemes.title')}</h1>
              <p className="text-white/70 text-sm sm:text-base mt-2 font-normal leading-relaxed">
                {t('schemes.desc')}
              </p>
            </div>
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white text-neutral-900 font-bold text-sm shadow-sm hover:bg-neutral-100 hover:shadow-md hover:scale-105 transition-all duration-200 active:scale-95 shrink-0 self-start sm:self-auto"
            >
              {t('schemes.check')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-border p-4 sm:p-5 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96 flex items-center">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isListening ? 'Listening for scheme name...' : t('schemes.search')}
              className="w-full pl-11 pr-11 py-2.5 bg-neutral-50/70 dark:bg-[#1F242C] border border-border rounded-xl text-sm outline-none focus:bg-white dark:focus:bg-[#161B22] focus:border-primary focus:ring-4 focus:ring-primary/10 transition text-foreground"
            />
            {/* Voice Search Button */}
            {isSTTSupported && (
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-foreground-muted hover:text-primary hover:bg-primary/10'
                }`}
                title={isListening ? 'Stop listening' : 'Voice search'}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['all', 'subsidy', 'loan', 'interest_subvention'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  selectedType === type
                    ? 'bg-primary text-white shadow-sm scale-105'
                    : 'bg-neutral-100 dark:bg-[#1F242C] text-foreground-muted hover:text-foreground hover:bg-neutral-200/70 dark:hover:bg-[#272D37]'
                }`}
              >
                {type === 'all' ? 'All Schemes' : type.replace(/_/g, ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Scheme List */}
        {loading ? (
          <div className="bg-white dark:bg-[#161B22] rounded-3xl border border-border p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-semibold text-foreground-muted">Loading government schemes directory...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSchemes.map((s, idx) => {
              const schemeCardId = `scheme-${s.id || idx}`;
              const isCardSpeaking = isSpeaking && speakingId === schemeCardId;
              const spokenText = `${s.name}. Agency: ${s.agency_name || ''}. ${s.description || ''}. Maximum subsidy: ${s.max_subsidy_percentage || 0} percent. Maximum loan: ₹${s.max_loan_amount ? s.max_loan_amount.toLocaleString('en-IN') : 'As per norms'}.`;

              return (
                <div
                  key={s.id || idx}
                  className="bg-white dark:bg-[#161B22] rounded-2xl border border-border p-6 shadow-subtle hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                          <Landmark className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-base leading-snug group-hover:text-primary transition-colors">{s.name}</h3>
                          <p className="text-xs text-foreground-muted font-medium mt-0.5">{s.agency_name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Read Aloud Button */}
                        <button
                          type="button"
                          onClick={() => toggleSpeak(spokenText, schemeCardId)}
                          className={`p-1.5 rounded-lg text-xs transition ${
                            isCardSpeaking
                              ? 'bg-primary text-white animate-pulse'
                              : 'text-foreground-muted hover:text-primary hover:bg-primary/10'
                          }`}
                          title={isCardSpeaking ? 'Stop audio' : 'Listen to scheme details'}
                        >
                          {isCardSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </button>

                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                          Active
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-foreground-muted leading-relaxed mb-6">
                      {s.description}
                    </p>
                  </div>

                  <div>
                    <div className="grid grid-cols-2 gap-3 p-4 bg-neutral-50/70 dark:bg-[#1F242C] rounded-xl border border-border/60 mb-5">
                      <div>
                        <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider block">Max Subsidy</span>
                        <span className="text-base font-black text-primary font-financial mt-0.5 block">
                          {s.max_subsidy_percentage ? `${s.max_subsidy_percentage}%` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider block">Max Loan Limit</span>
                        <span className="text-base font-black text-foreground font-financial mt-0.5 block">
                          {s.max_loan_amount ? `₹${(s.max_loan_amount / 100000).toFixed(1)}L` : 'As per project'}
                        </span>
                      </div>
                    </div>

                    {s.target_sectors && s.target_sectors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {s.target_sectors.map((sec, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-neutral-100 dark:bg-[#272D37] text-foreground-muted"
                          >
                            {sec.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground-muted flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Eligible for MSME/Rural
                      </span>
                      <Link
                        href="/onboarding"
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-600 transition group-hover:translate-x-1 duration-200"
                      >
                        Check Eligibility <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

