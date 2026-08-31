'use client';

import { ArrowRight, MapPin, Store, Wallet } from 'lucide-react';

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">UdyamAI</h1>
            <p className="text-sm text-slate-500">
              AI-Powered Business Feasibility & Scheme Advisor
            </p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex min-h-[70vh] max-w-6xl items-center px-6 py-16">
        <div className="grid w-full gap-12 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
              Smart business guidance
            </span>

            <h2 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Make better business decisions with UdyamAI.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Get a feasibility assessment and discover relevant government
              schemes based on your location, business choice, and available
              capital.
            </p>

            <button
              type="button"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              Start Analysis
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>

          {/* How it works */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold">How it works</h3>

            <div className="mt-6 space-y-5">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <MapPin size={21} aria-hidden="true" />
                </div>

                <div>
                  <h4 className="font-semibold">1. Tell us your location</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Select your district, taluka/block, and village.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Store size={21} aria-hidden="true" />
                </div>

                <div>
                  <h4 className="font-semibold">2. Choose your business</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Select the business category you want to analyze.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Wallet size={21} aria-hidden="true" />
                </div>

                <div>
                  <h4 className="font-semibold">3. Enter your capital</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Provide the financial information needed for the analysis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Information required */}
      <section className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h3 className="text-2xl font-bold">What you’ll need</h3>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border p-5">
              <p className="font-semibold">Location</p>
              <p className="mt-2 text-sm text-slate-500">
                District, taluka/block, and village
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <p className="font-semibold">Business choice</p>
              <p className="mt-2 text-sm text-slate-500">
                The business category you want to explore
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <p className="font-semibold">Capital</p>
              <p className="mt-2 text-sm text-slate-500">
                Your available capital and required inputs
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}