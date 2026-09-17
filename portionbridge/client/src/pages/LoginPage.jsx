import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { GoogleAuthButton } from "../components/auth/GoogleAuthButton";
import { Logo } from "../components/common/Logo";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  CircleAlert,
  Bolt,
  MapPin,
  Route,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

/**
 * PortionBridge — Login page
 * Split-screen on desktop, compact brand + form on mobile/tablet.
 */
export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { login, googleLogin, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [successMsg, setSuccessMsg] = useState(location.state?.message || "");

  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState("idle");
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(cooldownRef.current);
  }, []);


  const { socket, connected } = useSocket();
  const [stats, setStats] = useState({
    mealsDelivered: 12500,
    clothesDonated: 3200,
    verifiedVolunteers: 180,
    hubVerificationRate: 99.4,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE}/public/stats`);
        if (res.data && res.data.success) {
          setStats(res.data.data);
        }
      } catch {
        // Failed to fetch stats - keep defaults
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (!socket || !connected) return;
    const handleStatsUpdate = (newStats) => {
      setStats(newStats);
    };
    socket.on("stats_updated", handleStatsUpdate);
    return () => {
      socket.off("stats_updated", handleStatsUpdate);
    };
  }, [socket, connected]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSuccessMsg("");

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
    setNeedsVerification(false);

    try {
      const result = await login(email.trim(), password);

      if (!result.success) {
        if (result.code === "EMAIL_NOT_VERIFIED") {
          setNeedsVerification(true);
          setError("");
        } else if (result.errors && Array.isArray(result.errors)) {
          const errorsMap = {};
          result.errors.forEach((err) => {
            errorsMap[err.field] = err.message;
          });
          setFieldErrors(errorsMap);
          setError(result.error || "Validation failed.");
        } else {
          setError(result.error || "Login failed. Please try again.");
        }
        return;
      }

      if (result.user) {
        switch (result.user.role) {
          case "donor":
            navigate("/donor/dashboard");
            break;
          case "volunteer":
            navigate("/volunteer/dashboard");
            break;
          case "admin":
            navigate("/admin/dashboard");
            break;
          default:
            navigate("/");
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setResendStatus("sending");
    await resendVerification(email.trim());
    setResendStatus("sent");
    startResendCooldown();
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
          case "donor":
            navigate("/donor/dashboard");
            break;
          case "volunteer":
            navigate("/volunteer/dashboard");
            break;
          case "admin":
            navigate("/admin/dashboard");
            break;
          default:
            navigate("/");
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError) =>
    `w-full min-h-10 sm:min-h-11 pl-10 pr-4 py-2 sm:py-2.5 bg-slate-50 border-2 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 shadow-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:bg-white ${
      hasError
        ? "border-red-300 focus:ring-red-500/15 focus:border-red-500"
        : "border-slate-200 hover:border-slate-300 focus:ring-[#6d45bd]/15 focus:border-[#6d45bd]"
    }`;

  return (
    <div className="h-screen w-full bg-[#f8f7fb] text-slate-900 flex items-center justify-center p-2.5 sm:p-4 lg:p-6 relative selection:bg-[#6d45bd]/20 selection:text-[#35206f] overflow-hidden">
      {/* Floating ambient background lighting */}
      <div className="absolute -top-32 right-[8%] w-[500px] h-[400px] rounded-full blur-3xl opacity-35 pointer-events-none" style={{ background: "#e8c6ed", animation: "float 9s ease-in-out infinite" }} />
      <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none" style={{ background: "#d9c8f1", animation: "float 7s ease-in-out infinite reverse" }} />
      <div className="absolute -bottom-24 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-25 pointer-events-none" style={{ background: "#efe8fa", animation: "float 10s ease-in-out infinite" }} />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#35206f 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 75%)",
        }}
      />

      {/* Master Elevated Card Container — Fixed No Scroll on Desktop */}
      <div className="w-full max-w-5xl rounded-3xl bg-white border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(53,32,111,0.12)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 h-full max-h-[min(660px,95vh)] relative z-10">
        {/* LEFT PANEL — Deep Royal Violet Brand & Living Impact Showcase */}
        <section className="lg:col-span-5 p-5 sm:p-6 lg:p-7 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-white/10 bg-gradient-to-br from-[#241246] via-[#35206f] to-[#1c0e39] text-white h-full overflow-hidden">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-3 hover:opacity-90 transition-opacity focus:outline-none rounded-xl"
              >
                <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 p-1 flex items-center justify-center shrink-0 shadow-md">
                  <Logo className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5 font-serif">
                    PortionBridge
                  </div>
                  <p className="text-[9px] font-semibold text-[#d9c8f1] tracking-wider uppercase font-mono">
                    Surplus Redistribution Network
                  </p>
                </div>
              </Link>

              <div className="mt-4 sm:mt-5 space-y-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight tracking-tight font-serif">
                  Bridging <span className="text-[#e8c6ed]">surplus</span>
                  <br />
                  with those <span className="underline decoration-[#6d45bd] underline-offset-4">in need</span>.
                </h1>
                <p className="text-white/75 text-xs leading-relaxed font-normal">
                  Connect surplus food and clothing with communities that need them — powered by donors, volunteers, and verified local action.
                </p>
              </div>

              {/* 3 Live Ecosystem Cards */}
              <div className="mt-4 sm:mt-5 space-y-2.5">
                <div className="rounded-2xl p-2.5 sm:p-3 border border-white/15 bg-white/10 backdrop-blur-md shadow-sm hover:bg-white/15 transition-all">
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-xs shrink-0">
                        🍲
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white">Meals Redirected</h3>
                        <p className="text-[9px] text-[#d9c8f1]">18 districts</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-white font-serif tabular-nums">
                    {(stats.mealsDelivered ?? 0).toLocaleString()}+
                  </div>
                  <p className="text-[10px] text-[#d9c8f1]/80 mt-0.5 leading-snug">
                    Surplus portions matched with verified local kitchens.
                  </p>
                </div>

                <div className="rounded-2xl p-2.5 sm:p-3 border border-white/15 bg-white/10 backdrop-blur-md shadow-sm hover:bg-white/15 transition-all">
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#6d45bd]/30 border border-[#b88de0]/40 flex items-center justify-center text-xs shrink-0">
                        🧥
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white">Clothing Drive</h3>
                        <p className="text-[9px] text-[#d9c8f1]">Seasonal relief</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-white/15 text-[#e8c6ed] border border-white/20">
                      Active
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-white font-serif tabular-nums">
                    {(stats.clothesDonated ?? 0).toLocaleString()}+
                  </div>
                  <p className="text-[10px] text-[#d9c8f1]/80 mt-0.5 leading-snug">
                    Warm coats and clothing bundles distributed across hubs.
                  </p>
                </div>

                <div className="rounded-2xl p-2.5 sm:p-3 border border-white/15 bg-white/10 backdrop-blur-md shadow-sm hover:bg-white/15 transition-all">
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#6d45bd]/30 border border-[#b88de0]/40 flex items-center justify-center text-xs shrink-0">
                        🤝
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white">Active Logistics</h3>
                        <p className="text-[9px] text-[#d9c8f1]">On-road couriers</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-[#e8c6ed] bg-white/15 border border-white/20 px-2 py-0.5 rounded-full">
                      Avg 18m
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-white font-serif tabular-nums">
                    {(stats.verifiedVolunteers ?? 0).toLocaleString()}+
                  </div>
                  <p className="text-[10px] text-[#d9c8f1]/80 mt-0.5 leading-snug">
                    Certified volunteer couriers ready for direct dispatch.
                  </p>
                </div>
              </div>
            </div>

            <footer className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-[10px] text-white/70">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Verified Network</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[9px]">
                <span>Transparent Aid</span>
                <span>•</span>
                <span>Zero Waste</span>
              </div>
            </footer>
          </div>
        </section>

        {/* RIGHT PANEL — Pristine White Form with High Contrast & Compact Layout */}
        <section className="lg:col-span-7 p-5 sm:p-6 lg:p-7 flex flex-col justify-between bg-white text-slate-900 h-full overflow-y-auto">
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6d45bd] hover:text-[#35206f] transition-colors group cursor-pointer"
                >
                  <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Back to Home
                </Link>
              </div>

              <header className="mb-4 pb-3 border-b border-slate-100">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider text-[#6d45bd] bg-[#f5effb] border border-[#6d45bd]/20 mb-1.5 uppercase font-mono">
                  <ShieldCheck size={12} className="text-[#6d45bd]" />
                  Welcome back
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-serif">
                  Sign in to your account
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Continue creating real impact in your community.
                </p>
              </header>

              {/* Error Banner */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-xs flex items-start gap-2" role="alert">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-red-900">Couldn't sign in</span>
                    <span className="text-red-700">{error}</span>
                  </div>
                </div>
              )}

              {/* Needs Verification Banner */}
              {needsVerification && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border-2 border-amber-200 text-amber-900 text-xs flex flex-col gap-2" role="status">
                  <div className="flex items-start gap-2">
                    <Mail size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-amber-900">Verification required</span>
                      <span>Please verify your email to continue. We sent an activation link to your inbox.</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1.5 border-t border-amber-200">
                    <span className="text-[10px] text-amber-700 font-medium">
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Ready to resend"}
                    </span>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendStatus === "sending" || resendCooldown > 0}
                      className="px-2.5 py-1 bg-[#6d45bd] hover:bg-[#5b33a8] text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {resendStatus === "sending" ? "Sending..." : "Resend email"}
                    </button>
                  </div>
                </div>
              )}

              {/* Success Banner */}
              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-xs flex items-start gap-2" role="status">
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-emerald-900">Success</span>
                    <span>{successMsg}</span>
                  </div>
                </div>
              )}

              <form className="space-y-3" onSubmit={handleSubmit} noValidate>
                {/* Email Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1" htmlFor="email">
                    Email address <span className="text-[#6d45bd]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      autoComplete="username"
                      className={inputClass(Boolean(fieldErrors.email))}
                      id="email"
                      name="email"
                      placeholder="you@domain.org"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      aria-invalid={Boolean(fieldErrors.email)}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs font-medium text-red-600 mt-1 flex items-center gap-1">
                      <CircleAlert size={12} /> {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="password">
                      Password <span className="text-[#6d45bd]">*</span>
                    </label>
                    <button
                      type="button"
                      className="text-xs font-semibold text-[#6d45bd] hover:text-[#35206f] hover:underline shrink-0 cursor-pointer"
                      onClick={() => navigate("/forgot-password")}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <LockKeyhole size={16} />
                    </div>
                    <input
                      autoComplete="current-password"
                      className={`${inputClass(Boolean(fieldErrors.password))} pr-10`}
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      aria-invalid={Boolean(fieldErrors.password)}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs font-medium text-red-600 mt-1 flex items-center gap-1">
                      <CircleAlert size={12} /> {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Remember Me */}
                <label className="flex items-center gap-2 cursor-pointer py-0.5">
                  <input
                    checked={rememberMe}
                    className="w-4 h-4 rounded border-2 border-slate-300 text-[#6d45bd] focus:ring-[#6d45bd]/20 cursor-pointer"
                    name="remember"
                    type="checkbox"
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-xs font-medium text-slate-600 select-none">
                    Remember this device for 30 days
                  </span>
                </label>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-11 relative py-2.5 px-4 bg-gradient-to-r from-[#35206f] via-[#4d2899] to-[#6d45bd] hover:from-[#2a1758] hover:to-[#572ea8] text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-md shadow-[#35206f]/25 hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden mt-1"
                >
                  <span
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)",
                      backgroundSize: "220% 220%",
                      animation: "shimmerSweep 1.6s ease-in-out infinite",
                    }}
                  />
                  <span className="relative z-10 flex items-center gap-2 font-bold">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
                        </svg>
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign in</span>
                        <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </button>

                {/* Divider */}
                <div className="relative my-3 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <span className="relative px-2.5 bg-white text-[10px] uppercase tracking-wider text-slate-400 font-semibold font-mono">
                    Or continue with
                  </span>
                </div>

                {/* Google Auth Button */}
                <div className="flex justify-center [&>button]:w-full">
                  <GoogleAuthButton
                    label="Continue with Google"
                    disabled={loading}
                    onSuccess={handleGoogleSuccess}
                    onError={(message) => setError(message)}
                  />
                </div>
              </form>
            </div>

            {/* Switch to Register */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-600">
                New to PortionBridge?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="font-bold text-[#6d45bd] hover:text-[#35206f] hover:underline cursor-pointer ml-1"
                >
                  Create an account
                </button>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
