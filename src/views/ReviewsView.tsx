import React, { useState, useMemo } from 'react';
import { User, CampusReview, ReviewCategory } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ReviewsDialog } from '../components/ReviewsDialog';
import {
  Star,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ThumbsUp,
  MessageSquarePlus,
  Filter,
  GraduationCap,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReviewsViewProps {
  currentUser: User | null;
  reviews: CampusReview[];
  onAddReview: (review: CampusReview) => void;
  onOpenAuth: () => void;
}

export const ReviewsView: React.FC<ReviewsViewProps> = ({
  currentUser,
  reviews,
  onAddReview,
  onOpenAuth,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ReviewCategory | 'All'>('All');
  const [leaveReviewOpen, setLeaveReviewOpen] = useState(false);
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});

  // Rating metrics calculations
  const totalReviews = reviews.length;
  const averageRating = useMemo(() => {
    if (totalReviews === 0) return 4.6;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return +(sum / totalReviews).toFixed(1);
  }, [reviews, totalReviews]);

  const ratingCounts = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[star] = (counts[star] || 0) + 1;
    });
    return counts;
  }, [reviews]);

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

  const handleLikeReview = (reviewId: string) => {
    setLikedReviews((prev) => {
      const isCurrentlyLiked = !!prev[reviewId];
      if (!isCurrentlyLiked) {
        toast.success('Marked as helpful feedback!');
      }
      return {
        ...prev,
        [reviewId]: !isCurrentlyLiked,
      };
    });
  };

  const filteredReviews = useMemo(() => {
    if (selectedCategory === 'All') return reviews;
    return reviews.filter((r) => r.category === selectedCategory);
  }, [reviews, selectedCategory]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="rounded-2xl border-2 border-stone-900 dark:border-stone-700 bg-[#faf6ee] dark:bg-[#1c1a18] p-6 sm:p-8 shadow-[4px_4px_0px_0px_#1e1c1a] dark:shadow-[4px_4px_0px_0px_#000000]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-400 text-stone-950 text-xs font-bold uppercase tracking-wider border-2 border-stone-900 shadow-retro-sm">
                <Star className="w-3.5 h-3.5 fill-stone-950 text-stone-950" />
                <span>Student Testimonials</span>
              </span>
              <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                SRMIST P2P NETWORK
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-sans text-stone-950 dark:text-stone-100 tracking-tight">
              Campus Reviews & Feedback
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-2xl">
              Authentic exchange ratings, textbook trade experiences, and safety feedback from verified SRM campus students.
            </p>
          </div>

          <Button
            variant="retro-amber"
            size="md"
            onClick={() => {
              if (!currentUser) {
                onOpenAuth();
              } else {
                setLeaveReviewOpen(true);
              }
            }}
            className="shrink-0 text-sm font-bold"
          >
            <MessageSquarePlus className="w-4 h-4 mr-1.5" />
            <span>Leave a Review</span>
          </Button>
        </div>

        {/* Rating Breakdown Dashboard */}
        <div className="mt-8 pt-6 border-t-2 border-dashed border-stone-300 dark:border-stone-700 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Main Average Box */}
          <div className="bg-white dark:bg-stone-900 border-2 border-stone-900 dark:border-stone-700 rounded-xl p-5 text-center shadow-[3px_3px_0px_0px_#1e1c1a] dark:shadow-[3px_3px_0px_0px_#000000]">
            <div className="text-4xl sm:text-5xl font-black text-stone-950 dark:text-stone-100 font-bebas tracking-wide">
              {averageRating} <span className="text-2xl font-mono text-stone-400">/ 5</span>
            </div>
            <div className="flex items-center justify-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-5 h-5 fill-amber-400 text-stone-950 stroke-[2]"
                />
              ))}
            </div>
            <p className="text-xs font-bold text-stone-700 dark:text-stone-300">
              Based on verified student feedback
            </p>
            <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 block mt-0.5">
              {totalReviews} student reviews logged
            </span>
          </div>

          {/* Distribution Bars */}
          <div className="md:col-span-2 space-y-2 bg-white dark:bg-stone-900 border-2 border-stone-900 dark:border-stone-700 rounded-xl p-5 shadow-[3px_3px_0px_0px_#1e1c1a] dark:shadow-[3px_3px_0px_0px_#000000]">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingCounts[star] || 0;
              const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs font-bold">
                  <span className="w-8 font-mono text-stone-700 dark:text-stone-300 shrink-0">
                    {star} ★
                  </span>
                  <div className="flex-1 h-3.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden border border-stone-900 dark:border-stone-700">
                    <div
                      className="h-full bg-amber-400 dark:bg-amber-500 rounded-full transition-all duration-700"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-stone-500 dark:text-stone-400 shrink-0">
                    {percentage}% ({count})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {(['All', 'Marketplace', 'Search', 'AI Assistant', 'Safety', 'User Experience', 'Other'] as const).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border-2 uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-400 text-stone-950 border-stone-900 shadow-[2px_2px_0px_0px_#1e1c1a]'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-stone-900'
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>

        <div className="text-xs font-mono text-stone-500 dark:text-stone-400">
          Showing {filteredReviews.length} student reviews
        </div>
      </div>

      {/* Review Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReviews.map((review) => {
          const isLiked = !!likedReviews[review.id];
          const displayedHelpful = (review.helpfulCount || 0) + (isLiked ? 1 : 0);

          return (
            <div
              key={review.id}
              className="rounded-xl border-2 border-stone-900 dark:border-stone-700 bg-white dark:bg-[#1c1a18] p-5 shadow-[3px_3px_0px_0px_#1e1c1a] dark:shadow-[3px_3px_0px_0px_#000000] flex flex-col justify-between hover:-translate-y-0.5 transition-transform"
            >
              <div>
                {/* Reviewer Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={
                        review.userAvatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                      }
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border-2 border-stone-900 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-stone-950 dark:text-stone-100 truncate">
                          {review.userName}
                        </span>
                        {review.verified && (
                          <span
                            className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800"
                            title="Verified SRM Student"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ✓ Verified Student
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(review.createdAt)}
                        </span>
                        <span>•</span>
                        <span className="font-bold text-amber-700 dark:text-amber-400">
                          {review.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Star Rating Badge */}
                  <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-md border border-stone-900 dark:border-stone-700">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= review.rating
                            ? 'fill-amber-400 text-stone-950 stroke-[2]'
                            : 'text-stone-300 dark:text-stone-600 stroke-[1]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Context Tag if available */}
                {review.contextTag && (
                  <div className="mb-2">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider font-mono bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 px-2 py-0.5 rounded border border-stone-400 dark:border-stone-600">
                      🏷️ {review.contextTag}
                    </span>
                  </div>
                )}

                {/* Comment Text */}
                <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-sans mt-1">
                  "{review.comment}"
                </p>
              </div>

              {/* Card Footer with Helpful Action */}
              <div className="mt-4 pt-3 border-t-2 border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Verified Handoff
                </span>

                <button
                  type="button"
                  onClick={() => handleLikeReview(review.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    isLiked
                      ? 'bg-amber-400 text-stone-950 border-stone-900 shadow-2xs'
                      : 'bg-stone-50 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-stone-900'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-stone-950' : ''}`} />
                  <span>Helpful ({displayedHelpful})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leave Review Dialog */}
      <ReviewsDialog
        open={leaveReviewOpen}
        onOpenChange={setLeaveReviewOpen}
        currentUser={currentUser}
        onOpenAuth={onOpenAuth}
        onSubmitReview={onAddReview}
      />
    </div>
  );
};
