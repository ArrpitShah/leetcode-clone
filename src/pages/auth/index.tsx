import { useState } from "react";
import { supabase } from "@/supabase/supabase";
import { useRouter } from "next/router";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { IoCodeSlash } from "react-icons/io5";
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowLeft } from "react-icons/fi";
import ThemeToggle from "@/components/Buttons/ThemeToggle";

type AuthMode = "login" | "register" | "forgot" | "verify";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearMessages = () => { setError(""); setSuccess(""); };

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill all fields"); return; }
    setLoading(true); clearMessages();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(
        error.message.includes("Invalid login") ? "Invalid email or password." :
        error.message.includes("Email not confirmed") ? "Please verify your email first. Check your inbox." :
        error.message
      );
    } else {
      router.push("/");
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!email || !password || !username) { setError("Please fill all fields"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); clearMessages();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: username } },
    });

    if (error) {
      setError(error.message.includes("already registered")
        ? "Email already registered. Try logging in."
        : error.message
      );
    } else {
      // Save profile
      if (data.user) {
        await supabase.from("user_profiles").insert({
          user_id: data.user.id,
          username,
        });
      }

      // Check if email confirmation needed
      if (data.session) {
        // Email confirmation OFF — directly logged in
        router.push("/");
      } else {
        // Email confirmation ON
        setMode("verify");
        setSuccess(`Verification email sent to ${email}`);
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Please enter your email"); return; }
    setLoading(true); clearMessages();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(`Password reset link sent to ${email}! Check your inbox.`);
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    if (!email) { setError("Please enter your email"); return; }
    setLoading(true); clearMessages();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) { setError(error.message); }
    else { setSuccess("Verification email resent!"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark-layer-2 flex flex-col items-center justify-center px-4 relative">
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <IoCodeSlash className="text-brand-orange text-3xl" />
        <span className="text-white font-bold text-2xl">LeetClone</span>
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-dark-layer-1 border border-dark-fill-3 rounded-2xl p-6 shadow-2xl">

          {/* ── VERIFY EMAIL ── */}
          {mode === "verify" && (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-white font-semibold text-xl mb-2">Check your email</h2>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                We sent a verification link to <span className="text-white font-medium">{email}</span>.
                Click the link to activate your account.
              </p>
              {success && <p className="text-green-400 text-sm mb-4">{success}</p>}
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <button
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full py-2.5 bg-dark-fill-3 hover:bg-dark-fill-2 text-gray-300
                  rounded-lg text-sm transition-colors mb-3 flex items-center justify-center gap-2"
              >
                {loading ? <AiOutlineLoading3Quarters className="animate-spin" /> : "Resend Email"}
              </button>
              <button
                onClick={() => { setMode("login"); clearMessages(); }}
                className="text-sm text-brand-orange hover:underline"
              >
                Back to Login
              </button>
            </div>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {mode === "forgot" && (
            <>
              <button
                onClick={() => { setMode("login"); clearMessages(); }}
                className="flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-5 transition-colors"
              >
                <FiArrowLeft size={14} /> Back to Login
              </button>

              <h2 className="text-white font-semibold text-xl mb-1">Reset Password</h2>
              <p className="text-gray-400 text-sm mb-5">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              {success ? (
                <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-2">✉️</div>
                  <p className="text-green-400 text-sm">{success}</p>
                  <button
                    onClick={() => { setMode("login"); clearMessages(); }}
                    className="mt-3 text-xs text-gray-400 hover:text-white underline"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="bg-red-900/30 border border-red-800 rounded-lg px-3 py-2 mb-4">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Email</label>
                    <div className="flex items-center gap-2 bg-dark-fill-3 border border-dark-fill-2 rounded-lg px-3 py-2.5 transition-colors">                      <FiMail className="text-gray-400 flex-shrink-0" size={14} />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleForgotPassword()}
                        className="bg-transparent text-white text-sm outline-none w-full"
                        placeholder="name@example.com" />
                    </div>
                  </div>

                  <button onClick={handleForgotPassword} disabled={loading}
                    className="w-full py-2.5 bg-brand-orange hover:bg-brand-orange-s text-white
                      rounded-lg text-sm font-medium transition-colors flex items-center
                      justify-center gap-2 disabled:opacity-50">
                    {loading ? <AiOutlineLoading3Quarters className="animate-spin" /> : "Send Reset Link"}
                  </button>
                </>
              )}
            </>
          )}

          {/* ── LOGIN / REGISTER ── */}
          {(mode === "login" || mode === "register") && (
            <>
              {/* Tabs */}
              <div className="flex mb-6 bg-dark-fill-3 rounded-xl p-1">
                {(["login", "register"] as const).map(m => (
                  <button key={m} onClick={() => { setMode(m); clearMessages(); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize
                      ${mode === m ? "bg-dark-layer-2 text-white shadow-sm" : "text-gray-400 hover:text-white"}`}>
                    {m === "login" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-900/30 border border-red-800 rounded-lg px-3 py-2 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="bg-green-900/30 border border-green-800 rounded-lg px-3 py-2 mb-4">
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              <div className="space-y-3">

                {/* Username — only register */}
                {mode === "register" && (
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Username</label>
                    <div className="flex items-center gap-2 bg-dark-fill-3 border border-dark-fill-2 rounded-lg px-3 py-2.5 transition-colors">                      <FiUser className="text-gray-400 flex-shrink-0" size={14} />
                      <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                        className="bg-transparent text-white text-sm outline-none w-full"
                        placeholder="ArpitShah" />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Email</label>
                  <div className="flex items-center gap-2 bg-dark-fill-3 border border-dark-fill-2 rounded-lg px-3 py-2.5 transition-colors">                    <FiMail className="text-gray-400 flex-shrink-0" size={14} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="bg-transparent text-white text-sm outline-none w-full"
                      placeholder="name@example.com" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Password</label>
                  <div className="flex items-center gap-2 bg-dark-fill-3 border border-dark-fill-2 rounded-lg px-3 py-2.5 transition-colors">                    <FiLock className="text-gray-400 flex-shrink-0" size={14} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleRegister())}
                      className="bg-transparent text-white text-sm outline-none w-full"
                      placeholder="••••••••"
                    />
                    <button onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
                      {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                    </button>
                  </div>
                  {mode === "register" && (
                    <p className="text-[10px] text-gray-500 mt-1">Minimum 6 characters</p>
                  )}
                </div>

                {/* Forgot password link */}
                {mode === "login" && (
                  <div className="text-right">
                    <button onClick={() => { setMode("forgot"); clearMessages(); }}
                      className="text-xs text-brand-orange hover:underline">
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={mode === "login" ? handleLogin : handleRegister}
                  disabled={loading}
                  className="w-full py-2.5 bg-brand-orange hover:bg-brand-orange-s text-white
                    rounded-lg text-sm font-medium transition-colors flex items-center
                    justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {loading
                    ? <AiOutlineLoading3Quarters className="animate-spin" />
                    : mode === "login" ? "Sign In" : "Create Account"
                  }
                </button>
              </div>

              {/* Switch mode */}
              <p className="text-center text-xs text-gray-400 mt-5">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => { setMode(mode === "login" ? "register" : "login"); clearMessages(); }}
                  className="text-brand-orange hover:underline"
                >
                  {mode === "login" ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}