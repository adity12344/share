import React from 'react';
import { WantedItem, User } from '../types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import {
  Mail,
  CheckCircle2,
  Check,
  HelpCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface WantedCardProps {
  wanted: WantedItem;
  requester?: User;
  currentUser: User | null;
  onOfferWanted: (wanted: WantedItem, requesterEmail: string) => void;
  onFindAIMatches?: (wanted: WantedItem) => void;
  onMarkCompleted?: (wantedId: string, userId: string) => void;
  isOwner?: boolean;
  isMatching?: boolean;
}

export const WantedCard: React.FC<WantedCardProps> = ({
  wanted,
  requester,
  currentUser,
  onOfferWanted,
  onFindAIMatches,
  onMarkCompleted,
  isOwner = false,
  isMatching = false,
}) => {
  const [avatarError, setAvatarError] = React.useState(false);
  const requesterName = requester?.name || wanted.userName || 'SRM Student';
  const requesterEmail = requester?.contactEmail || requester?.email || wanted.userEmail || 'student@srmist.edu.in';
  const isVerified = requester?.verified ?? wanted.userVerified ?? false;
  const exchanges = requester?.successfulExchanges ?? wanted.userExchanges ?? 0;
  const isCompleted = wanted.status === 'COMPLETED';

  const formatBudget = (budget: number) => {
    if (budget === 0) return 'Flexible / Free';
    return `₹${budget.toLocaleString('en-IN')}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div
      className={`group flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 bg-white dark:bg-stone-900 ${
        isCompleted
          ? 'border-stone-200 dark:border-stone-800 opacity-75 bg-stone-50/50 dark:bg-stone-900/50'
          : 'border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md'
      }`}
    >
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
            <Badge variant="category" category={wanted.category} className="text-[11px]">
              {wanted.category}
            </Badge>
          </div>

          {isCompleted ? (
            <Badge variant="status-completed">FULFILLED</Badge>
          ) : (
            <div className="flex items-center text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
              <span>Budget: {formatBudget(wanted.budget)}</span>
            </div>
          )}
        </div>

        {/* Title & Description */}
        <h4 className="font-bold text-stone-900 dark:text-stone-100 text-base leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
          {wanted.title}
        </h4>

        <p className="text-stone-600 dark:text-stone-400 text-xs mt-2.5 line-clamp-3 leading-relaxed">
          {wanted.description}
        </p>
      </div>

      {/* Requester & Action Footer */}
      <div className="mt-5 pt-3.5 border-t border-stone-100 dark:border-stone-800 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {!avatarError && (requester?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150') ? (
              <img
                src={requester?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="w-7 h-7 rounded-full object-cover border border-stone-200 dark:border-stone-700 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950 border border-stone-300 dark:border-stone-700 flex items-center justify-center font-bold text-stone-900 dark:text-stone-100 text-[10px] shrink-0">
                {requesterName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                  {requesterName}
                </span>
                {isVerified && (
                  <span title="Verified SRM Student">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  </span>
                )}
              </div>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 block truncate">
                {exchanges > 0 ? `${exchanges} successful exchanges` : 'Active Student Requester'}
              </span>
            </div>
          </div>

          <span className="text-[11px] text-stone-400 dark:text-stone-500 font-medium shrink-0">
            {formatTimeAgo(wanted.createdAt)}
          </span>
        </div>

        {/* Action Buttons */}
        {!isCompleted && (
          <div className="space-y-2 pt-1">
            {/* Prominent Find AI Matches Button */}
            {onFindAIMatches && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onFindAIMatches(wanted)}
                disabled={isMatching}
                className="w-full text-xs font-bold border-emerald-300 dark:border-emerald-700/80 bg-linear-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/60 dark:via-stone-900 dark:to-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:border-emerald-500 hover:text-emerald-900 dark:hover:text-emerald-200 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                {isMatching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                    <span>Scanning listings...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                    <span>Find AI Matches ✨</span>
                  </>
                )}
              </Button>
            )}

            {isOwner ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkCompleted && onMarkCompleted(wanted.id, wanted.userId)}
                className="w-full text-xs font-medium border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Mark Request as COMPLETED
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => onOfferWanted(wanted, requesterEmail)}
                className="w-full text-xs font-semibold bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 text-white shadow-2xs flex items-center justify-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                <span>I Have This / Contact Requester</span>
              </Button>
            )}
          </div>
        )}

        {isCompleted && (
          <div className="w-full text-center py-2 text-xs font-semibold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 rounded-lg">
            Request Fulfilled & Closed
          </div>
        )}
      </div>
    </div>
  );
};
