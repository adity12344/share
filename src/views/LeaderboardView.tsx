import React from 'react';
import { User } from '../types';
import { Trophy, CheckCircle2, Award, Sparkles, Medal, ArrowUpRight } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

interface LeaderboardViewProps {
  users: Record<string, User>;
  currentUser: User | null;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ users, currentUser }) => {
  // Sort users by successfulExchanges descending
  const sortedUsers = Object.values(users)
    .sort((a, b) => (b.successfulExchanges || 0) - (a.successfulExchanges || 0))
    .slice(0, 10);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-400 text-stone-950 border-2 border-stone-900 flex items-center justify-center font-bold shadow-[1.5px_1.5px_0px_0px_#000] text-sm animate-bounce">
            <Medal className="w-4 h-4 stroke-[2.5]" />
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 rounded-lg bg-stone-200 text-stone-950 border-2 border-stone-900 flex items-center justify-center font-bold shadow-[1.5px_1.5px_0px_0px_#000] text-sm">
            2nd
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-600/30 dark:bg-amber-700/55 text-amber-900 dark:text-amber-200 border-2 border-stone-900 dark:border-stone-600 flex items-center justify-center font-bold shadow-[1.5px_1.5px_0px_0px_#000] text-sm">
            3rd
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 flex items-center justify-center font-bold text-xs">
            #{rank}
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="rounded-2xl border-2 border-stone-900 dark:border-stone-700 bg-amber-400 text-stone-950 p-6 sm:p-8 shadow-[4px_4px_0px_0px_#1e1c1a] dark:shadow-[4px_4px_0px_0px_#000000]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-950 text-amber-300 text-xs font-bold uppercase tracking-wider border border-stone-900">
              <Trophy className="w-4 h-4" />
              <span>Campus Trust Rankings</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-sans tracking-tight uppercase">
              Trusted User Leaderboard
            </h1>
            <p className="text-xs sm:text-sm font-medium text-stone-900 max-w-2xl leading-relaxed">
              Meet the community champions! This board ranks SRMIST students based on their verified, completed peer exchanges (selling, buying, donating, tutoring). Higher successful swaps mean top-tier campus reliability.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-stone-950 text-stone-50 border-2 border-stone-900 p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] shrink-0 self-stretch md:self-auto justify-between md:justify-start">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-300 block">Your Trust Status</span>
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base">{currentUser.name}</span>
                  <Badge variant="verified" className="bg-amber-400 text-stone-950 text-[9px] py-0 px-1 border border-stone-950 shrink-0">
                    {currentUser.successfulExchanges} Swaps
                  </Badge>
                </div>
              ) : (
                <span className="text-xs font-bold text-stone-400">Not Signed In</span>
              )}
            </div>
            <Award className="w-8 h-8 text-amber-400 stroke-[2]" />
          </div>
        </div>
      </div>

      {/* Leaderboard Table Container */}
      <div className="rounded-2xl border-2 border-stone-900 dark:border-stone-700 bg-white dark:bg-[#1c1a18] shadow-[4px_4px_0px_0px_#1e1c1a] dark:shadow-[4px_4px_0px_0px_#000000] overflow-hidden">
        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 bg-stone-100 dark:bg-stone-900 border-b-2 border-stone-900 dark:border-stone-700 text-xs font-mono uppercase font-bold text-stone-600 dark:text-stone-400">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-4">Student Profile</div>
          <div className="col-span-4">College / Department</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-1 text-right">Exchanges</div>
        </div>

        {/* User list */}
        <div className="divide-y-2 divide-stone-900 dark:divide-stone-800">
          {sortedUsers.map((user, index) => {
            const rank = index + 1;
            const isSelf = currentUser && currentUser.uid === user.uid;

            return (
              <div
                key={user.uid}
                className={`grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center px-6 py-4 transition-colors font-sans ${
                  isSelf
                    ? 'bg-amber-100/60 dark:bg-amber-950/20 border-l-4 border-amber-500'
                    : 'hover:bg-amber-50/30 dark:hover:bg-stone-800/40'
                }`}
              >
                {/* Rank Indicator */}
                <div className="col-span-1 flex items-center justify-between sm:justify-center">
                  <span className="sm:hidden text-xs font-mono font-bold text-stone-500 dark:text-stone-400 uppercase">Rank</span>
                  {getRankBadge(rank)}
                </div>

                {/* Profile Identity */}
                <div className="col-span-4 flex items-center gap-3">
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={user.name}
                    className="w-10 h-10 rounded-lg object-cover border-2 border-stone-900 dark:border-stone-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-stone-950 dark:text-stone-100 text-sm sm:text-base truncate">
                        {user.name}
                      </span>
                      {isSelf && (
                        <span className="text-[9px] font-mono font-bold uppercase bg-amber-400 text-stone-950 px-1 py-0.2 rounded border border-stone-950 shrink-0">
                          You
                        </span>
                      )}
                    </div>
                    {user.department && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{user.department}</p>
                    )}
                  </div>
                </div>

                {/* College Info */}
                <div className="col-span-4 min-w-0">
                  <span className="sm:hidden text-xs font-mono font-bold text-stone-500 dark:text-stone-400 uppercase block mb-1">College</span>
                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-medium truncate">
                    {user.college || 'SRMIST'}
                  </p>
                </div>

                {/* Verified Indicator */}
                <div className="col-span-2 flex items-center sm:justify-center">
                  <span className="sm:hidden text-xs font-mono font-bold text-stone-500 dark:text-stone-400 uppercase mr-3">Status</span>
                  {user.verified ? (
                    <Badge variant="verified" className="text-[10px] gap-1 px-2 py-0.5 shadow-none shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                      <span>Verified</span>
                    </Badge>
                  ) : (
                    <Badge variant="unverified" className="text-[10px] px-2 py-0.5 shadow-none shrink-0">
                      <span>Standard</span>
                    </Badge>
                  )}
                </div>

                {/* Successful Exchanges */}
                <div className="col-span-1 flex items-center justify-between sm:justify-end">
                  <span className="sm:hidden text-xs font-mono font-bold text-stone-500 dark:text-stone-400 uppercase">Exchanges</span>
                  <div className="flex items-center gap-1 font-bold text-base text-stone-950 dark:text-stone-100 font-mono">
                    <span>{user.successfulExchanges || 0}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust & Badging FAQ Banner */}
      <div className="rounded-2xl border-2 border-stone-900 dark:border-stone-700 bg-stone-100 dark:bg-stone-900 p-6 flex items-start gap-4 shadow-[3px_3px_0px_0px_#1e1c1a] dark:shadow-[3px_3px_0px_0px_#000000]">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center border-2 border-stone-900 dark:border-stone-600 shrink-0">
          <Sparkles className="w-5 h-5 text-amber-500 stroke-[2.5]" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-stone-950 dark:text-stone-100 text-sm">How to rise up the trust rankings?</h4>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-medium">
            To earn exchange trust points, list active products/services you no longer need on the marketplace or wanted board. Once you successfully meet with a buyer or seller on campus and close the deal, click **"Mark as COMPLETED"** on your item card. This automatically logs a successful exchange to your profile and updates the leaderboard in real time!
          </p>
        </div>
      </div>
    </div>
  );
};
