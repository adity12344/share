import React, { useState, useMemo } from 'react';
import { WantedItem, Listing, User, CategoryType, IntendedAction, AIMatchItem } from '../types';
import { CategoryFilter } from '../components/CategoryFilter';
import { WantedCard } from '../components/WantedCard';
import { AIMatchModal } from '../components/AIMatchModal';
import { Button } from '../components/ui/Button';
import { findAIMatches } from '../lib/gemini';
import { toast } from 'sonner';
import {
  Search,
  HelpCircle,
  PlusCircle,
  SlidersHorizontal,
  X,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';

interface WantedViewProps {
  wanted: WantedItem[];
  listings: Listing[];
  users: Record<string, User>;
  currentUser: User | null;
  onPostWanted: () => void;
  onGatedAction: (action: IntendedAction) => void;
  onMarkWantedCompleted: (wantedId: string, userId: string) => void;
}

export const WantedView: React.FC<WantedViewProps> = ({
  wanted,
  listings,
  users,
  currentUser,
  onPostWanted,
  onGatedAction,
  onMarkWantedCompleted,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'budget_high' | 'budget_low'>('newest');

  // AI Matching Engine Modal State
  const [aiMatchModalOpen, setAiMatchModalOpen] = useState(false);
  const [activeWantedForMatch, setActiveWantedForMatch] = useState<WantedItem | null>(null);
  const [matchingWantedId, setMatchingWantedId] = useState<string | null>(null);
  const [aiMatches, setAiMatches] = useState<AIMatchItem[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  const filteredWanted = useMemo(() => {
    return wanted
      .filter((item) => {
        if (item.status !== 'OPEN') return false;
        const matchesCategory =
          selectedCategory === 'All' || item.category === selectedCategory;
        const matchesSearch =
          !searchTerm.trim() ||
          item.title.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase().trim());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.createdAt - a.createdAt;
        if (sortBy === 'budget_high') return b.budget - a.budget;
        if (sortBy === 'budget_low') return a.budget - b.budget;
        return 0;
      });
  }, [wanted, selectedCategory, searchTerm, sortBy]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: 0 };
    wanted.forEach((item) => {
      if (item.status === 'OPEN') {
        counts.All = (counts.All || 0) + 1;
        counts[item.category] = (counts[item.category] || 0) + 1;
      }
    });
    return counts;
  }, [wanted]);

  const handleOfferWanted = (wantedItem: WantedItem, requesterEmail: string) => {
    if (!currentUser) {
      onGatedAction({
        type: 'OFFER_WANTED',
        email: requesterEmail,
        title: wantedItem.title,
        budget: wantedItem.budget,
      });
      return;
    }
    const subject = encodeURIComponent(`[Share Wanted Board] I have what you need: ${wantedItem.title}`);
    const body = encodeURIComponent(
      `Hi,\n\nI saw your wanted request for "${wantedItem.title}" on the Share campus board.\n\nI have this item/service available. Let's arrange a time to meet!\n\nBest regards,\n${currentUser.name}\n${currentUser.contactEmail || currentUser.email}`
    );
    window.location.href = `mailto:${requesterEmail}?subject=${subject}&body=${body}`;
  };

  const handleFindAIMatches = async (wantedItem: WantedItem) => {
    // Visual auth gating: if not logged in, prompt sign in first
    if (!currentUser) {
      onGatedAction({
        type: 'AI_MATCH',
        wantedItem,
      });
      return;
    }

    setActiveWantedForMatch(wantedItem);
    setMatchingWantedId(wantedItem.id);
    setMatchLoading(true);
    setMatchError(null);
    setAiMatches([]);
    setAiMatchModalOpen(true);

    try {
      const results = await findAIMatches(wantedItem, listings);
      setAiMatches(results);
      if (results.length === 0 || results.every((r) => r.matchScore < 50)) {
        // Modal will render friendly empty state
      } else {
        toast.success(`Found ${results.filter((r) => r.matchScore >= 50).length} high-confidence AI matches!`);
      }
    } catch (err: any) {
      console.error('Error finding AI matches:', err);
      setMatchError(err?.message || 'Unable to scan campus listings at this time.');
    } finally {
      setMatchLoading(false);
      setMatchingWantedId(null);
    }
  };

  const handleContactMatchedSeller = (listing: Listing, sellerEmail: string) => {
    if (!currentUser) {
      onGatedAction({
        type: 'CONTACT_SELLER',
        email: sellerEmail,
        title: listing.title,
        price: listing.price,
      });
      return;
    }
    const subject = encodeURIComponent(`[Share Campus Match] Regarding your listing: ${listing.title}`);
    const body = encodeURIComponent(
      `Hi,\n\nI found your listing for "${listing.title}" (₹${listing.price}) via Share's AI Match Engine for my wanted request "${activeWantedForMatch?.title || ''}".\n\nIs this available to meet on campus?\n\nBest regards,\n${currentUser.name}\n${currentUser.contactEmail || currentUser.email}`
    );
    window.location.href = `mailto:${sellerEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 dark:text-stone-100">
              Student Wanted Board
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            Post what you're looking for and use Gemini AI to find compatible campus listings instantly.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="default"
            size="md"
            onClick={onPostWanted}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            <span>Post Request</span>
          </Button>
        </div>
      </div>

      {/* Search & Sort Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student requests by keyword, subject, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-stone-500 dark:text-stone-400" />
          <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-semibold bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg px-2.5 py-2 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="newest">Recently Requested</option>
            <option value="budget_high">Budget: High to Low</option>
            <option value="budget_low">Budget: Low to High</option>
          </select>
        </div>
      </div>

      {/* Category Pills Filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        itemCounts={categoryCounts}
      />

      {/* Counter & Status */}
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
        <span>
          Showing <strong className="text-stone-900 dark:text-stone-100">{filteredWanted.length}</strong> open requests
          {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          {searchTerm && ` matching "${searchTerm}"`}
        </span>
        {(selectedCategory !== 'All' || searchTerm) && (
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchTerm('');
            }}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 font-semibold hover:underline cursor-pointer"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Grid */}
      {filteredWanted.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-12 text-center space-y-3">
          <HelpCircle className="w-10 h-10 text-stone-400 dark:text-stone-500 mx-auto" />
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">No matching requests found</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
            Looking for something specific? Post a request and use Gemini AI to find matching student offers.
          </p>
          <div className="pt-2">
            <Button
              variant="default"
              size="sm"
              onClick={onPostWanted}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Post Request Now
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWanted.map((item) => (
            <WantedCard
              key={item.id}
              wanted={item}
              requester={users[item.userId]}
              currentUser={currentUser}
              isOwner={currentUser?.uid === item.userId}
              isMatching={matchingWantedId === item.id}
              onOfferWanted={handleOfferWanted}
              onFindAIMatches={handleFindAIMatches}
              onMarkCompleted={onMarkWantedCompleted}
            />
          ))}
        </div>
      )}

      {/* AI Matching Engine Modal */}
      <AIMatchModal
        open={aiMatchModalOpen}
        onOpenChange={setAiMatchModalOpen}
        wantedItem={activeWantedForMatch}
        matches={aiMatches}
        loading={matchLoading}
        error={matchError}
        listings={listings}
        users={users}
        currentUser={currentUser}
        onContactSeller={handleContactMatchedSeller}
        onRetry={() => {
          if (activeWantedForMatch) {
            handleFindAIMatches(activeWantedForMatch);
          }
        }}
      />
    </div>
  );
};
