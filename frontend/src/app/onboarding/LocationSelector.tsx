'use client';

import { useEffect, useState } from 'react';
import { MapPin, Loader2, Building } from 'lucide-react';
import { getStates, getDistricts, getTalukas, getVillages, District, Taluka, Village } from '@/lib/api';
import { useLanguageStore } from '@/stores/languageStore';

interface LocationSelectorProps {
  districtId: string;
  talukaId: string;
  villageId: string;
  setDistrictId: (id: string, name?: string) => void;
  setTalukaId: (id: string, name?: string) => void;
  setVillageId: (id: string, name?: string) => void;
  stateCode?: string;
  setStateCode?: (code: string, name?: string) => void;
}

const DEFAULT_INDIAN_STATES = [
  'Maharashtra',
  'Karnataka',
  'Tamil Nadu',
  'Uttar Pradesh',
  'Gujarat',
  'Rajasthan',
  'Punjab',
  'Haryana',
  'West Bengal',
  'Madhya Pradesh',
  'Andhra Pradesh',
  'Telangana',
  'Kerala',
  'Bihar',
  'Odisha',
  'Assam',
  'Jharkhand',
  'Chhattisgarh',
  'Uttarakhand',
  'Himachal Pradesh',
];

const STATE_CODE_TO_NAME: Record<string, string> = {
  AP: 'Andhra Pradesh',
  AR: 'Arunachal Pradesh',
  AS: 'Assam',
  BR: 'Bihar',
  CG: 'Chhattisgarh',
  GA: 'Goa',
  GJ: 'Gujarat',
  HR: 'Haryana',
  HP: 'Himachal Pradesh',
  JH: 'Jharkhand',
  KA: 'Karnataka',
  KL: 'Kerala',
  MP: 'Madhya Pradesh',
  MH: 'Maharashtra',
  MN: 'Manipur',
  ML: 'Meghalaya',
  MZ: 'Mizoram',
  NL: 'Nagaland',
  OD: 'Odisha',
  PB: 'Punjab',
  RJ: 'Rajasthan',
  SK: 'Sikkim',
  TN: 'Tamil Nadu',
  TS: 'Telangana',
  TR: 'Tripura',
  UP: 'Uttar Pradesh',
  UK: 'Uttarakhand',
  WB: 'West Bengal',
};

function canonicalState(input?: string): string {
  if (!input) return 'Maharashtra';
  const trimmed = input.trim();
  const upper = trimmed.toUpperCase();
  if (STATE_CODE_TO_NAME[upper]) return STATE_CODE_TO_NAME[upper];
  return trimmed;
}

export default function LocationSelector({
  districtId,
  talukaId,
  villageId,
  setDistrictId,
  setTalukaId,
  setVillageId,
  stateCode = 'Maharashtra',
  setStateCode,
}: LocationSelectorProps) {
  const [states, setStates] = useState<string[]>(DEFAULT_INDIAN_STATES);
  const [selectedState, setSelectedState] = useState<string>(canonicalState(stateCode));
  const [districts, setDistricts] = useState<District[]>([]);
  const [talukas, setTalukas] = useState<Taluka[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingTalukas, setLoadingTalukas] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const t = useLanguageStore((s) => s.t);

  // Sync selectedState if parent stateCode changes
  useEffect(() => {
    const canon = canonicalState(stateCode);
    if (canon && canon !== selectedState) {
      setSelectedState(canon);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateCode]);

  // Load States from Live Database API on mount
  useEffect(() => {
    async function loadStates() {
      setLoadingStates(true);
      try {
        const apiStates = await getStates();
        if (apiStates && apiStates.length > 0) {
          setStates(apiStates);
          const currentCanon = canonicalState(selectedState);
          if (!apiStates.includes(currentCanon)) {
            const initial = apiStates.includes(canonicalState(stateCode)) ? canonicalState(stateCode) : apiStates[0];
            setSelectedState(initial);
            if (setStateCode) setStateCode(initial, initial);
          }
        }
      } catch (err) {
        console.warn('Using default states list:', err);
      } finally {
        setLoadingStates(false);
      }
    }
    loadStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load Districts strictly for the selectedState
  useEffect(() => {
    if (!selectedState) {
      setDistricts([]);
      return;
    }
    async function loadDistricts() {
      setLoadingDistricts(true);
      setLoadError(null);
      try {
        const apiDistricts = await getDistricts(selectedState);
        setDistricts(apiDistricts || []);
      } catch (err) {
        console.warn('Failed to load districts for state:', selectedState, err);
        setDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    }
    loadDistricts();
  }, [selectedState]);

  // Load Talukas when districtId changes
  useEffect(() => {
    if (!districtId) {
      setTalukas([]);
      return;
    }
    async function loadTalukas() {
      setLoadingTalukas(true);
      try {
        const apiTalukas = await getTalukas(districtId);
        setTalukas(apiTalukas || []);
      } catch {
        setTalukas([]);
      } finally {
        setLoadingTalukas(false);
      }
    }
    loadTalukas();
  }, [districtId]);

  // Load Villages when talukaId changes
  useEffect(() => {
    if (!talukaId) {
      setVillages([]);
      return;
    }
    async function loadVillages() {
      setLoadingVillages(true);
      try {
        const apiVillages = await getVillages(talukaId);
        setVillages(apiVillages || []);
      } catch {
        setVillages([]);
      } finally {
        setLoadingVillages(false);
      }
    }
    loadVillages();
  }, [talukaId]);

  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    if (setStateCode) {
      setStateCode(newState, newState);
    }
    setDistrictId('', '');
    setTalukaId('', '');
    setVillageId('', '');
  };

  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
        <MapPin size={20} aria-hidden="true" />
      </div>

      <div className="w-full">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-foreground text-sm sm:text-base">
            {t('onboard.locTitle') || 'Location & Geographic Feasibility'}
          </h4>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
            {selectedState}
          </span>
        </div>

        <p className="mt-0.5 text-xs text-foreground-muted">
          {t('onboard.locDesc') || 'Select state, district, taluka, and village from official government datasets.'}
        </p>
        {loadError && <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">{loadError}</p>}

        <div className="mt-4 space-y-3">
          {/* Dynamic State Selector */}
          <div>
            <label className="block text-xs font-semibold text-foreground-muted mb-1 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-primary" /> State / Union Territory (Live Government Registry)
            </label>
            <div className="relative">
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                disabled={loadingStates}
                className="w-full rounded-2xl border border-slate-200 dark:border-[#2B313C] bg-slate-50/50 dark:bg-[#1C2128] px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white dark:focus:bg-[#222731] focus:ring-2 focus:ring-primary/20 text-foreground font-medium disabled:opacity-60"
              >
                {states.map((st) => (
                  <option key={st} value={st} className="bg-white dark:bg-[#1C2128] text-foreground">
                    {st}
                  </option>
                ))}
              </select>
              {loadingStates && (
                <Loader2 className="absolute right-3.5 top-3.5 h-4 w-4 animate-spin text-primary" />
              )}
            </div>
          </div>

          {/* District Selector */}
          <div className="relative">
            <label className="block text-xs font-semibold text-foreground-muted mb-1">District (LGD Registry)</label>
            <select
              value={districtId}
              onChange={(e) => {
                const id = e.target.value;
                const found = districts.find((d) => d.id === id);
                setDistrictId(id, found?.name || '');
                setTalukaId('', '');
                setVillageId('', '');
              }}
              disabled={loadingDistricts}
              className="w-full rounded-2xl border border-slate-200 dark:border-[#2B313C] bg-slate-50/50 dark:bg-[#1C2128] px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white dark:focus:bg-[#222731] focus:ring-2 focus:ring-primary/20 disabled:bg-slate-100 dark:disabled:bg-[#161B22] text-foreground font-medium"
            >
              <option value="">
                {loadingDistricts ? t('onboard.loadingDistricts') : (t('onboard.selectDistrict') || `Select District in ${selectedState}`)}
              </option>
              {districts.map((item) => (
                <option key={item.id} value={item.id} className="bg-white dark:bg-[#1C2128] text-foreground">
                  {item.name}
                </option>
              ))}
            </select>
            {loadingDistricts && (
              <Loader2 className="absolute right-3.5 top-9 h-4 w-4 animate-spin text-primary" />
            )}
          </div>

          {/* Taluka Selector */}
          <div className="relative">
            <label className="block text-xs font-semibold text-foreground-muted mb-1">Taluka / Sub-District</label>
            <select
              value={talukaId}
              onChange={(e) => {
                const id = e.target.value;
                const found = talukas.find((t) => t.id === id);
                setTalukaId(id, found?.name || '');
                setVillageId('', '');
              }}
              disabled={!districtId || loadingTalukas}
              className="w-full rounded-2xl border border-slate-200 dark:border-[#2B313C] bg-slate-50/50 dark:bg-[#1C2128] px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white dark:focus:bg-[#222731] focus:ring-2 focus:ring-primary/20 disabled:bg-slate-100 dark:disabled:bg-[#161B22] text-foreground font-medium"
            >
              <option value="">
                {loadingTalukas ? t('onboard.loadingTalukas') : (t('onboard.selectTaluka') || 'Select Taluka / Block')}
              </option>
              {talukas.map((item) => (
                <option key={item.id} value={item.id} className="bg-white dark:bg-[#1C2128] text-foreground">
                  {item.name}
                </option>
              ))}
            </select>
            {loadingTalukas && (
              <Loader2 className="absolute right-3.5 top-9 h-4 w-4 animate-spin text-primary" />
            )}
          </div>

          {/* Village Selector */}
          <div className="relative">
            <label className="block text-xs font-semibold text-foreground-muted mb-1">Village / Gram Panchayat</label>
            <select
              value={villageId}
              onChange={(e) => {
                const id = e.target.value;
                const found = villages.find((v) => v.id === id);
                setVillageId(id, found?.name || '');
              }}
              disabled={!talukaId || loadingVillages}
              className="w-full rounded-2xl border border-slate-200 dark:border-[#2B313C] bg-slate-50/50 dark:bg-[#1C2128] px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white dark:focus:bg-[#222731] focus:ring-2 focus:ring-primary/20 disabled:bg-slate-100 dark:disabled:bg-[#161B22] text-foreground font-medium"
            >
              <option value="">
                {loadingVillages ? t('onboard.loadingVillages') : (t('onboard.selectVillage') || 'Select Village / Town')}
              </option>
              {villages.map((item) => (
                <option key={item.id} value={item.id} className="bg-white dark:bg-[#1C2128] text-foreground">
                  {item.name}
                </option>
              ))}
            </select>
            {loadingVillages && (
              <Loader2 className="absolute right-3.5 top-9 h-4 w-4 animate-spin text-primary" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}