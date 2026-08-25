import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ListingCard } from '../components/ListingCard';
import { Listing, User } from '../types';

// Mock gemini utilities
vi.mock('../lib/gemini', () => ({
  checkAIDeal: vi.fn().mockResolvedValue({
    verdict: 'Great Deal',
    estimatedValue: 1200,
    explanation: 'This is a stellar price for a textbook in this condition on campus.',
  }),
}));

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ListingCard', () => {
  const mockListing: Listing = {
    id: 'listing-123',
    ownerId: 'user-456',
    title: 'Vikas Engineering Physics Textbook',
    description: 'Clean textbook, no marks, latest syllabus edition.',
    category: 'Textbooks',
    price: 350,
    status: 'OPEN',
    imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300',
    createdAt: Date.now() - 3600000, // 1 hour ago
    ownerName: 'Rahul Kumar',
    ownerEmail: 'rahul@srmist.edu.in',
    ownerVerified: true,
    ownerExchanges: 4,
  };

  const mockUser: User = {
    uid: 'user-789',
    name: 'Priya Sharma',
    email: 'priya@srmist.edu.in',
    college: 'SRMIST KTR',
    verified: true,
    successfulExchanges: 2,
    contactEmail: 'priya@srmist.edu.in',
  };

  const handleContact = vi.fn();
  const handleMarkCompleted = vi.fn();
  const handleGatedAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders listing card details correctly', () => {
    render(
      <ListingCard
        listing={mockListing}
        currentUser={mockUser}
        onContactSeller={handleContact}
        onMarkCompleted={handleMarkCompleted}
        onGatedAction={handleGatedAction}
      />
    );

    expect(screen.getByText('Vikas Engineering Physics Textbook')).toBeDefined();
    expect(screen.getByText('Clean textbook, no marks, latest syllabus edition.')).toBeDefined();
    expect(screen.getByText('₹350')).toBeDefined();
    expect(screen.getByText('Rahul Kumar')).toBeDefined();
    expect(screen.getByText('4 campus swaps')).toBeDefined();
  });

  it('calls contact seller callback when contact button is clicked', () => {
    render(
      <ListingCard
        listing={mockListing}
        currentUser={mockUser}
        onContactSeller={handleContact}
        onMarkCompleted={handleMarkCompleted}
        onGatedAction={handleGatedAction}
      />
    );

    const contactButton = screen.getByRole('button', { name: /Contact Seller/i });
    expect(contactButton).toBeDefined();
    fireEvent.click(contactButton);

    expect(handleContact).toHaveBeenCalledWith(mockListing, 'rahul@srmist.edu.in');
  });

  it('shows Mark Completed button for owners', () => {
    render(
      <ListingCard
        listing={mockListing}
        currentUser={mockUser}
        onContactSeller={handleContact}
        onMarkCompleted={handleMarkCompleted}
        onGatedAction={handleGatedAction}
        isOwner={true}
      />
    );

    const completeButton = screen.getByRole('button', { name: /Mark Completed/i });
    expect(completeButton).toBeDefined();
    fireEvent.click(completeButton);

    expect(handleMarkCompleted).toHaveBeenCalledWith('listing-123', 'user-456');
  });

  it('executes AI Deal Check workflow correctly', async () => {
    render(
      <ListingCard
        listing={mockListing}
        currentUser={mockUser}
        onContactSeller={handleContact}
        onMarkCompleted={handleMarkCompleted}
        onGatedAction={handleGatedAction}
      />
    );

    // Initial check button is present
    const checkBtn = screen.getByRole('button', { name: /AI Deal Check/i });
    expect(checkBtn).toBeDefined();

    // Click check button
    await act(async () => {
      fireEvent.click(checkBtn);
    });

    // Should render the deal result badge
    expect(screen.getByText(/Great Deal/i)).toBeDefined();
    expect(screen.getByText('Est: ₹1,200')).toBeDefined();
  });
});
