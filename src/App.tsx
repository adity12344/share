/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Listing,
  WantedItem,
  User,
  ViewType,
  IntendedAction,
  CampusReview,
} from './types';
import {
  subscribeToListings,
  subscribeToWanted,
  subscribeToUsers,
  subscribeToAuth,
  logoutUser,
  markListingCompleted,
  markWantedCompleted,
  checkEmailVerification,
} from './lib/firebase';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { AuthDialog } from './components/AuthDialog';
import { CreateListingModal } from './components/CreateListingModal';
import { CreateWantedModal } from './components/CreateWantedModal';
import { HomeView } from './views/HomeView';
import { MarketplaceView } from './views/MarketplaceView';
import { WantedView } from './views/WantedView';
import { ProfileView } from './views/ProfileView';
import { ReviewsView } from './views/ReviewsView';
import { PrivacyView } from './views/PrivacyView';
import { LeaderboardView } from './views/LeaderboardView';
import { CampusAssistantChat } from './components/CampusAssistantChat';
import { INITIAL_MOCK_REVIEWS } from './data/mockData';
import { Toaster, toast } from 'sonner';
import { Button } from './components/ui/Button';
import {
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Heart,
  Star,
  Lock,
  AlertOctagon,
  LogOut,
  ArrowRight,
  ShieldAlert,
  Trophy,
} from 'lucide-react';

const REVIEWS_STORAGE_KEY = 'share_srmist_campus_reviews_v1';

function AppContent() {
  const { theme } = useTheme();
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [wanted, setWanted] = useState<WantedItem[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});

  // Reviews state with local persistence
  const [reviews, setReviews] = useState<CampusReview[]>(() => {
    try {
      const saved = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load reviews from local storage', e);
    }
    return INITIAL_MOCK_REVIEWS;
  });

  const handleAddReview = (newReview: CampusReview) => {
    setReviews((prev) => {
      const updated = [newReview, ...prev];
      try {
        localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save review to storage', e);
      }
      return updated;
    });
  };

  // Modals state
  const [authOpen, setAuthOpen] = useState(false);
  const [createListingOpen, setCreateListingOpen] = useState(false);
  const [createWantedOpen, setCreateWantedOpen] = useState(false);
  const [intendedAction, setIntendedAction] = useState<IntendedAction>(null);

  // Real-time subscriptions
  useEffect(() => {
    const unsubAuth = subscribeToAuth((user) => {
      setCurrentUser(user);
    });

    const unsubListings = subscribeToListings((newListings) => {
      setListings(newListings);
    });

    const unsubWanted = subscribeToWanted((newWanted) => {
      setWanted(newWanted);
    });

    const unsubUsers = subscribeToUsers((newUsers) => {
      setUsers(newUsers);
    });

    return () => {
      unsubAuth();
      unsubListings();
      unsubWanted();
      unsubUsers();
    };
  }, []);

  // Visual Auth Gating & Auto-Resume Handler
  const handleGatedAction = useCallback((action: IntendedAction) => {
    setIntendedAction(action);
    setAuthOpen(true);
  }, []);

  const handleAuthSuccess = useCallback(
    (loggedInUser: User) => {
      setCurrentUser(loggedInUser);
      toast.success(
        `Welcome ${loggedInUser.name}! ${
          loggedInUser.verified ? 'Verified SRM badge active.' : ''
        }`
      );

      // Execute stored intended action automatically without requiring a second click
      if (intendedAction) {
        const action = intendedAction;
        setIntendedAction(null);

        if (action.type === 'CREATE_LISTING') {
          setTimeout(() => setCreateListingOpen(true), 150);
        } else if (action.type === 'POST_WANTED') {
          setTimeout(() => setCreateWantedOpen(true), 150);
        } else if (action.type === 'CONTACT_SELLER') {
          const subject = encodeURIComponent(
            `[SHARE SRMIST] Inquiry: ${action.title}`
          );
          const body = encodeURIComponent(
            `Hi,\n\nI saw your listing for "${action.title}" on SHARE SRMIST (₹${
              action.price || ''
            }). Is this still available for campus pickup?\n\nBest regards,\n${
              loggedInUser.name
            }\n${loggedInUser.contactEmail || loggedInUser.email}`
          );
          window.location.href = `mailto:${action.email}?subject=${subject}&body=${body}`;
        } else if (action.type === 'OFFER_WANTED') {
          const subject = encodeURIComponent(
            `[SHARE SRMIST] Regarding: ${action.title}`
          );
          const body = encodeURIComponent(
            `Hi,\n\nI saw your request for "${action.title}" on SHARE SRMIST. I have this item/service available on campus.\n\nBest regards,\n${
              loggedInUser.name
            }\n${loggedInUser.contactEmail || loggedInUser.email}`
          );
          window.location.href = `mailto:${action.email}?subject=${subject}&body=${body}`;
        } else if (action.type === 'AI_MATCH') {
          toast.info(`Signed in! Click "Find AI Matches ✨" on your request to scan.`);
        }
      }
    },
    [intendedAction]
  );

  const isUnauthorizedUser = Boolean(currentUser && currentUser.email && !checkEmailVerification(currentUser.email));

  const handleCreateListingClick = () => {
    if (!currentUser) {
      handleGatedAction({ type: 'CREATE_LISTING' });
    } else if (!checkEmailVerification(currentUser.email)) {
      toast.error('Access Denied: Only accounts ending in @srmist.edu.in can list items.');
      setAuthOpen(true);
    } else {
      setCreateListingOpen(true);
    }
  };

  const handlePostWantedClick = () => {
    if (!currentUser) {
      handleGatedAction({ type: 'POST_WANTED' });
    } else if (!checkEmailVerification(currentUser.email)) {
      toast.error('Access Denied: Only accounts ending in @srmist.edu.in can post requests.');
      setAuthOpen(true);
    } else {
      setCreateWantedOpen(true);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    toast.info('Signed out successfully.');
  };

  const handleMarkListingCompleted = async (listingId: string, ownerId: string) => {
    await markListingCompleted(listingId, ownerId);
    toast.success('Listing marked as COMPLETED! Exchange count incremented.');
  };

  const handleMarkWantedCompleted = async (wantedId: string, userId: string) => {
    await markWantedCompleted(wantedId, userId);
    toast.success('Request marked as COMPLETED! Exchange count incremented.');
  };

  return (
    <div className="min-h-screen bg-[#f5efe1] dark:bg-[#121110] text-stone-900 dark:text-stone-100 font-sans flex flex-col selection:bg-amber-300 dark:selection:bg-amber-600 selection:text-stone-950 transition-colors">
      {/* Toast Notifications with dark theme support */}
      <Toaster richColors position="top-right" theme={theme === 'dark' ? 'dark' : 'light'} />

      {/* Top Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        currentUser={currentUser}
        onOpenAuth={() => {
          setIntendedAction(null);
          setAuthOpen(true);
        }}
        onLogout={handleLogout}
        onCreateListing={handleCreateListingClick}
        onPostWanted={handlePostWantedClick}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {isUnauthorizedUser ? (
          <div className="max-w-2xl mx-auto py-12 px-4">
            <div className="rounded-3xl border-2 border-red-600 dark:border-red-700 bg-white dark:bg-stone-900 p-6 sm:p-10 shadow-[6px_6px_0px_0px_#dc2626] dark:shadow-[6px_6px_0px_0px_#7f1d1d] text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto border-2 border-red-600 dark:border-red-700">
                <ShieldAlert className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
                  UNAUTHORIZED EMAIL DOMAIN
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-stone-950 dark:text-stone-100">
                  SRMIST Student Access Required
                </h1>
                <p className="text-sm text-stone-600 dark:text-stone-300 max-w-lg mx-auto leading-relaxed">
                  To protect campus safety and maintain 100% peer trust, this portal and its listing capabilities are strictly reserved for students and faculty of SRM Institute of Science and Technology.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-stone-400">Current Signed-in Account:</span>
                  <span className="font-mono font-bold text-red-700 dark:text-red-400">{currentUser?.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-stone-400">Allowed Domain:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">@srmist.edu.in</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-stone-400">Portal & Listing Access:</span>
                  <span className="font-bold text-red-600 dark:text-red-400 uppercase tracking-wider text-[11px]">BLOCKED</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="retro-amber"
                  size="lg"
                  onClick={async () => {
                    await logoutUser();
                    setIntendedAction(null);
                    setAuthOpen(true);
                  }}
                  className="font-bold text-xs"
                >
                  <ArrowRight className="w-4 h-4 mr-1.5" />
                  Sign In with @srmist.edu.in
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLogout}
                  className="font-bold text-xs border-stone-300 dark:border-stone-700"
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {currentView === 'home' && (
              <HomeView
                listings={listings}
                wanted={wanted}
                users={users}
                currentUser={currentUser}
                onNavigate={setCurrentView}
                onCreateListing={handleCreateListingClick}
                onPostWanted={handlePostWantedClick}
                onGatedAction={handleGatedAction}
                onMarkListingCompleted={handleMarkListingCompleted}
                onMarkWantedCompleted={handleMarkWantedCompleted}
              />
            )}

            {currentView === 'marketplace' && (
              <MarketplaceView
                listings={listings}
                users={users}
                currentUser={currentUser}
                onCreateListing={handleCreateListingClick}
                onGatedAction={handleGatedAction}
                onMarkListingCompleted={handleMarkListingCompleted}
              />
            )}

            {currentView === 'wanted' && (
              <WantedView
                wanted={wanted}
                listings={listings}
                users={users}
                currentUser={currentUser}
                onPostWanted={handlePostWantedClick}
                onGatedAction={handleGatedAction}
                onMarkWantedCompleted={handleMarkWantedCompleted}
              />
            )}

            {currentView === 'reviews' && (
              <ReviewsView
                currentUser={currentUser}
                reviews={reviews}
                onAddReview={handleAddReview}
                onOpenAuth={() => {
                  setIntendedAction(null);
                  setAuthOpen(true);
                }}
              />
            )}

            {currentView === 'privacy' && <PrivacyView />}

            {currentView === 'leaderboard' && (
              <LeaderboardView users={users} currentUser={currentUser} />
            )}

            {currentView === 'profile' && (
              <ProfileView
                currentUser={currentUser}
                listings={listings}
                wanted={wanted}
                users={users}
                onOpenAuth={() => {
                  setIntendedAction(null);
                  setAuthOpen(true);
                }}
                onCreateListing={handleCreateListingClick}
                onPostWanted={handlePostWantedClick}
                onMarkListingCompleted={handleMarkListingCompleted}
                onMarkWantedCompleted={handleMarkWantedCompleted}
              />
            )}
          </>
        )}
      </main>

      {/* Retro Tactile Footer */}
      <footer className="border-t-2 border-stone-900 dark:border-stone-700 bg-[#faf6ee] dark:bg-[#181614] py-10 text-stone-700 dark:text-stone-300 text-xs mt-auto transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b-2 border-dashed border-stone-300 dark:border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-stone-950 font-black text-sm border-2 border-stone-900 dark:border-stone-600 shadow-retro-sm">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bebas text-2xl tracking-wider text-stone-950 dark:text-stone-100">
                    SHARE SRMIST
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-stone-900 text-amber-300 text-[10px] font-mono font-bold">
                    KTR CAMPUS
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Verified campus resource and skill exchange network for college students.
                </p>
              </div>
            </div>

            {/* Quick Navigation Footer Links */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold font-mono">
              <button
                onClick={() => setCurrentView('home')}
                className="hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
              >
                HOME
              </button>
              <button
                onClick={() => setCurrentView('marketplace')}
                className="hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
              >
                MARKETPLACE
              </button>
              <button
                onClick={() => setCurrentView('wanted')}
                className="hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
              >
                WANTED BOARD
              </button>
              <button
                onClick={() => setCurrentView('leaderboard')}
                className="hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer flex items-center gap-1"
              >
                <Trophy className="w-3 h-3 text-amber-500" />
                LEADERBOARD
              </button>
              <button
                onClick={() => setCurrentView('reviews')}
                className="hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer flex items-center gap-1"
              >
                <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                REVIEWS
              </button>
              <button
                onClick={() => setCurrentView('privacy')}
                className="hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer flex items-center gap-1"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                PRIVACY & SAFETY
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500 dark:text-stone-400 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Campus Verified • Zero Platform Brokerage • In-Person SRMIST Handoff</span>
            </div>
            <p>© {new Date().getFullYear()} SHARE SRMIST Campus Exchange. Built for students, by students.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        intendedAction={intendedAction}
        onSuccess={handleAuthSuccess}
      />

      <CreateListingModal
        open={createListingOpen}
        onOpenChange={setCreateListingOpen}
        currentUser={currentUser}
        onListingCreated={() => {
          toast.success('Listing published successfully to the campus marketplace!');
        }}
      />

      <CreateWantedModal
        open={createWantedOpen}
        onOpenChange={setCreateWantedOpen}
        currentUser={currentUser}
        onWantedCreated={() => {
          toast.success('Wanted request posted! Students can now contact you directly.');
        }}
      />

      {/* 24/7 Grounded Campus Assistant Chatbot */}
      <CampusAssistantChat
        currentUser={currentUser}
        listings={listings}
        wanted={wanted}
        onOpenAuth={() => {
          setIntendedAction(null);
          setAuthOpen(true);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
