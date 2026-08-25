import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WantedCard } from '../components/WantedCard';
import { WantedItem, User } from '../types';

describe('WantedCard', () => {
  const mockWantedItem: WantedItem = {
    id: 'wanted-123',
    userId: 'user-456',
    title: 'Scientific Calculator fx-991EX',
    description: 'Urgently looking for Casio fx-991EX calculator for end semester math exams.',
    category: 'Electronics',
    budget: 800,
    status: 'OPEN',
    createdAt: Date.now() - 7200000, // 2 hours ago
    userName: 'Meera Nair',
    userEmail: 'meera@srmist.edu.in',
    userVerified: true,
    userExchanges: 1,
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

  const handleOffer = vi.fn();
  const handleFindAIMatches = vi.fn();
  const handleMarkCompleted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders wanted card metadata correctly', () => {
    render(
      <WantedCard
        wanted={mockWantedItem}
        currentUser={mockUser}
        onOfferWanted={handleOffer}
        onFindAIMatches={handleFindAIMatches}
        onMarkCompleted={handleMarkCompleted}
      />
    );

    expect(screen.getByText('Scientific Calculator fx-991EX')).toBeDefined();
    expect(screen.getByText('Urgently looking for Casio fx-991EX calculator for end semester math exams.')).toBeDefined();
    expect(screen.getByText('Budget: ₹800')).toBeDefined();
    expect(screen.getByText('Meera Nair')).toBeDefined();
  });

  it('triggers onOfferWanted callback when click I Have This button', () => {
    render(
      <WantedCard
        wanted={mockWantedItem}
        currentUser={mockUser}
        onOfferWanted={handleOffer}
        onFindAIMatches={handleFindAIMatches}
        onMarkCompleted={handleMarkCompleted}
      />
    );

    const offerButton = screen.getByRole('button', { name: /I Have This/i });
    expect(offerButton).toBeDefined();
    fireEvent.click(offerButton);

    expect(handleOffer).toHaveBeenCalledWith(mockWantedItem, 'meera@srmist.edu.in');
  });

  it('shows Mark Completed button for owners', () => {
    render(
      <WantedCard
        wanted={mockWantedItem}
        currentUser={mockUser}
        onOfferWanted={handleOffer}
        onFindAIMatches={handleFindAIMatches}
        onMarkCompleted={handleMarkCompleted}
        isOwner={true}
      />
    );

    const completeButton = screen.getByRole('button', { name: /Mark Request as COMPLETED/i });
    expect(completeButton).toBeDefined();
    fireEvent.click(completeButton);

    expect(handleMarkCompleted).toHaveBeenCalledWith('wanted-123', 'user-456');
  });

  it('triggers AI Matching callback when find matches button is clicked', () => {
    render(
      <WantedCard
        wanted={mockWantedItem}
        currentUser={mockUser}
        onOfferWanted={handleOffer}
        onFindAIMatches={handleFindAIMatches}
        onMarkCompleted={handleMarkCompleted}
      />
    );

    const matchButton = screen.getByRole('button', { name: /Find AI Matches/i });
    expect(matchButton).toBeDefined();
    fireEvent.click(matchButton);

    expect(handleFindAIMatches).toHaveBeenCalledWith(mockWantedItem);
  });
});
