'use client';

import React from 'react';

interface MarketSectionProps {
  data?: any;
}

interface MarketStatProps {
  label: string;
  value: string;
  description?: string;
}

function MarketStat({ label, value, description }: MarketStatProps) {
  return (
    <div className="rounded-2xl border border-border bg-white dark:bg-[#161B22] p-5 shadow-subtle hover:border-primary/30 transition-all">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p className="text-2xl sm:text-3xl font-extrabold font-financial tracking-tight text-foreground mt-2">
        {value}
      </p>

      {description && (
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      )}
    </div>
  );
}

function getScoreBarColor(score: number) {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
}

function getScoreTextColor(score: number) {
  if (score >= 75) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

export default function MarketSection({ data }: MarketSectionProps) {
  const mkt = data?.market || {};
  const feas = data?.feasibility || {};
  const aiAdvice = data?.ai_advice || {};
  const marketAdviceList: string[] = aiAdvice.market_advice || [];

  // Use only real API data; no hardcoded fallback scores
  const rawMarketScore = feas.market_score ?? mkt.market_score;
  const marketScore = rawMarketScore != null ? Math.round(rawMarketScore) : null;

  // Derive demand level from demand_indicators if not directly available
  const demandIndicators = mkt.demand_indicators || {};
  const demandLevel = mkt.demand_level
    || demandIndicators.demand_level
    || demandIndicators.level
    || null;

  // Population & household data from Census-based analysis
  const populationEstimate = mkt.population_estimate ?? null;
  const householdEstimate = mkt.household_estimate ?? null;

  // Target customers from market reach estimate
  const targetCustomersRaw = mkt.target_customers ?? null;
  const targetCustomers = targetCustomersRaw != null
    ? `${Number(targetCustomersRaw).toLocaleString('en-IN')}+ people`
    : (populationEstimate != null ? `${Number(populationEstimate).toLocaleString('en-IN')}+ (Census Catchment)` : null);

  // Pricing indicators from AGMARKNET/commodity data
  const pricingIndicators = mkt.pricing_indicators || {};
  const hasPricingData = Object.keys(pricingIndicators).length > 0;

  // Demand indicators breakdown
  const hasDemandData = Object.keys(demandIndicators).length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Market statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MarketStat
          label="Market Sub-Score"
          value={marketScore != null ? `${marketScore} / 100` : '—'}
          description="Demographic & price score"
        />

        <MarketStat
          label="Local Demand Level"
          value={demandLevel || '—'}
          description="Assessed from commodity demand"
        />

        <MarketStat
          label="Catchment Population"
          value={populationEstimate != null ? `${Number(populationEstimate).toLocaleString('en-IN')}+` : '—'}
          description="Within survey radius"
        />

        <MarketStat
          label="Target Customers"
          value={targetCustomers || '—'}
          description="Estimated market reach"
        />
      </div>

      {/* Secondary market metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {householdEstimate != null && (
          <MarketStat
            label="Household Estimate"
            value={Number(householdEstimate).toLocaleString('en-IN')}
            description="Census-based household count"
          />
        )}
        {mkt.radius_km != null && (
          <MarketStat
            label="Analysis Radius"
            value={`${mkt.radius_km} km`}
            description="Survey coverage area"
          />
        )}
        {mkt.data_confidence && (
          <MarketStat
            label="Data Confidence"
            value={mkt.data_confidence}
            description="Market data reliability"
          />
        )}
      </div>

      {/* AI Market Guidance */}
      {marketAdviceList.length > 0 && (
        <div className="rounded-2xl border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              AI Market Guidance
            </p>
            {aiAdvice.confidence && (
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                aiAdvice.confidence === 'high' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : aiAdvice.confidence === 'medium' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                : 'bg-slate-100 dark:bg-[#1F242C] text-muted-foreground border-slate-200 dark:border-[#2B313C]'
              }`}>
                {aiAdvice.confidence.toUpperCase()} CONFIDENCE
              </span>
            )}
          </div>
          <ul className="space-y-2">
            {marketAdviceList.map((advice: string, i: number) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>{advice}</span>
              </li>
            ))}
          </ul>
          {aiAdvice.sources && aiAdvice.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-primary/10 dark:border-primary/20 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold">Sources:</span>
              {aiAdvice.sources.map((s: any, idx: number) => (
                <span key={idx} className="bg-white dark:bg-[#1F242C] dark:text-slate-200 px-2 py-0.5 rounded border border-primary/15 font-mono text-[11px]">
                  {s.claim || s.source_type || `Source #${idx + 1}`}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Catchment Demographics & Customer Funnel Visualization */}
      {(populationEstimate != null || householdEstimate != null || targetCustomersRaw != null) && (
        <div className="rounded-2xl border border-border bg-white dark:bg-[#161B22] p-6 shadow-subtle">
          <h3 className="text-lg font-bold text-foreground tracking-tight">
            Catchment Demographics & Customer Funnel
          </h3>
          <p className="text-xs text-muted-foreground mt-1 mb-5">
            Census-verified catchment reach vs. addressable household and customer demand
          </p>

          <div className="space-y-4">
            {populationEstimate != null && (
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-muted-foreground">Total Catchment Population</span>
                  <span className="font-bold text-foreground">{Number(populationEstimate).toLocaleString('en-IN')} persons</span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-[#1F242C] rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            )}

            {householdEstimate != null && (
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-muted-foreground">Estimated Households (Census Density)</span>
                  <span className="font-bold text-foreground">{Number(householdEstimate).toLocaleString('en-IN')} homes</span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-[#1F242C] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${populationEstimate ? Math.min(100, Math.round((Number(householdEstimate) / Number(populationEstimate)) * 100 * 3.5)) : 60}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {targetCustomersRaw != null && (
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-muted-foreground">Direct Addressable Target Customers</span>
                  <span className="font-bold text-foreground">{Number(targetCustomersRaw).toLocaleString('en-IN')} customers</span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-[#1F242C] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${populationEstimate ? Math.min(100, Math.max(8, Math.round((Number(targetCustomersRaw) / Number(populationEstimate)) * 100))) : 40}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Market opportunity index */}
      <div className="rounded-2xl border border-border bg-white dark:bg-[#161B22] p-6 shadow-subtle">
        <h3 className="text-lg font-bold text-foreground tracking-tight">
          Market Opportunity Assessment
        </h3>

        <p className="text-xs text-muted-foreground mt-1">
          Real-time market evaluation from AGMARKNET & Census demographic data
        </p>

        <div className="mt-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">
              Opportunity Index
            </span>

            <span className={`text-sm font-bold font-financial ${marketScore != null ? getScoreTextColor(marketScore) : 'text-slate-400 dark:text-slate-500'}`}>
              {marketScore != null ? `${marketScore} / 100` : '— / 100'}
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 dark:bg-[#1F242C] rounded-full overflow-hidden">
            {marketScore != null ? (
              <div
                className={`h-full ${getScoreBarColor(marketScore)} rounded-full transition-all duration-500`}
                style={{ width: `${marketScore}%` }}
              />
            ) : (
              <div
                className="h-full bg-slate-200 dark:bg-slate-700 rounded-full"
                style={{ width: '0%' }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Demand & Pricing Indicators (if data is available) */}
      {(hasDemandData || hasPricingData) && (
        <div className="rounded-2xl border border-border bg-white dark:bg-[#161B22] p-6 shadow-subtle">
          <h3 className="text-lg font-bold text-foreground mb-4 tracking-tight">
            Market Indicators Detail
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hasDemandData && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Demand Indicators
                </p>
                <div className="space-y-2">
                  {Object.entries(demandIndicators).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-sm py-1 border-b border-slate-100 dark:border-[#2B313C]">
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-foreground">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hasPricingData && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Pricing Indicators
                </p>
                <div className="space-y-2">
                  {Object.entries(pricingIndicators).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-sm py-1 border-b border-slate-100 dark:border-[#2B313C]">
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-foreground">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}