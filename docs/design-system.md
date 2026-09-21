# UdyamAI Design System Specification

**Theme**: Modern Rural FinTech  
**Philosophy**: Earth + Trust  
**Version**: 1.0.0  
**Scope**: Frontend design tokens, component primitives, typography, iconography, chart guidelines, and navigation patterns.

---

## 1. Design Direction & Core Philosophy

UdyamAI delivers institutional-grade financial intelligence tailored for rural entrepreneurs, farmers, and self-help groups (SHGs). 

The visual design is grounded in three core tenets:
1. **Trust & Financial Clarity**: Serious, dependable financial presentation with high-contrast figures and uncluttered surfaces.
2. **Earthy Harmony**: A grounded palette (Deep Forest Green, Sage, Warm Amber, Warm Off-white) representing agricultural growth, stability, and prosperity rather than cold corporate slate/blue.
3. **Rural Accessibility & Generous Whitespace**: Large touch targets (minimum 44px), high legibility, clean visual hierarchy, and 16–20px rounded surfaces with soft shadows instead of harsh, intimidating borders.

---

## 2. Color Palette & Token Hierarchy

### 2.1 Core Palette (Earth + Trust)

| Token | Hex | Role & Usage |
|---|---|---|
| **Primary (Forest Green)** | `#176B4D` | Primary CTAs, key brand anchors, active navigation states, verified statuses |
| **Secondary (Sage)** | `#7BAE8A` | Supporting cards, secondary series in charts, category tags, balanced states |
| **Accent (Warm Amber)** | `#F2B84B` | Highlights, demo scenario banners, warnings, attention anchors |
| **Background (Warm Off-white)** | `#F7F6F1` | Main application background (prevents eye fatigue in sunny outdoor/mobile use) |
| **Surface (Clean Card)** | `#FFFFFF` | Card backgrounds, modals, input containers |
| **Foreground (Charcoal)** | `#17221D` | Primary text and headers (high readability without harsh 100% black) |
| **Foreground Muted** | `#4F5E57` | Subtitles, helper text, table column headers |
| **Danger / Alert (Muted Red)** | `#D95C5C` | Risk warnings, expenditure overruns, destructive action buttons |

### 2.2 Extended Color Scales in Tailwind

```typescript
// tailwind.config.ts
colors: {
  primary: {
    50: "#F2F8F5",
    100: "#E5F2EC",
    200: "#CBE5D9",
    300: "#A4D2BD",
    400: "#73B79A",
    DEFAULT: "#176B4D",
    600: "#135B41",
    700: "#104B35",
    800: "#0D3A2A",
    900: "#09281D",
  },
  secondary: {
    50: "#F5FAF6",
    100: "#E9F4EC",
    200: "#D3E9DA",
    300: "#B4D9BE",
    DEFAULT: "#7BAE8A",
    500: "#5F966F",
    600: "#4B7757",
  },
  accent: {
    50: "#FEFBF5",
    100: "#FEF7EB",
    DEFAULT: "#F2B84B",
    600: "#D99B28",
    700: "#B07917",
  },
  danger: {
    50: "#FCF5F5",
    100: "#FBEFEF",
    DEFAULT: "#D95C5C",
    600: "#BE4747",
    700: "#9A3434",
  }
}
```

---

## 3. Card System Spec

All dashboard content is organized in clean, modular cards with soft organic shadows and rounded corners:

- **Corner Radius**: 
  - `rounded-card`: `18px` (`1.125rem`) — Default for content cards, dashboards, charts.
  - `rounded-card-sm`: `14px` — Sub-items, nested cards, inner metric tiles.
  - `rounded-card-lg`: `22px` — Large modal dialogs, top-level hero banners.
- **Shadow Matrix**:
  - `shadow-card`: `0 4px 20px -2px rgba(23, 34, 29, 0.05), 0 2px 6px -1px rgba(23, 34, 29, 0.03)`
  - `shadow-card-hover`: `0 12px 28px -4px rgba(23, 34, 29, 0.08)`
  - `shadow-elevated`: `0 20px 35px -8px rgba(23, 34, 29, 0.10)`
- **Borders**: Flat, subtle borders (`border border-primary/10`) layered over soft shadows for tactile depth without clutter.
- **Whitespace**: Generous internal padding (`p-5` to `p-8`) to prevent cognitive overload.

```tsx
import Card, { CardHeader, CardContent } from '@/components/ui/Card';

<Card variant="default" padding="lg">
  <CardHeader title="Feasibility Score" subtitle="Based on local demand and soil suitability" />
  <CardContent>
    {/* Body */}
  </CardContent>
</Card>
```

---

## 4. Financial Figures & Typography Spec

Financial figures (feasibility scores, revenue projections, loan amounts, subsidy totals) must read as **the immediate visual anchor** on any screen:

- **Typography Class**: `font-financial` with `tabular-nums lining-nums`.
- **Weight**: Bold (`font-bold`) to Extra-Bold (`font-extrabold`).
- **Scale**:
  - `metric-sm`: `1.5rem` (24px), line-height `2rem`
  - `metric-md`: `2rem` (32px), line-height `2.5rem`
  - `metric-lg`: `2.5rem` (40px), line-height `3rem`
  - `metric-xl`: `3.25rem` (52px), line-height `3.75rem`
- **Prefix / Currency Handling**: Currency symbol (`₹`) is placed with slight opacity (`text-foreground-muted`) so the numeral itself stands out.

```tsx
import MetricDisplay from '@/components/ui/MetricDisplay';

<MetricDisplay
  label="Estimated Monthly Profit"
  prefix="₹"
  value="48,500"
  trend={{ value: "+14%", direction: "up", label: "vs local avg" }}
  size="lg"
/>
```

---

## 5. Status Indicator Color Mapping

Avoid default generic browser/Tailwind red & green. All status pills, alerts, and badges adhere to the strict semantic map:

| Status | Background | Text Color | Border | Use Case |
|---|---|---|---|---|
| **Verified / Good / Safe** | `#E8F3EE` | `#176B4D` (Forest) | `#B4D9C7` | High feasibility score (>75), eligible scheme, verified identity, low risk |
| **Warning / Caution / Review** | `#FEF7EB` | `#B07917` (Dark Amber) | `#FCE6BA` | Moderate risk, missing optional document, seasonal price fluctuation |
| **Risk / Critical / Alert** | `#FBEFEF` | `#B33D3D` (Muted Red) | `#F7C4C4` | High debt ratio, unviable unit economics, deficit warning |
| **Neutral / Info** | `#F0ECE1` | `#4F5E57` | `#DDD7C9` | General metadata, dates, stage labels |

```tsx
import StatusBadge from '@/components/ui/StatusBadge';

<StatusBadge status="verified" label="Eligible for Subsidy" />
<StatusBadge status="warning" label="High Water Dependency" />
<StatusBadge status="risk" label="Repayment Risk" />
```

---

## 6. "Demo Scenario" Visual Identity Spec

One-click sample scenario buttons and simulated demo modes must **never blend in** with actual user actions:

- **Appearance**: Warm Amber gradient background (`from-[#FFFDF7] to-[#FFF9E8]`), 2px dashed border (`border-dashed border-[#F2B84B]`), sparkle/flask icon.
- **Badge**: Distinctive `[DEMO SCENARIO]` / `[SIMULATED]` warm amber tag.
- **Purpose**: Instantly informs users they are testing pre-filled demonstration profiles rather than committing real financial data.

```tsx
import { DemoBadge, DemoScenarioButton } from '@/components/ui/DemoBadge';

<DemoScenarioButton
  scenarioTitle="Load Sample Dairy Farm Profile"
  scenarioDescription="Pre-fills 10 crossbred cows, 2-acre fodder land in Nashik"
  onClick={handleLoadDemo}
/>
```

---

## 7. Crop & Business Category Line-Iconography

To maintain financial credibility, crop and business categories use **clean, minimalist line-style vector icons** rather than colorful or cartoonish clip-art:

- **Stroke Width**: `1.75` for crisp rendering across all screen DPIs.
- **Icon Container**: 9-11px rounded container with subtle primary tint (`bg-primary/5 border border-primary/20`).

| Category | Line Glyph Concept | Component Name |
|---|---|---|
| **Paddy / Rice / Wheat** | Minimalist wheat grain stalk | `Wheat` / `Sprout` |
| **Cotton / Pulses / Mustard** | Organic leaf / botanical sprout | `Leaf` |
| **Dairy / Cattle** | Clean milk jar / vessel | `Milk` |
| **Poultry / Livestock** | Minimalist egg / feather | `Egg` |
| **Fisheries / Aquaculture** | Streamlined fish outline | `Fish` |
| **Kirana / Village Retail** | Traditional storefront outline | `Store` |
| **Handloom / Handicraft** | Precision shears / loom spool | `Scissors` |
| **Agro-processing / Mill** | Rural mill / factory structure | `Factory` |
| **Logistics / Transport** | Rural utility truck outline | `Truck` |
| **Solar / Bio-Energy** | Clean sunburst / panel | `Sun` |

```tsx
import CategoryIcon from '@/components/ui/CategoryIcon';

<CategoryIcon category="wheat" size="md" variant="outline" />
<CategoryIcon category="dairy" size="md" variant="pill" />
```

---

## 8. Chart & Data Visualization Style Guide

1. **2D Minimal Aesthetics**: No 3D bevels, heavy multi-color shadows, or cluttered background grids.
2. **Minimal Gridlines**: Horizontal dotted lines only (`strokeDasharray="3 3"` in `#E6E1D3`); suppress vertical gridlines.
3. **Maximum 2–3 Brand Colors per Chart**:
   - Primary Series: `#176B4D` (Deep Forest Green)
   - Secondary Series / Benchmark: `#7BAE8A` (Sage)
   - Accent / Target: `#F2B84B` (Warm Amber)
   - Negative / Expenses: `#D95C5C` (Muted Red)
4. **Tooltips**: Rounded `12px` card with white background, subtle border, and bold `font-financial` values.

```tsx
import ChartCard from '@/components/charts/ChartCard';
import { CHART_COLORS } from '@/components/charts/ChartTheme';

<ChartCard title="Monthly Cashflow Breakdown" subtitle="Income vs Operational Expenses">
  {/* Chart content rendering using CHART_COLORS */}
</ChartCard>
```

---

## 9. Mobile Bottom-Nav / Desktop-Sidebar Navigation Spec

### 9.1 Desktop Sidebar (>= 1024px)
- **Width**: `w-64` (256px), fixed left navigation.
- **Background**: `bg-background` with subtle right border (`border-r border-primary/15`).
- **Active State**: Forest Green background tint (`bg-primary/10 text-primary font-semibold`) with active icon accent.
- **Inactive State**: `text-foreground/70 hover:bg-primary/5 hover:text-primary`.

### 9.2 Mobile Bottom Navigation (< 1024px)
- **Position**: `fixed bottom-0 inset-x-0`, height `h-16`, safe-area bottom padding.
- **Background**: `bg-background/95 backdrop-blur border-t border-primary/15`.
- **Touch Target**: 5 core high-frequency routes (Dashboard, Feasibility, Expenses, Schemes, Profile) with 48px touch targets.
- **Active Visual Indicator**: Top active indicator bar or vibrant primary label text (`text-primary`).

---

## 10. Summary Checklist for Frontend Development

- [x] Use `bg-background` (`#F7F6F1`) as base page background.
- [x] Use `<Card>` or `rounded-card shadow-card bg-white` for content containers.
- [x] Apply `font-financial` and large bold metric sizing (`text-3xl font-extrabold`) on key figures.
- [x] Use `<StatusBadge>` with `verified`, `warning`, or `risk` for status indicators.
- [x] Use `<DemoBadge>` or `<DemoScenarioButton>` for test/simulation scenarios.
- [x] Use `<CategoryIcon>` for crop/business categories (no cartoon illustrations).
- [x] Keep all charts 2D with minimal gridlines using `CHART_COLORS`.