import React, { useState } from 'react';
import { User, Listing, WantedItem } from '../types';
import { ListingCard } from '../components/ListingCard';
import { WantedCard } from '../components/WantedCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  User as UserIcon,
  CheckCircle2,
  ShieldCheck,
  Award,
  ShoppingBag,
  HeartHandshake,
  PlusCircle,
  Mail,
  GraduationCap,
  Building,
} from 'lucide-react';

interface ProfileViewProps {
  currentUser: User | null;
  listings: Listing[];
  wanted: WantedItem[];
  users: Record<string, User>;
  onOpenAuth: () => void;
  onCreateListing: () => void;
  onPostWanted: () => void;
  onMarkListingCompleted: (listingId: string, ownerId: string) => void;
  onMarkWantedCompleted: (wantedId: string, userId: string) => void;
  onSelectUserForDemo?: (uid: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  listings,
  wanted,
  onOpenAuth,
  onCreateListing,
  onPostWanted,
  onMarkListingCompleted,
  onMarkWantedCompleted,
}) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'wanted' | 'completed'>('listings');

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-800 shadow-sm">
          <UserIcon className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-stone-900 dark:text-stone-100">Student Profile & Trust Stats</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            Sign in with your Google or campus email to manage your listings, view your verified student badge, and track completed exchanges.
          </p>
        </div>
        <Button
          variant="default"
          size="lg"
          onClick={onOpenAuth}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6"
        >
          Sign In to View Profile
        </Button>
      </div>
    );
  }

  // Filter items owned by current user
  const myListings = listings.filter((l) => l.ownerId === currentUser.uid);
  const myWanted = wanted.filter((w) => w.userId === currentUser.uid);

  const activeMyListings = myListings.filter((l) => l.status === 'OPEN');
  const completedMyListings = myListings.filter((l) => l.status === 'COMPLETED');

  const activeMyWanted = myWanted.filter((w) => w.status === 'OPEN');
  const completedMyWanted = myWanted.filter((w) => w.status === 'COMPLETED');

  const allCompleted = [...completedMyListings, ...completedMyWanted];

  const getTrustLevel = (exchanges: number) => {
    if (exchanges >= 10) return { label: 'Campus Veteran Trader', color: 'text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800' };
    if (exchanges >= 5) return { label: 'Trusted Student Trader', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' };
    if (exchanges >= 1) return { label: 'Verified Campus Trader', color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800' };
    return { label: 'New Student Member', color: 'text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700' };
  };

  const trustLevel = getTrustLevel(currentUser.successfulExchanges || 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Profile Header Card */}
      <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt=""
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-stone-200 dark:border-stone-700 shadow-sm"
              />
              {currentUser.verified && (
                <div
                  className="absolute -bottom-1.5 -right-1.5 p-1 bg-emerald-600 text-white rounded-full ring-2 ring-white dark:ring-stone-900 shadow-xs"
                  title="Verified Student"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                  {currentUser.name}
                </h1>
                {currentUser.verified ? (
                  <Badge variant="verified" className="text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Verified Student
                  </Badge>
                ) : (
                  <Badge variant="unverified" className="text-xs">
                    Unverified Student
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  {currentUser.contactEmail || currentUser.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-stone-400" />
                  {currentUser.department || 'Engineering / Sciences'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-stone-400" />
                  {currentUser.college}
                </span>
              </div>

              <div className="pt-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${trustLevel.color}`}>
                  <Award className="w-3.5 h-3.5" />
                  {trustLevel.label}
                </span>
              </div>
            </div>
          </div>

          {/* Exchanges Counter Metric */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-4 sm:p-5 text-center min-w-[160px] w-full sm:w-auto">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 block">
              {currentUser.successfulExchanges || 0}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 block mt-0.5">
              Successful Exchanges
            </span>
            <span className="text-[10px] text-stone-400 dark:text-stone-500 block mt-1">
              Verified by peers upon deal closure
            </span>
          </div>
        </div>

        {/* Verification banner if unverified */}
        {!currentUser.verified && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block text-amber-800 dark:text-amber-300">Want the Verified Student Badge?</strong>
              <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                Sign in with an official SRM email ending in <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded text-amber-900 dark:text-amber-200">@srmist.edu.in</code> to receive an immediate verified badge and higher peer trust.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs for My Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'listings'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800'
              }`}
            >
              My Open Listings ({activeMyListings.length})
            </button>
            <button
              onClick={() => setActiveTab('wanted')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'wanted'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800'
              }`}
            >
              My Wanted Requests ({activeMyWanted.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800'
              }`}
            >
              Completed Deals ({allCompleted.length})
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onPostWanted} className="text-xs border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200">
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              Post Request
            </Button>
            <Button size="sm" variant="default" onClick={onCreateListing} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              Create Listing
            </Button>
          </div>
        </div>

        {/* Tab 1: My Open Listings */}
        {activeTab === 'listings' && (
          <div>
            {activeMyListings.length === 0 ? (
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-12 text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-stone-400 dark:text-stone-500 mx-auto" />
                <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">You have no active listings</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  Have spare textbooks, Arduino kits, or dorm accessories? List them for students nearby!
                </p>
                <Button size="sm" onClick={onCreateListing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Create First Listing
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeMyListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    seller={currentUser}
                    currentUser={currentUser}
                    isOwner={true}
                    onContactSeller={() => {}}
                    onMarkCompleted={onMarkListingCompleted}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: My Wanted Requests */}
        {activeTab === 'wanted' && (
          <div>
            {activeMyWanted.length === 0 ? (
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-12 text-center space-y-3">
                <HeartHandshake className="w-10 h-10 text-stone-400 dark:text-stone-500 mx-auto" />
                <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">No active wanted requests</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  Looking for a specific course book, calculator, or roommate? Post a request on the wanted board.
                </p>
                <Button size="sm" onClick={onPostWanted} className="bg-amber-600 hover:bg-amber-700 text-white">
                  Post Request
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeMyWanted.map((item) => (
                  <WantedCard
                    key={item.id}
                    wanted={item}
                    requester={currentUser}
                    currentUser={currentUser}
                    isOwner={true}
                    onOfferWanted={() => {}}
                    onMarkCompleted={onMarkWantedCompleted}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Completed Deals */}
        {activeTab === 'completed' && (
          <div>
            {allCompleted.length === 0 ? (
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-12 text-center space-y-3">
                <Award className="w-10 h-10 text-stone-400 dark:text-stone-500 mx-auto" />
                <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">No completed deals yet</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  When you sell an item or find a requested item, click &quot;Mark as COMPLETED&quot; on your card to increment your campus exchange counter.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedMyListings.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-12 h-12 rounded-xl object-cover grayscale opacity-75 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate line-through">
                            {item.title}
                          </span>
                          <Badge variant="category" category={item.category} className="text-[10px]">
                            {item.category}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block mt-0.5">
                          ✓ Successfully Sold & Exchanged (₹{item.price})
                        </span>
                      </div>
                    </div>
                    <Badge variant="status-completed" className="shrink-0">
                      COMPLETED
                    </Badge>
                  </div>
                ))}

                {completedMyWanted.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate line-through">
                          {item.title}
                        </span>
                        <Badge variant="category" category={item.category} className="text-[10px]">
                          {item.category}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold block mt-0.5">
                        ✓ Request Fulfilled by Campus Peer (Budget: ₹{item.budget})
                      </span>
                    </div>
                    <Badge variant="status-completed" className="shrink-0">
                      FULFILLED
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
