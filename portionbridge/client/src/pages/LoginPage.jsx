import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { GoogleAuthButton } from "../components/auth/GoogleAuthButton";
import { DevLoginButton } from "../components/auth/DevLoginButton";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * PortionBridge — Login page
 * Fused branding / impact-stats panel and Flowbite login card.
 * Styled with deep violet matching colors and viewport heights.
 */
export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [successMsg, setSuccessMsg] = useState(location.state?.message || "");

  const { socket, connected } = useSocket();
  const [stats, setStats] = useState({
    mealsDelivered: 12500,
    clothesDonated: 3200,
    verifiedVolunteers: 180
  });

  // Initial stats fetch via API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE}/public/stats`);
        if (res.data && res.data.success) {
          setStats(res.data.data);
        }
      } catch {
        // Failed to fetch stats
      }
    };
    fetchStats();
  }, []);

  // Real-time stats updates via socket
  useEffect(() => {
    if (!socket || !connected) return;
    const handleStatsUpdate = (newStats) => {
      setStats(newStats);
    };
    socket.on('stats_updated', handleStatsUpdate);
    return () => {
      socket.off('stats_updated', handleStatsUpdate);
    };
  }, [socket, connected]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSuccessMsg("");

    // Client-side validation
    const errors = {};
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "A valid email address is required.";
    }

    if (!password) {
      errors.password = "Password is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the validation errors below.");
      return;
    }

    setLoading(true);

    try {
      // Use sequential role login implemented in context
      const result = await login(email.trim(), password);

      if (!result.success) {
        if (result.errors && Array.isArray(result.errors)) {
          const errorsMap = {};
          result.errors.forEach(err => {
            errorsMap[err.field] = err.message;
          });
          setFieldErrors(errorsMap);
          setError(result.error || "Validation failed.");
        } else {
          setError(result.error || "Login failed. Please try again.");
        }
        return;
      }

      // Successful redirect based on user role.
      // AUDIT FIX: removed a dead 'leader' case — the users.role column
      // (see schema) only ever contains 'donor' | 'volunteer' | 'admin'.
      // A team leader is still a 'volunteer' at the account level (team
      // leadership is per-team, tracked in team_members.role, not on the
      // user account), so that branch could never actually be reached and
      // was misleading dead code.
      if (result.user) {
        switch (result.user.role) {
          case 'donor': navigate('/donor/dashboard'); break;
          case 'volunteer': navigate('/volunteer/dashboard'); break;
          case 'admin': navigate('/admin/dashboard'); break;
          default: navigate('/');
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupClick = () => {
    navigate("/register");
  };

  const handleForgotPasswordClick = () => {
    navigate("/forgot-password");
  };

  const handleGoogleSuccess = async (credential) => {
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      const result = await googleLogin(credential);
      if (!result.success) {
        setError(result.error || "Google login failed.");
        return;
      }
      if (result.user) {
        switch (result.user.role) {
          case 'donor': navigate('/donor/dashboard'); break;
          case 'volunteer': navigate('/volunteer/dashboard'); break;
          case 'admin': navigate('/admin/dashboard'); break;
          default: navigate('/');
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfe] dark:bg-[#0a0518] px-4 py-6">
        <div className="w-full max-w-[760px] rounded-3xl overflow-hidden flex flex-col md:flex-row items-stretch shadow-[0_20px_56px_rgba(46,16,101,0.24)] border border-purple-200/70 dark:border-purple-950/30 bg-[#faf9fc] dark:bg-[#120721]">
        {/* LEFT PANEL — purple branding / impact stats */}
        <div
          className="hidden md:flex flex-[0.82] relative flex-col items-center justify-center px-6 py-7 text-left"
          style={{
            background:
              "radial-gradient(ellipse 75% 45% at 50% 2%, #f0e4fb 0%, rgba(240,228,251,0) 65%), linear-gradient(180deg, #b487e8 0%, #9256e0 16%, #7c3aed 32%, #5b21b6 50%, #35127a 68%, #180a35 85%, #050208 100%)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.05]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/></svg>\")",
            }}
          />

          <div className="relative z-10 flex items-center gap-2 text-white text-xs font-semibold mb-3">
            <span className="w-4 h-4 border-2 border-white rounded-full inline-block" />
            PortionBridge
          </div>
          <h1 className="relative z-10 text-white text-2xl font-bold leading-tight mb-2">
            Welcome back.
          </h1>
          <p className="relative z-10 text-white/70 text-xs leading-relaxed max-w-[220px] mb-6">
            Continue creating real impact in your community.
          </p>

          <div className="relative z-10 w-full max-w-[250px] flex flex-col gap-2">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white text-[#111] text-xs font-medium animate-fade-in">
              <span className="w-5 h-5 rounded-full bg-[#111] text-white flex items-center justify-center text-[11px] shrink-0">
                🍲
              </span>
              {stats.mealsDelivered.toLocaleString()}+ meals shared to date
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.08] backdrop-blur-md text-white/70 text-xs font-medium animate-fade-in">
              <span className="w-5 h-5 rounded-full bg-white/15 text-white flex items-center justify-center text-[11px] shrink-0">
                👕
              </span>
              {stats.clothesDonated.toLocaleString()}+ clothing items donated
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.08] backdrop-blur-md text-white/70 text-xs font-medium animate-fade-in">
              <span className="w-5 h-5 rounded-full bg-white/15 text-white flex items-center justify-center text-[11px] shrink-0">
                🤝
              </span>
              {stats.verifiedVolunteers.toLocaleString()}+ verified volunteers
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — merged seamlessly with left panel */}
        <div className="flex-1 flex flex-col justify-center items-center bg-white/95 dark:bg-[#120721] px-5 py-6 sm:px-7">
          <div className="flex w-full flex-col justify-center gap-3 max-w-[340px]">
            <div className="left-0 right-0 inline-block px-1">
                  <form className="flex flex-col gap-3 pb-3" onSubmit={handleSubmit}>
                    <div className="mb-2"><div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-purple-600"><ShieldCheck size={15} /> SECURE SIGN IN</div><h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Sign in to your account</h1></div>

                    {error && (
                      <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                        {error}
                      </div>
                    )}

                    {successMsg && (
                      <div className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-600 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                        {successMsg}
                      </div>
                    )}

                    <div>
                      <div className="mb-2">
                        <label
                          className="text-xs font-semibold text-gray-700 dark:text-gray-300"
                          htmlFor="email"
                        >
                          Email address
                        </label>
                      </div>
                      <div className="flex w-full rounded-lg pt-1">
                        <div className="relative w-full">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 pl-9 text-sm text-gray-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="email@example.com"
                            disabled={loading}
                          /><Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>
                      {fieldErrors.email && (
                        <span className="text-red-600 dark:text-red-400 text-xs mt-1 block">{fieldErrors.email}</span>
                      )}
                    </div>

                    <div>
                      <div className="mb-2">
                        <label
                          className="text-xs font-semibold text-gray-700 dark:text-gray-300"
                          htmlFor="password"
                        >
                          Password
                        </label>
                      </div>
                      <div className="flex w-full rounded-lg pt-1">
                        <div className="relative w-full">
                          <input
                            className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 pl-9 text-sm text-gray-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                            id="password"
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                          /><LockKeyhole size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>
                      {fieldErrors.password && (
                        <span className="text-red-600 dark:text-red-400 text-xs mt-1 block">{fieldErrors.password}</span>
                      )}
                      <p
                        className="mt-2 cursor-pointer text-purple-600 hover:text-purple-700"
                        onClick={handleForgotPasswordClick}
                      >
                        Forgot password?
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl border border-transparent bg-gradient-to-r from-purple-500 to-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-purple-600 hover:to-violet-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-sm"
                      >
                        <span className="inline-flex items-center gap-2">{loading ? "Signing in..." : "Sign In"}<ArrowRight size={15} /></span>
                      </button>

                      <div className="flex items-center gap-3 my-1">
                        <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
                        <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">OR</span>
                        <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
                      </div>

                      <GoogleAuthButton
                        label="Continue with Google"
                        disabled={loading}
                        onSuccess={handleGoogleSuccess}
                        onError={(message) => setError(message)}
                      />
                    </div>
                  </form>

                  <div className="min-w-[270px]">
                    <div className="mt-4 text-center dark:text-gray-200">
                      New user?{" "}
                      <a
                        className="text-purple-600 underline hover:text-purple-700"
                        href="/register"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSignupClick();
                        }}
                      >
                        Create account here
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
      <DevLoginButton />
    </>
  );
}
