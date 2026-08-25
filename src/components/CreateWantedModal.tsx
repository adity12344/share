import React, { useState } from 'react';
import { CategoryType, CATEGORIES, User } from '../types';
import { createWanted, checkEmailVerification } from '../lib/firebase';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input, Textarea } from './ui/Input';
import { Badge } from './ui/Badge';
import { HelpCircle, CheckCircle2, Lock, AlertTriangle } from 'lucide-react';

interface CreateWantedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User | null;
  onWantedCreated: () => void;
}

export const CreateWantedModal: React.FC<CreateWantedModalProps> = ({
  open,
  onOpenChange,
  currentUser,
  onWantedCreated,
}) => {
  const [category, setCategory] = useState<CategoryType>('Textbooks');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('300');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAuthorizedStudent = currentUser ? checkEmailVerification(currentUser.email) : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please sign in with your SRM student email before posting a wanted request.');
      return;
    }
    if (!isAuthorizedStudent) {
      setError(
        `Access Denied: Only accounts ending with @srmist.edu.in can post wanted requests. "${currentUser.email}" is not authorized.`
      );
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    const numBudget = parseFloat(budget);
    if (isNaN(numBudget) || numBudget < 0) {
      setError('Please enter a valid budget.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createWanted({
        userId: currentUser.uid,
        title: title.trim(),
        description: description.trim(),
        category,
        budget: Math.round(numBudget),
        userName: currentUser.name,
        userEmail: currentUser.contactEmail || currentUser.email,
        userCollege: currentUser.college,
        userVerified: true,
        userExchanges: currentUser.successfulExchanges,
      });

      // Reset
      setTitle('');
      setDescription('');
      setBudget('300');
      onOpenChange(false);
      onWantedCreated();
    } catch (err: any) {
      setError(err?.message || 'Failed to post wanted request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <span>Post to Wanted Board</span>
        </div>
      }
      description="Looking for an urgent lab manual, room cooler, scientific calculator, or project partner? Post here."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Domain Access Warning if unverified */}
        {currentUser && !isAuthorizedStudent && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-xs font-medium text-red-700 dark:text-red-300 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Institutional Access Blocked</strong>
              <span>
                Your signed-in account (<code className="font-mono">{currentUser.email}</code>) is not from <strong className="font-semibold">@srmist.edu.in</strong>. Only SRM students can post requests.
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-lg text-xs font-medium text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Current Requester Identity Preview */}
        {currentUser && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-500 dark:text-stone-400">Requesting as:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{currentUser.name}</span>
            </div>
            {isAuthorizedStudent ? (
              <Badge variant="verified" className="text-[10px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Verified Student
              </Badge>
            ) : (
              <Badge variant="unverified" className="text-[10px]">
                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                Unauthorized Domain
              </Badge>
            )}
          </div>
        )}

        {/* Request Title */}
        <Input
          id="wanted-title"
          label="What are you looking for? *"
          placeholder="e.g. Needed: Data Structures Lab Manual & Casio fx-991EX"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Category Selection */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
            Category *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                  category === cat
                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 shadow-2xs'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <Input
          id="wanted-budget"
          label="Target Budget (₹ INR) *"
          type="number"
          min="0"
          step="10"
          placeholder="300 (Set 0 for flexible/free request)"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          helperText="Fellow students will see your price expectations upfront."
          required
        />

        {/* Description */}
        <Textarea
          id="wanted-desc"
          label="Details / Urgency / Campus Location *"
          placeholder="e.g. Needed by Friday for 3rd semester CSE practicals. Can meet at UB or Tech Park."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            loading={loading}
            disabled={!isAuthorizedStudent}
            className="bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 dark:disabled:bg-stone-800 disabled:text-stone-500 text-white font-semibold px-6"
          >
            {isAuthorizedStudent ? 'Post to Wanted Board' : 'SRM Email Required'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
