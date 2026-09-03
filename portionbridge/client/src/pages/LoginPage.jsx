import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { GoogleAuthButton } from "../components/auth/GoogleAuthButton";
import { Button } from "../components/common/Button";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * PortionBridge — Login page
 * Fused branding / impact-stats panel and login card.
 * PHASE 7: restyled onto the sky-blue premium design system (was deep violet).
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
    <div className="min-h-screen flex items-center justify-center bg-page px-4 py-6">
      <div className="w-full max-w-[760px] rounded-3xl overflow-hidden flex flex-col md:flex-row items-stretch shadow-pb-modal border border-border bg-surface">
        {/* LEFT PANEL — sky-blue branding / impact stats */}
        <div
          className="hidden md:flex flex-[0.82] relative flex-col items-center justify-center px-6 py-7 text-left"
          style={{
            background:
              "radial-gradient(ellipse 75% 45% at 50% 2%, rgba(224,242,254,0.5) 0%, rgba(224,242,254,0) 65%), linear-gradient(180deg, #7dd3fc 0%, #38bdf8 16%, #0ea5e9 32%, #0284c7 50%, #075985 68%, #0c2a3d 85%, #041018 100%)",
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
        <div className="flex-1 flex flex-col justify-center items-center bg-surface px-5 py-6 sm:px-7">
          <div className="flex w-full flex-col justify-center gap-3 max-w-[340px]">
            <div className="left-0 right-0 inline-block px-1">
                  <form className="flex flex-col gap-3 pb-3" onSubmit={handleSubmit}>
                    <div className="mb-2"><div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-dash-primary"><ShieldCheck size={15} /> SECURE SIGN IN</div><h1 className="mt-1 text-2xl font-bold text-text-primary">Sign in to your account</h1></div>

                    {error && (
                      <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
                        {error}
                      </div>
                    )}

                    {successMsg && (
                      <div className="rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-sm text-success">
                        {successMsg}
                      </div>
                    )}

                    <div>
                      <div className="mb-2">
                        <label
                          className="text-xs font-semibold text-text-secondary"
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
                            className="block w-full rounded-xl border border-border bg-input p-2.5 pl-9 text-sm text-text-primary focus:border-dash-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 transition-all"
                            placeholder="email@example.com"
                            disabled={loading}
                          /><Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        </div>
                      </div>
                      {fieldErrors.email && (
                        <span className="text-danger text-xs mt-1 block">{fieldErrors.email}</span>
                      )}
                    </div>

                    <div>
                      <div className="mb-2">
                        <label
                          className="text-xs font-semibold text-text-secondary"
                          htmlFor="password"
                        >
                          Password
                        </label>
                      </div>
                      <div className="flex w-full rounded-lg pt-1">
                        <div className="relative w-full">
                          <input
                            className="block w-full rounded-xl border border-border bg-input p-2.5 pl-9 text-sm text-text-primary focus:border-dash-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 transition-all"
                            id="password"
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                          /><LockKeyhole size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        </div>
                      </div>
                      {fieldErrors.password && (
                        <span className="text-danger text-xs mt-1 block">{fieldErrors.password}</span>
                      )}
                      <p
                        className="mt-2 cursor-pointer text-dash-primary hover:text-dash-primary-hover"
                        onClick={handleForgotPasswordClick}
                      >
                        Forgot password?
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button type="submit" loading={loading} icon={ArrowRight} className="w-full">
                        {loading ? "Signing in..." : "Sign In"}
                      </Button>

                      <div className="flex items-center gap-3 my-1">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">OR</span>
                        <div className="h-px flex-1 bg-border" />
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
                    <div className="mt-4 text-center text-text-secondary">
                      New user?{" "}
                      <a
                        className="text-dash-primary underline hover:text-dash-primary-hover"
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
