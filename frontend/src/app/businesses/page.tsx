import React from 'react';
import Header from '@/components/ui/Header';
import Link from 'next/link';

export default function BusinessesPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Businesses Module</h1>
          <p className="text-slate-600 mb-6">
            Welcome to the UdyamAI Businesses module. Explore supported categories and business profiles.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/onboarding"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition"
            >
              Select Business in Onboarding
            </Link>
            <Link
              href="/dashboard"
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
