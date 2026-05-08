import { useState, useEffect } from "react";
import { supabase } from "@/supabase/supabase";
import { useRouter } from "next/router";
import Link from "next/link";
import { BsCheckCircleFill } from "react-icons/bs";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { IoCodeSlash } from "react-icons/io5";
import { FiMessageSquare } from "react-icons/fi";
import { BiFilterAlt } from "react-icons/bi";
import ThemeToggle from "../Buttons/ThemeToggle";

type Problem = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  order: number;
  video_id?: string;
};

type DashboardProps = {
  user: any;
};

const TOPICS = [
  "All", "Array", "String", "Linked List", "Stack", "Queue",
  "Tree", "Graph", "Dynamic Programming", "Binary Search",
  "Sorting", "Hashing", "General",
];

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [solvedProblems, setSolvedProblems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"problems" | "discussion">("problems");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [postingDiscussion, setPostingDiscussion] = useState(false);

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("problems")
        .select("*")
        .order("order", { ascending: true });
      if (data) setProblems(data);
      setLoading(false);
    };
    fetchProblems();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchSolved = async () => {
      const { data } = await supabase
        .from("solved_problems")
        .select("problem_id")
        .eq("user_id", user.id);
      if (data) setSolvedProblems(data.map((d: any) => d.problem_id));
    };
    fetchSolved();
  }, [user]);

  useEffect(() => {
    if (activeTab !== "discussion") return;
    const fetchDiscussions = async () => {
      const { data } = await supabase
        .from("discussions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setDiscussions(data);
    };
    fetchDiscussions();
  }, [activeTab]);

  const handlePostDiscussion = async () => {
    if (!newPost.trim()) return;
    setPostingDiscussion(true);
    const { data, error } = await supabase
      .from("discussions")
      .insert({
        user_id: user.id,
        user_email: user.email,
        content: newPost.trim(),
      })
      .select()
      .single();
    if (!error && data) {
      setDiscussions([data, ...discussions]);
      setNewPost("");
    }
    setPostingDiscussion(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const filteredProblems = problems.filter((p) => {
    const topicMatch = selectedTopic === "All" || p.category === selectedTopic;
    const diffMatch = selectedDifficulty === "All" || p.difficulty === selectedDifficulty;
    const searchMatch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    return topicMatch && diffMatch && searchMatch;
  });

  const solvedCount = solvedProblems.length;
  const totalCount = problems.length;

  const difficultyBg = (d: string) =>
    d === "Easy" ? "bg-green-900 text-green-400" :
    d === "Medium" ? "bg-yellow-900 text-yellow-400" :
    "bg-red-900 text-red-400";

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">

      {/* Topbar */}
      <nav className="bg-dark-layer-1 border-b border-dark-fill-3 h-auto sm:h-14 flex flex-col sm:flex-row items-center px-4 sm:px-6 sticky top-0 z-50 py-2 sm:py-0">
        <div className="flex items-center justify-between w-full sm:w-auto sm:mr-8 mb-2 sm:mb-0">
          <div className="flex items-center gap-2">
            <IoCodeSlash className="text-brand-orange text-2xl" />
            <span className="text-white font-bold text-lg">LeetClone</span>
          </div>
          <div
            onClick={() => router.push("/profile")}
            className="sm:hidden w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center
              text-white font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity"
            title="View Profile"
          >
            {user?.email?.[0]?.toUpperCase()}
          </div>
        </div>

        {/* Nav tabs */}
        <div className="flex items-center gap-1 flex-1 w-full overflow-x-auto no-scrollbar mb-2 sm:mb-0">
          <button
            onClick={() => { setActiveTab("problems"); setShowFilters(false); }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm transition-colors shrink-0
              ${activeTab === "problems" ? "bg-dark-fill-3 text-white" : "text-gray-400 hover:text-white"}`}
          >
            <span>Problems</span>
          </button>

          <button
            onClick={() => setActiveTab("discussion")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm transition-colors shrink-0
              ${activeTab === "discussion" ? "bg-dark-fill-3 text-white" : "text-gray-400 hover:text-white"}`}
          >
            <span>Discussion</span>
          </button>

          <Link href="/contests" className="shrink-0">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm
              text-gray-400 hover:text-white hover:bg-dark-fill-3 cursor-pointer transition-colors">
              <span>Contests</span>
            </div>
          </Link>

          <Link href="/leaderboard" className="shrink-0">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm
              text-gray-400 hover:text-white hover:bg-dark-fill-3 cursor-pointer transition-colors">
              <span>Leaderboard</span>
            </div>
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 sm:gap-4 bg-dark-fill-3 px-2 sm:px-3 py-1.5 rounded-lg border border-dark-fill-2 flex-1 sm:flex-none justify-center">
            <ThemeToggle />
            <div className="w-px h-4 bg-dark-fill-2" />
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex flex-row items-center gap-1 sm:gap-2">
                <div className="hidden xs:block text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-tighter font-semibold">Solved</div>
                <div className="text-xs sm:text-sm font-bold text-white">{solvedCount}</div>
              </div>
              <div className="w-px h-4 bg-dark-fill-2" />
              <div className="flex flex-row items-center gap-1 sm:gap-2">
                <div className="hidden xs:block text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-tighter font-semibold">Total</div>
                <div className="text-xs sm:text-sm font-bold text-white">{totalCount}</div>
              </div>
            </div>
            <div className="w-px h-4 bg-dark-fill-2" />
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke="#282828" strokeWidth="4" />
                <circle cx="20" cy="20" r="16" fill="none" stroke="#00b8a3" strokeWidth="4"
                  strokeDasharray={`${totalCount > 0 ? (solvedCount / totalCount) * 100.5 : 0} 100.5`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[7px] sm:text-[8px] text-white font-bold">
                {totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0}%
              </div>
            </div>
          </div>

          <div
            onClick={() => router.push("/profile")}
            className="hidden sm:flex w-8 h-8 rounded-full bg-brand-orange items-center justify-center
              text-white font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity"
            title="View Profile"
          >
            {user?.email?.[0]?.toUpperCase()}
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* PROBLEMS TAB */}
        {activeTab === "problems" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:w-64">
                  <input
                    type="text"
                    placeholder="Search problems..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-dark-layer-1 text-white text-sm px-4 py-2 rounded-lg
                      border border-dark-fill-3 focus:border-brand-orange outline-none placeholder-gray-500"
                  />
                </div>

                {/* Filter Button + Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-lg border transition-colors flex items-center gap-2 text-sm
                      ${showFilters
                        ? "bg-brand-orange border-brand-orange text-white"
                        : "bg-dark-layer-1 border-dark-fill-3 text-gray-400 hover:text-white"}`}
                  >
                    <BiFilterAlt size={18} />
                    <span className="hidden xs:inline">Filter</span>
                  </button>

                  {/* Filter Dropdown */}
                  {showFilters && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-[100]"
                        onClick={() => setShowFilters(false)}
                      />

                      {/* Dropdown panel */}
                      <div className="absolute right-0 mt-2 w-72 bg-[#1e1e1e] border border-[#3e3e3e]
                        rounded-xl shadow-2xl z-[200] p-4">

                        {/* Difficulty */}
                        <div className="mb-4">
                          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">
                            Difficulty
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {DIFFICULTIES.map((d) => (
                              <button
                                key={d}
                                onClick={() => setSelectedDifficulty(d)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                                  ${selectedDifficulty === d
                                    ? "bg-brand-orange text-white"
                                    : "bg-[#3e3e3e] text-gray-300 hover:text-white hover:bg-[#4e4e4e]"
                                  }`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Topic */}
                        <div>
                          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">
                            Topic
                          </div>
                          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                            {TOPICS.map((t) => (
                              <button
                                key={t}
                                onClick={() => setSelectedTopic(t)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                                  ${selectedTopic === t
                                    ? "bg-brand-orange text-white"
                                    : "bg-[#3e3e3e] text-gray-300 hover:text-white hover:bg-[#4e4e4e]"
                                  }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-4 pt-3 border-t border-[#3e3e3e] flex justify-between items-center">
                          <button
                            onClick={() => {
                              setSelectedDifficulty("All");
                              setSelectedTopic("All");
                            }}
                            className="text-[10px] text-gray-500 hover:text-white underline"
                          >
                            Reset all
                          </button>
                          <button
                            onClick={() => setShowFilters(false)}
                            className="bg-[#3e3e3e] text-white px-3 py-1 rounded text-xs hover:bg-[#4e4e4e] transition-colors"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-400 mb-4">{filteredProblems.length} problems found</div>

            {loading ? (
              <div className="flex justify-center mt-20">
                <AiOutlineLoading3Quarters className="animate-spin text-white text-3xl" />
              </div>
            ) : (
              <div className="bg-dark-layer-1 rounded-xl overflow-hidden border border-dark-fill-3">
                {/* Table Header */}
                <div className="grid grid-cols-12 text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider
                  px-4 sm:px-5 py-3 border-b border-dark-fill-3">
                  <div className="col-span-2 sm:col-span-1">Status</div>
                  <div className="col-span-6">Title</div>
                  <div className="col-span-4 sm:col-span-2">Difficulty</div>
                  <div className="hidden sm:block col-span-3">Category</div>
                </div>

                {filteredProblems.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    No problems found with current filters.
                  </div>
                ) : (
                  filteredProblems.map((problem, idx) => (
                    <Link href={`/problems/${problem.id}`} key={problem.id}>
                      <div className={`grid grid-cols-12 items-center px-4 sm:px-5 py-4 cursor-pointer
                        transition-colors hover:bg-dark-fill-3
                        ${idx % 2 === 0 ? "bg-dark-layer-1" : "bg-dark-layer-2"}`}>
                        <div className="col-span-2 sm:col-span-1">
                          {solvedProblems.includes(problem.id) ? (
                            <BsCheckCircleFill className="text-green-400 text-lg" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-600" />
                          )}
                        </div>
                        <div className="col-span-6 text-white text-sm hover:text-brand-orange transition-colors truncate pr-2">
                          {problem.title}
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-full font-medium ${difficultyBg(problem.difficulty)}`}>
                            {problem.difficulty}
                          </span>
                        </div>
                        <div className="hidden sm:block col-span-3 text-gray-400 text-xs">
                          {problem.category}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* DISCUSSION TAB */}
        {activeTab === "discussion" && (
          <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
            <h2 className="text-white text-xl font-bold mb-6">Discussion</h2>

            <div className="bg-dark-layer-1 rounded-xl p-4 mb-6 border border-dark-fill-3">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Start a discussion, ask a question, share a tip..."
                className="w-full bg-dark-fill-3 text-white text-sm px-4 py-3 rounded-lg
                  border border-transparent focus:border-brand-orange outline-none
                  resize-none placeholder-gray-500 min-h-[80px]"
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-500">Logged in as {user?.email}</span>
                <button
                  onClick={handlePostDiscussion}
                  disabled={postingDiscussion || !newPost.trim()}
                  className="px-4 py-2 bg-brand-orange hover:bg-brand-orange-s text-white
                    text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {postingDiscussion
                    ? <AiOutlineLoading3Quarters className="animate-spin" />
                    : "Post"}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {discussions.length === 0 ? (
                <div className="text-center py-16">
                  <FiMessageSquare className="text-gray-600 text-5xl mx-auto mb-3" />
                  <p className="text-gray-400">No discussions yet. Start one!</p>
                </div>
              ) : (
                discussions.map((d) => (
                  <div key={d.id} className="bg-dark-layer-1 rounded-xl p-4 border border-dark-fill-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center
                        justify-center text-white text-sm font-bold">
                        {d.user_email?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">
                          {d.user_email?.split("@")[0]}
                        </div>
                        <div className="text-gray-500 text-xs">{formatDate(d.created_at)}</div>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{d.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;