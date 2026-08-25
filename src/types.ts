export type CategoryType =
  | 'Textbooks'
  | 'Electronics'
  | 'Services'
  | 'Opportunities'
  | 'Dorm Essentials';

export const CATEGORIES: CategoryType[] = [
  'Textbooks',
  'Electronics',
  'Services',
  'Opportunities',
  'Dorm Essentials',
];

export type ItemStatus = 'OPEN' | 'COMPLETED';

export interface User {
  uid: string;
  name: string;
  email: string;
  college: string;
  verified: boolean;
  successfulExchanges: number;
  contactEmail: string;
  avatarUrl?: string;
  department?: string;
}

export interface Listing {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: CategoryType;
  price: number;
  status: ItemStatus;
  imageUrl: string;
  createdAt: number; // Unix timestamp in milliseconds
  ownerName?: string;
  ownerEmail?: string;
  ownerCollege?: string;
  ownerVerified?: boolean;
  ownerExchanges?: number;
}

export interface WantedItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: CategoryType;
  budget: number;
  status: ItemStatus;
  createdAt: number; // Unix timestamp in milliseconds
  userName?: string;
  userEmail?: string;
  userCollege?: string;
  userVerified?: boolean;
  userExchanges?: number;
}

export type ViewType = 'home' | 'marketplace' | 'wanted' | 'profile' | 'reviews' | 'privacy' | 'leaderboard';

export type ReviewCategory =
  | 'Marketplace'
  | 'Search'
  | 'AI Assistant'
  | 'Safety'
  | 'User Experience'
  | 'Other';

export interface CampusReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  verified: boolean;
  rating: number; // 1-5
  category: ReviewCategory;
  comment: string;
  createdAt: number;
  contextTag?: string;
  helpfulCount?: number;
}

export type IntendedAction =
  | { type: 'CREATE_LISTING' }
  | { type: 'POST_WANTED' }
  | { type: 'CONTACT_SELLER'; email: string; title: string; price?: number }
  | { type: 'OFFER_WANTED'; email: string; title: string; budget?: number }
  | { type: 'AI_MATCH'; wantedItem: WantedItem }
  | null;

export interface AISearchResult {
  searchTerms: string[];
  category: CategoryType | null;
  maxBudget: number | null;
  rawQuery?: string;
}

export interface AIMatchItem {
  listingId: string;
  matchScore: number;
  explanation: string;
  recommendation: 'connect' | 'maybe' | 'pass';
}

export interface AIMatchResponse {
  matches: AIMatchItem[];
}

export type AIDealVerdict = 'Great Deal' | 'Fair Price' | 'Overpriced';

export interface AIDealCheckResult {
  verdict: AIDealVerdict;
  estimatedValue: number;
  explanation: string;
}
