import React, { useState, useEffect } from 'react';
import { ViewType, User } from '../types';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ThemeToggle } from './ThemeToggle';
import {
  GraduationCap,
  PlusCircle,
  HelpCircle,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  HeartHandshake,
  Star,
  ShieldCheck,
  Trophy,
} from 'lucide-react';

interface NavbarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onCreateListing: () => void;
  onPostWanted: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onOpenAuth,
  onLogout,
  onCreateListing,
  onPostWanted,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks: { view: ViewType; label: string; icon: React.ReactNode }[] = [
    { view: 'home', label: 'Home', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { view: 'marketplace', label: 'Marketplace', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { view: 'wanted', label: 'Wanted Board', icon: <HeartHandshake className="w-3.5 h-3.5" /> },
    { view: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-3.5 h-3.5 text-amber-500" /> },
    { view: 'reviews', label: 'Reviews', icon: <Star className="w-3.5 h-3.5 fill-amber-400" /> },
    { view: 'privacy', label: 'Privacy', icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b-2 border-stone-900 dark:border-stone-700 transition-all duration-200 ${
        isScrolled
          ? 'bg-[#faf6ee]/98 dark:bg-[#181614]/98 shadow-[0_4px_12px_rgba(0,0,0,0.12)]'
          : 'bg-[#faf6ee]/90 dark:bg-[#181614]/90 shadow-[0_2px_0px_0px_rgba(30,28,26,0.1)]'
      } backdrop-blur-md`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Brand Identity */}
          <div className="flex items-center gap-4 lg:gap-6 shrink-0">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 text-left group transition-transform focus:outline-none cursor-pointer active:translate-y-0.5"
              aria-label="SHARE Campus Exchange Home"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 border-2 border-stone-900 dark:border-stone-600 shadow-[2px_2px_0px_0px_#1e1c1a] dark:shadow-[2px_2px_0px_0px_#000000] group-hover:rotate-3 transition-transform">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl sm:text-2xl font-bebas tracking-wider text-stone-950 dark:text-stone-100 uppercase">
                    SHARE
                  </span>
                  <span className="text-[10px] font-mono font-bold tracking-wider bg-stone-900 text-amber-300 dark:bg-amber-400 dark:text-stone-950 px-1.5 py-0.5 rounded border border-stone-900 shadow-2xs">
                    SRMIST
                  </span>
                </div>
                <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-stone-600 dark:text-stone-400 hidden sm:block -mt-1">
                  Campussette 01
                </p>
              </div>
            </button>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = currentView === link.view;
              return (
                <button
                  key={link.view}
                  onClick={() => onNavigate(link.view)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider font-sans transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 dark:bg-amber-500 text-stone-950 border-2 border-stone-900 dark:border-stone-700 shadow-[2px_2px_0px_0px_#1e1c1a] dark:shadow-[2px_2px_0px_0px_#000000]'
                      : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-stone-200/70 dark:hover:bg-stone-800/80 border-2 border-transparent'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls (Desktop & Mobile) */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle size="sm" />

            <Button
              variant="outline"
              size="sm"
              onClick={onPostWanted}
              className="text-xs font-bold shrink-0"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mr-1" />
              <span>Post Request</span>
            </Button>

            <Button
              variant="retro-amber"
              size="sm"
              onClick={onCreateListing}
              className="text-xs shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              <span>Create Listing</span>
            </Button>

            <div className="h-6 w-0.5 bg-stone-300 dark:bg-stone-700 mx-0.5" />

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl border-2 border-stone-900 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-stone-700 shadow-[2px_2px_0px_0px_#1e1c1a] dark:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all focus:outline-none cursor-pointer"
                  aria-expanded={userDropdownOpen}
                  aria-label="User Account Menu"
                >
                  <img
                    src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-lg object-cover border border-stone-900 dark:border-stone-600 shrink-0"
                  />
                  <div className="text-left hidden lg:block pr-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-stone-950 dark:text-stone-100 truncate max-w-[100px]">
                        {currentUser.name}
                      </span>
                      {currentUser.verified && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950 shrink-0" />
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-stone-600 dark:text-stone-400 block -mt-0.5">
                      {currentUser.verified ? '✓ Verified Student' : 'SRM Student'}
                    </span>
                  </div>
                </button>

                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#faf6ee] dark:bg-[#1c1a18] p-2 shadow-[4px_4px_0px_0px_#1e1c1a] dark:shadow-[4px_4px_0px_0px_#000000] border-2 border-stone-900 dark:border-stone-700 z-50 animate-in zoom-in-95">
                      <div className="p-2 border-b-2 border-stone-900 dark:border-stone-700 mb-1">
                        <p className="font-bold text-sm text-stone-950 dark:text-stone-100">{currentUser.name}</p>
                        <p className="text-xs font-mono text-stone-600 dark:text-stone-400 truncate">{currentUser.email}</p>
                        <div className="mt-2 flex items-center gap-1.5">
                          {currentUser.verified ? (
                            <Badge variant="verified" className="text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
                              SRM Verified
                            </Badge>
                          ) : (
                            <Badge variant="unverified" className="text-[10px]">
                              Unverified
                            </Badge>
                          )}
                          <span className="text-[10px] font-mono font-bold text-stone-900 dark:text-stone-100 bg-amber-200 dark:bg-amber-900/60 px-1.5 py-0.5 rounded border border-stone-900 dark:border-amber-700">
                            {currentUser.successfulExchanges} swaps
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('profile');
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-stone-800 dark:text-stone-200 hover:bg-amber-100 dark:hover:bg-stone-800 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                        <span>View Campus Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-red-700 dark:text-red-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={onOpenAuth}
                className="font-bold text-xs"
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Header Controls */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle size="sm" />
            {currentUser ? (
              <button
                onClick={() => onNavigate('profile')}
                className="flex items-center min-w-[44px] min-h-[44px] justify-center"
                aria-label="Go to profile"
              >
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-stone-900 dark:border-stone-700"
                />
              </button>
            ) : (
              <Button size="sm" variant="outline" onClick={onOpenAuth} className="border-stone-900 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs min-h-[38px]">
                Sign In
              </Button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-stone-900 dark:text-stone-100 rounded-lg focus:outline-none cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-stone-900 dark:border-stone-700 bg-[#faf6ee] dark:bg-[#181614] px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="space-y-1.5">
            {navLinks.map((link) => {
              const isActive = currentView === link.view;
              return (
                <button
                  key={link.view}
                  onClick={() => {
                    onNavigate(link.view);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider font-sans transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 dark:bg-amber-500 text-stone-950 border-2 border-stone-900 dark:border-stone-700 shadow-[2px_2px_0px_0px_#1e1c1a]'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </button>
              );
            })}

            <button
              onClick={() => {
                onNavigate('profile');
                setMobileMenuOpen(false);
              }}
              className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider font-sans transition-all cursor-pointer ${
                currentView === 'profile'
                  ? 'bg-amber-400 dark:bg-amber-500 text-stone-950 border-2 border-stone-900 dark:border-stone-700 shadow-[2px_2px_0px_0px_#1e1c1a]'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>My Profile</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t-2 border-stone-900 dark:border-stone-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMobileMenuOpen(false);
                onPostWanted();
              }}
              className="w-full text-xs font-bold min-h-[44px]"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mr-1" />
              Post Request
            </Button>
            <Button
              variant="retro-amber"
              size="sm"
              onClick={() => {
                setMobileMenuOpen(false);
                onCreateListing();
              }}
              className="w-full text-xs font-bold min-h-[44px]"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              Create Listing
            </Button>
          </div>

          {currentUser && (
            <div className="pt-3 border-t-2 border-stone-900 dark:border-stone-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-950 dark:text-stone-100">{currentUser.name}</span>
                {currentUser.verified && (
                  <Badge variant="verified" className="text-[10px]">
                    SRM Verified
                  </Badge>
                )}
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="text-red-700 dark:text-red-400 font-bold hover:underline flex items-center gap-1 cursor-pointer min-h-[44px] px-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

