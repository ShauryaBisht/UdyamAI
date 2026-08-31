const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function startAnalysis(data: {
  user_id: string | null;
  location_id: string;
  village_id: string;
  business_category_id: string;
  available_capital: number;
  desired_project_cost: number;
  language: 'en' | 'hi' | 'mr';
}) {
  const response = await fetch(`${API_BASE_URL}/api/v1/analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Analysis submission failed');
  }

  return response.json();
}