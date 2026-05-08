import { useState, useEffect } from "react";
import { supabase } from "@/supabase/supabase";
import { useRouter } from "next/router";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { IoCodeSlash } from "react-icons/io5";
import { FiLock, FiEye, FiEyeOff, FiCheckCircle } from "react-icons/fi";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    // Supabase sets session from URL hash after redirect
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true);
      else setError("Invalid or expired reset link. Please request a new one.");
    });
  }, []);

  const handleReset = async () => {
    if (!password || !confirm) { setError("Please fill all fields"); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      setTimeout(() => router.push("/"), 2500);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4">

      <div className="flex items-center gap-2 mb-8">
        <IoCodeSlash className="text-brand-orange text-3xl" />
        <span className="text-white font-bold text-2xl">LeetClone</span>
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-[#161b22] border border-[#21262d] rounded-2xl p-6 shadow-2xl">

          {done ? (
            <div className="text-center">
              <FiCheckCircle className="text-green-400 text-5xl mx-auto mb-4" />
              <h2 className="text-white font-semibold text-xl mb-2">Password Updated!</h2>
              <p className="text-gray-400 text-sm">Redirecting you to the app...</p>
            </div>
          ) : (
            <>
              <h2 className="text-white font-semibold text-xl mb-1">Set New Password</h2>
              <p className="text-gray-400 text-sm mb-5">Enter your new password below.</p>

              {error && (
                <div className="bg-red-900/30 border border-red-800 rounded-lg px-3 py-2 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                  {!validSession && (
                    <button onClick={() => router.push("/auth")}
                      className="text-xs text-brand-orange hover:underline mt-1">
                      Go to Login →
                    </button>
                  )}
                </div>
              )}

              {validSession && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">
                      New Password
                    </label>
                    <div className="flex items-center gap-2 bg-[#0d1117] border border-[#21262d]
                      focus-within:border-[#58a6ff] rounded-lg px-3 py-2.5 transition-colors">
                      <FiLock className="text-gray-400 flex-shrink-0" size={14} />
                      <input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="bg-transparent text-white text-sm outline-none w-full"
                        placeholder="••••••••"
                      />
                      <button onClick={() => setShowPass(!showPass)}
                        className="text-gray-400 hover:text-white transition-colors">
                        {showPass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">
                      Confirm Password
                    </label>
                    <div className="flex items-center gap-2 bg-[#0d1117] border border-[#21262d]
                      focus-within:border-[#58a6ff] rounded-lg px-3 py-2.5 transition-colors">
                      <FiLock className="text-gray-400 flex-shrink-0" size={14} />
                      <input
                        type={showPass ? "text" : "password"}
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleReset()}
                        className="bg-transparent text-white text-sm outline-none w-full"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* Password strength */}
                  {password.length > 0 && (
                    <div>
                      <div className="h-1 bg-[#21262d] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${
                          password.length < 6 ? "w-1/4 bg-red-500" :
                          password.length < 10 ? "w-2/4 bg-yellow-500" :
                          "w-full bg-green-500"
                        }`} />
                      </div>
                      <p className={`text-[10px] mt-1 ${
                        password.length < 6 ? "text-red-400" :
                        password.length < 10 ? "text-yellow-400" : "text-green-400"
                      }`}>
                        {password.length < 6 ? "Weak" : password.length < 10 ? "Medium" : "Strong"}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleReset}
                    disabled={loading}
                    className="w-full py-2.5 bg-brand-orange hover:bg-brand-orange-s text-white
                      rounded-lg text-sm font-medium transition-colors flex items-center
                      justify-center gap-2 disabled:opacity-50"
                  >
                    {loading
                      ? <AiOutlineLoading3Quarters className="animate-spin" />
                      : "Update Password"
                    }
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}