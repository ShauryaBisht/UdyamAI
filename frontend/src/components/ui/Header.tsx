'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/onboarding', label: 'Onboarding' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/analysis', label: 'Analysis' },
    { href: '/businesses', label: 'Businesses' },
    { href: '/chat', label: 'Chat' },
    { href: '/reports', label: 'Reports' },
    { href: '/schemes', label: 'Schemes' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <Sparkles className="h-4 w-4 text-indigo-600" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Udyam<span className="text-indigo-600">AI</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-xs lg:text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth / Action */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs lg:text-sm font-semibold text-white transition hover:bg-indigo-600"
          >
            Login
          </Link>
        </div>
      </div>

      {/* Mobile nav bar for smaller screens */}
      <div className="flex md:hidden overflow-x-auto border-t border-slate-100 px-4 py-2 gap-2 bg-slate-50/80">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
