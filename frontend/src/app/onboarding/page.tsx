"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import LocationSelector from "./LocationSelector";
import BusinessSelector from "./BusinessSelector";
import FinancialForm from "./FinancialForm";
import ReviewScreen from "./ReviewScreen";
import WhatYouNeed from "./WhatYouNeed";

import { mockLocations } from "@/mocks/mockLocations";
import { mockBusinessCategories } from "@/mocks/mockBusinessCategories";
import Header from "@/components/ui/Header";

export default function OnboardingPage() {
  const router = useRouter();

  // Location
  const [districtId, setDistrictId] = useState("");
  const [talukaId, setTalukaId] = useState("");
  const [villageId, setVillageId] = useState("");

  // Business
  const [businessCategoryId, setBusinessCategoryId] = useState("");

  // Financial inputs
  const [capital, setCapital] = useState("");
  const [desiredProjectCost, setDesiredProjectCost] = useState("");

  // Language
  const [language, setLanguage] = useState("en");

  // UI state
  const [showReview, setShowReview] = useState(false);
  const [error, setError] = useState("");

  // Find selected names for ReviewScreen
  const district =
    mockLocations.districts.find(
      (item) => item.id === districtId
    )?.name || "";

  const taluka =
    mockLocations.talukas.find(
      (item) => item.id === talukaId
    )?.name || "";

  const village =
    mockLocations.villages.find(
      (item) => item.id === villageId
    )?.name || "";

  const business =
    mockBusinessCategories.find(
      (item) => item.id === businessCategoryId
    )?.name || "";

  // Review button
  const handleReview = () => {
    setError("");

    if (
      !districtId ||
      !talukaId ||
      !villageId ||
      !businessCategoryId ||
      !capital ||
      Number(capital) < 0
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setShowReview(true);
  };

  // Edit button
  const handleEdit = () => {
    setShowReview(false);
    setError("");
  };

  // Start Analysis
  const handleStartAnalysis = () => {
    console.log("Analysis inputs:", {
      villageId,
      businessCategoryId,
      capital,
      desiredProjectCost,
      language,
    });

    router.push('/dashboard');
  };

  // -----------------------------
  // Review Screen
  // -----------------------------
  if (showReview) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Header />
        <ReviewScreen
          district={district}
          taluka={taluka}
          village={village}
          business={business}
          capital={capital}
          desiredProjectCost={desiredProjectCost}
          language={language}
          onEdit={handleEdit}
          onStartAnalysis={handleStartAnalysis}
        />
      </main>
    );
  }

  // -----------------------------
  // Main Onboarding
  // -----------------------------
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* Header */}
      <Header />

      {/* Main content */}
      <section className="mx-auto max-w-6xl px-6 py-12">

        <div className="grid gap-10 lg:grid-cols-2">

          {/* Left side */}
          <div>
            <p className="font-medium text-blue-600">
              Smart business guidance
            </p>

            <h1 className="mt-3 text-4xl font-bold leading-tight">
              Make better business decisions with UdyamAI.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Get a feasibility assessment and discover relevant
              opportunities based on your location, business and capital.
            </p>

            <div className="mt-8">
              <WhatYouNeed />
            </div>
          </div>

          {/* Right side */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <h2 className="text-xl font-semibold">
              Start your analysis
            </h2>

            <div className="mt-6 space-y-8">

              {/* Location */}
              <LocationSelector
                districtId={districtId}
                talukaId={talukaId}
                villageId={villageId}
                setDistrictId={setDistrictId}
                setTalukaId={setTalukaId}
                setVillageId={setVillageId}
              />

              {/* Business */}
              <BusinessSelector
                businessCategoryId={businessCategoryId}
                setBusinessCategoryId={setBusinessCategoryId}
              />

              {/* Financial */}
              <FinancialForm
                capital={capital}
                desiredProjectCost={desiredProjectCost}
                language={language}
                setCapital={setCapital}
                setDesiredProjectCost={setDesiredProjectCost}
                setLanguage={setLanguage}
              />

            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Review */}
            <button
              type="button"
              onClick={handleReview}
              className="mt-8 w-full rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              Review Details →
            </button>

          </div>
        </div>

      </section>
    </main>
  );
}