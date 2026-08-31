'use client';

const schemes = [
  {
    name: 'PM MUDRA Yojana',
    provider: 'Government of India',
    benefit: 'Up to ₹10 Lakh',
    eligibility: 'High Match',
    description:
      'Provides collateral-free loans to small and micro enterprises for business growth.',
    category: 'Business Loan',
  },
  {
    name: 'PMEGP',
    provider: 'Ministry of MSME',
    benefit: 'Subsidy up to 35%',
    eligibility: 'Eligible',
    description:
      'Supports new micro-enterprises through financial assistance and government subsidy.',
    category: 'Startup Support',
  },
  {
    name: 'Stand-Up India',
    provider: 'Government of India',
    benefit: '₹10 Lakh – ₹1 Crore',
    eligibility: 'Moderate Match',
    description:
      'Provides bank loans to support entrepreneurship and new business ventures.',
    category: 'Business Funding',
  },
];

function SummaryCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <h3 className="mt-2 text-2xl font-bold text-gray-900">
        {value}
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        {subtitle}
      </p>
    </div>
  );
}

function getEligibilityColor(status: string) {
  if (status === 'High Match') {
    return 'bg-green-100 text-green-700';
  }

  if (status === 'Eligible') {
    return 'bg-blue-100 text-blue-700';
  }

  return 'bg-amber-100 text-amber-700';
}

export default function SchemeSection() {
  return (
    <div className="flex flex-col gap-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <SummaryCard
          label="Eligible Schemes"
          value="8"
          subtitle="Based on your business profile"
        />

        <SummaryCard
          label="Best Match"
          value="PMEGP"
          subtitle="Highest potential support"
        />

        <SummaryCard
          label="Funding Opportunities"
          value="₹12L+"
          subtitle="Estimated available support"
        />

      </div>

      {/* Scheme Recommendations */}
      <div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recommended Schemes
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Government schemes matched with your business profile
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {schemes.map((scheme) => (
            <div
              key={scheme.name}
              className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col"
            >

              <div className="flex items-start justify-between gap-3">

                <div>
                  <h3 className="font-semibold text-gray-900">
                    {scheme.name}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {scheme.provider}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getEligibilityColor(
                    scheme.eligibility
                  )}`}
                >
                  {scheme.eligibility}
                </span>

              </div>

              <div className="mt-5">

                <p className="text-sm text-gray-500">
                  Potential Benefit
                </p>

                <p className="mt-1 text-xl font-bold text-gray-900">
                  {scheme.benefit}
                </p>

              </div>

              <p className="mt-4 text-sm leading-6 text-gray-600">
                {scheme.description}
              </p>

              <div className="mt-4">
                <span className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  {scheme.category}
                </span>
              </div>

              <button className="mt-5 w-full rounded-lg border border-blue-600 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50">
                View Details
              </button>

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}