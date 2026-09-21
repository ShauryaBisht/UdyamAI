'use client';

import { useEffect, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { getDistricts, getTalukas, getVillages, District, Taluka, Village } from '@/lib/api';
import { useLanguageStore } from '@/stores/languageStore';

interface LocationSelectorProps {
  districtId: string;
  talukaId: string;
  villageId: string;
  setDistrictId: (id: string, name?: string) => void;
  setTalukaId: (id: string, name?: string) => void;
  setVillageId: (id: string, name?: string) => void;
}

export default function LocationSelector({
  districtId,
  talukaId,
  villageId,
  setDistrictId,
  setTalukaId,
  setVillageId,
}: LocationSelectorProps) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [talukas, setTalukas] = useState<Taluka[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingTalukas, setLoadingTalukas] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const t = useLanguageStore((s) => s.t);

  // Load Districts on mount
  useEffect(() => {
    async function loadDistricts() {
      setLoadingDistricts(true);
      setLoadError(null);
      try {
        const apiDistricts = await getDistricts();
        setDistricts(apiDistricts);
        if (apiDistricts.length === 0) {
          setLoadError(t('onboard.noDistricts'));
        }
      } catch {
        setLoadError(t('onboard.failDistricts'));
      } finally {
        setLoadingDistricts(false);
      }
    }
    loadDistricts();
  }, [t]);

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
        setTalukas(apiTalukas);
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
        setVillages(apiVillages);
      } catch {
        setVillages([]);
      } finally {
        setLoadingVillages(false);
      }
    }
    loadVillages();
  }, [talukaId]);

  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
        <MapPin size={20} aria-hidden="true" />
      </div>

      <div className="w-full">
        <h4 className="font-bold text-foreground text-sm sm:text-base">
          {t('onboard.locTitle')}
        </h4>

        <p className="mt-0.5 text-xs text-foreground-muted">
          {t('onboard.locDesc')}
        </p>
        {loadError && <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">{loadError}</p>}

        <div className="mt-4 space-y-3">
          {/* District Selector */}
          <div className="relative">
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
                {loadingDistricts ? t('onboard.loadingDistricts') : t('onboard.selectDistrict')}
              </option>
              {districts.map((item) => (
                <option key={item.id} value={item.id} className="bg-white dark:bg-[#1C2128] text-foreground">
                  {item.name}
                </option>
              ))}
            </select>
            {loadingDistricts && (
              <Loader2 className="absolute right-3.5 top-3.5 h-4 w-4 animate-spin text-primary" />
            )}
          </div>

          {/* Taluka Selector */}
          <div className="relative">
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
                {loadingTalukas ? t('onboard.loadingTalukas') : t('onboard.selectTaluka')}
              </option>
              {talukas.map((item) => (
                <option key={item.id} value={item.id} className="bg-white dark:bg-[#1C2128] text-foreground">
                  {item.name}
                </option>
              ))}
            </select>
            {loadingTalukas && (
              <Loader2 className="absolute right-3.5 top-3.5 h-4 w-4 animate-spin text-primary" />
            )}
          </div>

          {/* Village Selector */}
          <div className="relative">
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
                {loadingVillages ? t('onboard.loadingVillages') : t('onboard.selectVillage')}
              </option>
              {villages.map((item) => (
                <option key={item.id} value={item.id} className="bg-white dark:bg-[#1C2128] text-foreground">
                  {item.name}
                </option>
              ))}
            </select>
            {loadingVillages && (
              <Loader2 className="absolute right-3.5 top-3.5 h-4 w-4 animate-spin text-primary" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}