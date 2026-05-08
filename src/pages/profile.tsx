import { useState, useEffect } from "react";
import { supabase } from "@/supabase/supabase";
import { useRouter } from "next/router";
import Link from "next/link";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BsCheckCircleFill, BsGithub, BsLinkedin, BsPencil } from "react-icons/bs";
import { FiLogOut, FiBookOpen, FiMessageSquare, FiUser, FiX, FiSave } from "react-icons/fi";
import { IoCodeSlash } from "react-icons/io5";
import { BiTrophy } from "react-icons/bi";

type Submission = {
  id: string;
  problem_id: string;
  status: string;
  runtime: number;
  memory: number;
  language: string;
  created_at: string;
};

type Problem = {
  id: string;
  title: string;
  difficulty: string;
  category: string;
  order: number;
};

type ActivityDay = {
  date: string;
  count: number;
};

type UserProfile = {
  username: string;
  bio: string;
  github: string;
  linkedin: string;
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const BADGES = [
  { icon: "🔥", name: "Streak Starter", desc: "7 day streak",   condition: (s: number) => s >= 7 },
  { icon: "⚡", name: "Speed Coder",    desc: "< 50ms runtime", condition: (_: number, r: number) => r > 0 && r < 50 },
  { icon: "🌱", name: "Getting Started",desc: "Solved 5+",      condition: (_: number, __: number, t: number) => t >= 5 },
  { icon: "📚", name: "Bookworm",       desc: "Solved 25+",     condition: (_: number, __: number, t: number) => t >= 25 },
  { icon: "🏆", name: "Champion",       desc: "Solved 50+",     condition: (_: number, __: number, t: number) => t >= 50 },
  { icon: "🎯", name: "Consistent",     desc: "Solved 100+",    condition: (_: number, __: number, t: number) => t >= 100 },
  { icon: "🌟", name: "Hard Hitter",    desc: "Solved 1 Hard",  condition: (_: number, __: number, __2: number, h: number) => h >= 1 },
  { icon: "💎", name: "Diamond Coder",  desc: "Solved 5 Hard",  condition: (_: number, __: number, __2: number, h: number) => h >= 5 },
];

function getLevelClass(count: number): string {
  if (count === 0) return "bg-[#161b22] border border-[#21262d]";
  if (count <= 2)  return "bg-[#0e4429]";
  if (count <= 5)  return "bg-[#006d32]";
  if (count <= 9)  return "bg-[#26a641]";
  return "bg-[#39d353]";
}

function buildHeatmapData(submissions: Submission[]): ActivityDay[] {
  const map: Record<string, number> = {};
  submissions.forEach(s => {
    const day = s.created_at.split("T")[0];
    map[day] = (map[day] || 0) + 1;
  });
  const days: ActivityDay[] = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  start.setDate(start.getDate() - start.getDay()); // go to Sunday
  const cur = new Date(start);
  while (cur <= today) {
    const key = cur.toISOString().split("T")[0];
    days.push({ date: key, count: map[key] || 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function calcStreaks(submissions: Submission[]) {
  const days = new Set(submissions.map(s => s.created_at.split("T")[0]));
  const sorted = Array.from(days).sort();
  let max = 0, streak = 0;
  let prev: Date | null = null;
  for (const d of sorted) {
    const cur = new Date(d);
    if (prev) {
      const diff = (cur.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) { streak++; } else { max = Math.max(max, streak); streak = 1; }
    } else { streak = 1; }
    prev = cur;
  }
  max = Math.max(max, streak);
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const current = days.has(today) || days.has(yesterday) ? streak : 0;
  return { current, max, total: days.size };
}

const EditProfileModal = ({
  profile, onSave, onClose,
}: {
  profile: UserProfile;
  onSave: (p: UserProfile) => void;
  onClose: () => void;
}) => {
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);
  const handleSave = async () => { setSaving(true); await onSave(form); setSaving(false); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#161b22] border border-[#21262d] rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-lg">Edit Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <FiX size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Username</label>
            <input type="text" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              className="w-full bg-[#0d1117] border border-[#21262d] focus:border-[#58a6ff] text-white text-sm px-3 py-2.5 rounded-lg outline-none transition-colors"
              placeholder="Your username" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Bio</label>
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
              className="w-full bg-[#0d1117] border border-[#21262d] focus:border-[#58a6ff] text-white text-sm px-3 py-2.5 rounded-lg outline-none transition-colors resize-none min-h-[80px]"
              placeholder="Tell something about yourself..." />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">GitHub URL</label>
            <div className="flex items-center gap-2 bg-[#0d1117] border border-[#21262d] focus-within:border-[#58a6ff] rounded-lg px-3 py-2.5 transition-colors">
              <BsGithub className="text-gray-400 flex-shrink-0" size={14} />
              <input type="text" value={form.github} onChange={e => setForm({ ...form, github: e.target.value })}
                className="bg-transparent text-white text-sm outline-none w-full"
                placeholder="https://github.com/username" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">LinkedIn URL</label>
            <div className="flex items-center gap-2 bg-[#0d1117] border border-[#21262d] focus-within:border-[#58a6ff] rounded-lg px-3 py-2.5 transition-colors">
              <BsLinkedin className="text-[#0a66c2] flex-shrink-0" size={14} />
              <input type="text" value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })}
                className="bg-transparent text-white text-sm outline-none w-full"
                placeholder="https://linkedin.com/in/username" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 rounded-lg text-sm transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <AiOutlineLoading3Quarters className="animate-spin" /> : <><FiSave size={14} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [solvedProblems, setSolvedProblems] = useState<Problem[]>([]);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<"overview" | "submissions">("overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({ username: "", bio: "", github: "", linkedin: "" });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth"); return; }
      setUser(session.user);
      const uid = session.user.id;
      const defaultUsername = session.user.email?.split("@")[0] || "User";

      const [subRes, solvedRes, allRes, profileRes] = await Promise.all([
        supabase.from("submissions").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        supabase.from("solved_problems").select("problem_id").eq("user_id", uid),
        supabase.from("problems").select("*").order("order", { ascending: true }),
        supabase.from("user_profiles").select("*").eq("user_id", uid).single(),
      ]);

      if (subRes.data)  setSubmissions(subRes.data);
      if (allRes.data)  setAllProblems(allRes.data);
      if (solvedRes.data && allRes.data) {
        const solvedIds = new Set(solvedRes.data.map((s: any) => s.problem_id));
        setSolvedProblems(allRes.data.filter((p: Problem) => solvedIds.has(p.id)));
      }
      setUserProfile(profileRes.data
        ? { username: profileRes.data.username || defaultUsername, bio: profileRes.data.bio || "", github: profileRes.data.github || "", linkedin: profileRes.data.linkedin || "" }
        : { username: defaultUsername, bio: "", github: "", linkedin: "" }
      );
      setLoading(false);
    };
    init();
  }, []);

  const handleSaveProfile = async (newProfile: UserProfile) => {
    if (!user) return;
    await supabase.from("user_profiles").upsert(
      { user_id: user.id, ...newProfile, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    setUserProfile(newProfile);
    setShowEditModal(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/auth"); };

  const heatmapDays  = buildHeatmapData(submissions);
  const streaks      = calcStreaks(submissions);
  const easySolved   = solvedProblems.filter(p => p.difficulty === "Easy").length;
  const mediumSolved = solvedProblems.filter(p => p.difficulty === "Medium").length;
  const hardSolved   = solvedProblems.filter(p => p.difficulty === "Hard").length;
  const totalSolved  = solvedProblems.length;
  const totalAll     = allProblems.length;
  const easyTotal    = allProblems.filter(p => p.difficulty === "Easy").length;
  const mediumTotal  = allProblems.filter(p => p.difficulty === "Medium").length;
  const hardTotal    = allProblems.filter(p => p.difficulty === "Hard").length;
  const acceptedSubs = submissions.filter(s => s.status === "Accepted").length;
  const acceptanceRate = submissions.length > 0 ? Math.round((acceptedSubs / submissions.length) * 100) : 0;
  const bestRuntime  = submissions.filter(s => s.status === "Accepted" && s.runtime > 0).reduce((min, s) => s.runtime < min ? s.runtime : min, Infinity);
  const earnedBadges = BADGES.filter(b => b.condition(streaks.current, bestRuntime === Infinity ? 999 : bestRuntime, totalSolved, hardSolved));

  // Build weeks
  const weeks: ActivityDay[][] = [];
  for (let i = 0; i < heatmapDays.length; i += 7) weeks.push(heatmapDays.slice(i, i + 7));

  // Month labels — one label per month, placed at correct week column
  const monthLabels: { label: string; col: number }[] = [];
  weeks.forEach((week, wi) => {
    if (!week[0]) return;
    const d = new Date(week[0].date);
    if (d.getDate() <= 7) monthLabels.push({ label: MONTHS[d.getMonth()], col: wi });
  });

  const circleR = 42, circleC = 2 * Math.PI * circleR;
  const easyPct   = easyTotal   > 0 ? (easySolved / easyTotal)   * 100 : 0;
  const mediumPct = mediumTotal > 0 ? (mediumSolved / mediumTotal) * 100 : 0;
  const hardPct   = hardTotal   > 0 ? (hardSolved / hardTotal)   * 100 : 0;
  const diffColor = (d: string) => d === "Easy" ? "text-[#3fb950] bg-[#0d2d15]" : d === "Medium" ? "text-[#d29922] bg-[#2d1f00]" : "text-[#f85149] bg-[#2d0d0d]";

  if (loading) return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <AiOutlineLoading3Quarters className="animate-spin text-white text-4xl" />
    </div>
  );

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
              <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center text-white font-bold text-sm">
                {userProfile.username?.[0]?.toUpperCase()}
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors"><FiLogOut size={16} /></button>
            </div>
          </div>
        </Link>

        {/* Navigation - Scrollable on mobile */}
        <div className="flex items-center gap-1 flex-1 w-full overflow-x-auto no-scrollbar">
          <Link href="/">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[#21262d] cursor-pointer transition-colors whitespace-nowrap">
              <FiBookOpen size={14} /> Problems
            </div>
          </Link>
          <Link href="/">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[#21262d] cursor-pointer transition-colors whitespace-nowrap">
              <FiMessageSquare size={14} /> Discussion
            </div>
          </Link>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm text-white bg-[#21262d] whitespace-nowrap">
            <FiUser size={14} /> Profile
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 ml-4">
          <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center text-white font-bold text-sm">
            {userProfile.username?.[0]?.toUpperCase()}
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors"><FiLogOut size={16} /></button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:grid lg:grid-cols-[260px_1fr] gap-6">

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
            <div className="flex flex-col items-center text-center pb-4 border-b border-[#21262d] mb-4">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1f6feb] to-brand-orange flex items-center justify-center text-3xl font-bold">
                  {userProfile.username?.[0]?.toUpperCase()}
                </div>
                <div className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-[#238636] rounded-full border-2 border-[#161b22] flex items-center justify-center text-[9px]">✓</div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="text-lg font-semibold">{userProfile.username}</div>
                <button onClick={() => setShowEditModal(true)}
                  className="text-gray-500 hover:text-white transition-colors p-1 rounded-md hover:bg-[#21262d]" title="Edit Profile">
                  <BsPencil size={12} />
                </button>
              </div>
              <div className="text-xs text-brand-orange bg-[#2d1a00] px-3 py-1 rounded-full mb-2">
                {totalSolved >= 50 ? "Expert Coder" : totalSolved >= 20 ? "Rising Coder" : "Beginner"}
              </div>
              {userProfile.bio
                ? <p className="text-xs text-gray-400 mt-1 leading-relaxed">{userProfile.bio}</p>
                : <p className="text-xs text-gray-600 mt-1 italic cursor-pointer hover:text-gray-400" onClick={() => setShowEditModal(true)}>+ Add a bio</p>
              }
              <div className="text-xs text-gray-500 mt-2">
                Joined {new Date(user?.created_at || Date.now()).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
              </div>
            </div>
            {[["Problems Solved", totalSolved], ["Submissions", submissions.length], ["Acceptance Rate", `${acceptanceRate}%`], ["Best Runtime", bestRuntime === Infinity ? "N/A" : `${bestRuntime} ms`]].map(([label, val]) => (
              <div key={label as string} className="flex justify-between items-center py-2 border-b border-[#21262d] last:border-none">
                <span className="text-xs text-gray-400">{label}</span>
                <span className="text-sm font-medium">{val}</span>
              </div>
            ))}
            <div className="flex gap-2 mt-4">
              {userProfile.github
                ? <a href={userProfile.github} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg text-[10px] sm:text-xs text-gray-400 hover:text-white transition-colors"><BsGithub size={13} /> GitHub</a>
                : <button onClick={() => setShowEditModal(true)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#21262d] border border-dashed border-[#30363d] rounded-lg text-[10px] sm:text-xs text-gray-600 hover:text-gray-400 transition-colors"><BsGithub size={13} /> Add GitHub</button>
              }
              {userProfile.linkedin
                ? <a href={userProfile.linkedin} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg text-[10px] sm:text-xs text-gray-400 hover:text-white transition-colors"><BsLinkedin size={13} /> LinkedIn</a>
                : <button onClick={() => setShowEditModal(true)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#21262d] border border-dashed border-[#30363d] rounded-lg text-[10px] sm:text-xs text-gray-600 hover:text-gray-400 transition-colors"><BsLinkedin size={13} /> Add LinkedIn</button>
              }
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Streak</div>
            <div className="grid grid-cols-3 gap-2">
              {([["🔥", streaks.current, "Current"], ["⚡", streaks.max, "Best"], ["📅", streaks.total, "Active Days"]] as [string, number, string][]).map(([icon, val, lbl]) => (
                <div key={lbl} className="bg-[#0d1117] rounded-lg p-2 sm:p-3 text-center">
                  <div className="text-base sm:text-lg mb-1">{icon}</div>
                  <div className="text-lg sm:text-xl font-bold text-[#58a6ff]">{val}</div>
                  <div className="text-[8px] sm:text-[10px] text-gray-400 mt-1">{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Languages</div>
            {(() => {
              const langMap: Record<string, number> = {};
              submissions.forEach(s => { langMap[s.language] = (langMap[s.language] || 0) + 1; });
              const langs = Object.entries(langMap).sort((a, b) => b[1] - a[1]).slice(0, 4);
              const total = langs.reduce((s, [, v]) => s + v, 0);
              const colors = ["#58a6ff", "#3fb950", "#d29922", "#f85149"];
              if (langs.length === 0) return <p className="text-xs text-gray-500">No submissions yet.</p>;
              return langs.map(([lang, count], i) => (
                <div key={lang} className="mb-3 last:mb-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">{lang}</span>
                    <span className="text-gray-400">{Math.round((count / total) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(count / total) * 100}%`, background: colors[i] }} />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Main */}
        <div className="flex flex-col gap-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Solved", val: totalSolved,  sub: `of ${totalAll}`,    color: "text-white" },
              { label: "Easy",         val: easySolved,   sub: `of ${easyTotal}`,   color: "text-[#3fb950]" },
              { label: "Medium",       val: mediumSolved, sub: `of ${mediumTotal}`, color: "text-[#d29922]" },
              { label: "Hard",         val: hardSolved,   sub: `of ${hardTotal}`,   color: "text-[#f85149]" },
            ].map(card => (
              <div key={card.label} className="bg-[#161b22] border border-[#21262d] hover:border-[#30363d] rounded-xl p-4 transition-colors">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">{card.label}</div>
                <div className={`text-2xl sm:text-3xl font-bold mb-1 ${card.color}`}>{card.val}</div>
                <div className="text-[10px] sm:text-xs text-gray-500">{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Progress + Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-4">Progress</div>
              <div className="flex items-center gap-6">
                <svg width="90" height="90" viewBox="0 0 100 100" className="flex-shrink-0 sm:w-[110px] sm:h-[110px]">
                  <circle cx="50" cy="50" r={circleR} fill="none" stroke="#21262d" strokeWidth="8" />
                  <circle cx="50" cy="50" r={circleR} fill="none" stroke="#3fb950" strokeWidth="8" strokeDasharray={`${(easyPct/100)*circleC} ${circleC}`} strokeLinecap="round" transform="rotate(-90 50 50)" />
                  <circle cx="50" cy="50" r={circleR} fill="none" stroke="#d29922" strokeWidth="8" strokeDasharray={`${(mediumPct/100)*circleC} ${circleC}`} strokeLinecap="round" transform={`rotate(${-90+(easyPct/100)*360} 50 50)`} />
                  <circle cx="50" cy="50" r={circleR} fill="none" stroke="#f85149" strokeWidth="8" strokeDasharray={`${(hardPct/100)*circleC} ${circleC}`} strokeLinecap="round" transform={`rotate(${-90+((easyPct+mediumPct)/100)*360} 50 50)`} />
                  <text x="50" y="47" textAnchor="middle" fill="#e6edf3" fontSize="18" fontWeight="600">{totalSolved}</text>
                  <text x="50" y="60" textAnchor="middle" fill="#8b949e" fontSize="9">solved</text>
                </svg>
                <div className="flex-1 flex flex-col gap-3">
                  {[
                    { label: "Easy",   count: easySolved,   total: easyTotal,   color: "#3fb950" },
                    { label: "Medium", count: mediumSolved, total: mediumTotal, color: "#d29922" },
                    { label: "Hard",   count: hardSolved,   total: hardTotal,   color: "#f85149" },
                  ].map(d => (
                    <div key={d.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: d.color }}>{d.label}</span>
                        <span className="text-gray-400">{d.count}/{d.total}</span>
                      </div>
                      <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${d.total > 0 ? (d.count/d.total)*100 : 0}%`, background: d.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-4">Performance</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Acceptance Rate",   val: `${acceptanceRate}%`,                              icon: "🎯" },
                  { label: "Total Submissions", val: submissions.length,                                icon: "📤" },
                  { label: "Accepted",          val: acceptedSubs,                                      icon: "✅" },
                  { label: "Best Runtime",      val: bestRuntime === Infinity ? "N/A" : `${bestRuntime}ms`, icon: "⚡" },
                ].map(s => (
                  <div key={s.label} className="bg-[#0d1117] rounded-lg p-2 sm:p-3">
                    <div className="text-base sm:text-lg mb-1">{s.icon}</div>
                    <div className="text-base sm:text-lg font-bold text-[#58a6ff]">{s.val}</div>
                    <div className="text-[8px] sm:text-[10px] text-gray-400 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Heatmap — Scrollable on mobile */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="text-xs text-gray-400 uppercase tracking-wider">Activity</div>
              <div className="text-[10px] sm:text-xs text-gray-400">
                <span className="text-[#3fb950] font-medium">{submissions.length}</span> total submissions
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <div className="min-w-[650px]">
                {/* Month labels */}
                <div className="flex gap-0.5 mb-1">
                  {weeks.map((week, wi) => {
                    const lbl = monthLabels.find(m => m.col === wi);
                    return (
                      <div key={wi} className="w-3 flex-shrink-0 relative">
                        {lbl && (
                          <span className="absolute text-[9px] text-gray-500 whitespace-nowrap" style={{ left: 0 }}>
                            {lbl.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Actual cells */}
                <div className="flex gap-0.5 mt-3">
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-0.5">
                      {week.map(day => (
                        <div key={day.date}
                          className={`w-3 h-3 rounded-[2px] cursor-pointer transition-opacity hover:ring-1 hover:ring-[#58a6ff] ${getLevelClass(day.count)}`}
                          onMouseEnter={e => {
                            setHoveredDay(`${day.count} submission${day.count !== 1 ? "s" : ""} on ${new Date(day.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}`);
                            setTooltipPos({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => setHoveredDay(null)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-3 justify-end">
              <span className="text-[10px] text-gray-500">Less</span>
              {[0, 1, 3, 6, 10].map(n => <div key={n} className={`w-3 h-3 rounded-[2px] ${getLevelClass(n)}`} />)}
              <span className="text-[10px] text-gray-500">More</span>
            </div>
          </div>

          {/* Solved / Submissions */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
            <div className="flex border-b border-[#21262d] overflow-x-auto no-scrollbar">
              {(["overview", "submissions"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-xs font-medium capitalize transition-colors whitespace-nowrap ${activeTab === tab ? "text-white border-b-2 border-brand-orange bg-[#0d1117]" : "text-gray-400 hover:text-white"}`}>
                  {tab === "overview" ? "Solved Problems" : "All Submissions"}
                </button>
              ))}
            </div>
            {activeTab === "overview" && (
              <div className="divide-y divide-[#21262d] max-h-80 overflow-y-auto">
                {solvedProblems.length === 0
                  ? <div className="py-12 text-center text-gray-400 text-sm">No problems solved yet. Start solving! 🚀</div>
                  : solvedProblems.map(p => (
                    <Link href={`/problems/${p.id}`} key={p.id}>
                      <div className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-[#21262d] transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <BsCheckCircleFill className="text-[#3fb950] text-sm flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-white hover:text-brand-orange transition-colors truncate">{p.order}. {p.title}</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 ml-2 shrink-0">
                          <span className="hidden xs:block text-[10px] text-gray-400">{p.category}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${diffColor(p.difficulty)}`}>{p.difficulty}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                }
              </div>
            )}
            {activeTab === "submissions" && (
              <div className="max-h-80 overflow-y-auto">
                {submissions.length === 0
                  ? <div className="py-12 text-center text-gray-400 text-sm">No submissions yet.</div>
                  : <>
                    <div className="grid grid-cols-4 sm:grid-cols-5 text-[10px] text-gray-400 uppercase tracking-wider px-4 sm:px-5 py-2 bg-[#0d1117] sticky top-0">
                      <span className="col-span-2">Problem</span><span>Status</span><span className="hidden sm:block">Runtime</span><span className="text-right sm:text-left">Date</span>
                    </div>
                    {submissions.map(s => (
                      <div key={s.id} className="grid grid-cols-4 sm:grid-cols-5 items-center px-4 sm:px-5 py-3 border-b border-[#21262d] hover:bg-[#21262d] transition-colors text-xs sm:text-sm">
                        <span className="col-span-2 text-gray-300 truncate capitalize mr-2">{s.problem_id.replace(/-/g, " ")}</span>
                        <span className={s.status === "Accepted" ? "text-[#3fb950]" : "text-[#f85149]"}>{s.status}</span>
                        <span className="hidden sm:block text-gray-400 text-xs">{s.runtime > 0 ? `${s.runtime} ms` : "—"}</span>
                        <span className="text-gray-500 text-[10px] sm:text-xs text-right sm:text-left">{new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      </div>
                    ))}
                  </>
                }
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BiTrophy className="text-brand-orange" />
              <div className="text-xs text-gray-400 uppercase tracking-wider">Badges — {earnedBadges.length}/{BADGES.length} earned</div>
            </div>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-3">
              {BADGES.map(b => {
                const earned = earnedBadges.includes(b);
                return (
                  <div key={b.name} className={`rounded-xl p-2 sm:p-3 text-center border transition-all ${earned ? "bg-[#0d2044] border-[#1f6feb] hover:border-[#58a6ff] hover:scale-105" : "bg-[#0d1117] border-[#21262d] opacity-40"}`}>
                    <div className="text-xl sm:text-2xl mb-1 sm:mb-2">{b.icon}</div>
                    <div className="text-[10px] sm:text-xs font-medium mb-0.5 truncate">{b.name}</div>
                    <div className="text-[8px] sm:text-[10px] text-gray-400 line-clamp-1">{b.desc}</div>
                    {earned && <div className="text-[8px] sm:text-[9px] text-[#58a6ff] mt-1">Earned ✓</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div className="fixed z-50 bg-[#1c2128] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white pointer-events-none shadow-xl"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 35 }}>
          {hoveredDay}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditProfileModal profile={userProfile} onSave={handleSaveProfile} onClose={() => setShowEditModal(false)} />
      )}
    </div>
  );
}