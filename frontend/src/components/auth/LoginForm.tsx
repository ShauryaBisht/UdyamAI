'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setError('');

    // Temporary frontend-only login.
    // Backend authentication can be connected later.
    sessionStorage.setItem('udyam_user', phone);

    router.push('/onboarding');
  };

  return (
    <form
      onSubmit={handleLogin}
      className="rounded-2xl border bg-white p-8 shadow-sm"
    >
      <h2 className="text-2xl font-bold text-slate-900">
        Welcome back
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        Login to continue with your business analysis.
      </p>

      <div className="mt-6">
        <label
          htmlFor="phone"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Mobile Number
        </label>

        <div className="flex">
          <span className="flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
            +91
          </span>

          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            placeholder="Enter mobile number"
            className="w-full rounded-r-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
      >
        Continue
        <ArrowRight size={18} aria-hidden="true" />
      </button>

      <p className="mt-4 text-center text-xs text-slate-400">
        Authentication will be connected to the backend later.
      </p>
    </form>
  );
}