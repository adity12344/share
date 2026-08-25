import React, { useState } from 'react';
import { Listing, User, IntendedAction, AIDealCheckResult, CategoryType } from '../types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { checkAIDeal } from '../lib/gemini';
import { toast } from 'sonner';
import {
  Mail,
  CheckCircle2,
  Check,
  Clock,
  Sparkles,
  Loader2,
  RotateCw,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Cpu,
  Wrench,
  Compass,
  Home,
  Package,
} from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
  seller?: User;
  currentUser: User | null;
  onContactSeller: (listing: Listing, sellerEmail: string) => void;
  onMarkCompleted?: (listingId: string, ownerId: string) => void;
  onGatedAction?: (action: IntendedAction) => void;
  isOwner?: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  seller,
  currentUser,
  onContactSeller,
  onMarkCompleted,
  onGatedAction,
  isOwner = false,
}) => {
  const sellerName = seller?.name || listing.ownerName || 'SRM Student';
  const sellerEmail = seller?.contactEmail || seller?.email || listing.ownerEmail || 'student@srmist.edu.in';
  const isVerified = seller?.verified ?? listing.ownerVerified ?? false;
  const exchanges = seller?.successfulExchanges ?? listing.ownerExchanges ?? 0;

  // Image Fallback Handling
  const [imageError, setImageError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // AI Deal Checker State
  const [dealState, setDealState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [dealResult, setDealResult] = useState<AIDealCheckResult | null>(null);
  const [dealError, setDealError] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const formatPrice = (price: number) => {
    if (price === 0) return 'FREE';
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(seconds / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getCategoryFallbackIcon = (category: CategoryType) => {
    switch (category) {
      case 'Textbooks':
        return <BookOpen className="w-10 h-10 text-amber-600 dark:text-amber-400" />;
      case 'Electronics':
        return <Cpu className="w-10 h-10 text-cyan-600 dark:text-cyan-400" />;
      case 'Services':
        return <Wrench className="w-10 h-10 text-purple-600 dark:text-purple-400" />;
      case 'Opportunities':
        return <Compass className="w-10 h-10 text-blue-600 dark:text-blue-400" />;
      case 'Dorm Essentials':
        return <Home className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Package className="w-10 h-10 text-stone-600 dark:text-stone-400" />;
    }
  };

  const handleDealCheck = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!currentUser) {
      if (onGatedAction) {
        onGatedAction({
          type: 'CONTACT_SELLER',
          email: sellerEmail,
          title: listing.title,
          price: listing.price,
        });
      }
      toast.error('Please sign in with your college account to use the AI Deal Checker.');
      return;
    }

    setDealState('loading');
    setDealError(null);

    try {
      const result = await checkAIDeal(
        {
          title: listing.title,
          category: listing.category,
          price: listing.price,
          description: listing.description,
        },
        currentUser.uid
      );

      setDealResult(result);
      setDealState('success');
    } catch (err: any) {
      console.error('Deal check error:', err);
      setDealError(
        err?.message && !err.message.includes('fetch')
          ? err.message
          : 'Deal check unavailable right now.'
      );
      setDealState('error');
    }
  };

  const isCompleted = listing.status === 'COMPLETED';

  return (
    <div
      className={`group flex flex-col rounded-xl border-2 transition-all duration-200 bg-white dark:bg-[#1c1a18] p-3 ${
        isCompleted
          ? 'border-stone-400 dark:border-stone-800 opacity-80 shadow-[3px_3px_0px_0px_#78716c]'
          : 'border-stone-900 dark:border-stone-700 shadow-[4px_4px_0px_0px_#1e1c1a] dark:shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#1e1c1a] dark:hover:shadow-[6px_6px_0px_0px_#000000] hover:-translate-y-0.5'
      }`}
    >
      {/* Photo Frame Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border-2 border-stone-900 dark:border-stone-700 bg-stone-100 dark:bg-stone-900">
        {!imageError && listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className={`h-full w-full object-cover transition-transform duration-300 ${
              isCompleted ? 'grayscale contrast-125' : 'group-hover:scale-105'
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 dark:bg-stone-800/80 p-4 text-center select-none">
            <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border-2 border-stone-900 dark:border-stone-700 shadow-2xs mb-1.5">
              {getCategoryFallbackIcon(listing.category)}
            </div>
            <span className="text-[11px] font-mono font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              {listing.category} Item
            </span>
          </div>
        )}

        {/* Top Category and Price Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <Badge variant="category" category={listing.category} className="shadow-retro-sm">
            {listing.category}
          </Badge>

          {isCompleted ? (
            <span className="bg-rose-600 text-white font-bebas text-sm tracking-wider px-2 py-0.5 rounded border border-stone-900 shadow-retro-sm">
              EXCHANGED
            </span>
          ) : (
            <span className="bg-amber-400 text-stone-950 font-bebas text-lg tracking-wider px-2.5 py-0.5 rounded border-2 border-stone-900 shadow-retro-sm">
              {formatPrice(listing.price)}
            </span>
          )}
        </div>
      </div>

      {/* Polaroid Handwritten Caption / Body */}
      <div className="pt-3 pb-1 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mb-1">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              {formatTimeAgo(listing.createdAt)}
            </span>
            <span className="text-stone-400 dark:text-stone-500 font-mono text-[10px] uppercase">
              REC #{listing.id.slice(-4)}
            </span>
          </div>

          <h4 className="font-bold font-sans text-stone-900 dark:text-stone-100 text-base leading-snug line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {listing.title}
          </h4>

          <p className="text-stone-600 dark:text-stone-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {listing.description}
          </p>

          {/* AI Deal Checker Secondary Action */}
          {!isCompleted && (
            <div className="mt-3 pt-2.5 border-t-2 border-dashed border-stone-200 dark:border-stone-800">
              {dealState === 'idle' && (
                <button
                  type="button"
                  id={`deal-check-btn-${listing.id}`}
                  onClick={handleDealCheck}
                  className="group/deal flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-stone-800 dark:text-stone-200 hover:text-stone-950 dark:hover:text-white bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border-2 border-stone-900 dark:border-stone-700 shadow-[2px_2px_0px_0px_#1e1c1a] dark:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                  title="Check if this price is fair or a great deal with AI"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover/deal:rotate-12 transition-transform" />
                    <span className="font-bebas text-sm tracking-wider uppercase">AI Deal Check ✨</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono font-medium text-stone-500 dark:text-stone-400">Evaluate</span>
                </button>
              )}

              {dealState === 'loading' && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 bg-amber-50/60 dark:bg-stone-800/80 border-2 border-stone-900 dark:border-stone-700">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-xs truncate font-mono">Evaluating price tape...</span>
                </div>
              )}

              {dealState === 'error' && (
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs bg-rose-50 dark:bg-rose-950/40 border-2 border-stone-900 dark:border-rose-900 text-rose-800 dark:text-rose-300">
                  <span className="truncate text-[11px] font-medium">{dealError || 'Deal check unavailable.'}</span>
                  <button
                    type="button"
                    onClick={handleDealCheck}
                    className="flex items-center gap-1 text-[11px] font-bold text-rose-900 dark:text-rose-200 underline shrink-0 cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                </div>
              )}

              {dealState === 'success' && dealResult && (
                <div className="space-y-1.5 p-2 rounded-lg bg-[#fbf8f1] dark:bg-stone-800/80 border-2 border-stone-900 dark:border-stone-700 shadow-[2px_2px_0px_0px_#1e1c1a] dark:shadow-[2px_2px_0px_0px_#000000]">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    {dealResult.verdict === 'Great Deal' && (
                      <Badge variant="deal-great" className="font-extrabold text-[10px] px-2 py-0.5">
                        🟢 Great Deal
                      </Badge>
                    )}
                    {dealResult.verdict === 'Fair Price' && (
                      <Badge variant="deal-fair" className="font-extrabold text-[10px] px-2 py-0.5">
                        🟡 Fair Price
                      </Badge>
                    )}
                    {dealResult.verdict === 'Overpriced' && (
                      <Badge variant="deal-overpriced" className="font-extrabold text-[10px] px-2 py-0.5">
                        🔴 Overpriced
                      </Badge>
                    )}

                    <span className="text-[11px] font-mono font-bold text-stone-800 dark:text-stone-200">
                      Est: ₹{dealResult.estimatedValue.toLocaleString('en-IN')}
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowExplanation((prev) => !prev)}
                      className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer ml-auto"
                      aria-expanded={showExplanation}
                    >
                      <span>Tape Notes</span>
                      {showExplanation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {showExplanation && (
                    <p className="text-[11px] text-stone-700 dark:text-stone-300 leading-snug pt-1 border-t border-stone-300 dark:border-stone-700 font-sans">
                      {dealResult.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Seller Info & Action Footer */}
        <div className="mt-3.5 pt-3 border-t-2 border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              {!avatarError && (seller?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150') ? (
                <img
                  src={seller?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="w-7 h-7 rounded-full object-cover border-2 border-stone-900 dark:border-stone-700 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-amber-200 dark:bg-amber-900 border-2 border-stone-900 dark:border-stone-700 flex items-center justify-center font-bold text-stone-900 dark:text-stone-100 text-[10px] shrink-0">
                  {sellerName.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                    {sellerName}
                  </span>
                  {isVerified && (
                    <span title="Verified SRM Student">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block truncate font-mono">
                  {exchanges > 0 ? `${exchanges} campus swaps` : 'Student member'}
                </span>
              </div>
            </div>

            {isVerified && (
              <Badge variant="verified" className="text-[9px] py-0 px-1.5 shrink-0 hidden sm:inline-flex">
                SRM VERIFIED
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isOwner ? (
              isCompleted ? (
                <div className="w-full text-center py-2 text-xs font-bold text-stone-600 dark:text-stone-400 bg-stone-200 dark:bg-stone-800 rounded-lg border-2 border-stone-400 dark:border-stone-700 font-mono">
                  EXCHANGE CLOSED
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMarkCompleted && onMarkCompleted(listing.id, listing.ownerId)}
                  className="w-full text-xs font-bold border-2 border-emerald-700 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Mark Completed
                </Button>
              )
            ) : isCompleted ? (
              <Button
                variant="secondary"
                size="sm"
                disabled
                className="w-full text-xs opacity-60"
              >
                No Longer Available
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => onContactSeller(listing, sellerEmail)}
                className="w-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Seller</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

