import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { GoogleAuthButton } from "../components/auth/GoogleAuthButton";

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

      // Successful redirect based on user role
      if (result.user) {
        switch (result.user.role) {
          case 'donor': navigate('/donor/dashboard'); break;
          case 'volunteer': navigate('/volunteer/dashboard'); break;
          case 'leader': navigate('/leader/dashboard'); break;
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
          case 'leader': navigate('/leader/dashboard'); break;
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
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfe] dark:bg-[#0a0518] px-4 py-6 md:py-10">
      <div className="w-full max-w-[960px] rounded-2xl overflow-hidden flex flex-col md:flex-row items-stretch shadow-2xl border border-gray-200 dark:border-purple-950/30 bg-[#faf9fc] dark:bg-[#120721]">
        {/* LEFT PANEL — purple branding / impact stats */}
        <div
          className="hidden md:flex flex-1 relative flex-col items-center justify-center px-8 py-10 text-center"
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

          <div className="relative z-10 flex items-center justify-center gap-2 text-white text-sm font-semibold mb-3.5">
            <span className="w-4 h-4 border-2 border-white rounded-full inline-block" />
            PortionBridge
          </div>
          <h1 className="relative z-10 text-white text-2xl font-bold mb-2.5">
            Get Started with Us
          </h1>
          <p className="relative z-10 text-white/65 text-[13.5px] leading-relaxed max-w-[280px] mb-7">
            Bridging Abundance with Those in Need
          </p>

          <div className="relative z-10 w-full max-w-[300px] flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-[10px] bg-white text-[#111] text-[13.5px] font-medium animate-fade-in">
              <span className="w-5 h-5 rounded-full bg-[#111] text-white flex items-center justify-center text-[11px] shrink-0">
                🍲
              </span>
              {stats.mealsDelivered.toLocaleString()}+ meals shared to date
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-[10px] bg-white/[0.08] backdrop-blur-md text-white/55 text-[13.5px] font-medium animate-fade-in">
              <span className="w-5 h-5 rounded-full bg-white/15 text-white flex items-center justify-center text-[11px] shrink-0">
                👕
              </span>
              {stats.clothesDonated.toLocaleString()}+ clothing items donated
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-[10px] bg-white/[0.08] backdrop-blur-md text-white/55 text-[13.5px] font-medium animate-fade-in">
              <span className="w-5 h-5 rounded-full bg-white/15 text-white flex items-center justify-center text-[11px] shrink-0">
                🤝
              </span>
              {stats.verifiedVolunteers.toLocaleString()}+ verified volunteers
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — merged seamlessly with left panel */}
        <div className="flex-1 flex flex-col justify-center items-center bg-[#faf9fc] dark:bg-[#120721] px-6 py-8 sm:py-10">
          <div className="flex w-full flex-col justify-center gap-3.5 max-w-[340px] sm:min-w-[340px]">
            <div className="left-0 right-0 inline-block px-1 py-1.5 sm:px-2">
                  <form className="flex flex-col gap-4 pb-4" onSubmit={handleSubmit}>
                    <h1 className="mb-4 text-2xl font-bold dark:text-white">Login</h1>

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
                          className="text-sm font-medium text-gray-900 dark:text-gray-300"
                          htmlFor="email"
                        >
                          Email:
                        </label>
                      </div>
                      <div className="flex w-full rounded-lg pt-1">
                        <div className="relative w-full">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full rounded-xl border-2 border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-purple-500 focus:ring-purple-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="email@example.com"
                            disabled={loading}
                          />
                        </div>
                      </div>
                      {fieldErrors.email && (
                        <span className="text-red-600 dark:text-red-400 text-xs mt-1 block">{fieldErrors.email}</span>
                      )}
                    </div>

                    <div>
                      <div className="mb-2">
                        <label
                          className="text-sm font-medium text-gray-900 dark:text-gray-300"
                          htmlFor="password"
                        >
                          Password
                        </label>
                      </div>
                      <div className="flex w-full rounded-lg pt-1">
                        <div className="relative w-full">
                          <input
                            className="block w-full rounded-xl border-2 border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-purple-500 focus:ring-purple-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                            id="password"
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                          />
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
                        className="w-full rounded-xl border border-transparent bg-gradient-to-r from-purple-400 via-purple-600 to-purple-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-purple-500 hover:via-purple-700 hover:to-purple-950 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-sm hovering:shadow-md"
                      >
                        {loading ? "Signing in..." : "Sign In"}
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
  );
}
