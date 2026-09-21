'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, MapPin, Compass, Layers } from 'lucide-react';
import {
  ConsolidatedAnalysisData,
  getNearbyBusinesses,
  getNearbyFacilities,
  getNearbyMarkets,
  getNearbyVillages,
  NearbyBusiness,
  NearbyFacility,
  NearbyMarket,
  NearbyVillage,
} from '@/lib/api';
import type { MapLayers } from './LocationMap';

const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[440px] bg-neutral-50 dark:bg-[#161B22] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

interface MapContainerProps {
  title?: string;
  data: ConsolidatedAnalysisData;
}

const DEFAULT_LAYERS: MapLayers = {
  markets: true,
  businesses: true,
  facilities: true,
  villages: false,
  radius5: true,
  radius10: true,
};

export default function MapContainer({
  title = 'Geospatial Location Map',
  data,
}: MapContainerProps) {
  const [markets, setMarkets] = useState<NearbyMarket[]>([]);
  const [businesses, setBusinesses] = useState<NearbyBusiness[]>([]);
  const [facilities, setFacilities] = useState<NearbyFacility[]>([]);
  const [villages, setVillages] = useState<NearbyVillage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layers, setLayers] = useState<MapLayers>(DEFAULT_LAYERS);

  const lat = data.location?.latitude;
  const lng = data.location?.longitude;
  const villageName =
    data.location?.village_name || data.location?.name || 'Selected Village';
  const categoryId = data.business?.category_id;
  const directCompetitors = categoryId
    ? businesses.filter((b) => b.business_category_id === categoryId)
    : businesses;

  useEffect(() => {
    if (lat == null || lng == null) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadMapData() {
      try {
        setLoading(true);
        setError(null);
        const [marketsRes, businessesRes, facilitiesRes, villagesRes] = await Promise.all([
          getNearbyMarkets(lat!, lng!, 25),
          getNearbyBusinesses(lat!, lng!, 25),
          getNearbyFacilities(lat!, lng!, 10),
          getNearbyVillages(lat!, lng!, 10),
        ]);
        if (!cancelled) {
          setMarkets(marketsRes);
          setBusinesses(businessesRes);
          setFacilities(facilitiesRes);
          setVillages(villagesRes);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load map data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMapData();
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  function toggleLayer(key: keyof MapLayers) {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const locLabel = [
    villageName,
    data.location?.taluka_name,
    data.location?.district_name,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="bg-white dark:bg-[#161B22] rounded-3xl border border-border overflow-hidden shadow-subtle">
      <div className="px-6 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#161B22]">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
          </div>
          {locLabel && (
            <p className="text-xs text-foreground-muted flex items-center gap-1.5 mt-1 font-medium">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {locLabel}
            </p>
          )}
        </div>
        {!loading && lat != null && lng != null && (
          <div className="flex flex-wrap gap-3 text-xs font-semibold text-foreground-muted">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              {markets.length} APMC Mandis
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
              {directCompetitors.length} Direct Competitors
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary/20 text-primary border border-primary-100 dark:border-primary/30">
              <span className="inline-block w-2 h-2 rounded-full bg-primary" />
              {facilities.length} Infrastructure Units
            </span>
          </div>
        )}
      </div>

      {lat == null || lng == null ? (
        <div className="h-[440px] bg-neutral-50 dark:bg-[#161B22] flex flex-col items-center justify-center gap-2 text-foreground-muted px-6 text-center">
          <MapPin className="h-10 w-10 text-primary/40" />
          <p className="text-base font-bold text-foreground">No coordinates available for this location</p>
          <p className="text-xs text-foreground-muted">
            Re-run analysis with a village that has spatial coordinates.
          </p>
        </div>
      ) : loading ? (
        <div className="h-[440px] bg-neutral-50 dark:bg-[#161B22] flex flex-col items-center justify-center gap-3 text-foreground-muted">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-semibold">Loading PostGIS spatial data...</p>
        </div>
      ) : error ? (
        <div className="h-[440px] bg-rose-50/50 dark:bg-rose-950/20 flex flex-col items-center justify-center gap-2 text-rose-700 dark:text-rose-400 px-6 text-center">
          <p className="text-base font-bold">Could not load spatial data</p>
          <p className="text-xs">{error}</p>
        </div>
      ) : (
        <>
          <div className="px-6 py-3 border-b border-border bg-neutral-50/70 dark:bg-[#1C2128]/70 flex flex-wrap gap-x-5 gap-y-2">
            {(
              [
                ['markets', 'APMC Mandis', 'bg-emerald-500'],
                ['businesses', 'Competitors', 'bg-rose-500'],
                ['facilities', 'Infrastructure', 'bg-primary'],
                ['villages', 'Nearby Villages', 'bg-neutral-400'],
                ['radius5', '5 km radius', 'border-2 border-primary bg-transparent'],
                ['radius10', '10 km radius', 'border-2 border-dashed border-indigo-400 bg-transparent'],
              ] as const
            ).map(([key, label, colorClass]) => (
              <label key={key} className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={layers[key]}
                  onChange={() => toggleLayer(key)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${colorClass}`} />
                {label}
              </label>
            ))}
          </div>
          <div className="h-[440px] relative">
            {businesses.length === 0 && (
              <div className="absolute top-4 left-4 right-4 z-[500] rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/95 dark:bg-amber-950/95 px-4 py-2.5 text-xs font-medium text-amber-900 dark:text-amber-200 shadow-sm backdrop-blur">
                No MSME competitor records found within 25 km radius.
              </div>
            )}
            <LocationMap
              center={[lat, lng]}
              villageName={villageName}
              markets={markets}
              businesses={businesses}
              directCompetitorCategoryId={categoryId}
              facilities={facilities}
              villages={villages}
              layers={layers}
            />
          </div>
          <div className="px-6 py-3 border-t border-border bg-neutral-50 dark:bg-[#1C2128] text-xs text-foreground-muted">
            Data sourced from UdyamAI PostGIS — APMC mandis &amp; MSME clusters (25 km), infrastructure (10 km).
          </div>
        </>
      )}
    </div>
  );
}
