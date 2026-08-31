'use client';

import { useState } from 'react';
import { ArrowRight, MapPin, Store, Wallet } from 'lucide-react';

import { mockLocations } from '@/mocks/mockLocations';
import { mockBusinessCategories } from '@/mocks/mockBusinessCategories';
import { startAnalysis } from '@/lib/api';

export default function OnboardingPage() {
  const [districtId, setDistrictId] = useState('');
  const [talukaId, setTalukaId] = useState('');
  const [villageId, setVillageId] = useState('');

  const [businessCategoryId, setBusinessCategoryId] = useState('');

  const [capital, setCapital] = useState('');
  const [desiredProjectCost, setDesiredProjectCost] = useState('');
  const [language, setLanguage] = useState('en');

  const [showReview, setShowReview] = useState(false);

  const handleStartAnalysis = async () => {
  try {
    const result = await startAnalysis({
      user_id: null,
      location_id: villageId,
      village_id: villageId,
      business_category_id: businessCategoryId,
      available_capital: Number(capital),
      desired_project_cost: Number(desiredProjectCost),
      language: language as 'en' | 'hi' | 'mr',
    });

    console.log('Analysis started:', result);

    // We'll use analysis_id for the results screen next.
  } catch (error) {
    console.error('Analysis failed:', error);
    alert('Unable to start analysis. Please try again.');
  }
};

  // Find selected location names
  const selectedDistrict = mockLocations.districts.find(
    (item) => item.id === districtId
  );

  const selectedTaluka = mockLocations.talukas.find(
    (item) => item.id === talukaId
  );

  const selectedVillage = mockLocations.villages.find(
    (item) => item.id === villageId
  );

  // Find selected business
  const selectedBusiness = mockBusinessCategories.find(
    (item) => item.id === businessCategoryId
  );

  const handleReview = () => {
    if (
      !districtId ||
      !talukaId ||
      !villageId ||
      !businessCategoryId ||
      !capital ||
      Number(capital) <= 0 ||
      !desiredProjectCost ||
      Number(desiredProjectCost) <= 0
    ) {
      alert('Please fill in all required fields before continuing.');
      return;
    }

    setShowReview(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              UdyamAI
            </h1>

            <p className="text-sm text-slate-500">
              AI-Powered Business Feasibility & Scheme Advisor
            </p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-16">

        <div className="grid w-full gap-12 md:grid-cols-2 md:items-center">

          {/* Left side */}
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
              onClick={handleReview}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              Review Details
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>

          {/* Right side */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <h3 className="text-xl font-semibold">
              How it works
            </h3>

            <div className="mt-6 space-y-6">

              {/* STEP 1 - LOCATION */}
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

                    {/* District */}
                    <select
                      value={districtId}
                      onChange={(e) => {
                        setDistrictId(e.target.value);
                        setTalukaId('');
                        setVillageId('');
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">
                        Select district
                      </option>

                      {mockLocations.districts.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>

                    {/* Taluka */}
                    <select
                      value={talukaId}
                      onChange={(e) => {
                        setTalukaId(e.target.value);
                        setVillageId('');
                      }}
                      disabled={!districtId}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                    >
                      <option value="">
                        Select taluka / block
                      </option>

                      {mockLocations.talukas
                        .filter(
                          (item) => item.district_id === districtId
                        )
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                    </select>

                    {/* Village */}
                    <select
                      value={villageId}
                      onChange={(e) => setVillageId(e.target.value)}
                      disabled={!talukaId}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                    >
                      <option value="">
                        Select village
                      </option>

                      {mockLocations.villages
                        .filter(
                          (item) => item.taluka_id === talukaId
                        )
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                    </select>

                  </div>
                </div>
              </div>

              {/* STEP 2 + STEP 3 */}
              <div className="grid gap-6 md:grid-cols-2">

                {/* STEP 2 */}
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
                      onChange={(e) =>
                        setBusinessCategoryId(e.target.value)
                      }
                      className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">
                        Select business
                      </option>

                      {mockBusinessCategories
                        .filter((item) => item.active)
                        .map((item) => (
                          <option
                            key={item.id}
                            value={item.id}
                          >
                            {item.name}
                          </option>
                        ))}
                    </select>

                  </div>
                </div>

                {/* STEP 3 */}
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

                    {/* Capital */}
                    <div className="relative mt-4">

                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                        ₹
                      </span>

                      <input
                        type="number"
                        min="1"
                        value={capital}
                        onChange={(e) =>
                          setCapital(e.target.value)
                        }
                        placeholder="Available capital"
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                    </div>

                    {/* Desired project cost */}
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

                    {/* Language */}
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
                        onChange={(e) =>
                          setLanguage(e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="en">
                          English
                        </option>

                        <option value="hi">
                          Hindi
                        </option>

                        <option value="mr">
                          Marathi
                        </option>
                      </select>

                    </div>

                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </section>



      {/* REVIEW SCREEN */}
      {showReview && (
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

              {/* Location */}
              <div className="mt-8 rounded-xl border p-5">

                <div className="flex gap-4">

                  <MapPin className="text-blue-600" />

                  <div>

                    <p className="font-semibold">
                      Location
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      {selectedDistrict?.name} → {selectedTaluka?.name} → {selectedVillage?.name}
                    </p>

                  </div>
                </div>
              </div>

              {/* Business */}
              <div className="mt-4 rounded-xl border p-5">

                <div className="flex gap-4">

                  <Store className="text-blue-600" />

                  <div>

                    <p className="font-semibold">
                      Business
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      {selectedBusiness?.name}
                    </p>

                  </div>
                </div>
              </div>

              {/* Financial details */}
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

              {/* Language */}
              <div className="mt-4 rounded-xl border p-5">

                <p className="font-semibold">
                  Language
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  {language === 'en'
                    ? 'English'
                    : language === 'hi'
                    ? 'Hindi'
                    : 'Marathi'}
                </p>

              </div>

              {/* Start Analysis */}
              {/* Review Actions */}
<div className="mt-8 flex flex-wrap gap-3">

  {/* Edit Details */}
  <button
    type="button"
    onClick={() => setShowReview(false)}
    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
  >
    Edit Details
  </button>

  {/* Start Analysis */}
  <button
    type="button"
    onClick={handleStartAnalysis}
    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700"
  >
    Start Analysis
    <ArrowRight size={18} />
  </button>

</div>

            </div>
          </div>
        </section>
      )}
      {/* What you'll need */}
      <section className="border-t bg-white">

        <div className="mx-auto max-w-6xl px-6 py-12">

          <h3 className="text-2xl font-bold">
            What you’ll need
          </h3>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">

            <div className="rounded-xl border p-5">
              <p className="font-semibold">
                Location
              </p>

              <p className="mt-2 text-sm text-slate-500">
                District, taluka/block, and village
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <p className="font-semibold">
                Business choice
              </p>

              <p className="mt-2 text-sm text-slate-500">
                The business category you want to explore
              </p>
            </div>

            <div className="rounded-xl border p-5">
              <p className="font-semibold">
                Capital
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Your available capital and required inputs
              </p>
            </div>

          </div>
        </div>
      </section>
      )

    </main>
  );
}