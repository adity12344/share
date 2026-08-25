import React, { useState } from 'react';
import { CategoryType, CATEGORIES, User } from '../types';
import { createListing, checkEmailVerification } from '../lib/firebase';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input, Textarea } from './ui/Input';
import { Badge } from './ui/Badge';
import {
  PlusCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface CreateListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User | null;
  onListingCreated: () => void;
}

const PRESET_IMAGES: Record<CategoryType, string[]> = {
  'Textbooks': [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&auto=format&fit=crop&q=80',
  ],
  'Electronics': [
    'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
  ],
  'Services': [
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=600&auto=format&fit=crop&q=80',
  ],
  'Opportunities': [
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80',
  ],
  'Dorm Essentials': [
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop&q=80',
  ],
};

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  open,
  onOpenChange,
  currentUser,
  onListingCreated,
}) => {
  const [category, setCategory] = useState<CategoryType>('Textbooks');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('450');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES['Textbooks'][0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // AI Assistant States
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCategoryChange = (newCat: CategoryType) => {
    setCategory(newCat);
    setImageUrl(PRESET_IMAGES[newCat][0]);
  };

  const handleAiAutoFill = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a brief item note or photo description for the AI.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/ai/listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });

      if (!response.ok) {
        throw new Error('AI Listing assistant failed. Please fill manually or retry.');
      }

      const data = await response.json();

      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.price !== undefined && data.price !== null) setPrice(String(data.price));
      if (data.category && CATEGORIES.includes(data.category as CategoryType)) {
        const validatedCat = data.category as CategoryType;
        setCategory(validatedCat);
        if (!imageUrl || imageUrl === PRESET_IMAGES[category][0]) {
          setImageUrl(PRESET_IMAGES[validatedCat][0]);
        }
      }

      toast.success('Listing details auto-filled by AI! Review and publish.');
    } catch (err: any) {
      toast.error(err?.message || 'Could not connect to AI Assistant. Please input details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const isAuthorizedStudent = currentUser ? checkEmailVerification(currentUser.email) : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please sign in with your SRM student email before posting a listing.');
      return;
    }
    if (!isAuthorizedStudent) {
      setError(
        `Access Denied: Only accounts ending with @srmist.edu.in can create listings. "${currentUser.email}" is an unauthorized external domain.`
      );
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Please enter a valid price (0 for free/team slot).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createListing({
        ownerId: currentUser.uid,
        title: title.trim(),
        description: description.trim(),
        category,
        price: Math.round(numPrice),
        imageUrl: imageUrl.trim() || PRESET_IMAGES[category][0],
        ownerName: currentUser.name,
        ownerEmail: currentUser.contactEmail || currentUser.email,
        ownerCollege: currentUser.college,
        ownerVerified: true,
        ownerExchanges: currentUser.successfulExchanges,
      });

      // Reset form
      setAiPrompt('');
      setTitle('');
      setDescription('');
      setPrice('500');
      onOpenChange(false);
      onListingCreated();
    } catch (err: any) {
      setError(err?.message || 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span>Create Campus Marketplace Listing</span>
        </div>
      }
      description="List books, electronics, hostel essentials, study notes, or freelance services for fellow students."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Domain Access Warning if unverified */}
        {currentUser && !isAuthorizedStudent && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-xs font-medium text-red-700 dark:text-red-300 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Institutional Access Blocked</strong>
              <span>
                Your signed-in account (<code className="font-mono">{currentUser.email}</code>) is not from <strong className="font-semibold">@srmist.edu.in</strong>. Only SRM students are permitted to create marketplace listings.
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

        {/* Current Seller Identity Preview */}
        {currentUser && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-500 dark:text-stone-400">Posting as:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{currentUser.name}</span>
              <span className="text-stone-400 dark:text-stone-500">({currentUser.contactEmail || currentUser.email})</span>
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

        {/* AI Auto-Fill Section */}
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-emerald-50/20 dark:from-emerald-950/40 dark:via-stone-900 dark:to-stone-900 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span>AI Listing Assistant</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Powered by Gemini
              </span>
            </div>
          </div>

          <p className="text-xs text-stone-600 dark:text-stone-400">
            Paste rough item notes or notes from photos to auto-generate title, description, category, and price estimate.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              id="ai-prompt-input"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAiAutoFill();
                }
              }}
              placeholder="e.g., Selling my 2nd hand engineering physics kit with USB power supply"
              disabled={isGenerating}
              className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
            />
            <Button
              type="button"
              id="ai-autofill-btn"
              onClick={handleAiAutoFill}
              disabled={isGenerating || !aiPrompt.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-4 shrink-0 transition-all shadow-xs"
            >
              {isGenerating ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Gemini is generating your listing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Fill with AI ✨</span>
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Item Title */}
        <Input
          id="listing-title"
          label="Listing Title *"
          placeholder="e.g. Arduino Mega 2560 Starter Kit + Sensor Shield"
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
                onClick={() => handleCategoryChange(cat)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                  category === cat
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <Input
          id="listing-price"
          label="Price (₹ INR) *"
          type="number"
          min="0"
          step="10"
          placeholder="500 (Set 0 for free or collaboration slot)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          helperText="Fair student prices encourage faster sales and safe campus pick-ups."
          required
        />

        {/* Description */}
        <Textarea
          id="listing-desc"
          label="Description & Condition Details *"
          placeholder="Mention item condition, hostel block for handoff, semester use, accessories included..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        {/* Photo URL & Quick Presets */}
        <div className="space-y-2">
          <Input
            id="listing-image"
            label="Image URL"
            type="url"
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            helperText="Or pick from curated campus photo presets below:"
          />

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {PRESET_IMAGES[category]?.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setImageUrl(img)}
                className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  imageUrl === img ? 'border-emerald-600 scale-105 shadow-xs' : 'border-stone-200 dark:border-stone-700 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

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
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 dark:disabled:bg-stone-800 disabled:text-stone-500 text-white font-semibold px-6"
          >
            {isAuthorizedStudent ? 'Publish Listing' : 'SRM Email Required'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
