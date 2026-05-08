import { useState, useEffect } from "react";
import { supabase } from "@/supabase/supabase";
import { useRouter } from "next/router";
import Link from "next/link";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { IoCodeSlash } from "react-icons/io5";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiLogOut, FiShield } from "react-icons/fi";
import { toast } from "react-toastify";

type Problem = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  order: number;
  video_id?: string;
  likes: number;
  dislikes: number;
};

type ProblemForm = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  order: number;
  video_id: string;
};

const CATEGORIES = [
  "Array", "String", "Linked List", "Stack", "Queue",
  "Tree", "Graph", "Dynamic Programming", "Binary Search",
  "Sorting", "Hashing", "General",
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const emptyForm: ProblemForm = {
  id: "", title: "", category: "Array",
  difficulty: "Easy", order: 1, video_id: "",
};

// ── Problem Modal ──────────────────────────────────────
const ProblemModal = ({
  mode,
  initial,
  onSave,
  onClose,
}: {
  mode: "add" | "edit";
  initial: ProblemForm;
  onSave: (form: ProblemForm) => Promise<void>;
  onClose: () => void;
}) => {
  const [form, setForm] = useState<ProblemForm>(initial);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof ProblemForm, val: any) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!form.id.trim())    { toast.error("Problem ID required"); return; }
    if (!form.title.trim()) { toast.error("Title required"); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161b22] border border-[#21262d] rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-lg">
            {mode === "add" ? "➕ Add Problem" : "✏️ Edit Problem"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <FiX size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* ID */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">
              Problem ID (slug) *
            </label>
            <input
              type="text"
              value={form.id}
              onChange={e => set("id", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              disabled={mode === "edit"}
              className="w-full bg-[#0d1117] border border-[#21262d] focus:border-[#58a6ff]
                text-white text-sm px-3 py-2.5 rounded-lg outline-none transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="two-sum"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Used in URL: /problems/two-sum
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => set("title", e.target.value)}
              className="w-full bg-[#0d1117] border border-[#21262d] focus:border-[#58a6ff]
                text-white text-sm px-3 py-2.5 rounded-lg outline-none transition-colors"
              placeholder="Two Sum"
            />
          </div>

          {/* Order */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">
              Order (number)
            </label>
            <input
              type="number"
              value={form.order}
              onChange={e => set("order", parseInt(e.target.value) || 1)}
              className="w-full bg-[#0d1117] border border-[#21262d] focus:border-[#58a6ff]
                text-white text-sm px-3 py-2.5 rounded-lg outline-none transition-colors"
              min={1}
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">
              Difficulty
            </label>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => set("difficulty", d)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                    ${form.difficulty === d
                      ? d === "Easy" ? "bg-green-900 text-green-400 border border-green-600"
                        : d === "Medium" ? "bg-yellow-900 text-yellow-400 border border-yellow-600"
                        : "bg-red-900 text-red-400 border border-red-600"
                      : "bg-[#21262d] text-gray-400 border border-transparent hover:border-gray-600"
                    }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">
              Category
            </label>
            <select
              value={form.category}
              onChange={e => set("category", e.target.value)}
              className="w-full bg-[#0d1117] border border-[#21262d] focus:border-[#58a6ff]
                text-white text-sm px-3 py-2.5 rounded-lg outline-none transition-colors"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* YouTube Video ID */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">
              YouTube Video ID (optional)
            </label>
            <div className="flex items-center gap-2 bg-[#0d1117] border border-[#21262d]
              focus-within:border-[#58a6ff] rounded-lg px-3 py-2.5 transition-colors">
              <span className="text-red-500 text-sm">▶</span>
              <input
                type="text"
                value={form.video_id}
                onChange={e => set("video_id", e.target.value)}
                className="bg-transparent text-white text-sm outline-none w-full"
                placeholder="aAqYAAyzvGY"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              From: youtube.com/watch?v=<span className="text-gray-400">aAqYAAyzvGY</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300
              rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-[#238636] hover:bg-[#2ea043] text-white
              rounded-lg text-sm transition-colors flex items-center justify-center gap-2
              disabled:opacity-50"
          >
            {saving
              ? <AiOutlineLoading3Quarters className="animate-spin" />
              : <><FiSave size={14} /> {mode === "add" ? "Add Problem" : "Save Changes"}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ───────────────────────────────
const DeleteModal = ({
  problem,
  onConfirm,
  onClose,
}: {
  problem: Problem;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) => {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161b22] border border-[#21262d] rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
        <div className="text-center mb-5">
          <div className="text-4xl mb-3">🗑️</div>
          <h2 className="text-white font-semibold text-lg mb-2">Delete Problem?</h2>
          <p className="text-gray-400 text-sm">
            Are you sure you want to delete <span className="text-white font-medium">&quot;{problem.title}&quot;</span>?
            This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-[#21262d] hover:bg-[#30363d] text-gray-300 rounded-lg text-sm transition-colors">
            Cancel
          </button>
          <button
            onClick={async () => { setDeleting(true); await onConfirm(); setDeleting(false); }}
            disabled={deleting}
            className="flex-1 py-2.5 bg-red-900 hover:bg-red-800 text-red-300 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {deleting ? <AiOutlineLoading3Quarters className="animate-spin" /> : <><FiTrash2 size={14} /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Admin Page ────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDiff, setFilterDiff] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProblem, setEditProblem] = useState<Problem | null>(null);
  const [deleteProblem, setDeleteProblem] = useState<Problem | null>(null);
  const [stats, setStats] = useState({ total: 0, easy: 0, medium: 0, hard: 0, submissions: 0, users: 0 });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/auth"); return; }
      setUser(session.user);

      // Check admin
      const { data: adminData } = await supabase
        .from("admins")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (!adminData) { router.push("/"); return; }
      setIsAdmin(true);

      await fetchAll();
      setLoading(false);
    };
    init();
  }, [router]);

  const fetchAll = async () => {
    const [probRes, subRes, userRes] = await Promise.all([
      supabase.from("problems").select("*").order("order", { ascending: true }),
      supabase.from("submissions").select("id", { count: "exact" }),
      supabase.from("user_profiles").select("id", { count: "exact" }),
    ]);

    if (probRes.data) {
      setProblems(probRes.data);
      setStats({
        total: probRes.data.length,
        easy: probRes.data.filter((p: Problem) => p.difficulty === "Easy").length,
        medium: probRes.data.filter((p: Problem) => p.difficulty === "Medium").length,
        hard: probRes.data.filter((p: Problem) => p.difficulty === "Hard").length,
        submissions: subRes.count || 0,
        users: userRes.count || 0,
      });
    }
  };

  const handleAdd = async (form: ProblemForm) => {
    const { error } = await supabase.from("problems").insert({
      id: form.id,
      title: form.title,
      category: form.category,
      difficulty: form.difficulty,
      order: form.order,
      video_id: form.video_id || null,
      likes: 0,
      dislikes: 0,
    });

    if (error) {
      toast.error(error.message.includes("duplicate") ? "Problem ID already exists!" : error.message, {
        position: "top-center", theme: "dark",
      });
      return;
    }

    toast.success("Problem added successfully!", { position: "top-center", theme: "dark" });
    setShowAddModal(false);
    await fetchAll();
  };

  const handleEdit = async (form: ProblemForm) => {
    const { error } = await supabase.from("problems").update({
      title: form.title,
      category: form.category,
      difficulty: form.difficulty,
      order: form.order,
      video_id: form.video_id || null,
    }).eq("id", form.id);

    if (error) {
      toast.error(error.message, { position: "top-center", theme: "dark" });
      return;
    }

    toast.success("Problem updated!", { position: "top-center", theme: "dark" });
    setEditProblem(null);
    await fetchAll();
  };

  const handleDelete = async (problem: Problem) => {
    const { error } = await supabase.from("problems").delete().eq("id", problem.id);
    if (error) {
      toast.error(error.message, { position: "top-center", theme: "dark" });
      return;
    }
    toast.success("Problem deleted!", { position: "top-center", theme: "dark" });
    setDeleteProblem(null);
    await fetchAll();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const filtered = problems.filter(p => {
    const s = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const d = filterDiff === "All" || p.difficulty === filterDiff;
    return s && d;
  });

  const diffBg = (d: string) =>
    d === "Easy" ? "bg-green-900 text-green-400" :
    d === "Medium" ? "bg-yellow-900 text-yellow-400" :
    "bg-red-900 text-red-400";

  if (loading) return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <AiOutlineLoading3Quarters className="animate-spin text-white text-4xl" />
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">

      {/* Topbar */}
      <nav className="bg-[#161b22] border-b border-[#21262d] h-14 flex items-center px-6 sticky top-0 z-40">
        <Link href="/">
          <div className="flex items-center gap-2 mr-8 cursor-pointer">
            <IoCodeSlash className="text-brand-orange text-2xl" />
            <span className="font-bold text-lg">LeetClone</span>
          </div>
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <FiShield className="text-brand-orange" size={16} />
          <span className="text-white font-medium text-sm">Admin Panel</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/">
            <div className="text-gray-400 hover:text-white text-sm transition-colors cursor-pointer">
              ← Back to App
            </div>
          </Link>
          <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center text-white font-bold text-sm">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors">
            <FiLogOut size={16} />
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-6 gap-3 mb-8">
          {[
            { label: "Total Problems", val: stats.total,       color: "text-white" },
            { label: "Easy",           val: stats.easy,        color: "text-[#3fb950]" },
            { label: "Medium",         val: stats.medium,      color: "text-[#d29922]" },
            { label: "Hard",           val: stats.hard,        color: "text-[#f85149]" },
            { label: "Submissions",    val: stats.submissions, color: "text-[#58a6ff]" },
            { label: "Users",          val: stats.users,       color: "text-[#bc8cff]" },
          ].map(s => (
            <div key={s.label} className="bg-[#161b22] border border-[#21262d] rounded-xl p-4">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">{s.label}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Problems Management */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262d]">
            <h2 className="text-white font-medium">Problems</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#238636] hover:bg-[#2ea043]
                text-white text-sm rounded-lg transition-colors"
            >
              <FiPlus size={14} /> Add Problem
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[#21262d] bg-[#0d1117]">
            <input
              type="text"
              placeholder="Search by title or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-[#161b22] border border-[#21262d] focus:border-[#58a6ff] text-white
                text-xs px-3 py-2 rounded-lg outline-none transition-colors w-64"
            />
            <div className="flex gap-2">
              {["All", "Easy", "Medium", "Hard"].map(d => (
                <button key={d} onClick={() => setFilterDiff(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors
                    ${filterDiff === d
                      ? d === "All" ? "bg-[#21262d] text-white"
                        : d === "Easy" ? "bg-green-900 text-green-400"
                        : d === "Medium" ? "bg-yellow-900 text-yellow-400"
                        : "bg-red-900 text-red-400"
                      : "text-gray-400 hover:text-white"
                    }`}>
                  {d}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-400 ml-auto">{filtered.length} problems</span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 text-[10px] text-gray-400 uppercase tracking-wider
            px-5 py-3 border-b border-[#21262d] bg-[#0d1117]">
            <span className="col-span-1">#</span>
            <span className="col-span-1">ID</span>
            <span className="col-span-4">Title</span>
            <span className="col-span-2">Difficulty</span>
            <span className="col-span-2">Category</span>
            <span className="col-span-1">Video</span>
            <span className="col-span-1 text-right">Actions</span>
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No problems found.</div>
          ) : (
            filtered.map((p, idx) => (
              <div key={p.id}
                className={`grid grid-cols-12 items-center px-5 py-3 border-b border-[#21262d]
                  hover:bg-[#21262d] transition-colors
                  ${idx % 2 === 0 ? "bg-[#161b22]" : "bg-[#0d1117]"}`}>
                <span className="col-span-1 text-gray-500 text-xs">{p.order}</span>
                <span className="col-span-1 text-gray-400 text-xs font-mono truncate">{p.id}</span>
                <span className="col-span-4 text-white text-sm">{p.title}</span>
                <span className="col-span-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffBg(p.difficulty)}`}>
                    {p.difficulty}
                  </span>
                </span>
                <span className="col-span-2 text-gray-400 text-xs">{p.category}</span>
                <span className="col-span-1">
                  {p.video_id
                    ? <span className="text-red-500 text-lg">▶</span>
                    : <span className="text-gray-600 text-xs">—</span>
                  }
                </span>
                <div className="col-span-1 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setEditProblem(p)}
                    className="p-1.5 text-gray-400 hover:text-[#58a6ff] hover:bg-[#1f3a5c]
                      rounded-lg transition-colors"
                    title="Edit"
                  >
                    <FiEdit2 size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteProblem(p)}
                    className="p-1.5 text-gray-400 hover:text-[#f85149] hover:bg-[#3d1a1a]
                      rounded-lg transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <ProblemModal
          mode="add"
          initial={emptyForm}
          onSave={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Modal */}
      {editProblem && (
        <ProblemModal
          mode="edit"
          initial={{
            id: editProblem.id,
            title: editProblem.title,
            category: editProblem.category,
            difficulty: editProblem.difficulty,
            order: editProblem.order,
            video_id: editProblem.video_id || "",
          }}
          onSave={handleEdit}
          onClose={() => setEditProblem(null)}
        />
      )}

      {/* Delete Modal */}
      {deleteProblem && (
        <DeleteModal
          problem={deleteProblem}
          onConfirm={() => handleDelete(deleteProblem)}
          onClose={() => setDeleteProblem(null)}
        />
      )}
    </div>
  );
}