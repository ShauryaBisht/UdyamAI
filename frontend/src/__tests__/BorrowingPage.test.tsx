import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import BorrowingPage from '@/app/borrowing/page';

// Mock API
jest.mock('@/lib/api', () => ({
  getBorrowings: jest.fn().mockResolvedValue({
    total_requested: 500000,
    total_approved: 250000,
    exploring_count: 2,
    applied_count: 1,
    approved_count: 1,
    borrowings: [
      {
        id: '1',
        lender_name: 'SBI Micro Term Loan',
        loan_type: 'mudra',
        requested_amount: 250000,
        status: 'approved',
      },
    ],
  }),
  createBorrowing: jest.fn().mockResolvedValue({}),
}));

// Mock Next router & navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/borrowing',
}));

// Mock Auth
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123' },
    profile: { id: 'test-profile-123', name: 'Test Entrepreneur' },
  }),
}));

describe('BorrowingPage', () => {
  it('renders borrowing overview and pipeline metrics', async () => {
    render(<BorrowingPage />);

    expect(screen.getByText(/Micro Borrowing Tracker|कर्ज सहाय्य/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('SBI Micro Term Loan')).toBeInTheDocument();
    });
  });
});
