/**
 * UdyamAI Chart Theme & Style Guide Constants — Modern Financial SaaS Edition
 *
 * Rules:
 * 1. Clean 2D with soft rounded bars, smooth area fills, and subtle curves.
 * 2. Minimal gridlines — subtle horizontal lines only; omit vertical gridlines.
 * 3. Financial brand palette:
 *    - Primary / Active: #159A68 (Refined Emerald Green)
 *    - Secondary: #B7DEC9 (Soft Mint)
 *    - Tertiary: #DDF3E9 (Sage Tint)
 *    - Risk / Negative: #EF4444 (Vibrant Red)
 * 4. High contrast tabular labels with generous whitespace.
 */

export const CHART_COLORS = {
  primary: '#159A68',
  primaryDark: '#0F7D57',
  secondary: '#B7DEC9',
  accent: '#DDF3E9',
  danger: '#EF4444',
  success: '#159A68',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#111111',
  textMuted: '#6B7280',
  gridline: '#EFEFEF',
  border: '#E7E7E7',
} as const;

export const CHART_PALETTES = {
  standard: ['#159A68', '#B7DEC9', '#6366F1'],
  cashflow: {
    income: '#159A68',
    expense: '#EF4444',
    net: '#B7DEC9',
  },
  feasibility: {
    score: '#159A68',
    benchmark: '#B7DEC9',
    breakEven: '#6366F1',
  },
};

export const DEFAULT_CHART_CONFIG = {
  margin: { top: 16, right: 16, left: -16, bottom: 0 },
  strokeWidth: 2.5,
  barRadius: [8, 8, 8, 8] as [number, number, number, number],
  gridStrokeDasharray: '3 3',
  animationDuration: 400,
};
