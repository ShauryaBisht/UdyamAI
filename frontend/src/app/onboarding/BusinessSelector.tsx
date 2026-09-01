'use client';

import { Store } from 'lucide-react';
import { mockBusinessCategories } from '@/mocks/mockBusinessCategories';

interface BusinessSelectorProps {
  businessCategoryId: string;
  setBusinessCategoryId: (value: string) => void;
}

export default function BusinessSelector({
  businessCategoryId,
  setBusinessCategoryId,
}: BusinessSelectorProps) {
  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
        <Store size={21} aria-hidden="true" />
      </div>

      <div className="w-full">
        <h4 className="font-semibold">
          2. Choose your business
        </h4>

        <p className="mt-1 text-sm text-slate-500">
          Select the business category you want to analyze.
        </p>

        <select
          value={businessCategoryId}
          onChange={(e) => setBusinessCategoryId(e.target.value)}
          className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Select business</option>

          {mockBusinessCategories
            .filter((item) => item.active)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}