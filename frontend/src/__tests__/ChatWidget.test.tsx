import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatWidget from '@/components/chat/ChatWidget';

// Mock Auth
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123' },
    profile: { id: 'test-profile-123', name: 'Test Entrepreneur' },
  }),
}));

// Mock API
jest.mock('@/lib/api', () => ({
  sendChatMessage: jest.fn().mockResolvedValue({
    reply: 'PMEGP gives up to 35% subsidy.',
    confidence: 'high',
    rag_status: 'success',
    sources: [{ title: 'PMEGP Official Guidelines', url: 'https://msme.gov.in' }],
  }),
}));

// Mock window.speechSynthesis
beforeAll(() => {
  window.speechSynthesis = {
    speak: jest.fn(),
    cancel: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    getVoices: jest.fn().mockReturnValue([]),
  } as any;
});

describe('ChatWidget Component', () => {
  it('renders chat toggle button when closed', () => {
    render(<ChatWidget />);
    expect(screen.getByRole('button', { name: /open ai chat|एआई चॅट उघडा/i })).toBeInTheDocument();
  });

  it('opens chat drawer when toggle button is clicked', () => {
    render(<ChatWidget />);
    const openBtn = screen.getByRole('button', { name: /open ai chat|एआई चॅट उघडा/i });
    fireEvent.click(openBtn);

    expect(screen.getAllByText(/UdyamAI Assistant|उद्यमएआई सहाय्यक/i).length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/Ask about schemes|योजना, बाजार/i)).toBeInTheDocument();
  });

  it('submits a message and renders verified trust badge on high confidence', async () => {
    render(<ChatWidget />);
    const openBtn = screen.getByRole('button', { name: /open ai chat|एआई चॅट उघडा/i });
    fireEvent.click(openBtn);

    const input = screen.getByPlaceholderText(/Ask about schemes|योजना, बाजार/i);
    fireEvent.change(input, { target: { value: 'What is PMEGP?' } });

    const form = input.closest('form');
    if (form) fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('PMEGP gives up to 35% subsidy.')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Verified/i).length).toBeGreaterThan(0);
    expect(screen.getByText('PMEGP Official Guidelines')).toBeInTheDocument();
  });
});
