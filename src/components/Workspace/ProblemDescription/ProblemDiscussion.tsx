import { useState, useEffect } from "react";
import { supabase } from "@/supabase/supabase";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiMessageSquare, FiThumbsUp, FiSend } from "react-icons/fi";
import { toast } from "react-toastify";

type Comment = {
  id: string;
  problem_id: string;
  user_id: string;
  user_email: string;
  username: string;
  content: string;
  likes: number;
  created_at: string;
};

type ProblemDiscussionProps = {
  problemId: string;
};

export default function ProblemDiscussion({ problemId }: ProblemDiscussionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("problem_discussions")
        .select("*")
        .eq("problem_id", problemId)
        .order("created_at", { ascending: false });
      if (data) setComments(data);
      setLoading(false);
    };
    fetchComments();
  }, [problemId]);

  const handlePost = async () => {
    if (!newComment.trim() || !user) return;
    setPosting(true);

    // maybeSingle() — error nahi throw karta agar row nahi milti
    let username = user.email?.split("@")[0] || "User";
    try {
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("username")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profileData?.username) username = profileData.username;
    } catch (_) {}

    const { data, error } = await supabase
      .from("problem_discussions")
      .insert({
        problem_id: problemId,
        user_id: user.id,
        user_email: user.email,
        username,
        content: newComment.trim(),
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to post: " + error.message, {
        position: "top-center", theme: "dark",
      });
    } else if (data) {
      setComments([data, ...comments]);
      setNewComment("");
      toast.success("Posted!", {
        position: "top-center", theme: "dark", autoClose: 1500,
      });
    }
    setPosting(false);
  };

  const handleLike = async (comment: Comment) => {
    if (!user || likedComments.has(comment.id)) return;
    const newLikes = comment.likes + 1;
    const { error } = await supabase
      .from("problem_discussions")
      .update({ likes: newLikes })
      .eq("id", comment.id);
    if (!error) {
      setComments(comments.map(c => c.id === comment.id ? { ...c, likes: newLikes } : c));
      setLikedComments(new Set([...likedComments, comment.id]));
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });

  return (
    <div className="h-[calc(100vh-94px)] overflow-y-auto">
      <div className="p-5">

        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <FiMessageSquare className="text-brand-orange" size={16} />
          <h3 className="text-white font-medium text-sm">
            Discussion
            <span className="ml-2 text-gray-400 font-normal">({comments.length})</span>
          </h3>
        </div>

        {/* New comment box */}
        {user ? (
          <div className="bg-dark-layer-2 border border-dark-fill-3 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-brand-orange flex items-center
                justify-center text-white text-xs font-bold flex-shrink-0">
                {user.email?.[0]?.toUpperCase()}
              </div>
              <span className="text-xs text-gray-400">{user.email?.split("@")[0]}</span>
            </div>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handlePost(); }}
              placeholder="Share your approach, ask a question... (Ctrl+Enter to post)"
              className="w-full bg-dark-layer-1 text-white text-sm px-3 py-2.5 rounded-lg
                border border-dark-fill-3 focus:border-brand-orange outline-none
                resize-none placeholder-gray-600 min-h-[80px] transition-colors"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] text-gray-600">Ctrl+Enter to post</span>
              <button
                onClick={handlePost}
                disabled={posting || !newComment.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-orange
                  hover:bg-brand-orange-s text-white text-xs rounded-lg transition-colors
                  disabled:opacity-50"
              >
                {posting
                  ? <AiOutlineLoading3Quarters className="animate-spin" size={12} />
                  : <><FiSend size={11} /> Post</>
                }
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-dark-layer-2 border border-dark-fill-3 rounded-xl p-4 mb-5 text-center">
            <p className="text-gray-400 text-sm">Login to join the discussion</p>
          </div>
        )}

        {/* Comments */}
        {loading ? (
          <div className="flex justify-center py-10">
            <AiOutlineLoading3Quarters className="animate-spin text-white text-2xl" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <FiMessageSquare className="text-gray-700 text-4xl mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No comments yet.</p>
            <p className="text-gray-600 text-xs mt-1">Be the first to share your approach!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map(comment => (
              <div key={comment.id}
                className="bg-dark-layer-2 border border-dark-fill-3 rounded-xl p-4
                  hover:border-gray-600 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1f6feb]
                      to-brand-orange flex items-center justify-center text-white text-xs font-bold">
                      {comment.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <span className="text-white text-xs font-medium">{comment.username}</span>
                      <span className="text-gray-600 text-[10px] ml-2">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLike(comment)}
                    disabled={!user || likedComments.has(comment.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors
                      ${likedComments.has(comment.id)
                        ? "text-brand-orange bg-[#2d1a00]"
                        : "text-gray-400 hover:text-brand-orange hover:bg-dark-fill-3"
                      } disabled:cursor-not-allowed`}
                  >
                    <FiThumbsUp size={11} />
                    <span>{comment.likes}</span>
                  </button>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}