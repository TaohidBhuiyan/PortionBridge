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

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    const syncOverflow = () => {
      const lock = mq.matches ? "hidden" : "";
      document.body.style.overflow = lock;
      document.documentElement.style.overflow = lock;
    };

    syncOverflow();
    mq.addEventListener("change", syncOverflow);
    return () => {
      mq.removeEventListener("change", syncOverflow);
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
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
    `w-full min-h-11 pl-11 pr-4 py-2.5 bg-white border rounded-xl text-base lg:text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-4 ${
      hasError
        ? "border-red-300 focus:ring-red-500/15 focus:border-red-500"
        : "border-slate-200 focus:ring-sky-500/15 focus:border-sky-500"
    }`;

  return (
    <div className="login-page min-h-dvh lg:h-dvh lg:max-h-dvh overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row bg-slate-950 font-sans">
      {/* LEFT PANEL — original brand & living ecosystem */}
      <section className="login-page__left lg:w-[53%] xl:w-[55%] relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 px-5 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-6 xl:px-10 xl:py-7 flex flex-col justify-between overflow-hidden lg:h-full lg:min-h-0 border-b lg:border-b-0 lg:border-r border-sky-900/30 select-none">
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-sky-600/15 rounded-full blur-[110px] pointer-events-none animate-pulse" />
        <div className="absolute top-1/3 -right-24 w-[460px] h-[460px] bg-cyan-500/12 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: "-3s" }} />
        <div className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] bg-sky-400/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#38bdf8_1.2px,transparent_1.2px)] [background-size:28px_28px]" />

        <header className="relative z-10 shrink-0">
          <Link
            to="/"
            className="inline-flex items-center gap-3.5 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 rounded-xl"
          >
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 opacity-30 blur-md group-hover:opacity-60 transition duration-500" />
              <Logo className="relative w-[42px] h-[42px] rounded-xl shadow-lg" />
            </div>
            <div>
              <div className="font-bold text-2xl tracking-tight text-white flex items-center gap-1.5">
                PortionBridge
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              </div>
              <p className="text-[11px] font-medium text-sky-400/70 tracking-wide uppercase">
                Surplus Redistribution Network
              </p>
            </div>
          </Link>

          <div className="mt-6 sm:mt-8 lg:mt-8 max-w-2xl">
            <h1 className="login-page__headline m-0 text-3xl sm:text-4xl lg:text-[clamp(2rem,4.4vh,3.15rem)] xl:text-[clamp(2.25rem,4.8vh,3.4rem)] font-extrabold text-white tracking-tight leading-[1.12]">
              Bridging <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-300 to-sky-400">surplus</span> with those <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-300 to-teal-300">in need</span>.
            </h1>
            <p className="text-slate-300/90 text-sm sm:text-base lg:text-[clamp(0.95rem,1.8vh,1.15rem)] mt-4 leading-relaxed max-w-xl font-medium">
              Connect surplus food and clothing with communities that need them — powered by donors, volunteers, and verified local action.
            </p>
          </div>
        </header>

        <div className="login-page__ecosystem relative z-10 my-5 lg:my-6 flex-1 min-h-0 flex items-center justify-center">
          <div className="login-page__cards relative w-full max-w-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="login-page__card rounded-xl lg:rounded-2xl p-3.5 border border-sky-400/20 backdrop-blur-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 shadow-2xl hover:border-sky-400/40 transition-all duration-300 transform hover:scale-[1.02] cursor-default group" style={{ animation: "floatGentle 8s ease-in-out infinite" }}>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-400/30 flex items-center justify-center text-base shadow-sm shrink-0">
                    🍲
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">Meals Redirected</h3>
                    <p className="text-[10px] text-slate-400">18 districts</p>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse shrink-0" />
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight tabular-nums">
                {(stats.mealsDelivered ?? 0).toLocaleString()}+
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">
                Surplus portions matched with local kitchens.
              </p>
              <div className="mt-2 pt-2 border-t border-sky-800/30 flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <Bolt size={12} />
                <span>Live distribution</span>
              </div>
            </div>

            <div className="login-page__card rounded-xl lg:rounded-2xl p-3.5 border border-cyan-400/20 backdrop-blur-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 shadow-2xl hover:border-cyan-400/40 transition-all duration-300 transform hover:scale-[1.02] cursor-default" style={{ animation: "floatReverse 9.5s ease-in-out 1.2s infinite" }}>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-sky-500/20 border border-cyan-400/30 flex items-center justify-center text-base shadow-sm shrink-0">
                    🧥
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">Clothing Drive</h3>
                    <p className="text-[10px] text-slate-400">Seasonal relief</p>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shrink-0">Active</span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight tabular-nums">
                {(stats.clothesDonated ?? 0).toLocaleString()}+
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">
                Warm coats distributed by verified teams.
              </p>
              <div className="mt-2 pt-2 border-t border-sky-800/30 flex items-center gap-1 text-[10px] text-cyan-300 font-medium">
                <MapPin size={12} />
                <span>Regional distribution</span>
              </div>
            </div>

            <div className="login-page__card rounded-xl lg:rounded-2xl p-3.5 border border-sky-400/20 backdrop-blur-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 shadow-2xl hover:border-sky-400/40 transition-all duration-300 transform hover:scale-[1.02] cursor-default" style={{ animation: "floatGentle 8.5s ease-in-out 2.4s infinite" }}>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-400/30 flex items-center justify-center text-base shadow-sm shrink-0">
                    🤝
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">Active Logistics</h3>
                    <p className="text-[10px] text-slate-400">On-road couriers</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-500/20 border border-sky-400/30 px-2 py-0.5 rounded-full shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" /> Live
                </span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight tabular-nums">
                {(stats.verifiedVolunteers ?? 0).toLocaleString()}+
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">
                Certified volunteers on dispatch today.
              </p>
              <div className="mt-2 pt-2 border-t border-sky-800/30 flex items-center gap-1 text-[10px] text-slate-400">
                <Route size={12} className="text-sky-400 shrink-0" />
                <span>Avg. <strong>18 mins</strong> response</span>
              </div>
            </div>
          </div>
        </div>

        <footer className="login-page__left-footer relative z-10 shrink-0 border-t border-sky-900/40 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] sm:text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Unified humanitarian platform for Donors, Volunteers &amp; Hubs</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            <span>Transparent Aid</span>
            <span>•</span>
            <span>Zero Food Waste</span>
          </div>
        </footer>
      </section>

      {/* RIGHT — form */}
      <section className="login-page__right relative flex-1 lg:w-[47%] xl:w-[45%] flex flex-col justify-center items-center px-4 py-6 sm:px-8 sm:py-8 lg:px-8 lg:py-6 xl:px-10 bg-[#f8fafc] text-slate-900 lg:h-full lg:min-h-0 lg:overflow-y-auto">
        <div className="absolute top-0 right-0 w-64 h-64 lg:w-80 lg:h-80 bg-sky-400/8 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[440px] relative z-10">
          <div className="bg-white/90 lg:bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-900/5 p-5 sm:p-7">
            <header className="mb-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider text-sky-700 bg-sky-50 border border-sky-100 mb-3 uppercase">
                <ShieldCheck size={12} className="text-sky-600" /> Welcome back
              </div>
              <h2 className="m-0 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                Continue creating real impact in your community.
              </p>
            </header>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs flex items-start gap-2.5" role="alert">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-red-900">Couldn&apos;t sign in</span>
                  <span className="text-red-700/90">{error}</span>
                </div>
              </div>
            )}

            {needsVerification && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex flex-col gap-2" role="status">
                <div className="flex items-start gap-2.5">
                  <Mail size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-amber-900">Verification required</span>
                    Please verify your email to continue. We sent an activation link to your inbox.
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-amber-200/80">
                  <span className="text-[11px] text-amber-700 font-medium">
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Ready to resend"}
                  </span>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendStatus === "sending" || resendCooldown > 0}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendStatus === "sending" ? "Sending..." : "Resend email"}
                  </button>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs flex items-start gap-2.5" role="status">
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-emerald-900">Success</span>
                  {successMsg}
                </div>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="email">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={17} />
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
                  <p className="text-[11px] font-medium text-red-600 mt-1.5 flex items-center gap-1">
                    <CircleAlert size={13} /> {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600" htmlFor="password">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline shrink-0"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <LockKeyhole size={17} />
                  </div>
                  <input
                    autoComplete="current-password"
                    className={`${inputClass(Boolean(fieldErrors.password))} pr-11`}
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
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus-visible:text-sky-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] font-medium text-red-600 mt-1.5 flex items-center gap-1">
                    <CircleAlert size={13} /> {fieldErrors.password}
                  </p>
                )}
              </div>

              <label className="flex items-start sm:items-center gap-2.5 cursor-pointer">
                <input
                  checked={rememberMe}
                  className="mt-0.5 sm:mt-0 w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  name="remember"
                  type="checkbox"
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-xs font-medium text-slate-600 select-none leading-snug">
                  Remember this device for 30 days
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-11 relative py-2.5 px-4 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99] shadow-[0_10px_24px_-8px_rgba(14,165,233,0.55)]"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
                    </svg>
                    <span>Signing in…</span>
                  </>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in
                    <ArrowRight size={16} className="transform group-hover:translate-x-0.5 transition-transform" />
                  </span>
                )}
              </button>

              <div className="relative py-1">
                <div aria-hidden="true" className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    or continue with
                  </span>
                </div>
              </div>

              <GoogleAuthButton
                label="Continue with Google"
                disabled={loading}
                onSuccess={handleGoogleSuccess}
                onError={(message) => setError(message)}
              />
            </form>

            <p className="mt-5 pt-4 border-t border-slate-100 text-center text-sm text-slate-600">
              New to PortionBridge?{" "}
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="font-semibold text-sky-600 hover:text-sky-700 hover:underline"
              >
                Create an account
              </button>
            </p>
          </div>

          <div className="mt-5 text-center space-y-2 px-1">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium leading-snug">
              <ShieldCheck size={13} className="text-sky-500 shrink-0" />
              Protected by secure authentication
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-medium">
              <Link to="/" className="hover:text-slate-700 hover:underline">Home</Link>
              <span aria-hidden="true">·</span>
              <Link to="/#roles" className="hover:text-slate-700 hover:underline">How it works</Link>
              <span aria-hidden="true">·</span>
              <Link to="/register" className="hover:text-slate-700 hover:underline">Create account</Link>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (min-width: 1024px) {
          .login-page {
            height: 100dvh;
            max-height: 100dvh;
          }

          @supports not (height: 100dvh) {
            .login-page {
              height: 100vh;
              max-height: 100vh;
            }
          }

          .login-page__left {
            flex-shrink: 0;
          }

          .login-page__ecosystem {
            overflow: hidden;
          }
        }

        @media (min-width: 1024px) and (max-height: 820px) {
          .login-page__headline {
            font-size: clamp(1.55rem, 3.2vh, 2.15rem) !important;
          }

          .login-page__ecosystem {
            margin-block: 0.75rem;
          }
        }

        @media (min-width: 1024px) and (max-height: 700px) {
          .login-page__left {
            padding-block: 1rem;
          }

          .login-page__headline {
            font-size: clamp(1.35rem, 2.8vh, 1.75rem) !important;
          }

          .login-page__card {
            padding: 0.75rem;
          }

          .login-page__left-footer {
            padding-top: 0.5rem;
          }
        }

        @keyframes floatGentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(4px); }
        }
      `}</style>
    </div>
  );
}
