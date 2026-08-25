import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Listing,
  WantedItem,
  User,
  CategoryType,
  ViewType,
  IntendedAction,
  AIMatchItem,
  AISearchResult,
} from '../types';
import { CategoryFilter } from '../components/CategoryFilter';
import { ListingCard } from '../components/ListingCard';
import { WantedCard } from '../components/WantedCard';
import { CampusPulse } from '../components/CampusPulse';
import { AIMatchModal } from '../components/AIMatchModal';
import { Button } from '../components/ui/Button';
import { performSemanticSearch, findAIMatches } from '../lib/gemini';
import { toast } from 'sonner';
import {
  Search,
  PlusCircle,
  HelpCircle,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  Sparkles,
  Loader2,
  Tag,
  BadgePercent,
  Compass,
  Zap,
  Disc,
  Star,
} from 'lucide-react';

interface HomeViewProps {
  listings: Listing[];
  wanted: WantedItem[];
  users: Record<string, User>;
  currentUser: User | null;
  onNavigate: (view: ViewType) => void;
  onCreateListing: () => void;
  onPostWanted: () => void;
  onGatedAction: (action: IntendedAction) => void;
  onMarkListingCompleted: (listingId: string, ownerId: string) => void;
  onMarkWantedCompleted: (wantedId: string, userId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  listings,
  wanted,
  users,
  currentUser,
  onNavigate,
  onCreateListing,
  onPostWanted,
  onGatedAction,
  onMarkListingCompleted,
  onMarkWantedCompleted,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All'>('All');

  // AI Semantic Search State
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResult, setAiResult] = useState<AISearchResult | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // AI Match Modal State
  const [aiMatchModalOpen, setAiMatchModalOpen] = useState(false);
  const [activeWantedForMatch, setActiveWantedForMatch] = useState<WantedItem | null>(null);
  const [matchingWantedId, setMatchingWantedId] = useState<string | null>(null);
  const [aiMatches, setAiMatches] = useState<AIMatchItem[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  const searchSuggestions = [
    'cheap calculator under 500',
    'engineering mechanics textbook',
    'python tutor',
    'free physics notes',
    'lab apron & coat',
  ];

  // 500ms Debounced AI Search
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
        console.warn('Semantic search fallback:', err);
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

  // Filter listings based on search term / AI intent and category
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      if (item.status !== 'OPEN') return false;

      // Category filter
      let matchesCategory = true;
      if (selectedCategory !== 'All') {
        matchesCategory = item.category === selectedCategory;
      } else if (aiResult?.category) {
        matchesCategory = item.category === aiResult.category;
      }
      if (!matchesCategory) return false;

      // Budget filter
      if (aiResult?.maxBudget && item.price > aiResult.maxBudget) {
        return false;
      }

      // Search terms matching
      if (!searchTerm.trim()) return true;

      if (aiResult && aiResult.searchTerms.length > 0) {
        const itemText = `${item.title} ${item.description} ${item.category}`.toLowerCase();
        return aiResult.searchTerms.some((term) =>
          itemText.includes(term.toLowerCase())
        );
      }

      const lower = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower)
      );
    });
  }, [listings, selectedCategory, searchTerm, aiResult]);

  // Filter wanted items
  const filteredWanted = useMemo(() => {
    return wanted.filter((item) => {
      if (item.status !== 'OPEN') return false;
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        !searchTerm.trim() ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [wanted, selectedCategory, searchTerm]);

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
    const subject = encodeURIComponent(`[SHARE SRMIST] Regarding: ${listing.title}`);
    const body = encodeURIComponent(
      `Hi,\n\nI saw your listing for "${listing.title}" on SHARE SRMIST (₹${listing.price}). I am interested in purchasing/exchanging. Are you free to meet on campus?\n\nBest regards,\n${currentUser.name}\n${currentUser.contactEmail || currentUser.email}`
    );
    window.location.href = `mailto:${sellerEmail}?subject=${subject}&body=${body}`;
  };

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
    const subject = encodeURIComponent(`[SHARE SRMIST] Offer for your request: ${wantedItem.title}`);
    const body = encodeURIComponent(
      `Hi,\n\nI saw your wanted request for "${wantedItem.title}" on SHARE SRMIST. I have this available on campus!\n\nBest regards,\n${currentUser.name}\n${currentUser.contactEmail || currentUser.email}`
    );
    window.location.href = `mailto:${requesterEmail}?subject=${subject}&body=${body}`;
  };

  const handleFindAIMatches = async (wantedItem: WantedItem) => {
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
      if (results.length > 0 && results.some((r) => r.matchScore >= 50)) {
        toast.success(`Found ${results.filter((r) => r.matchScore >= 50).length} high-confidence AI matches!`);
      }
    } catch (err: any) {
      console.error('Error finding AI matches:', err);
      setMatchError(err?.message || 'Unable to scan campus listings.');
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
    const subject = encodeURIComponent(`[SHARE SRMIST AI Match] Regarding your listing: ${listing.title}`);
    const body = encodeURIComponent(
      `Hi,\n\nI found your listing for "${listing.title}" (₹${listing.price}) via SHARE's AI Match Engine for my wanted request "${activeWantedForMatch?.title || ''}".\n\nIs this available to meet on campus?\n\nBest regards,\n${currentUser.name}\n${currentUser.contactEmail || currentUser.email}`
    );
    window.location.href = `mailto:${sellerEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Section - Tactile Retro Poster */}
      <section className="relative overflow-hidden rounded-2xl bg-amber-400 dark:bg-stone-900 text-stone-950 dark:text-stone-100 p-6 sm:p-10 lg:p-12 border-2 border-stone-900 dark:border-stone-700 shadow-[6px_6px_0px_0px_#1e1c1a] dark:shadow-[6px_6px_0px_0px_#000000]">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e1c1a_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

        {/* Floating Retro Decorations (Responsive & Pointer-Events-None) */}
        {/* Decoration 1: Top-Right Retro Cassette Tape Sticker */}
        <div className="hidden sm:flex absolute top-5 right-6 z-0 pointer-events-none select-none items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/95 dark:bg-stone-800/95 text-stone-900 dark:text-amber-300 text-[10px] font-mono font-bold border-2 border-stone-900 dark:border-stone-600 shadow-retro-sm rotate-3 animate-float opacity-85">
          <Disc className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
          <span>CAMPUSSETTE • VOL 01</span>
        </div>

        {/* Decoration 2: Top-Left Pixel Star Stamp */}
        <div className="hidden sm:flex absolute top-6 left-6 z-0 pointer-events-none select-none items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-900 text-amber-300 text-[10px] font-mono font-black border border-amber-300 shadow-2xs -rotate-6 animate-float-slow opacity-80" style={{ animationDelay: '1s' }}>
          <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
          <span>100% PEER-TO-PEER</span>
        </div>

        {/* Decoration 3: Bottom-Left Retro Campus Stamp */}
        <div className="hidden lg:flex absolute bottom-6 left-6 z-0 pointer-events-none select-none items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 text-[10px] font-mono font-bold border-2 border-emerald-800 shadow-retro-sm -rotate-3 animate-float-reverse opacity-90">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>ZERO BROKERAGE</span>
        </div>

        {/* Decoration 4: Bottom-Right Polaroid Mini Badge */}
        <div className="hidden md:flex absolute bottom-6 right-6 z-0 pointer-events-none select-none items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 dark:bg-stone-800 text-stone-900 dark:text-stone-200 text-[10px] font-mono font-bold border-2 border-stone-900 dark:border-stone-600 shadow-retro-sm rotate-2 animate-float opacity-85" style={{ animationDelay: '2s' }}>
          <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>AI MATCH ACTIVE</span>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {/* Trust Badge with subtle pulseGlow */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900 text-amber-300 dark:bg-amber-400 dark:text-stone-950 text-xs font-bold font-mono tracking-wider border-2 border-stone-900 shadow-retro-sm animate-fade-in-up animate-pulse-glow"
            style={{ animationDelay: '0ms' }}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-800" />
            <span>EXCLUSIVE TO SRM INSTITUTE OF SCIENCE & TECHNOLOGY</span>
          </div>

          {/* Staggered Heading Words */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bebas tracking-wide leading-none text-stone-950 dark:text-stone-50 uppercase">
              <span
                className="inline-block animate-fade-in-up mr-3"
                style={{ animationDelay: '100ms' }}
              >
                CAMPUS
              </span>
              <span
                className="inline-block animate-fade-in-up"
                style={{ animationDelay: '250ms' }}
              >
                EXCHANGE
              </span>
            </h1>
            <p
              className="text-base sm:text-xl font-bold font-sans text-stone-900 dark:text-stone-200 animate-fade-in-up"
              style={{ animationDelay: '350ms' }}
            >
              Buy, Sell & Exchange Inside Your Campus • Resources • Services • Opportunities
            </p>
          </div>

          <p
            className="text-xs sm:text-sm text-stone-800 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed font-medium animate-fade-in-up"
            style={{ animationDelay: '380ms' }}
          >
            Pass on textbooks, electronics, dorm essentials, lab equipment, and student tutoring with instant Gemini AI search and automated match engine.
          </p>

          {/* Core Product Loop Micro-Graphic */}
          <div
            className="flex flex-wrap items-center justify-center gap-2 py-1 text-xs font-mono font-bold animate-fade-in-up"
            style={{ animationDelay: '420ms' }}
          >
            <div className="px-3 py-1 bg-white dark:bg-stone-800 border-2 border-stone-900 dark:border-stone-600 rounded-md shadow-2xs">
              1. HAVE
            </div>
            <span className="text-stone-900 dark:text-stone-100">➔</span>
            <div className="px-3 py-1 bg-white dark:bg-stone-800 border-2 border-stone-900 dark:border-stone-600 rounded-md shadow-2xs">
              2. LIST
            </div>
            <span className="text-stone-900 dark:text-stone-100">➔</span>
            <div className="px-3 py-1 bg-white dark:bg-stone-800 border-2 border-stone-900 dark:border-stone-600 rounded-md shadow-2xs">
              3. MATCH
            </div>
            <span className="text-stone-900 dark:text-stone-100">➔</span>
            <div className="px-3 py-1 bg-white dark:bg-stone-800 border-2 border-stone-900 dark:border-stone-600 rounded-md shadow-2xs text-emerald-700 dark:text-emerald-400">
              4. EXCHANGE
            </div>
          </div>

          {/* Interactive Search Bar with PopIn entrance and Focus Micro-Interactions */}
          <div
            className="pt-2 max-w-2xl mx-auto space-y-3 animate-pop-in"
            style={{ animationDelay: '550ms' }}
          >
            <div className="relative flex items-center rounded-xl bg-white dark:bg-stone-800 p-1.5 border-2 border-stone-900 dark:border-stone-700 shadow-retro transition-[transform,box-shadow,border-color] duration-200 focus-within:-translate-y-0.5 focus-within:shadow-[5px_5px_0px_0px_#1e1c1a] dark:focus-within:shadow-[5px_5px_0px_0px_#000000] focus-within:border-amber-500">
              {isAiSearching ? (
                <Loader2 className="w-5 h-5 text-amber-500 ml-3 shrink-0 animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-stone-500 ml-3 shrink-0" />
              )}
              <input
                type="text"
                id="hero-search-input"
                placeholder="Search: 'cheap calculator under 500' or 'physics notes'..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-stone-900 dark:text-stone-100 text-sm font-medium placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none bg-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 px-2 font-bold cursor-pointer transition-colors"
                >
                  Clear
                </button>
              )}
              <Button
                variant="retro-amber"
                size="sm"
                onClick={() => onNavigate('marketplace')}
                className="font-bold rounded-lg shrink-0 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Search</span>
              </Button>
            </div>

            {/* Quick Search Suggestion Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
              <span className="font-mono font-bold text-[11px] text-stone-800 dark:text-stone-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Suggestions:
              </span>
              {searchSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchTerm(sug)}
                  className="px-2.5 py-1 rounded bg-white/90 dark:bg-stone-800/90 text-stone-900 dark:text-stone-100 text-[11px] font-bold border border-stone-900 dark:border-stone-700 shadow-2xs hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer transition-[transform,background-color] duration-150 hover:scale-[1.03] active:scale-[0.98]"
                >
                  "{sug}"
                </button>
              ))}
            </div>

            {/* AI Intent Preview Chips */}
            {aiResult && (aiResult.category || aiResult.maxBudget || aiResult.searchTerms.length > 0) && (
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs animate-fade-in-up">
                <span className="flex items-center gap-1 text-stone-900 dark:text-amber-400 font-bold text-[11px]">
                  <Sparkles className="w-3 h-3" /> AI Intent:
                </span>
                {aiResult.searchTerms.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-stone-900 text-amber-300 dark:bg-stone-800 dark:text-stone-200 text-[11px] font-mono border border-stone-900">
                    {aiResult.searchTerms.join(', ')}
                  </span>
                )}
                {aiResult.category && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 text-[11px] font-bold border border-emerald-600">
                    <Tag className="w-2.5 h-2.5" /> {aiResult.category}
                  </span>
                )}
                {aiResult.maxBudget && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 text-[11px] font-bold border border-emerald-600">
                    <BadgePercent className="w-2.5 h-2.5" /> ≤ ₹{aiResult.maxBudget}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quick Action Badges */}
          <div
            className="flex flex-wrap items-center justify-center gap-3 pt-2 animate-fade-in-up"
            style={{ animationDelay: '650ms' }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('marketplace')}
              className="bg-white dark:bg-stone-800 text-stone-950 dark:text-stone-100 text-xs font-bold"
            >
              <Compass className="w-4 h-4 text-amber-600 mr-1.5" />
              Explore Campus
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onCreateListing}
              className="text-xs font-bold"
            >
              <PlusCircle className="w-4 h-4 text-amber-300 mr-1.5" />
              Post Something
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onPostWanted}
              className="bg-white dark:bg-stone-800 text-stone-950 dark:text-stone-100 text-xs font-bold"
            >
              <HelpCircle className="w-4 h-4 text-amber-600 mr-1.5" />
              Post Request
            </Button>
          </div>
        </div>
      </section>

      {/* Category Pills Filter */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-stone-600 dark:text-stone-400">
            Browse By Category
          </h3>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer transition-colors"
            >
              Reset to All
            </button>
          )}
        </div>
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </section>

      {/* Campus Pulse Trending Widget */}
      <section>
        <CampusPulse
          listings={listings}
          wanted={wanted}
          users={users}
          onSelectListing={() => onNavigate('marketplace')}
          onSelectWanted={() => onNavigate('wanted')}
          onViewMarketplace={() => onNavigate('marketplace')}
          onViewWanted={() => onNavigate('wanted')}
        />
      </section>

      {/* Featured Active Listings Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bebas tracking-wide text-stone-950 dark:text-stone-100 uppercase">
              Campus Marketplace
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
              {filteredListings.length} verified listings available for campus pickup
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('marketplace')}
            className="text-xs font-bold"
          >
            <span>View All ({listings.filter((l) => l.status === 'OPEN').length})</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        {filteredListings.length === 0 ? (
          <div className="rounded-2xl border-2 border-stone-900 dark:border-stone-700 bg-white dark:bg-stone-900 p-10 text-center space-y-3 shadow-retro-sm">
            <GraduationCap className="w-10 h-10 text-stone-400 dark:text-stone-500 mx-auto" />
            <p className="text-base font-bold text-stone-900 dark:text-stone-100">No active listings found</p>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              No open items match your current filter. Be the first to create one!
            </p>
            <Button size="sm" onClick={onCreateListing} variant="retro-amber">
              Create Listing
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredListings.slice(0, 8).map((listing) => (
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
      </section>

      {/* Wanted Board Preview */}
      <section className="space-y-4 pt-4 border-t-2 border-dashed border-stone-300 dark:border-stone-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bebas tracking-wide text-stone-950 dark:text-stone-100 uppercase">
              Student Wanted Board
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
              Peers looking for specific books, lab kits, project partners & room equipment
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('wanted')}
            className="text-xs font-bold"
          >
            <span>View All Requests ({wanted.filter((w) => w.status === 'OPEN').length})</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        {filteredWanted.length === 0 ? (
          <div className="rounded-2xl border-2 border-stone-900 dark:border-stone-700 bg-white dark:bg-stone-900 p-8 text-center space-y-2 shadow-retro-sm">
            <p className="text-sm font-bold text-stone-700 dark:text-stone-300">No open wanted requests</p>
            <Button size="sm" onClick={onPostWanted} variant="outline" className="text-xs font-bold">
              Post Request
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWanted.slice(0, 3).map((item) => (
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
      </section>

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
