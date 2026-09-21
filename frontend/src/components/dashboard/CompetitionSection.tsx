'use client';

interface CompetitionSectionProps {
  data?: any;
}

function MetricCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white dark:bg-[#161B22] p-5 shadow-subtle hover:border-primary/30 transition-all">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold font-financial tracking-tight text-foreground">
        {value}
      </h3>

      <p className="mt-1 text-xs text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}

function getScoreBarColor(score: number) {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
}

export default function CompetitionSection({ data }: CompetitionSectionProps) {
  const comp = data?.competition || {};
  const feas = data?.feasibility || {};
  const aiAdvice = data?.ai_advice || {};
  const competitionAdviceList: string[] = aiAdvice.competition_advice || [];

  // Use only real API data; no hardcoded fallback scores
  const rawScore = feas.competition_score ?? comp.competition_score;
  const score = rawScore != null ? Math.round(rawScore) : null;

  const competitorsCount = comp.competitor_count ?? comp.total_competitors ?? comp.competitors?.length ?? null;

  const saturation = competitorsCount != null
    ? (competitorsCount > 20 ? 'High Saturation' : competitorsCount > 8 ? 'Moderate' : 'Low Saturation')
    : '—';

  const pressure = score != null
    ? (score >= 75 ? 'Low Competition Risk' : score >= 50 ? 'Moderate Pressure' : 'High Competition Pressure')
    : '—';

  // Competition density from backend analysis
  const density = comp.competition_density ?? null;
  const distribution = comp.competitor_distribution || {};
  const identifiedGaps = comp.identified_gaps || {};
  const radiusKm = comp.radius_km ?? null;
  const dataConfidence = comp.data_confidence ?? null;

  const hasDistribution = Object.keys(distribution).length > 0;
  const hasGaps = Object.keys(identifiedGaps).length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Competition Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Competition Sub-Score"
          value={score != null ? `${score}/100` : '—'}
          subtitle="Inverse competitor density score"
        />

        <MetricCard
          label="Nearby Competitors"
          value={competitorsCount != null ? String(competitorsCount) : '—'}
          subtitle="Active cluster enterprises"
        />

        <MetricCard
          label="Market Saturation"
          value={saturation}
          subtitle="Density analysis"
        />

        <MetricCard
          label="Competitive Pressure"
          value={pressure}
          subtitle="Evaluated by AI Engine"
        />
      </div>

      {/* AI Competition Guidance */}
      {competitionAdviceList.length > 0 && (
        <div className="rounded-2xl border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              AI Competition Guidance
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
            {competitionAdviceList.map((advice: string, i: number) => (
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

      {/* Secondary competition metrics */}
      {(density != null || radiusKm != null || dataConfidence != null) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {density != null && (
            <MetricCard
              label="Competition Density"
              value={Number(density).toFixed(2)}
              subtitle="Competitors per sq km"
            />
          )}
          {radiusKm != null && (
            <MetricCard
              label="Analysis Radius"
              value={`${radiusKm} km`}
              subtitle="Survey coverage area"
            />
          )}
          {dataConfidence && (
            <MetricCard
              label="Data Confidence"
              value={dataConfidence}
              subtitle="Competitor data reliability"
            />
          )}
        </div>
      )}

      {/* Competitor Strength & Distribution */}
      <div className="rounded-2xl border border-border bg-white dark:bg-[#161B22] p-6 shadow-subtle">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Competitive Landscape Breakdown
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Density of registered MSME clusters in local taluka & district
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-foreground">Competitor Safety Margin</span>
            <span className={`font-bold font-financial ${score != null ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
              {score != null ? `${score}/100` : '— /100'}
            </span>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#1F242C]">
            {score != null ? (
              <div
                className={`h-full rounded-full ${getScoreBarColor(score)} transition-all duration-500`}
                style={{ width: `${score}%` }}
              />
            ) : (
              <div
                className="h-full rounded-full bg-slate-200 dark:bg-slate-700"
                style={{ width: '0%' }}
              />
            )}
          </div>
        </div>

        {/* Competitor Distribution Visual Bars */}
        {hasDistribution && (
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Competitor Cluster Distribution (by Sector)
            </p>
            {(() => {
              const entries = Object.entries(distribution);
              const maxVal = Math.max(...entries.map(([, c]) => Number(c) || 0), 1);
              return (
                <div className="space-y-3">
                  {entries.map(([category, count]) => {
                    const num = Number(count) || 0;
                    const pct = Math.round((num / maxVal) * 100);
                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-foreground capitalize">{category.replace(/_/g, ' ')}</span>
                          <span className="text-muted-foreground font-bold">{num} units</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-[#1F242C] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/80 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Market Gaps */}
        {hasGaps && (
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Identified Market Gaps
            </p>
            <div className="space-y-2">
              {Object.entries(identifiedGaps).map(([gap, detail]) => (
                <div key={gap} className="flex justify-between text-sm py-1 border-b border-slate-100 dark:border-[#2B313C]">
                  <span className="text-muted-foreground capitalize">{gap.replace(/_/g, ' ')}</span>
                  <span className="font-semibold text-foreground">{String(detail)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}