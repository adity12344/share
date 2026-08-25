import React from 'react';
import { Listing, WantedItem, User } from '../types';
import {
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  BookOpen,
  Cpu,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';

interface CampusPulseProps {
  listings: Listing[];
  wanted: WantedItem[];
  users: Record<string, User>;
  onSelectListing: (listing: Listing) => void;
  onSelectWanted: (wanted: WantedItem) => void;
  onViewMarketplace: () => void;
  onViewWanted: () => void;
}

export const CampusPulse: React.FC<CampusPulseProps> = ({
  listings,
  wanted,
  users,
  onSelectListing,
  onSelectWanted,
  onViewMarketplace,
  onViewWanted,
}) => {
  const activeListings = listings.filter((l) => l.status === 'OPEN');
  const activeWanted = wanted.filter((w) => w.status === 'OPEN');

  // Combined pulse feed sorted by most recent createdAt
  const combinedFeed = [
    ...activeListings.map((item) => ({ ...item, feedType: 'listing' as const })),
    ...activeWanted.map((item) => ({ ...item, feedType: 'wanted' as const })),
  ]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  const userList = Object.values(users) as User[];
  const totalExchangesCompleted = userList.reduce(
    (acc, u) => acc + (u.successfulExchanges || 0),
    0
  );

  const verifiedStudentsCount = userList.filter((u) => u.verified).length;

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

  const campusTrends = [
    { label: 'Most Requested', item: 'Engineering Textbooks', icon: <BookOpen className="w-3.5 h-3.5 text-amber-500" /> },
    { label: 'Trending Item', item: 'Calculators ↑ 42%', icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> },
    { label: 'Most Shared', item: 'Lab Kits & Hardware', icon: <Cpu className="w-3.5 h-3.5 text-sky-500" /> },
    { label: 'Top Service', item: 'Python & Web Tutoring', icon: <GraduationCap className="w-3.5 h-3.5 text-purple-500" /> },
  ];

  return (
    <div className="rounded-2xl border-2 border-stone-900 dark:border-stone-700 bg-[#faf6ee] dark:bg-[#1c1a18] p-6 sm:p-8 shadow-[4px_4px_0px_0px_#1e1c1a] dark:shadow-[4px_4px_0px_0px_#000000] overflow-hidden relative">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b-2 border-dashed border-stone-300 dark:border-stone-700 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest font-mono text-emerald-700 dark:text-emerald-400 flex items-center">
              CAMPUS RESOURCE PULSE
              <span className="inline-block animate-blink-cursor font-mono font-black ml-0.5 text-emerald-600 dark:text-emerald-400">
                _
              </span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-sans tracking-tight text-stone-950 dark:text-stone-100 flex items-center gap-2">
            <span>Live Campus Exchange Feed</span>
            <Flame className="w-6 h-6 text-amber-500 fill-amber-400" />
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-xl">
            Real-time feed of textbook offers, calculator trades, and student requests across SRM campus hostels and tech parks.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
          <div className="bg-white dark:bg-stone-900 border-2 border-stone-900 dark:border-stone-700 rounded-xl p-3 text-center min-w-[90px] shadow-retro-sm hover:-translate-y-0.5 transition-transform duration-150">
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 block font-bebas">
              {activeListings.length}
            </span>
            <span className="text-[10px] text-stone-600 dark:text-stone-400 uppercase font-bold tracking-wider">
              Active Items
            </span>
          </div>
          <div className="bg-white dark:bg-stone-900 border-2 border-stone-900 dark:border-stone-700 rounded-xl p-3 text-center min-w-[90px] shadow-retro-sm hover:-translate-y-0.5 transition-transform duration-150">
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 block font-bebas">
              {activeWanted.length}
            </span>
            <span className="text-[10px] text-stone-600 dark:text-stone-400 uppercase font-bold tracking-wider">
              Requests
            </span>
          </div>
          <div className="bg-white dark:bg-stone-900 border-2 border-stone-900 dark:border-stone-700 rounded-xl p-3 text-center min-w-[90px] shadow-retro-sm hover:-translate-y-0.5 transition-transform duration-150">
            <span className="text-xl font-black text-sky-600 dark:text-sky-400 block font-bebas">
              {verifiedStudentsCount}+
            </span>
            <span className="text-[10px] text-stone-600 dark:text-stone-400 uppercase font-bold tracking-wider">
              Verified SRM
            </span>
          </div>
          <div className="bg-white dark:bg-stone-900 border-2 border-stone-900 dark:border-stone-700 rounded-xl p-3 text-center min-w-[90px] shadow-retro-sm hover:-translate-y-0.5 transition-transform duration-150">
            <span className="text-xl font-black text-purple-600 dark:text-purple-400 block font-bebas">
              {totalExchangesCompleted}
            </span>
            <span className="text-[10px] text-stone-600 dark:text-stone-400 uppercase font-bold tracking-wider">
              Swaps Closed
            </span>
          </div>
        </div>
      </div>

      {/* Campus Trends Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
        {campusTrends.map((trend, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border-2 border-stone-900 dark:border-stone-700 flex items-center gap-2 shadow-2xs hover:-translate-y-0.5 hover:shadow-retro-sm transition-[transform,box-shadow] duration-150"
          >
            <div className="p-1 rounded bg-stone-100 dark:bg-stone-800 shrink-0">
              {trend.icon}
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                {trend.label}
              </span>
              <span className="text-xs font-bold text-stone-950 dark:text-stone-100 truncate block">
                {trend.item}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Trending Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {combinedFeed.map((item, idx) => {
          const isListing = item.feedType === 'listing';
          const user = isListing
            ? users[(item as Listing).ownerId]
            : users[(item as WantedItem).userId];

          return (
            <div
              key={`${item.feedType}_${item.id}`}
              style={{ animationDelay: `${idx * 80}ms` }}
              onClick={() => {
                if (isListing) onSelectListing(item as Listing);
                else onSelectWanted(item as WantedItem);
              }}
              className="group bg-white dark:bg-stone-900 border-2 border-stone-900 dark:border-stone-700 hover:border-amber-400 rounded-xl p-4 transition-[transform,box-shadow,border-color] duration-200 cursor-pointer flex flex-col justify-between shadow-retro-sm hover:-translate-y-1 hover:rotate-[0.5deg] hover:shadow-retro animate-slide-in-right"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        isListing
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-500'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-500'
                      }`}
                    >
                      {isListing ? 'Offered' : 'Wanted'}
                    </span>
                    <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                      {item.category}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-stone-400" />
                    {formatTimeAgo(item.createdAt)}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                  {item.title}
                </h4>

                <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-stone-700 dark:text-stone-300 font-bold truncate max-w-[120px]">
                    {user?.name || (isListing ? (item as Listing).ownerName : (item as WantedItem).userName) || 'Student'}
                  </span>
                  {(user?.verified ?? true) && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </div>

                <div className="font-bold text-xs font-mono text-stone-950 dark:text-stone-100">
                  {isListing ? (
                    (item as Listing).price === 0 ? 'Free' : `₹${(item as Listing).price.toLocaleString('en-IN')}`
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">
                      {(item as WantedItem).budget === 0 ? 'Flexible' : `₹${(item as WantedItem).budget.toLocaleString('en-IN')}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation CTAs */}
      <div className="mt-6 pt-4 border-t-2 border-dashed border-stone-300 dark:border-stone-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Exclusive peer-to-peer student trust network</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onViewWanted}
            className="text-amber-700 dark:text-amber-400 hover:underline font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Explore Wanted Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <span className="text-stone-300 dark:text-stone-700">|</span>
          <button
            onClick={onViewMarketplace}
            className="text-stone-900 dark:text-stone-100 hover:underline font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Browse Full Marketplace</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
          </button>
        </div>
      </div>
    </div>
  );
};
