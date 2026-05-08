import { useState, useEffect } from "react";
import { Problem } from "@/utils/types/problem";
import { supabase } from "@/supabase/supabase";
import { AiFillLike, AiFillDislike, AiOutlineLoading3Quarters } from "react-icons/ai";
import { BsCheck2Circle } from "react-icons/bs";
import { TiStarOutline, TiStar } from "react-icons/ti";
import { FiStar } from "react-icons/fi"; // Import FiStar icon
import { toast } from "react-toastify";
import { SubmitResult } from "../Playground/Playground";
import ProblemDiscussion from "@/components/Workspace/ProblemDescription/ProblemDiscussion";
import ProblemEditorial from "./ProblemEditorial";

type ProblemDescriptionProps = {
  problem: Problem;
  _solved: boolean;
  submitResult: SubmitResult | null;
  onClearResult: () => void;

  // Props for bookmarking
  user: any;
  isStarred: boolean;
  handleToggleBookmark: (problemId: string) => Promise<void>;
  currentProblemId: string;
};

type Submission = {
  id: string;
  status: string;
  runtime: number;
  memory: number;
  language: string;
  created_at: string;
  code: string;
};

// Add 'notes' to TabType
type TabType = "description" | "editorial" | "solutions" | "submissions" | "discussion" | "notes";

const ProblemDescription: React.FC<ProblemDescriptionProps> = ({
  problem,
  _solved,
  submitResult,
  onClearResult,
  // Destructure new props
  user,
  isStarred,
  handleToggleBookmark,
  currentProblemId,
}) => {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  // Use isStarred from props directly, local state is redundant if props are stable
  // const [starred, setStarred] = useState(false); 
  const [localStarred, setLocalStarred] = useState(isStarred); // Use local state for immediate UI feedback
  const [solved, setSolved] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>("description");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // State and handlers for Notes
  const [notesContent, setNotesContent] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Sync local starred state with prop changes
  useEffect(() => {
    setLocalStarred(isStarred);
  }, [isStarred]);

  useEffect(() => {
    if (submitResult) {
      setActiveTab("submissions");
      setSelectedSubmission(null);
      fetchSubmissions();
    }
  }, [submitResult]);

  // Auth effect for user, keeping existing logic
  useEffect(() => {
    if (!user) { // If user logs out, reset local states that depend on user
      setLiked(false);
      setDisliked(false);
      setLocalStarred(false);
      setSolved(false);
      // setStarred(false); // Local starred state removed, using prop isStarred
      setNotesContent(""); // Clear notes
      setCurrentProblem(null); // Clear problem details if user changes
      setSubmissions([]);
      setSelectedSubmission(null);
      setActiveTab("description"); // Reset tab
      }    // Existing auth listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Fetch related user data only if user is present
        fetchUserData(session.user.id);
        fetchNotes(session.user.id); // Fetch notes when user logs in
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
        fetchNotes(session.user.id); // Fetch notes when user logs in
      } else {
        // Reset states when user logs out
        setLiked(false);
        setDisliked(false);
        setLocalStarred(false);
        setSolved(false);
        setStarred(false); // Ensure local starred state is reset too if needed
        setNotesContent(""); // Clear notes
        setCurrentProblem(null);
        setSubmissions([]);
        setSelectedSubmission(null);
        setActiveTab("description"); // Reset tab
      }
    });
    return () => subscription.unsubscribe();
  }, []); // Dependency array for auth listener

  // Fetch problem details, keeping existing logic
  useEffect(() => {
    const fetchProblem = async () => {
      const { data } = await supabase
        .from("problems").select("*").eq("id", problem.id).single();
      if (data) setCurrentProblem(data);
    };
    fetchProblem();
  }, [problem.id]);

  // Fetch user-specific data (likes, dislikes, solved, stars)
  const fetchUserData = async (userId: string) => {
    const { data: solvedData } = await supabase
      .from("solved_problems").select("*")
      .eq("user_id", userId).eq("problem_id", problem.id).single();
    if (solvedData) setSolved(true);

    const { data: likedData } = await supabase
      .from("problem_likes").select("*")
      .eq("user_id", userId).eq("problem_id", problem.id).single();
    if (likedData) {
      setLiked(likedData.type === "like");
      setDisliked(likedData.type === "dislike");
    }

    // Starred data is now managed by props, but for consistency with other fetches:
    // If you need to fetch initial starred state here as well (though it's passed as prop)
    // const { data: starredData } = await supabase
    //   .from("problem_stars").select("*")
    //   .eq("user_id", userId).eq("problem_id", problem.id).single();
    // if (starredData) setStarred(true); // This local starred state might be redundant now
  };

  // Fetch submissions
  const fetchSubmissions = async () => {
    if (!user) return;
    setLoadingSubmissions(true);
    const { data } = await supabase
      .from("submissions").select("*")
      .eq("user_id", user.id).eq("problem_id", problem.id)
      .order("created_at", { ascending: false });
    if (data) setSubmissions(data);
    setLoadingSubmissions(false);
  };

  useEffect(() => {
    if (activeTab === "submissions") fetchSubmissions();
  }, [activeTab, user]);

  // --- Like/Dislike Handlers ---
  const handleLike = async () => {
    if (!user) { toast.error("Please login", { position: "top-center", theme: "dark" }); return; }
    if (updating) return;
    setUpdating(true);
    try {
      // Logic for updating likes/dislikes (existing)
      const currentLikes = currentProblem?.likes || 0;
      const currentDislikes = currentProblem?.dislikes || 0;

      if (liked) { // If currently liked, unlike
        await supabase.from("problem_likes").delete().eq("user_id", user.id).eq("problem_id", problem.id);
        setCurrentProblem((p: any) => ({ ...p, likes: currentLikes - 1 }));
        setLiked(false);
      } else { // If not liked, like it (and remove dislike if active)
        await supabase.from("problem_likes").upsert({ user_id: user.id, problem_id: problem.id, type: "like" }, { onConflict: "user_id,problem_id" });
        setCurrentProblem((p: any) => ({ ...p, likes: currentLikes + 1, dislikes: disliked ? currentDislikes - 1 : currentDislikes }));
        setLiked(true);
        if (disliked) setDisliked(false);
      }
    } catch (error: any) {
      console.error("Error handling like:", error);
      toast.error("Something went wrong", { position: "top-center", theme: "dark" });
    } finally {
      setUpdating(false);
    }
  };

  const handleDislike = async () => {
    if (!user) { toast.error("Please login", { position: "top-center", theme: "dark" }); return; }
    if (updating) return;
    setUpdating(true);
    try {
      const currentLikes = currentProblem?.likes || 0;
      const currentDislikes = currentProblem?.dislikes || 0;

      if (disliked) { // If currently disliked, undislike
        await supabase.from("problem_likes").delete().eq("user_id", user.id).eq("problem_id", problem.id);
        setCurrentProblem((p: any) => ({ ...p, dislikes: currentDislikes - 1 }));
        setDisliked(false);
      } else { // If not disliked, dislike it (and remove like if active)
        await supabase.from("problem_likes").upsert({ user_id: user.id, problem_id: problem.id, type: "dislike" }, { onConflict: "user_id,problem_id" });
        setCurrentProblem((p: any) => ({ ...p, dislikes: currentDislikes + 1, likes: liked ? currentLikes - 1 : currentLikes }));
        setDisliked(true);
        if (liked) setLiked(false);
      }
    } catch (error: any) {
      console.error("Error handling dislike:", error);
      toast.error("Something went wrong", { position: "top-center", theme: "dark" });
    } finally {
      setUpdating(false);
    }
  };

  // --- Star/Bookmark Handler ---
  // This function now uses the passed-down handler from the page
  const handleStarClick = async () => {
    if (!user) {
      toast.error("Please login to bookmark problems.", { position: "top-center", theme: "dark" });
      return;
    }
    await handleToggleBookmark(currentProblemId);
    // Update local state immediately for UI feedback, assuming prop will update soon
    setLocalStarred(!localStarred); 
  };

  // --- Notes Handlers ---
  const fetchNotes = async (userId: string) => {
    if (!userId) return;
    setLoadingNotes(true);
    const { data, error } = await supabase
      .from("problem_notes")
      .select("content")
      .eq("user_id", userId)
      .eq("problem_id", problem.id)
      .single();

    if (error && error.code !== "PGRST116") { // Ignore "0 rows" error if no note exists
      console.error("Error fetching notes:", error);
      toast.error("Could not load notes.", { position: "top-center", theme: "dark" });
    } else if (data) {
      setNotesContent(data.content || "");
    }
    setLoadingNotes(false);
  };

  const saveNotes = async () => {
    if (!user) { toast.error("Please login to save notes.", { position: "top-center", theme: "dark" }); return; }
    if (updating) return; // Reuse updating state for saving notes
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("problem_notes")
        .upsert([
          { user_id: user.id, problem_id: problem.id, content: notesContent }
        ], { onConflict: "user_id,problem_id" });

      if (error) {
        console.error("Error saving notes:", error);
        toast.error("Failed to save notes. Please try again.", { position: "top-center", theme: "dark" });
      } else {
        toast.success("Notes saved successfully!", { position: "top-center", theme: "dark" });
        setIsEditingNotes(false); // Exit editing mode after saving
      }
    } catch (error: any) {
      console.error("An unexpected error occurred while saving notes:", error);
      toast.error("An unexpected error occurred.", { position: "top-center", theme: "dark" });
    } finally {
      setUpdating(false);
    }
  };

  // --- Tab management ---
  const difficultyClass =
    currentProblem?.difficulty === "Easy" ? "text-dark-green-s" :
    currentProblem?.difficulty === "Medium" ? "text-dark-yellow" : "text-dark-pink";

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    });
  };

  // Add 'notes' tab
  const tabs: { id: TabType; label: string }[] = [
    { id: "description", label: "Description" },
    { id: "editorial",   label: "Editorial" },
    { id: "solutions",   label: "Solutions" },
    { id: "submissions", label: "Submissions" },
    { id: "discussion",  label: "Discussion" },
    { id: "notes",       label: "Notes" }, // New Notes tab
  ];

  return (
    <div className="bg-dark-layer-1 flex flex-col h-full">

      {/* Tabs */}
      <div className="flex h-11 w-full items-center pt-2 bg-dark-layer-2
        text-white overflow-x-auto scrollbar-hide border-b border-dark-fill-3">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id !== "submissions") onClearResult();
              setSelectedSubmission(null);
              if (tab.id !== "notes") setIsEditingNotes(false); // Exit editing mode if not on notes tab
              // Fetch notes when switching to notes tab
              if (tab.id === "notes" && user) fetchNotes(user.id);
            }}
            className={`px-4 py-[10px] text-xs cursor-pointer whitespace-nowrap
              transition-colors border-b-2
              ${activeTab === tab.id
                ? "border-white text-white bg-dark-layer-1"
                : "border-transparent text-gray-400 hover:text-white"
              }`}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* DESCRIPTION TAB */}
      {activeTab === "description" && (
        <div className="flex px-0 py-4 h-[calc(100vh-94px)] overflow-y-auto">
          <div className="px-5 w-full">
            <div className="flex items-center justify-between mb-2"> {/* Added justify-between */}
              <div className="flex-1 mr-2 text-lg text-white font-medium">{problem.title}</div>
              {/* Bookmark Icon - moved here to be alongside title */}
              <div className="cursor-pointer p-2 hover:bg-dark-fill-3 rounded" onClick={handleStarClick}>
                {localStarred ? (
                  <TiStar className="text-dark-yellow text-xl" />
                ) : (
                  <TiStarOutline className="text-gray-500 text-xl" />
                )}
              </div>
            </div>

            <div className="flex items-center mt-3 flex-wrap gap-2">
              <div className={`${difficultyClass} inline-block rounded-[21px]
                bg-opacity-[.15] px-2.5 py-1 text-xs font-medium`}>
                {currentProblem?.difficulty}
              </div>

              {(solved || _solved) && (
                <div className="rounded p-[3px] text-lg text-dark-green-s">
                  <BsCheck2Circle />
                </div>
              )}

              <div className="flex items-center cursor-pointer hover:bg-dark-fill-3
                space-x-1 rounded p-[3px] text-lg text-dark-gray-6" onClick={handleLike}>
                {updating && liked ? <AiOutlineLoading3Quarters className="animate-spin" /> :
                  liked ? <AiFillLike className="text-dark-blue-s" /> : <AiFillLike />}
                <span className="text-xs">{currentProblem?.likes ?? 0}</span>
              </div>

              <div className="flex items-center cursor-pointer hover:bg-dark-fill-3
                space-x-1 rounded p-[3px] text-lg text-dark-gray-6" onClick={handleDislike}>
                {updating && disliked ? <AiOutlineLoading3Quarters className="animate-spin" /> :
                  disliked ? <AiFillDislike className="text-dark-blue-s" /> : <AiFillDislike />}
                <span className="text-xs">{currentProblem?.dislikes ?? 0}</span>
              </div>

              {/* Star icon moved up to be next to title */}
              {/* <div className="cursor-pointer hover:bg-dark-fill-3 rounded p-[3px]
                text-xl text-dark-gray-6" onClick={handleStar}>
                {starred ? <TiStar className="text-dark-yellow" /> : <TiStarOutline />}
              </div> */}
            </div>

            <div className="text-white text-sm mt-3">
              <div dangerouslySetInnerHTML={{ __html: problem.problemStatement }} />
            </div>

            <div className="mt-4">
              {problem.examples.map((example, index) => (
                <div key={example.id} className="mb-4">
                  <p className="font-medium text-white mb-2">Example {index + 1}:</p>
                  {example.img && <img src={example.img} alt="example" className="mt-2 mb-2" />}
                  <div className="example-card">
                    <pre className="text-sm">
                      <strong className="text-white">Input: </strong>{example.inputText}{"\n"}
                      <strong className="text-white">Output: </strong>{example.outputText}{"\n"}
                      {example.explanation && (
                        <><strong className="text-white">Explanation: </strong>{example.explanation}</>
                      )}
                    </pre>
                  </div>
                </div>
              ))}
            </div>

            <div className="my-5 pb-4">
              <div className="text-white text-sm font-medium">Constraints:</div>
              <div dangerouslySetInnerHTML={{ __html: problem.constraints }}
                className="text-white mt-2 text-sm ml-3" />
            </div>
          </div>
        </div>
      )}

      {/* EDITORIAL TAB */}
      {activeTab === "editorial" && (
        <ProblemEditorial problemId={problem.id} />
      )}

      {/* SOLUTIONS TAB */}
      {activeTab === "solutions" && (
        <div className="h-[calc(100vh-94px)] overflow-y-auto p-5">
          <div className="text-center mt-16">
            <div className="text-6xl mb-4">💡</div>
            <h3 className="text-white text-lg font-medium mb-2">Community Solutions</h3>
            <p className="text-gray-400 text-sm">
              Community solutions will be displayed here.
            </p>
          </div>
        </div>
      )}

      {/* SUBMISSIONS TAB */}
      {activeTab === "submissions" && (
        <div className="h-[calc(100vh-94px)] overflow-y-auto">

          {submitResult && (
            <div className={`mx-5 mt-5 rounded-xl p-5 border
              ${submitResult.status === "Accepted"
                ? "bg-green-950 border-green-700"
                : "bg-red-950 border-red-700"
              }`}>
              <div className={`text-2xl font-bold mb-3
                ${submitResult.status === "Accepted" ? "text-green-400" : "text-red-400"}`}>
                {submitResult.status === "Accepted" ? "✓ " : "✗ "}
                {submitResult.status}
              </div>

              <div className="text-white text-sm mb-4">
                {submitResult.passedCount} / {submitResult.totalCount} test cases passed
              </div>

              <div className="w-full bg-dark-fill-3 rounded-full h-2 mb-4">
                <div
                  className={`h-2 rounded-full transition-all duration-700
                    ${submitResult.status === "Accepted" ? "bg-green-500" : "bg-red-500"}`}
                  style={{
                    width: `${submitResult.totalCount > 0
                      ? (submitResult.passedCount / submitResult.totalCount) * 100
                      : 0}%`
                  }}
                />
              </div>

              {submitResult.status === "Accepted" && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-dark-layer-2 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-white">
                      {submitResult.runtime}
                      <span className="text-xs text-gray-400 ml-1">ms</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Runtime</div>
                    <div className="text-xs text-green-400 mt-1">
                      Beats ~{Math.floor(Math.random() * 30 + 60)}% of users
                    </div>
                  </div>
                  <div className="bg-dark-layer-2 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-white">
                      {submitResult.memory}
                      <span className="text-xs text-gray-400 ml-1">MB</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Memory</div>
                    <div className="text-xs text-green-400 mt-1">
                      Beats ~{Math.floor(Math.random() * 30 + 50)}% of users
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-5">
            <h3 className="text-white font-medium mb-4 text-sm">
              {submitResult ? "All Submissions" : "Submissions"}
            </h3>

            {!user ? (
              <p className="text-gray-400 text-sm">Please login to see submissions.</p>
            ) : loadingSubmissions ? (
              <div className="flex justify-center mt-10">
                <AiOutlineLoading3Quarters className="animate-spin text-white text-2xl" />
              </div>
            ) : submissions.length === 0 ? (
              <p className="text-gray-400 text-sm">No submissions yet.</p>
            ) : selectedSubmission ? (
              <div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1"
                >
                  ← Back
                </button>

                <div className={`rounded-lg p-4 mb-4 ${
                  selectedSubmission.status === "Accepted"
                    ? "bg-green-900 border border-green-600"
                    : "bg-red-900 border border-red-600"
                }`}>
                  <div className={`text-xl font-bold mb-1 ${
                    selectedSubmission.status === "Accepted" ? "text-green-400" : "text-red-400"
                  }`}>
                    {selectedSubmission.status}
                  </div>
                  <div className="text-xs text-gray-300">
                    Submitted {formatDate(selectedSubmission.created_at)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-dark-layer-2 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-white">{selectedSubmission.runtime} ms</div>
                    <div className="text-xs text-gray-400">Runtime</div>
                  </div>
                  <div className="bg-dark-layer-2 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-white">{selectedSubmission.memory} MB</div>
                    <div className="text-xs text-gray-400">Memory</div>
                  </div>
                </div>

                <div className="bg-dark-layer-2 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-2 flex justify-between">
                    <span>Code</span>
                    <span className="text-green-400">{selectedSubmission.language}</span>
                  </div>
                  <pre className="text-sm text-green-300 overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                    {selectedSubmission.code}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 sm:grid-cols-4 text-[10px] sm:text-xs text-gray-400 pb-2
                  border-b border-gray-700 px-2 sm:px-3">
                  <span>Status</span>
                  <span className="hidden xs:block">Runtime</span>
                  <span className="xs:hidden">Time</span>
                  <span className="hidden sm:block">Memory</span>
                  <span className="text-right sm:text-left">Date</span>
                </div>
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubmission(sub)}
                    className="grid grid-cols-3 sm:grid-cols-4 items-center px-2 sm:px-3 py-3 rounded-lg
                      bg-dark-layer-2 hover:bg-dark-fill-3 cursor-pointer
                      transition-colors text-xs sm:text-sm"
                  >
                    <span className={`font-medium ${
                      sub.status === "Accepted" ? "text-green-400" : "text-red-400"
                    }`}>
                      {sub.status}
                    </span>
                    <span className="text-white text-[10px] sm:text-xs">{sub.runtime} ms</span>
                    <span className="hidden sm:block text-white text-[10px] sm:text-xs">{sub.memory} MB</span>
                    <span className="text-gray-400 text-[10px] sm:text-xs text-right sm:text-left">{formatDate(sub.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DISCUSSION TAB — ProblemDiscussion component */}
      {activeTab === "discussion" && (
        <ProblemDiscussion problemId={problem.id} />
      )}

      {/* NOTES TAB */}
      {activeTab === "notes" && (
        <div className="h-[calc(100vh-94px)] overflow-y-auto p-5">
          {!user ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">Please login to manage your notes.</p>
            </div>
          ) : loadingNotes ? (
            <div className="flex justify-center py-10">
              <AiOutlineLoading3Quarters className="animate-spin text-white text-2xl" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-medium text-sm">Your Notes</h3>
                {!isEditingNotes ? (
                  <button 
                    onClick={() => setIsEditingNotes(true)}
                    className="text-xs text-brand-orange hover:underline"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={saveNotes} 
                      disabled={updating}
                      className="px-3 py-1 bg-brand-orange text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                    >
                      {updating ? <AiOutlineLoading3Quarters className="animate-spin" /> : "Save"}
                    </button>
                    <button 
                      onClick={() => setIsEditingNotes(false)} 
                      className="px-3 py-1 bg-dark-layer-2 text-gray-300 text-xs rounded-lg hover:bg-dark-fill-3 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              
              {isEditingNotes ? (
                <textarea
                  value={notesContent}
                  onChange={(e) => setNotesContent(e.target.value)}
                  placeholder="Write your notes here..."
                  className="w-full bg-dark-layer-1 text-white text-sm px-3 py-2.5 rounded-lg border border-dark-fill-3 focus:border-brand-orange outline-none resize-none min-h-[150px] transition-colors"
                />
              ) : (
                <pre className="text-sm text-gray-300 whitespace-pre-wrap bg-dark-layer-1 p-4 rounded-lg border border-dark-fill-3 min-h-[150px]">
                  {notesContent || "No notes yet. Click 'Edit' to add some."}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProblemDescription;