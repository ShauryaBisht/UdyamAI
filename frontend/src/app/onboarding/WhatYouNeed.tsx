export default function WhatYouNeed() {
  return (
    <section className="border-t bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h3 className="text-2xl font-bold">
          What you’ll need
        </h3>

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
  );
}