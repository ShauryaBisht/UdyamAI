'use client';

import { ArrowRight, MapPin, Store, Wallet } from 'lucide-react';

interface ReviewScreenProps {
  district: string;
  taluka: string;
  village: string;
  business: string;
  capital: string;
  desiredProjectCost: string;
  language: string;
  onEdit: () => void;
  onStartAnalysis: () => void;
}

export default function ReviewScreen({
  district,
  taluka,
  village,
  business,
  capital,
  desiredProjectCost,
  language,
  onEdit,
  onStartAnalysis,
}: ReviewScreenProps) {
  const languageName =
    language === 'en'
      ? 'English'
      : language === 'hi'
        ? 'Hindi'
        : 'Marathi';

  return (
    <section className="border-t bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-blue-600">
            Final step
          </p>

          <h3 className="mt-2 text-3xl font-bold">
            Review your details
          </h3>

          <p className="mt-2 text-slate-500">
            Please check the information below before starting your analysis.
          </p>

          <div className="mt-8 rounded-xl border p-5">
            <div className="flex gap-4">
              <MapPin className="text-blue-600" />

              <div>
                <p className="font-semibold">Location</p>

                <p className="mt-2 text-sm text-slate-600">
                  {district} → {taluka} → {village}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border p-5">
            <div className="flex gap-4">
              <Store className="text-blue-600" />

              <div>
                <p className="font-semibold">Business</p>

                <p className="mt-2 text-sm text-slate-600">
                  {business}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border p-5">
              <p className="font-semibold">
                Available Capital
              </p>

              <p className="mt-2 text-sm text-slate-600">
                ₹{Number(capital).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <p className="font-semibold">
                Desired Project Cost
              </p>

              <p className="mt-2 text-sm text-slate-600">
                ₹{Number(desiredProjectCost).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border p-5">
            <p className="font-semibold">Language</p>

            <p className="mt-2 text-sm text-slate-600">
              {languageName}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Edit Details
            </button>

            <button
              type="button"
              onClick={onStartAnalysis}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700"
            >
              Start Analysis
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}