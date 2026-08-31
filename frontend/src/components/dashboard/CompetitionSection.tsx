'use client';

const competitionData = {
  score: 71,
  competitors: 12,
  saturation: 'Moderate',
  pressure: 'Medium',
};

const competitors = [
  { name: 'Local Competitors', score: 65 },
  { name: 'Regional Businesses', score: 78 },
  { name: 'Established Brands', score: 85 },
];

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
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <h3 className="mt-3 text-3xl font-bold text-gray-900">
        {value}
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        {subtitle}
      </p>
    </div>
  );
}

export default function CompetitionSection() {
  return (
    <div className="flex flex-col gap-6">

      {/* Competition Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <MetricCard
          label="Competition Score"
          value={`${competitionData.score}/100`}
          subtitle="Overall competition level"
        />

        <MetricCard
          label="Competitors"
          value={competitionData.competitors}
          subtitle="Estimated active businesses"
        />

        <MetricCard
          label="Market Saturation"
          value={competitionData.saturation}
          subtitle="Current market condition"
        />

        <MetricCard
          label="Competitive Pressure"
          value={competitionData.pressure}
          subtitle="Based on market analysis"
        />

      </div>

      {/* Competitor Strength */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Competitive Landscape
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Estimated strength of different competitor groups
          </p>
        </div>

        <div className="flex flex-col gap-5">

          {competitors.map((competitor) => (
            <div key={competitor.name}>

              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-gray-700">
                  {competitor.name}
                </span>

                <span className="font-semibold text-gray-700">
                  {competitor.score}/100
                </span>
              </div>

              <div className="h-3 w-full rounded-full bg-gray-100">

                <div
                  className="h-3 rounded-full bg-orange-500"
                  style={{
                    width: `${competitor.score}%`,
                  }}
                />

              </div>

            </div>
          ))}

        </div>
      </div>

      {/* Insights */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">

        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Competition Insights
        </h2>

        <div className="flex flex-col gap-3">

          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            The market has a moderate level of competition.
          </div>

          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            Established businesses have strong market presence.
          </div>

          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            New businesses can compete through pricing, quality, or unique services.
          </div>

        </div>

      </div>

    </div>
  );
}