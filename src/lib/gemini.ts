import {
  AISearchResult,
  AIMatchItem,
  Listing,
  WantedItem,
  CategoryType,
  CATEGORIES,
  AIDealCheckResult,
} from '../types';

export async function performSemanticSearch(query: string): Promise<AISearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      searchTerms: [],
      category: null,
      maxBudget: null,
      rawQuery: '',
    };
  }

  try {
    const response = await fetch('/api/ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: trimmed }),
    });

    if (!response.ok) {
      throw new Error(`AI search request failed with status ${response.status}`);
    }

    const data = await response.json();
    let validatedCategory: CategoryType | null = null;
    if (data.category && CATEGORIES.includes(data.category as CategoryType)) {
      validatedCategory = data.category as CategoryType;
    }

    return {
      searchTerms: Array.isArray(data.searchTerms) ? data.searchTerms : [trimmed],
      category: validatedCategory,
      maxBudget: typeof data.maxBudget === 'number' && data.maxBudget > 0 ? data.maxBudget : null,
      rawQuery: trimmed,
    };
  } catch (error) {
    console.warn('Semantic search fallback to basic matching:', error);
    // Seamless fallback to basic string tokens
    return {
      searchTerms: trimmed.split(/\s+/).filter(Boolean),
      category: null,
      maxBudget: null,
      rawQuery: trimmed,
    };
  }
}

export async function findAIMatches(
  wantedItem: WantedItem,
  availableListings: Listing[]
): Promise<AIMatchItem[]> {
  // Filter to only open listings and cap to 15 most recent
  const openListings = availableListings
    .filter((listing) => listing.status !== 'COMPLETED')
    .slice(0, 15);

  if (openListings.length === 0) {
    return [];
  }

  const response = await fetch('/api/ai/match', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      wantedItem,
      availableListings: openListings,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error || `AI matching request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data.matches)) {
    return [];
  }

  return data.matches;
}

export interface AssistantChatMessage {
  role: 'user' | 'assistant';
  content: string;
  debugInfo?: {
    extractedKeywords: string[];
    matchedListingsCount: number;
    matchedWantedRequestsCount: number;
    activeFilters: {
      isAskingForItems: boolean;
    };
  } | null;
}

export async function sendCampusAssistantMessage(
  messages: AssistantChatMessage[],
  listings: Listing[],
  wanted: WantedItem[],
  userId?: string | null
): Promise<{ response: string; debugInfo?: any }> {
  if (!userId) {
    throw new Error('Unauthorized: You must be signed in with your college account to talk with Campus Bot.');
  }

  const response = await fetch('/api/ai/assistant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userId}`,
      'x-user-id': userId,
    },
    body: JSON.stringify({ messages, listings, wanted }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error || `Request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (typeof data.response !== 'string') {
    throw new Error('Invalid response from Campus Assistant.');
  }

  return {
    response: data.response,
    debugInfo: data.debugInfo || null,
  };
}

export async function checkAIDeal(
  listing: {
    title: string;
    category: string;
    price: number;
    description: string;
  },
  userId?: string | null
): Promise<AIDealCheckResult> {
  if (!userId) {
    throw new Error('Unauthorized: You must be signed in with your college account to check deal prices.');
  }

  const response = await fetch('/api/ai/deal-check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userId}`,
      'x-user-id': userId,
    },
    body: JSON.stringify({
      title: listing.title,
      category: listing.category,
      price: listing.price,
      description: listing.description,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error || `Deal check request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (
    !data ||
    typeof data.verdict !== 'string' ||
    typeof data.estimatedValue !== 'number' ||
    typeof data.explanation !== 'string'
  ) {
    throw new Error('Deal check is temporarily unavailable.');
  }

  return data as AIDealCheckResult;
}

