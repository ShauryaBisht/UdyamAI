'use client';

import { Wallet } from 'lucide-react';

interface FinancialFormProps {
  capital: string;
  desiredProjectCost: string;
  language: string;
  setCapital: (value: string) => void;
  setDesiredProjectCost: (value: string) => void;
  setLanguage: (value: string) => void;
}

export default function FinancialForm({
  capital,
  desiredProjectCost,
  language,
  setCapital,
  setDesiredProjectCost,
  setLanguage,
}: FinancialFormProps) {
  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
        <Wallet size={21} aria-hidden="true" />
      </div>

      <div className="w-full">
        <h4 className="font-semibold">
          3. Enter your capital
        </h4>

        <p className="mt-1 text-sm text-slate-500">
          Enter the amount you are willing to invest in your business.
        </p>

        <div className="relative mt-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
            ₹
          </span>

          <input
            type="number"
            min="0"
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
            placeholder="Available capital"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="mt-4">
          <label
            htmlFor="desiredProjectCost"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Desired Project Cost
          </label>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
              ₹
            </span>

            <input
              id="desiredProjectCost"
              type="number"
              min="1"
              value={desiredProjectCost}
              onChange={(e) =>
                setDesiredProjectCost(e.target.value)
              }
              placeholder="Desired project cost"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="language"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Language
          </label>

          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="mr">Marathi</option>
          </select>
        </div>
      </div>
    </div>
  );
}