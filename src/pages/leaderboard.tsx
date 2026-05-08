import { useState, useEffect } from "react";
import { supabase } from "@/supabase/supabase";
import { useRouter } from "next/router";
import Link from "next/link";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { IoCodeSlash } from "react-icons/io5";
import { FiLogOut, FiBookOpen, FiMessageSquare, FiUser, FiAward } from "react-icons/fi";
import { BsTrophy } from "react-icons/bs";

type LeaderboardEntry = {
  user_id: string;
  username: string;
  solved_count: number;
  easy_count: number;
  medium_count: number;
  hard_count: number;
  total_submissions: number;
  last_active: string;
};

export default function LeaderboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"solved" | "easy" | "medium" | "hard">("solved");
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth"); return; }
      setUser(session.user);

      const { data } = await supabase
        .from("leaderboard")
        .select("*");

      if (data) {
        setEntries(data);
        const rank = data.findIndex((e: LeaderboardEntry) => e.user_id === session.user.id);
        if (rank !== -1) setMyRank(rank + 1);
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const sorted = [...entries].sort((a, b) => {
    if (filter === "solved")  return b.solved_count  - a.solved_count;
    if (filter === "easy")    return b.easy_count    - a.easy_count;
    if (filter === "medium")  return b.medium_count  - a.medium_count;
    if (filter === "hard")    return b.hard_count    - a.hard_count;
    return 0;
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank;
  };

  const getRankBg = (rank: number, isMe: boolean) => {
    if (isMe) return "bg-[#1a2a1a] border-l-2 border-brand-orange";
    if (rank === 1) return "bg-[#2a2200]";
    if (rank === 2) return "bg-[#1a1a2a]";
    if (rank === 3) return "bg-[#1a1f1a]";
    return "";
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <AiOutlineLoading3Quarters className="animate-spin text-white text-4xl" />
    </div>
  );

  const myEntry = entries.find(e => e.user_id === user?.id);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">

      {/* Topbar */}
      <nav className="bg-[#161b22] border-b border-[#21262d] h-auto sm:h-14 flex flex-col sm:flex-row items-center px-4 sm:px-6 sticky top-0 z-40 py-2 sm:py-0">
        <Link href="/">
          <div className="flex items-center justify-between w-full sm:w-auto sm:mr-8 mb-2 sm:mb-0 cursor-pointer">
            <div className="flex items-center gap-2">
              <IoCodeSlash className="text-brand-orange text-2xl" />
              <span className="font-bold text-lg">LeetClone</span>
            </div>
            <div className="sm:hidden flex items-center gap-3">
              <Link href="/profile">
                <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center text-white font-bold text-sm">
                  {user?.email?.[0]?.toUpperCase()}
                </div>
              </Link>
              <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors"><FiLogOut size={16} /></button>
            </div>
          </div>
        </Link>
        
        <div className="flex items-center gap-1 flex-1 w-full overflow-x-auto no-scrollbar">
          <Link href="/">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm
              text-gray-400 hover:text-white hover:bg-[#21262d] cursor-pointer transition-colors whitespace-nowrap">
              <FiBookOpen size={14} /> Problems
            </div>
          </Link>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm text-white bg-[#21262d] whitespace-nowrap">
            <FiAward size={14} /> Leaderboard
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 ml-4">
          <Link href="/profile">
            <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center
              justify-center text-white font-bold text-sm cursor-pointer hover:opacity-80">
              {user?.email?.[0]?.toUpperCase()}
            </div>
          </Link>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors">
            <FiLogOut size={16} />
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BsTrophy className="text-yellow-400 text-2xl sm:text-3xl" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Leaderboard</h1>
            <p className="text-gray-400 text-xs sm:text-sm">{entries.length} coders ranked</p>
          </div>
        </div>

        {/* My Rank Card */}
        {myEntry && (
          <div className="bg-[#161b22] border border-brand-orange rounded-xl p-4 mb-6
            flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="text-xl sm:text-2xl font-bold text-brand-orange min-w-[40px]">#{myRank}</div>
              <div className="w-10 h-10 rounded-full bg-brand-orange flex items-center
                justify-center text-white font-bold flex-shrink-0">
                {myEntry.username?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-white font-medium truncate">{myEntry.username} <span className="text-xs text-brand-orange">(You)</span></div>
                <div className="text-[10px] text-gray-400">Last active {formatDate(myEntry.last_active)}</div>
              </div>
            </div>
            <div className="flex gap-4 sm:gap-6 text-center w-full sm:w-auto justify-around sm:justify-end border-t sm:border-t-0 border-[#21262d] pt-3 sm:pt-0">
              <div>
                <div className="text-base sm:text-lg font-bold text-white">{myEntry.solved_count}</div>
                <div className="text-[8px] sm:text-[10px] text-gray-400">Solved</div>
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-[#3fb950]">{myEntry.easy_count}</div>
                <div className="text-[8px] sm:text-[10px] text-gray-400">Easy</div>
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-[#d29922]">{myEntry.medium_count}</div>
                <div className="text-[8px] sm:text-[10px] text-gray-400">Medium</div>
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-[#f85149]">{myEntry.hard_count}</div>
                <div className="text-[8px] sm:text-[10px] text-gray-400">Hard</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 sm:gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
          {([
            { key: "solved",  label: "Total Solved", color: "text-white" },
            { key: "easy",    label: "Easy",         color: "text-[#3fb950]" },
            { key: "medium",  label: "Medium",       color: "text-[#d29922]" },
            { key: "hard",    label: "Hard",         color: "text-[#f85149]" },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm transition-colors whitespace-nowrap
                ${filter === f.key
                  ? `bg-[#21262d] ${f.color} font-medium`
                  : "text-gray-400 hover:text-white"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">

          {/* Header */}
          <div className="grid grid-cols-12 text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider
            px-3 sm:px-5 py-3 border-b border-[#21262d] bg-[#0d1117]">
            <span className="col-span-2 sm:col-span-1">Rank</span>
            <span className="col-span-4 sm:col-span-4">User</span>
            <span className="col-span-2 sm:col-span-2 text-center">Solved</span>
            <span className="col-span-1 text-center text-[#3fb950]">Easy</span>
            <span className="col-span-1 text-center text-[#d29922]">Med</span>
            <span className="col-span-1 text-center text-[#f85149]">Hard</span>
            <span className="hidden sm:block col-span-1 text-center">Subs</span>
            <span className="hidden sm:block col-span-1 text-center">Active</span>
            <span className="sm:hidden col-span-1"></span>
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No users yet. Be the first to solve a problem! 🚀
            </div>
          ) : (
            sorted.map((entry, idx) => {
              const rank = idx + 1;
              const isMe = entry.user_id === user?.id;
              return (
                <div key={entry.user_id}
                  className={`grid grid-cols-12 items-center px-3 sm:px-5 py-3 border-b
                    border-[#21262d] transition-colors hover:bg-[#21262d]
                    ${getRankBg(rank, isMe)}`}>

                  {/* Rank */}
                  <div className="col-span-2 sm:col-span-1 text-center">
                    {rank <= 3
                      ? <span className="text-lg sm:text-xl">{getRankIcon(rank)}</span>
                      : <span className="text-gray-400 text-xs sm:text-sm font-mono">#{rank}</span>
                    }
                  </div>

                  {/* User */}
                  <div className="col-span-4 flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center
                      text-white font-bold text-xs sm:text-sm flex-shrink-0
                      ${isMe ? "bg-brand-orange" : "bg-[#21262d]"}`}>
                      {entry.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs sm:text-sm font-medium truncate ${isMe ? "text-brand-orange" : "text-white"}`}>
                        {entry.username || "Anonymous"}
                      </div>
                    </div>
                  </div>

                  {/* Solved */}
                  <div className="col-span-2 text-center">
                    <span className="text-white text-xs sm:text-sm font-bold">{entry.solved_count}</span>
                  </div>

                  {/* Easy */}
                  <div className="col-span-1 text-center">
                    <span className="text-[#3fb950] text-[10px] sm:text-sm">{entry.easy_count}</span>
                  </div>

                  {/* Medium */}
                  <div className="col-span-1 text-center">
                    <span className="text-[#d29922] text-[10px] sm:text-sm">{entry.medium_count}</span>
                  </div>

                  {/* Hard */}
                  <div className="col-span-1 text-center">
                    <span className="text-[#f85149] text-[10px] sm:text-sm">{entry.hard_count}</span>
                  </div>

                  {/* Submissions */}
                  <div className="hidden sm:block col-span-1 text-center">
                    <span className="text-gray-400 text-xs sm:text-sm">{entry.total_submissions}</span>
                  </div>

                  {/* Last active */}
                  <div className="hidden sm:block col-span-1 text-center">
                    <span className="text-gray-500 text-[10px] sm:text-xs">{formatDate(entry.last_active)}</span>
                  </div>
                  
                  <div className="sm:hidden col-span-1"></div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}