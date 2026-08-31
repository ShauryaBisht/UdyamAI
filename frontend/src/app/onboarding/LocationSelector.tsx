'use client';

import { MapPin } from 'lucide-react';
import { mockLocations } from '@/mocks/mockLocations';

interface LocationSelectorProps {
  districtId: string;
  talukaId: string;
  villageId: string;
  setDistrictId: (value: string) => void;
  setTalukaId: (value: string) => void;
  setVillageId: (value: string) => void;
}

export default function LocationSelector({
  districtId,
  talukaId,
  villageId,
  setDistrictId,
  setTalukaId,
  setVillageId,
}: LocationSelectorProps) {
  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
        <MapPin size={21} aria-hidden="true" />
      </div>

      <div className="w-full">
        <h4 className="font-semibold">
          1. Tell us your location
        </h4>

        <p className="mt-1 text-sm text-slate-500">
          Select your district, taluka/block, and village.
        </p>

        <div className="mt-4 space-y-3">
          <select
            value={districtId}
            onChange={(e) => {
              setDistrictId(e.target.value);
              setTalukaId('');
              setVillageId('');
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Select district</option>

            {mockLocations.districts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={talukaId}
            onChange={(e) => {
              setTalukaId(e.target.value);
              setVillageId('');
            }}
            disabled={!districtId}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
          >
            <option value="">Select taluka / block</option>

            {mockLocations.talukas
              .filter((item) => item.district_id === districtId)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>

          <select
            value={villageId}
            onChange={(e) => setVillageId(e.target.value)}
            disabled={!talukaId}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
          >
            <option value="">Select village</option>

            {mockLocations.villages
              .filter((item) => item.taluka_id === talukaId)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
}