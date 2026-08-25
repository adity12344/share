import React, { useState } from 'react';
import { User, CampusReview, ReviewCategory } from '../types';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Star, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReviewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onSubmitReview: (review: CampusReview) => void;
}

const CATEGORIES: ReviewCategory[] = [
  'Marketplace',
  'Search',
  'AI Assistant',
  'Safety',
  'User Experience',
  'Other',
];

export const ReviewsDialog: React.FC<ReviewsDialogProps> = ({
  open,
  onOpenChange,
  currentUser,
  onOpenAuth,
  onSubmitReview,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [category, setCategory] = useState<ReviewCategory>('Marketplace');
  const [contextTag, setContextTag] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!comment.trim()) {
      setError('Please write a short description of your experience.');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Please provide at least 10 characters of helpful feedback.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newReview: CampusReview = {
        id: `rev_${Date.now()}`,
        userId: currentUser.uid,
        userName: currentUser.name,
        userAvatar: currentUser.avatarUrl,
        verified: currentUser.verified,
        rating,
        category,
        contextTag: contextTag.trim() || `${category} Experience`,
        comment: comment.trim(),
        createdAt: Date.now(),
        helpfulCount: 1,
      };

      onSubmitReview(newReview);
      toast.success('Thank you! Your verified campus review has been published.');
      onOpenChange(false);
      setComment('');
      setContextTag('');
      setRating(5);
    } catch (err: any) {
      setError(err?.message || 'Failed to publish review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeDisplayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center font-bold border-2 border-stone-900 shadow-retro-sm">
            <Star className="w-4 h-4 fill-stone-950 text-stone-950" />
          </div>
          <span>Leave a Campus Review</span>
        </div>
      }
      description="Share your genuine experience with textbook trades, AI tools, or safety handoffs to help fellow SRMIST students."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border-2 border-stone-900 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-5 Star Interactive Rating */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 mb-1.5">
            Your Rating <span className="text-amber-600 dark:text-amber-400">({activeDisplayRating} of 5 Stars)</span>
          </label>
          <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800/80 p-3 rounded-xl border-2 border-stone-900 dark:border-stone-700">
            <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Star Rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 rounded-md transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= activeDisplayRating
                        ? 'fill-amber-400 text-stone-950 stroke-[2]'
                        : 'text-stone-300 dark:text-stone-600 stroke-[1.5]'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs font-mono font-bold text-stone-600 dark:text-stone-400">
              {activeDisplayRating === 5 && '⭐️ Excellent / Highly Recommended'}
              {activeDisplayRating === 4 && '⭐️ Very Good Trade'}
              {activeDisplayRating === 3 && '⭐️ Average Experience'}
              {activeDisplayRating === 2 && '⭐️ Needs Improvement'}
              {activeDisplayRating === 1 && '⭐️ Poor / Caution'}
            </span>
          </div>
        </div>

        {/* Category Picker */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 mb-1.5">
            Review Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-2 text-xs font-bold rounded-lg border-2 text-left transition-all cursor-pointer ${
                  category === cat
                    ? 'bg-amber-400 text-stone-950 border-stone-900 shadow-[2px_2px_0px_0px_#1e1c1a]'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-stone-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Context / Tag */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 mb-1.5">
            Context Tag <span className="text-stone-400 font-normal normal-case">(Optional, e.g. Textbook Exchange)</span>
          </label>
          <input
            type="text"
            value={contextTag}
            onChange={(e) => setContextTag(e.target.value)}
            placeholder="e.g. Casio Calculator, ECE Lab Kit, Safety & Handoff"
            maxLength={40}
            className="w-full px-3 py-2 text-xs rounded-lg border-2 border-stone-900 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Feedback Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
              Your Feedback
            </label>
            <span className="text-[11px] font-mono text-stone-400">{comment.length}/500</span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell fellow students how the handoff went, item condition accuracy, speed of communication..."
            rows={4}
            maxLength={500}
            required
            className="w-full p-3 text-xs rounded-lg border-2 border-stone-900 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 leading-relaxed resize-none"
          />
        </div>

        {/* Auth Notice or Submitter Info */}
        <div className="flex items-center justify-between pt-2 border-t-2 border-stone-200 dark:border-stone-800 text-xs">
          {currentUser ? (
            <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full border border-stone-900"
              />
              <span className="font-bold text-stone-900 dark:text-stone-100">{currentUser.name}</span>
              {currentUser.verified && (
                <span className="flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                  <CheckCircle2 className="w-3 h-3" /> Verified Student
                </span>
              )}
            </div>
          ) : (
            <span className="text-amber-700 dark:text-amber-400 font-bold text-xs">
              ⚠️ You must sign in with your SRM email to publish.
            </span>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="retro-amber"
              size="sm"
              loading={isSubmitting}
              className="text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Submit Review
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
