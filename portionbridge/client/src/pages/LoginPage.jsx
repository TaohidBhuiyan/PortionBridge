import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { GoogleAuthButton } from "../components/auth/GoogleAuthButton";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Eye, EyeOff, Bolt, MapPin, Route } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * PortionBridge — Login page
 * Premium split-screen design with animated ecosystem visualization
 * Integrates Stitch-generated design while preserving all auth functionality
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

  // Email verification handling
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState("idle");
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(cooldownRef.current);
  }, []);

  // Lock page scroll on desktop split layout only
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

  // Socket and stats integration
  const { socket, connected } = useSocket();
  const [stats, setStats] = useState({
    mealsDelivered: 12500,
    clothesDonated: 3200,
    verifiedVolunteers: 180,
    hubVerificationRate: 99.4
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
        // Failed to fetch stats - keep defaults
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
    setNeedsVerification(false);

    try {
      const result = await login(email.trim(), password);

      if (!result.success) {
        if (result.code === "EMAIL_NOT_VERIFIED") {
          setNeedsVerification(true);
          setError("");
        } else if (result.errors && Array.isArray(result.errors)) {
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
    <div className="login-page min-h-dvh lg:h-dvh lg:max-h-dvh overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row bg-slate-950 font-sans">
      {/* LEFT PANEL - Brand & Living Ecosystem (53% width) */}
      <section className="login-page__left lg:w-[53%] xl:w-[55%] relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-5 xl:px-8 xl:py-6 flex flex-col justify-between overflow-hidden lg:h-full lg:min-h-0 border-b lg:border-b-0 lg:border-r border-sky-900/30 select-none">
        {/* Ambient Atmospheric Background Lights */}
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-sky-600/15 rounded-full blur-[110px] pointer-events-none animate-pulse" />
        <div className="absolute top-1/3 -right-24 w-[460px] h-[460px] bg-cyan-500/12 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '-3s' }} />
        <div className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] bg-sky-400/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Subtle Geometric Background Grid Mesh */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#38bdf8_1.2px,transparent_1.2px)] [background-size:28px_28px]" />
        
        {/* Top Header & Brand Identity */}
        <header className="relative z-10">
          <div 
            className="flex items-center gap-3.5 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 opacity-30 blur-md group-hover:opacity-60 transition duration-500" />
              <div className="relative w-[42px] h-[42px] rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                <span className="text-2xl">🌊</span>
              </div>
            </div>
            <div>
              <div className="font-bold text-2xl tracking-tight text-white flex items-center gap-1.5">
                PortionBridge
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              </div>
              <p className="text-[11px] font-medium text-sky-400/70 tracking-wide uppercase">Surplus Redistribution Network</p>
            </div>
          </div>
          
          {/* Vision Statement & Tagline */}
          <div className="mt-8 lg:mt-10 max-w-2xl">
            <h1 className="login-page__headline m-0 text-4xl sm:text-5xl lg:text-[clamp(2.5rem,5vh,3.25rem)] xl:text-[clamp(2.75rem,5.5vh,3.5rem)] font-extrabold text-white tracking-tight leading-[1.1]">
              Bridging <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-300 to-sky-400">surplus</span> with those <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-300 to-teal-300">in need</span>.
            </h1>
            <p className="text-slate-300/90 text-base sm:text-lg lg:text-[clamp(1rem,2vh,1.25rem)] mt-5 leading-relaxed max-w-xl font-medium">
              Connect surplus food and clothing with communities that need them — powered by donors, volunteers, and verified local action.
            </p>
          </div>
        </header>
        
        {/* Dynamic Living Ecosystem: Floating Cards with Real-Time Stats */}
        <div className="login-page__ecosystem relative z-10 my-6 lg:my-8 flex-1 min-h-0 flex items-center justify-center py-2">
          {/* Floating Cards Staggered Arrangement */}
          <div className="login-page__cards relative w-full max-w-lg grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: Fresh Meals Redirected */}
            <div className="login-page__card rounded-xl lg:rounded-2xl p-3 sm:p-3.5 border border-sky-400/20 backdrop-blur-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 shadow-2xl hover:border-sky-400/40 transition-all duration-300 transform hover:scale-[1.02] cursor-default group" style={{ animation: 'floatGentle 8s ease-in-out infinite' }}>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-400/30 flex items-center justify-center text-base shadow-sm">
                    🍲
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">Meals Redirected</h3>
                    <p className="text-[10px] text-slate-400">18 districts</p>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse" />
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                {stats.mealsDelivered.toLocaleString()}+
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">
                Surplus portions matched with local kitchens.
              </p>
              <div className="mt-2 pt-2 border-t border-sky-800/30 flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <Bolt size={12} />
                <span>Live distribution</span>
              </div>
            </div>
            
            {/* Card 2: Winter Clothing Drive */}
            <div className="login-page__card rounded-xl lg:rounded-2xl p-3 sm:p-3.5 border border-cyan-400/20 backdrop-blur-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 shadow-2xl hover:border-cyan-400/40 transition-all duration-300 transform hover:scale-[1.02] cursor-default" style={{ animation: 'floatReverse 9.5s ease-in-out 1.2s infinite' }}>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-sky-500/20 border border-cyan-400/30 flex items-center justify-center text-base shadow-sm">
                    🧥
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">Clothing Drive</h3>
                    <p className="text-[10px] text-slate-400">Seasonal relief</p>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">Active</span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                {stats.clothesDonated.toLocaleString()}+
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">
                Warm coats distributed by verified teams.
              </p>
              <div className="mt-2 pt-2 border-t border-sky-800/30 flex items-center gap-1 text-[10px] text-cyan-300 font-medium">
                <MapPin size={12} />
                <span>Regional distribution</span>
              </div>
            </div>
            
            {/* Card 3: Volunteer Logistics Handover */}
            <div className="login-page__card rounded-xl lg:rounded-2xl p-3 sm:p-3.5 border border-sky-400/20 backdrop-blur-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 shadow-2xl hover:border-sky-400/40 transition-all duration-300 transform hover:scale-[1.02] cursor-default" style={{ animation: 'floatGentle 8.5s ease-in-out 2.4s infinite' }}>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-400/30 flex items-center justify-center text-base shadow-sm">
                    🤝
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">Active Logistics</h3>
                    <p className="text-[10px] text-slate-400">On-road couriers</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-500/20 border border-sky-400/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" /> Live
                </span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                {stats.verifiedVolunteers.toLocaleString()}+
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
        
        {/* Left Bottom Trust Badges */}
        <footer className="login-page__left-footer relative z-10 shrink-0 border-t border-sky-900/40 pt-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] sm:text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Unified humanitarian platform for Donors, Volunteers & Hubs</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            <span>Transparent Aid</span>
            <span>•</span>
            <span>Zero Food Waste</span>
          </div>
        </footer>
      </section>
      
      {/* RIGHT PANEL - Login Experience (47% width) */}
      <section className="login-page__right lg:w-[47%] xl:w-[45%] flex flex-col justify-center items-center px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-5 xl:px-10 bg-[#f8fafc] text-slate-900 transition-colors duration-300 relative lg:h-full lg:min-h-0 overflow-hidden">
        {/* Subtle top light beam */}
        <div className="absolute top-0 right-0 w-64 h-64 lg:w-80 lg:h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Main Login Card Wrapper */}
        <div className="login-page__form w-full max-w-[420px] relative z-10">
          {/* Mobile Logo Bar (Visible only on smaller screens) */}
          <div className="lg:hidden flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <span className="text-xl">🌊</span>
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">PortionBridge</span>
          </div>
          
          {/* Form Header */}
          <header className="mb-4 text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider text-sky-700 bg-sky-100/70 border border-sky-200 mb-2 uppercase">
              <ShieldCheck size={13} className="text-sky-600" /> WELCOME BACK
            </div>
            <h2 className="m-0 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              Sign in to PortionBridge
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-normal">
              Continue creating real impact in your community.
            </p>
          </header>
          
          {/* Dynamic Alerts */}
          {error && (
            <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3 shadow-sm animate-fade-in">
              <ShieldCheck size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-red-900">Invalid credentials</span>
                <span className="text-red-700/90">{error}</span>
              </div>
            </div>
          )}
          
          {needsVerification && (
            <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-300/80 text-amber-800 text-xs flex flex-col gap-2 shadow-sm animate-fade-in">
              <div className="flex items-start gap-3">
                <Mail size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-amber-900">Verification Required</span>
                  Please verify your email address to continue. We sent a secure activation link to your inbox.
                </div>
              </div>
              <div className="flex items-center justify-between pt-2.5 border-t border-amber-200/80 mt-0.5">
                <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                  {resendCooldown > 0 ? (
                    <>
                      <Bolt size={13} /> Resend in <span className="font-bold font-mono">{resendCooldown}s</span>
                    </>
                  ) : (
                    <span>Ready to resend</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendStatus === "sending" || resendCooldown > 0}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendStatus === "sending" ? "Sending..." : "Resend Email"}
                </button>
              </div>
            </div>
          )}
          
          {successMsg && (
            <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3 shadow-sm animate-fade-in">
              <CheckCircle size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-emerald-900">Success</span>
                {successMsg}
              </div>
            </div>
          )}
          
          {/* Core Login Form */}
          <form className="space-y-3" onSubmit={handleSubmit}>
            {/* Email Input Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-800 mb-1.5" htmlFor="email">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 transition-all"
                  id="email"
                  name="email"
                  placeholder="you@domain.org"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] font-medium text-red-600 mt-1.5 flex items-center gap-1">
                  <ShieldCheck size={14} /> {fieldErrors.email}
                </p>
              )}
            </div>
            
            {/* Password Input Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-800" htmlFor="password">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline transition-colors"
                  onClick={handleForgotPasswordClick}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <LockKeyhole size={18} />
                </div>
                <input
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 focus:border-sky-500 transition-all"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] font-medium text-red-600 mt-1.5 flex items-center gap-1">
                  <ShieldCheck size={14} /> {fieldErrors.password}
                </p>
              )}
            </div>
            
            {/* Remember Me & Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  checked={rememberMe}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                  name="remember"
                  type="checkbox"
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-xs font-medium text-slate-700 select-none">Remember this device for 30 days</span>
              </label>
            </div>
            
            {/* Primary Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full relative py-2.5 px-4 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99] shadow-lg"
                style={{
                  boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
                    </svg>
                    <span>Authenticating credentials...</span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-2 tracking-wide">
                      <span>Sign In</span>
                      <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                    </span>
                  </>
                )}
              </button>
            </div>
            
            {/* Divider */}
            <div className="relative my-3">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#f8fafc] text-slate-600 font-semibold uppercase tracking-wider text-[11px]">or continue with</span>
              </div>
            </div>
            
            {/* Google SSO Authentication Button */}
            <GoogleAuthButton
              label="Continue with Google SSO"
              disabled={loading}
              onSuccess={handleGoogleSuccess}
              onError={(message) => setError(message)}
            />
          </form>
          
          {/* Create Account Link */}
          <div className="mt-4 pt-3 border-t border-slate-200/80 text-center">
            <p className="text-xs text-slate-700">
              New to PortionBridge?{" "}
              <button
                type="button"
                onClick={handleSignupClick}
                className="font-semibold text-sky-600 hover:text-sky-700 hover:underline ml-1 transition-colors"
              >
                Create an account
              </button>
            </p>
          </div>
          
          {/* Trust & Security Microcopy Footer */}
          <div className="mt-3 text-center space-y-1.5">
            <p className="text-[10px] sm:text-[11px] text-slate-600 flex items-center justify-center gap-1.5 font-medium leading-snug">
              <ShieldCheck size={14} className="text-sky-600 shrink-0" />
              <span>Protected by enterprise-grade security · Certified humanitarian platform</span>
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] text-slate-500 font-medium">
              <button type="button" className="hover:text-slate-800 hover:underline">Privacy Policy</button>
              <span>•</span>
              <button type="button" className="hover:text-slate-800 hover:underline">Donation Charter</button>
              <span>•</span>
              <button type="button" className="hover:text-slate-800 hover:underline">Help & Support</button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Custom CSS Animations & viewport-fit layout */}
      <style>{`
        @media (min-width: 1024px) {
          .login-page {
            height: 100dvh;
            max-height: 100dvh;
          }
        }

        @media (min-width: 1024px) {
          @supports not (height: 100dvh) {
            .login-page {
              height: 100vh;
              max-height: 100vh;
            }
          }
        }

        @media (min-width: 1024px) {
          .login-page__left {
            flex-shrink: 0;
          }

          .login-page__left > header {
            flex-shrink: 0;
          }

          .login-page__ecosystem {
            overflow: hidden;
          }
        }

        /* Short desktop/laptop viewports — tighten hero + cards without hiding content */
        @media (min-width: 1024px) and (max-height: 900px) {
          .login-page__headline {
            font-size: clamp(1.45rem, 3vh, 2rem) !important;
          }

          .login-page__ecosystem {
            margin-block: 0.5rem;
          }

          .login-page__cards {
            transform: scale(0.94);
            transform-origin: center center;
          }

          .login-page__form {
            transform: scale(0.97);
            transform-origin: center center;
          }
        }

        @media (min-width: 1024px) and (max-height: 768px) {
          .login-page__left {
            padding-block: 0.875rem;
          }

          .login-page__headline {
            font-size: clamp(1.25rem, 2.8vh, 1.65rem) !important;
          }

          .login-page__cards {
            transform: scale(0.86);
            gap: 0.375rem;
          }

          .login-page__card {
            padding: 0.5rem 0.625rem;
          }

          .login-page__left-footer {
            padding-top: 0.5rem;
            font-size: 0.625rem;
          }

          .login-page__form {
            transform: scale(0.92);
          }
        }

        @keyframes floatGentle {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(0.3deg); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(4px) rotate(-0.2deg); }
        }
        @keyframes dashTravel {
          to { stroke-dashoffset: -40; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease;
        }
      `}</style>
    </div>
  );
}
