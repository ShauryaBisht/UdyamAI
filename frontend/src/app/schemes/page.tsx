import React from 'react';
import Header from '@/components/ui/Header';
import Link from 'next/link';

export default function SchemesPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Government Schemes Module</h1>
          <p className="text-slate-600 mb-6">
            Welcome to the UdyamAI Schemes module. Browse eligible government schemes and financial subsidies.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition"
            >
              View Schemes in Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
