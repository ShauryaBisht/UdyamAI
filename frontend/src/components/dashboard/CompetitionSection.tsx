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
    <div className="rounded-card border border-primary/10 bg-white p-5 shadow-card">
      <p className="text-sm font-medium text-foreground/60">
        {label}
      </p>

      <h3 className="mt-3 text-metric-lg text-foreground">
        {value}
      </h3>

      <p className="mt-1 text-sm text-foreground/60">
        {subtitle}
      </p>
    </div>
  );
}

function getScoreBarColor(score: number) {
  if (score >= 75) return 'bg-status-verified';
  if (score >= 50) return 'bg-status-warning';
  return 'bg-status-risk';
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

      {/* AI Competition Guidance (when data is sparse) */}
      {(score == null && competitorsCount == null && competitionAdviceList.length > 0) && (
       <div className="rounded-card border border-primary/15 bg-primary/5 p-5 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            AI Competition Guidance
          </p>
          <ul className="space-y-1.5">
            {competitionAdviceList.map((advice: string, i: number) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-1.5">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>{advice}</span>
              </li>
            ))}
          </ul>
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

      {/* Competitor Strength */}
      <div className="rounded-card border border-primary/10 bg-white p-6 shadow-card">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Competitive Landscape Breakdown
          </h2>

          <p className="mt-1 text-sm text-foreground/60">
            Density of registered MSME clusters in local taluka & district
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-foreground/70">Competitor Safety Margin</span>
            <span className={`font-semibold ${score != null ? 'text-primary' : 'text-foreground/40'}`}>
              {score != null ? `${score}/100` : '— /100'}
            </span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-foreground/10">
            {score != null ? (
              <div
                className={`h-full rounded-full ${getScoreBarColor(score)} transition-all duration-500`}
                style={{ width: `${score}%` }}
              />
            ) : (
              <div
                className="h-full rounded-full bg-foreground/10"
                style={{ width: '0%' }}
              />
            )}
          </div>
        </div>

        {/* Competitor Distribution Breakdown */}
        {hasDistribution && (
          <div className="mt-6 pt-4 border-t border-primary/10">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-3">
              Competitor Category Distribution
            </p>
            <div className="space-y-2">
              {Object.entries(distribution).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-foreground/70 capitalize">{category.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-bold text-foreground">{String(count)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Market Gaps */}
        {hasGaps && (
          <div className="mt-4 pt-4 border-t border-primary/10">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-3">
              Identified Market Gaps
            </p>
            <div className="space-y-1.5">
              {Object.entries(identifiedGaps).map(([gap, detail]) => (
                <div key={gap} className="flex justify-between text-sm">
                  <span className="text-foreground/70 capitalize">{gap.replace(/_/g, ' ')}</span>
                  <span className="font-medium text-foreground">{String(detail)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}