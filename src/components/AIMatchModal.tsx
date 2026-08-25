import React from 'react';
import { WantedItem, Listing, User, AIMatchItem } from '../types';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import {
  Sparkles,
  Loader2,
  Mail,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Tag,
  ExternalLink,
} from 'lucide-react';

interface AIMatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wantedItem: WantedItem | null;
  matches: AIMatchItem[];
  loading: boolean;
  error: string | null;
  listings: Listing[];
  users: Record<string, User>;
  currentUser: User | null;
  onContactSeller: (listing: Listing, sellerEmail: string) => void;
  onRetry?: () => void;
}

export const AIMatchModal: React.FC<AIMatchModalProps> = ({
  open,
  onOpenChange,
  wantedItem,
  matches,
  loading,
  error,
  listings,
  users,
  currentUser,
  onContactSeller,
  onRetry,
}) => {
  if (!wantedItem) return null;

  // Map listings for fast O(1) lookup
  const listingsMap = new Map<string, Listing>();
  listings.forEach((l) => listingsMap.set(l.id, l));

  // Filter matches with score >= 50 as strong candidates
  const qualifyingMatches = matches.filter((m) => m.matchScore >= 50);

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
    }
    if (score >= 50) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-700';
    }
    return 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-300 dark:border-stone-700';
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec.toLowerCase()) {
      case 'connect':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
            <Sparkles className="w-3 h-3" /> Connect
          </span>
        );
      case 'maybe':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-600 text-white shadow-2xs">
            <TrendingUp className="w-3 h-3" /> Potential Match
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-stone-500 text-white shadow-2xs">
            Low Match
          </span>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      maxWidth="xl"
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">AI Marketplace Match Engine</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Powered by Gemini
              </span>
            </div>
          </div>
        </div>
      }
      description={
        <span>
          Matching active campus listings against request: <strong>&ldquo;{wantedItem.title}&rdquo;</strong>{' '}
          (Target Budget: {wantedItem.budget === 0 ? 'Flexible' : `₹${wantedItem.budget}`})
        </span>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Loading State */}
        {loading && (
          <div className="py-12 px-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Scanning listings...
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                Comparing conceptual relevance, student budget limits, and category fit across active listings.
              </p>
            </div>
          </div>
        )}

        {/* Error or Empty State (No matches reaching 50% or error) */}
        {!loading && (error || qualifyingMatches.length === 0) && (
          <div className="py-10 px-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                No strong AI matches found right now. Check back soon!
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                {error
                  ? error
                  : 'We analyzed current active listings on campus, but none scored above 50% compatibility with your specific request and budget.'}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              {onRetry && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="text-xs font-semibold border-stone-300 dark:border-stone-700"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                  Re-Scan Listings
                </Button>
              )}
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="bg-stone-900 dark:bg-stone-100 dark:text-stone-900 text-white text-xs font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {/* Matches Found List */}
        {!loading && qualifyingMatches.length > 0 && (
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
              <span>
                Found <strong>{qualifyingMatches.length}</strong> compatible campus listing
                {qualifyingMatches.length === 1 ? '' : 's'}:
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Sorted by AI Match Score
              </span>
            </div>

            {qualifyingMatches.map((match) => {
              const listing = listingsMap.get(match.listingId);
              if (!listing) return null;

              // Lookup seller contact details
              const seller = users[listing.ownerId];
              const sellerName = seller?.name || listing.ownerName || 'SRM Student';
              const sellerEmail =
                seller?.contactEmail ||
                seller?.email ||
                listing.ownerEmail ||
                'student@srmist.edu.in';
              const isVerified = seller?.verified ?? listing.ownerVerified ?? false;

              const isWithinBudget =
                wantedItem.budget === 0 || listing.price <= wantedItem.budget;

              return (
                <div
                  key={match.listingId}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-xs space-y-3.5"
                >
                  {/* Top Bar: Match Score & Recommendation */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-2.5 py-1 rounded-lg border text-xs font-black tracking-tight flex items-center gap-1.5 ${getScoreBadgeColor(
                          match.matchScore
                        )}`}
                      >
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>{match.matchScore}% MATCH</span>
                      </div>
                      {getRecommendationBadge(match.recommendation)}
                    </div>

                    <Badge variant="category" category={listing.category} className="text-[11px]">
                      {listing.category}
                    </Badge>
                  </div>

                  {/* Listing Snapshot */}
                  <div className="flex flex-col sm:flex-row items-start gap-3.5">
                    <img
                      src={listing.imageUrl || 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600'}
                      alt=""
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                      className="w-full sm:w-24 h-28 sm:h-24 rounded-xl object-cover border border-stone-200 dark:border-stone-800 shrink-0 bg-stone-100 dark:bg-stone-800"
                    />

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm leading-snug">
                          {listing.title}
                        </h4>
                        <span className="font-extrabold text-stone-900 dark:text-stone-100 text-sm shrink-0">
                          ₹{listing.price.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                        {listing.description}
                      </p>

                      {/* Budget comparison note */}
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Tag className="w-3 h-3 text-stone-400" />
                        <span className="text-stone-500 dark:text-stone-400">Budget Comparison:</span>
                        {isWithinBudget ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Within Target Budget (₹{wantedItem.budget})
                          </span>
                        ) : (
                          <span className="font-medium text-amber-600 dark:text-amber-400">
                            ₹{listing.price - wantedItem.budget} above target (₹{wantedItem.budget})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Explanation Box */}
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-300">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Why Gemini matched this listing:</span>
                    </div>
                    <p className="leading-relaxed text-[11px] text-stone-700 dark:text-stone-300">
                      {match.explanation || 'Direct match for requested category, topic keywords, and campus exchange.'}
                    </p>
                  </div>

                  {/* Footer: Seller info & Direct Contact Button */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={seller?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                            {sellerName}
                          </span>
                          {isVerified && (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => onContactSeller(listing, sellerEmail)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-1.5 px-3.5 shadow-2xs flex items-center gap-1.5 shrink-0"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Contact Seller</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Dialog>
  );
};
