'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface LogoProps {
  /**
   * 'icon': Only the emblem/mark without text (for compact nav, mobile, icons, cards)
   * 'full': Complete SVG with original vectorized text
   * 'combined': Clean SVG emblem icon + modern typography (recommended for brand headers)
   */
  variant?: 'icon' | 'full' | 'combined';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /**
   * Set to true when placed on dark backgrounds (like chatbot header, dark cards, CTA banners)
   * Reverses colors so the emblem and text pop with brilliant contrast.
   */
  inverted?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  href?: string;
  showText?: boolean;
}

const SIZE_MAP = {
  xs: { icon: 26, text: 'text-sm' },
  sm: { icon: 34, text: 'text-lg' },
  md: { icon: 42, text: 'text-2xl' },
  lg: { icon: 52, text: 'text-3xl' },
  xl: { icon: 68, text: 'text-4xl' },
};

export default function Logo({
  variant = 'combined',
  size = 'md',
  inverted = false,
  className = '',
  iconClassName = '',
  textClassName = '',
  href,
  showText,
}: LogoProps) {
  const sizeConfig = typeof size === 'number'
    ? { icon: size, text: 'text-xl' }
    : SIZE_MAP[size] || SIZE_MAP.md;

  const shouldShowText = showText !== undefined ? showText : variant !== 'icon';

  const content = (
    <div className={`inline-flex items-center gap-2.5 font-black tracking-tight select-none ${className}`}>
      {variant === 'full' ? (
        inverted ? (
          <Image
            src="/logo-white.svg"
            alt="UdyamAI Logo"
            width={sizeConfig.icon * 2.2}
            height={sizeConfig.icon}
            className={`h-auto object-contain ${iconClassName}`}
            priority
          />
        ) : (
          <>
            <Image
              src="/logo.svg"
              alt="UdyamAI Logo"
              width={sizeConfig.icon * 2.2}
              height={sizeConfig.icon}
              className={`h-auto object-contain dark:hidden ${iconClassName}`}
              priority
            />
            <Image
              src="/logo-white.svg"
              alt="UdyamAI Logo"
              width={sizeConfig.icon * 2.2}
              height={sizeConfig.icon}
              className={`h-auto object-contain hidden dark:block ${iconClassName}`}
              priority
            />
          </>
        )
      ) : (
        <div
          className={`relative flex items-center justify-center shrink-0 transition-transform ${iconClassName}`}
          style={{ width: sizeConfig.icon, height: sizeConfig.icon }}
        >
          {inverted ? (
            <Image
              src="/logo-icon-white.svg"
              alt="UdyamAI Emblem"
              width={sizeConfig.icon}
              height={sizeConfig.icon}
              className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.25)]"
              priority
            />
          ) : (
            <>
              <Image
                src="/logo-icon.svg"
                alt="UdyamAI Emblem"
                width={sizeConfig.icon}
                height={sizeConfig.icon}
                className="w-full h-full object-contain filter drop-shadow-sm dark:hidden"
                priority
              />
              <Image
                src="/logo-icon-white.svg"
                alt="UdyamAI Emblem"
                width={sizeConfig.icon}
                height={sizeConfig.icon}
                className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.25)] hidden dark:block"
                priority
              />
            </>
          )}
        </div>
      )}

      {shouldShowText && variant !== 'full' && (
        <span
          className={`font-black ${
            inverted
              ? 'text-white'
              : 'text-foreground dark:text-white'
          } ${sizeConfig.text} ${textClassName}`}
        >
          Udyam
          <span
            className={
              inverted
                ? 'text-accent font-bold'
                : 'text-primary dark:text-[#34D399] font-bold'
            }
          >
            AI
          </span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center transition-opacity hover:opacity-95 focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
