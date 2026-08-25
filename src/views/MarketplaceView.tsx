import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Listing, User, CategoryType, IntendedAction, AISearchResult } from '../types';
import { CategoryFilter } from '../components/CategoryFilter';
import { ListingCard } from '../components/ListingCard';
import { Button } from '../components/ui/Button';
import { performSemanticSearch } from '../lib/gemini';
import {
  Search,
  PlusCircle,
  ShoppingBag,
  SlidersHorizontal,
  X,
  Sparkles,
  Loader2,
  Tag,
  BadgePercent,
} from 'lucide-react';

interface MarketplaceViewProps {
  listings: Listing[];
  users: Record<string, User>;
  currentUser: User | null;
  onCreateListing: () => void;
  onGatedAction: (action: IntendedAction) => void;
  onMarkListingCompleted: (listingId: string, ownerId: string) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  listings,
  users,
  currentUser,
  onCreateListing,
  onGatedAction,
  onMarkListingCompleted,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');

  // AI Semantic Search State
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResult, setAiResult] = useState<AISearchResult | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 500ms Debounced AI Semantic Search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setAiResult(null);
      setIsAiSearching(false);
      return;
    }

    setIsAiSearching(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await performSemanticSearch(trimmed);
        setAiResult(result);
      } catch (err) {
        console.warn('Semantic search fallback to basic match:', err);
        setAiResult(null);
      } finally {
        setIsAiSearching(false);
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  // Filter listings by status === "OPEN" and search matching titles against search terms / AI parsed intent
  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        if (item.status !== 'OPEN') return false;

        // 1. Category Filter: User explicit filter has highest precedence; if 'All' and AI detected category, match it
        let matchesCategory = true;
        if (selectedCategory !== 'All') {
          matchesCategory = item.category === selectedCategory;
        } else if (aiResult?.category) {
          matchesCategory = item.category === aiResult.category;
        }

        if (!matchesCategory) return false;

        // 2. Budget Filter from AI Semantic Analysis
        if (aiResult?.maxBudget && item.price > aiResult.maxBudget) {
          return false;
        }

        // 3. Search Terms Matching
        if (!searchTerm.trim()) return true;

        if (aiResult && aiResult.searchTerms.length > 0) {
          const itemText = `${item.title} ${item.description} ${item.category}`.toLowerCase();
          const matchesAnyTerm = aiResult.searchTerms.some((term) =>
            itemText.includes(term.toLowerCase())
          );
          return matchesAnyTerm;
        }

        // Standard string fallback
        const lowerSearch = searchTerm.toLowerCase().trim();
        return (
          item.title.toLowerCase().includes(lowerSearch) ||
          item.description.toLowerCase().includes(lowerSearch)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.createdAt - a.createdAt;
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'price_high') return b.price - a.price;
        return 0;
      });
  }, [listings, selectedCategory, searchTerm, sortBy, aiResult]);

  // Compute category counts for active items
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: 0 };
    listings.forEach((item) => {
      if (item.status === 'OPEN') {
        counts.All = (counts.All || 0) + 1;
        counts[item.category] = (counts[item.category] || 0) + 1;
      }
    });
    return counts;
  }, [listings]);

  const handleContactSeller = (listing: Listing, sellerEmail: string) => {
    if (!currentUser) {
      onGatedAction({
        type: 'CONTACT_SELLER',
        email: sellerEmail,
        title: listing.title,
        price: listing.price,
      });
      return;
    }
    const subject = encodeURIComponent(`[Share College Marketplace] Inquiry: ${listing.title}`);
    const body = encodeURIComponent(
      `Hi,\n\nI am interested in your item "${listing.title}" listed for ₹${listing.price} on Share.\n\nCould we arrange a campus meetup?\n\nBest regards,\n${currentUser.name}\n${currentUser.contactEmail || currentUser.email}`
    );
    window.location.href = `mailto:${sellerEmail}?subject=${subject}&body=${body}`;
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setAiResult(null);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Marketplace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 dark:text-stone-100">
              Campus Marketplace
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            Browse active textbooks, electronics, dorm essentials, and student services with Gemini AI search.
          </p>
        </div>

        <Button
          variant="default"
          size="md"
          onClick={onCreateListing}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs shrink-0"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          <span>Create Listing</span>
        </Button>
      </div>

      {/* Search & Sort Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input with AI Indicator */}
        <div className="relative flex-1">
          {isAiSearching ? (
            <Loader2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          )}

          <input
            type="text"
            id="marketplace-search-input"
            placeholder="Try natural search: 'cheap casio calculator under 500' or 'first year physics notes'..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-20 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs transition-colors"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              title="Semantic search powered by Gemini 2.5 Flash"
            >
              <Sparkles className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
              AI
            </span>
          </div>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-stone-500 dark:text-stone-400" />
          <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-semibold bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg px-2.5 py-2 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="newest">Recently Listed</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* AI Semantic Search Interpretation Bar */}
      {aiResult && (aiResult.category || aiResult.maxBudget || aiResult.searchTerms.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>AI Intent:</span>
          </div>

          {aiResult.searchTerms.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 border border-emerald-200 dark:border-emerald-800/80 text-stone-700 dark:text-stone-300">
              <span className="text-stone-400 text-[10px]">Keywords:</span>
              <span className="font-semibold">{aiResult.searchTerms.join(', ')}</span>
            </div>
          )}

          {aiResult.category && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 border border-emerald-200 dark:border-emerald-800/80 text-stone-700 dark:text-stone-300">
              <Tag className="w-3 h-3 text-emerald-600" />
              <span className="text-stone-400 text-[10px]">Category:</span>
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">{aiResult.category}</span>
            </div>
          )}

          {aiResult.maxBudget && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 border border-emerald-200 dark:border-emerald-800/80 text-stone-700 dark:text-stone-300">
              <BadgePercent className="w-3 h-3 text-emerald-600" />
              <span className="text-stone-400 text-[10px]">Budget Cap:</span>
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">≤ ₹{aiResult.maxBudget}</span>
            </div>
          )}

          <button
            onClick={handleClearSearch}
            className="ml-auto text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Reset
          </button>
        </div>
      )}

      {/* Category Pills Filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        itemCounts={categoryCounts}
      />

      {/* Active Listings Counter & Filter Badge */}
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
        <span>
          Showing <strong className="text-stone-900 dark:text-stone-100">{filteredListings.length}</strong> active items
          {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          {searchTerm && ` for "${searchTerm}"`}
        </span>
        {(selectedCategory !== 'All' || searchTerm) && (
          <button
            onClick={() => {
              setSelectedCategory('All');
              handleClearSearch();
            }}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-semibold hover:underline cursor-pointer"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-12 text-center space-y-3">
          <ShoppingBag className="w-10 h-10 text-stone-400 dark:text-stone-500 mx-auto" />
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">No matching listings found</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
            Try adjusting your search terms or category selection, or create a listing for fellow students.
          </p>
          <div className="pt-2">
            <Button
              variant="default"
              size="sm"
              onClick={onCreateListing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Create Listing Now
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              seller={users[listing.ownerId]}
              currentUser={currentUser}
              isOwner={currentUser?.uid === listing.ownerId}
              onContactSeller={handleContactSeller}
              onMarkCompleted={onMarkListingCompleted}
              onGatedAction={onGatedAction}
            />
          ))}
        </div>
      )}
    </div>
  );
};
