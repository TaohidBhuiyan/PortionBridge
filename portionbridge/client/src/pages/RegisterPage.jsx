import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Upload,
  HandHeart,
  Users,
  Truck,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Circle,
  MailCheck,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { GoogleAuthButton } from "../components/auth/GoogleAuthButton";
import { Logo } from "../components/common/Logo";

// Redesign per Taohid's supplied mockup (portionbridge_create_account_bd_format.html):
// a dark navy/cyan two-panel layout (brand story left, form right) in Plus
// Jakarta Sans, replacing the previous sky-blue gradient card. All the
// underlying validation, submit, photo-upload, and Google/verification
// logic below is unchanged from before — only the markup and visual
// language changed. LoginPage.jsx was intentionally left as-is; only the
// Register page was in scope for this redesign.
const FONT_FAMILY = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

const JOURNEY_STEPS = [
  {
    icon: HandHeart,
    iconColor: "text-[#6d45bd]",
    title: "Surplus & Donors",
    description: "Restaurants, households, and shops log surplus food or clothing in seconds.",
    emphasized: false,
  },
  {
    icon: ShieldCheck,
    iconColor: "text-white",
    title: "PortionBridge Protocol",
    badge: "Auto-Match",
    description: "Smart auto-assignment matches your donation with a suitable nearby volunteer.",
    emphasized: true,
  },
  {
    icon: Truck,
    iconColor: "text-[#6d45bd]",
    title: "Active Volunteers",
    description: "Verified volunteer couriers pick up and transport donations to where they're needed.",
    emphasized: false,
  },
  {
    icon: Building2,
    iconColor: "text-emerald-600",
    title: "Community Impact",
    description: "Donations reach individuals and communities that need them, tracked start to finish.",
    emphasized: false,
  },
];

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("donor");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // COMING-SOON ELIMINATION / email verification: registration used to
  // navigate straight to /login with a toast-style message saying "please
  // verify your email" — telling the user to do something without ever
  // showing them where the email went or giving them a way to resend it.
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [verificationEmailSent, setVerificationEmailSent] = useState(true);
  const [resendStatus, setResendStatus] = useState("idle"); // idle | sending | sent
  const [resendMessage, setResendMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  const { register, googleLogin, resendVerification } = useAuth();
  const navigate = useNavigate();

  // Core 4-criteria score drives the segmented strength bar (matches the
  // mockup's 4-bar visual exactly); the fuller checklist below still shows
  // the special-character and no-outer-spaces checks since those reflect
  // real backend behavior even though they aren't required.
  const getPasswordStrength = () => {
    if (!password) return { segments: 0, text: "None", textClass: "text-slate-500" };
    let score = 0;
    if (password.length >= 8 && password.length <= 64) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;

    const levels = {
      1: { text: "Very Weak", textClass: "text-red-500" },
      2: { text: "Fair", textClass: "text-amber-500" },
      3: { text: "Good", textClass: "text-[#6d45bd]" },
      4: { text: "Strong & Secure", textClass: "text-emerald-600" },
    };
    return { segments: score, ...(levels[score] || { text: "None", textClass: "text-slate-400" }) };
  };

  const strength = getPasswordStrength();
  const segmentColor = (index) => {
    if (index >= strength.segments) return "bg-slate-200";
    if (strength.segments === 1) return "bg-red-500";
    if (strength.segments === 2) return "bg-amber-500";
    if (strength.segments === 3) return "bg-[#6d45bd]";
    return "bg-emerald-500";
  };

  const validateForm = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = "Name is required.";
    } else if (name.trim().length < 2 || name.trim().length > 100) {
      errors.name = "Name must be between 2 and 100 characters.";
    }

    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "A valid email address is required.";
    }

    if (phone.trim()) {
      if (phone.trim().length < 7 || phone.trim().length > 20) {
        errors.phone = "Phone number must be between 7 and 20 characters.";
      }
    }

    if (!password) {
      errors.password = "Password is required.";
    } else {
      if (password.length < 8 || password.length > 64) {
        errors.password = "Password must be between 8 and 64 characters.";
      }
      if (!/[A-Z]/.test(password)) {
        errors.password = "Password must contain at least one uppercase letter.";
      }
      if (!/[a-z]/.test(password)) {
        errors.password = "Password must contain at least one lowercase letter.";
      }
      if (!/[0-9]/.test(password)) {
        errors.password = "Password must contain at least one number.";
      }
      if (password !== password.trim()) {
        errors.password = "Password must not contain leading or trailing spaces.";
      }
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (!agree) {
      errors.agree = "Please agree to the Terms & Conditions.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!validateForm()) {
      setError("Please fix the validation errors below.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      formData.append('password', password);
      formData.append('role', role);
      if (phone.trim()) formData.append('phone', phone.trim());
      if (profilePhoto) formData.append('photo', profilePhoto);

      const result = await register(formData);

      if (!result.success) {
        if (result.errors && Array.isArray(result.errors)) {
          const errorsMap = {};
          result.errors.forEach(err => {
            errorsMap[err.field] = err.message;
          });
          setFieldErrors(errorsMap);
          setError(result.error || "Validation failed.");
        } else {
          setError(result.error || "Registration failed. Please try again.");
        }
        return;
      }

      setRegisteredEmail(email.trim());
      setVerificationEmailSent(result.verificationEmailSent);
      setRegistered(true);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleGoogleSuccess = async (credential) => {
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      const result = await googleLogin(credential, role);
      if (!result.success) {
        setError(result.error || "Google signup failed.");
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

  useEffect(() => {
    let objectUrl;

    if (profilePhoto) {
      objectUrl = URL.createObjectURL(profilePhoto);
      setTimeout(() => setProfilePhotoPreview(objectUrl), 0);
    } else {
      setTimeout(() => setProfilePhotoPreview(null), 0);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [profilePhoto]);

  const handleProfilePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setProfilePhoto(null);
      setFieldErrors((prev) => ({ ...prev, profilePhoto: undefined }));
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      event.target.value = '';
      setProfilePhoto(null);
      setFieldErrors((prev) => ({
        ...prev,
        profilePhoto: 'Unsupported file type. Please upload JPG, PNG, or WEBP.',
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      event.target.value = '';
      setProfilePhoto(null);
      setFieldErrors((prev) => ({
        ...prev,
        profilePhoto: 'Image is too large. Maximum size is 5MB.',
      }));
      return;
    }

    setFieldErrors((prev) => ({
      ...prev,
      profilePhoto: undefined,
    }));
    setProfilePhoto(file);
  };

  useEffect(() => {
    return () => clearInterval(cooldownRef.current);
  }, []);

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
    const result = await resendVerification(registeredEmail);
    setResendMessage(result.success ? result.message : result.error);
    setResendStatus("sent");
    startResendCooldown();
  };

  if (registered) {
    return (
      <div
        className="min-h-screen w-full bg-[#fdfbfe] text-[#1A1523] flex items-center justify-center p-4 relative overflow-hidden selection:bg-[#6d45bd]/20 selection:text-[#35206f]"
        style={FONT_FAMILY}
      >
        {/* Floating editorial background ambient lighting */}
        <div className="absolute -top-32 right-[8%] w-[480px] h-[360px] rounded-full blur-3xl opacity-40 pointer-events-none" style={{ background: "#e8c6ed", animation: "float 9s ease-in-out infinite" }} />
        <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: "#d9c8f1", animation: "float 7s ease-in-out infinite reverse" }} />
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-25 pointer-events-none" style={{ background: "#efe8fa", animation: "float 10s ease-in-out infinite" }} />
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#35206f 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 75%)",
          }}
        />

        <div className="w-full max-w-md bg-white/95 border border-[#6d45bd]/20 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(53,32,111,0.1)] relative z-10 text-center backdrop-blur-xl">
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto mb-4 ${verificationEmailSent ? 'bg-[#f6effb] border-[#6d45bd]/30 text-[#6d45bd]' : 'bg-amber-50 border-amber-300 text-amber-600'}`}>
            {verificationEmailSent ? <MailCheck size={32} /> : <AlertTriangle size={32} />}
          </div>
          <h1 className="text-2xl font-bold text-[#1A1523] tracking-tight font-serif">{verificationEmailSent ? 'Check your email' : 'Verification email needs a retry'}</h1>
          {verificationEmailSent ? (
            <p className="text-sm text-[#35206f]/70 mt-2 leading-relaxed">
              We sent a verification link to <span className="font-semibold text-[#6d45bd]">{registeredEmail}</span>. Click the link inside to verify your account before logging in.
            </p>
          ) : (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-left text-sm text-amber-800">
              <div className="flex gap-2">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                <p>Your account was created, but the verification email could not be delivered. Use the button below to try again; do not try to register with this email a second time.</p>
              </div>
            </div>
          )}

          <div className="mt-6 p-3.5 rounded-2xl bg-[#f8effb]/70 border border-[#6d45bd]/15 text-left text-xs text-slate-700 flex items-center gap-3">
            <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
            <span>
              Selected Role: <strong className="text-[#35206f] font-semibold">{role === 'donor' ? 'Donor' : 'Volunteer'}</strong>
            </span>
          </div>

          {resendMessage && (
            <div className="mt-4 rounded-xl border border-[#6d45bd]/25 bg-[#f6effb] px-3.5 py-2.5 text-sm font-medium text-[#6d45bd]">
              {resendMessage}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendStatus === "sending" || resendCooldown > 0}
              className="w-full py-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-[#35206f] via-[#54309a] to-[#6d45bd] hover:from-[#2a1758] hover:to-[#57319e] transition shadow-lg shadow-[#6d45bd]/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {resendCooldown > 0
                ? `Resend Verification Email (${resendCooldown}s)`
                : resendStatus === "sending"
                  ? "Sending..."
                  : "Resend Verification Email"}
            </button>
            <p className="text-xs text-slate-400 mt-0.5">Didn't receive it? Check your spam/junk folder.</p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-[#6d45bd] hover:text-[#35206f] transition hover:underline cursor-pointer"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#fdfbfe] text-[#1A1523] relative overflow-x-hidden selection:bg-[#6d45bd]/20 selection:text-[#35206f]" style={FONT_FAMILY}>
      {/* Floating editorial background ambient lighting */}
      <div className="absolute -top-32 right-[8%] w-[500px] h-[400px] rounded-full blur-3xl opacity-40 pointer-events-none" style={{ background: "#e8c6ed", animation: "float 9s ease-in-out infinite" }} />
      <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: "#d9c8f1", animation: "float 7s ease-in-out infinite reverse" }} />
      <div className="absolute -bottom-24 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-25 pointer-events-none" style={{ background: "#efe8fa", animation: "float 10s ease-in-out infinite" }} />
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#35206f 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 75%)",
        }}
      />

      <main className="min-h-screen flex items-center justify-center p-3 sm:p-5 lg:p-8 relative z-10">
        <div className="w-full max-w-5xl rounded-3xl bg-white/95 border border-[#6d45bd]/15 shadow-[0_25px_60px_-15px_rgba(53,32,111,0.1)] backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 lg:min-h-[620px]">

          {/* LEFT: Brand, story & verified impact journey */}
          <section className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-[#6d45bd]/15 bg-gradient-to-br from-[#f8effb]/90 via-white/80 to-[#f3eaf9]/90 backdrop-blur-md">
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#35206f] to-[#6d45bd] p-0.5 shadow-md shadow-[#6d45bd]/20 flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                    <Logo className="w-7 h-7" rounded={false} />
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight text-[#35206f] font-serif">
                      Portion<span className="text-[#6d45bd]">Bridge</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6d45bd] font-semibold font-mono tracking-wider uppercase">Food &amp; Clothes Donation Network</span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1523] leading-tight tracking-tight font-serif">
                  Give what you can.
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#35206f] via-[#6d45bd] to-[#35206f]">
                    Connect with those who need it.
                  </span>
                </h1>
                <p className="text-[#35206f]/75 text-xs sm:text-sm leading-relaxed font-normal">
                  Every surplus item becomes real relief. Join verified donors and volunteer couriers coordinating pickups and deliveries in real time.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-[#6d45bd]/15">
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-xs font-bold tracking-wider text-[#35206f] uppercase font-mono">Verified Impact Journey</span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Ecosystem
                  </span>
                </div>
                <div className="space-y-3 relative before:absolute before:left-[17px] before:top-3 before:bottom-3 before:w-0.5 before:bg-[#6d45bd]/20">
                  {JOURNEY_STEPS.map((step) => {
                    const StepIcon = step.icon;
                    return (
                      <div key={step.title} className="relative flex items-start gap-3.5 group">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 z-10 transition-all duration-300 ${
                            step.emphasized
                              ? "bg-gradient-to-tr from-[#35206f] to-[#6d45bd] text-white shadow-md shadow-[#6d45bd]/30 ring-2 ring-[#6d45bd]/20 scale-105"
                              : "bg-white border border-[#6d45bd]/20 text-[#6d45bd] shadow-xs group-hover:border-[#6d45bd] group-hover:shadow-md group-hover:-translate-y-0.5"
                          }`}
                        >
                          <StepIcon size={16} className={step.emphasized ? "text-white" : step.iconColor} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h2 className={`text-xs sm:text-sm font-bold ${step.emphasized ? "text-[#35206f]" : "text-[#1A1523]"}`}>{step.title}</h2>
                            {step.badge && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f6effb] text-[#6d45bd] border border-[#6d45bd]/25 font-mono font-semibold">
                                {step.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#6d45bd]/15 relative z-10">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 border border-[#6d45bd]/15 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[#f6effb] border border-[#6d45bd]/20 text-[#6d45bd] flex items-center justify-center shrink-0">
                  <Users size={17} />
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-[#35206f]">Join 10,000+ changemakers</span> — food donors, pantries &amp; volunteer couriers making direct community impact.
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: Create account form */}
          <section className="lg:col-span-7 p-5 sm:p-7 lg:p-8 flex flex-col justify-between overflow-y-auto max-h-[85vh] lg:max-h-none custom-scrollbar bg-white">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6d45bd] hover:text-[#35206f] transition-colors group cursor-pointer"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  Back to Login
                </button>
              </div>

              <div className="pb-4 border-b border-[#6d45bd]/15">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider text-[#6d45bd] bg-[#f6effb] border border-[#6d45bd]/20 mb-2 font-mono">
                  <Lock size={12} className="text-[#6d45bd]" />
                  Secure Registration
                </div>
                <h2 className="text-2xl font-bold text-[#1A1523] tracking-tight font-serif">Create your account</h2>
                <p className="text-xs text-slate-500 mt-1">Start contributing as a donor or volunteer in minutes.</p>
              </div>

              {/* Role Selector */}
              <div className="mt-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">I want to join as</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("donor")}
                    disabled={loading}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-300 relative flex flex-col justify-between gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                      role === "donor"
                        ? "bg-[#f0fbf5] border-emerald-400 ring-2 ring-emerald-400/20 shadow-md shadow-emerald-500/10"
                        : "border-slate-200 bg-white hover:border-[#6d45bd]/40 hover:bg-[#fbf9fe]"
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        role === "donor" ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        <HandHeart size={20} />
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight border ${
                        role === "donor" ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold" : "text-slate-500 border-slate-200 bg-slate-50 font-medium"
                      }`}>
                        {role === "donor" && <CheckCircle2 size={12} />}
                        {role === "donor" ? "Selected" : "Select"}
                      </span>
                    </div>
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <span className={`text-base font-bold tracking-tight ${role === "donor" ? "text-emerald-950" : "text-[#1A1523]"}`}>Donor</span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${role === "donor" ? "text-emerald-700" : "text-slate-400"}`}>Give Surplus</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">Share surplus food, meals, or clothing donations</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("volunteer")}
                    disabled={loading}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-300 relative flex flex-col justify-between gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                      role === "volunteer"
                        ? "bg-[#f8f2fd] border-[#6d45bd] ring-2 ring-[#6d45bd]/20 shadow-md shadow-[#6d45bd]/15"
                        : "border-slate-200 bg-white hover:border-[#6d45bd]/40 hover:bg-[#fbf9fe]"
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        role === "volunteer" ? "bg-[#efe8fa] text-[#6d45bd] border-[#6d45bd]/30" : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        <Truck size={20} />
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight border ${
                        role === "volunteer" ? "bg-[#f6effb] text-[#6d45bd] border-[#6d45bd]/30 font-semibold" : "text-slate-500 border-slate-200 bg-slate-50 font-medium"
                      }`}>
                        {role === "volunteer" && <CheckCircle2 size={12} />}
                        {role === "volunteer" ? "Selected" : "Select"}
                      </span>
                    </div>
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <span className={`text-base font-bold tracking-tight ${role === "volunteer" ? "text-[#35206f]" : "text-[#1A1523]"}`}>Volunteer</span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${role === "volunteer" ? "text-[#6d45bd]" : "text-slate-400"}`}>Hands-on Relief</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">Pick up, transport &amp; deliver donations</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-red-700">
                  <AlertCircle size={17} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium leading-relaxed">{error}</p>
                </div>
              )}

              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                {/* Profile photo upload */}
                <div className="p-3.5 rounded-2xl bg-[#faf6fe] border border-dashed border-[#6d45bd]/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={handleProfilePhotoClick}
                      disabled={loading}
                      className="w-11 h-11 rounded-full bg-white border border-[#6d45bd]/25 flex items-center justify-center text-[#6d45bd] overflow-hidden shrink-0 hover:border-[#6d45bd] shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {profilePhotoPreview ? (
                        <img src={profilePhotoPreview} alt="Profile preview" className="w-full h-full object-cover" />
                      ) : (
                        <Upload size={18} strokeWidth={1.75} />
                      )}
                    </button>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1A1523]">
                        Profile Photo <span className="text-slate-400 font-normal">(Optional)</span>
                      </p>
                      <p className="text-[11px] text-slate-500">JPG, PNG or WEBP up to 5MB</p>
                      {profilePhoto && <p className="text-[11px] text-[#6d45bd] font-medium mt-0.5 truncate">{profilePhoto.name}</p>}
                    </div>
                  </div>
                  {profilePhoto ? (
                    <button
                      type="button"
                      onClick={() => {
                        setProfilePhoto(null);
                        fileInputRef.current.value = '';
                        setFieldErrors((prev) => ({ ...prev, profilePhoto: undefined }));
                      }}
                      disabled={loading}
                      className="text-xs font-medium text-red-600 hover:text-red-700 transition shrink-0 cursor-pointer"
                    >
                      Remove
                    </button>
                  ) : (
                    <label
                      htmlFor="avatarInput"
                      className="cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-[#f6effb] text-[#6d45bd] border border-[#6d45bd]/30 shadow-xs transition-colors shrink-0"
                    >
                      Browse
                    </label>
                  )}
                  <input
                    ref={fileInputRef}
                    id="avatarInput"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleProfilePhotoChange}
                    disabled={loading}
                  />
                </div>
                {fieldErrors.profilePhoto && (
                  <span className="block -mt-2 text-red-600 text-[11px] ml-1 leading-tight font-medium">{fieldErrors.profilePhoto}</span>
                )}

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="fullName">
                      Full Name <span className="text-[#6d45bd]">*</span>
                    </label>
                    <div className="relative">
                      <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6d45bd]/60 pointer-events-none" />
                      <input
                        id="fullName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        placeholder="e.g., Marcus Vance"
                        autoComplete="name"
                        className={`w-full pl-10 pr-3 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 shadow-xs transition-all disabled:opacity-50 focus:outline-none focus:ring-4 ${
                          fieldErrors.name
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
                            : "border-slate-200 focus:border-[#6d45bd] focus:ring-[#6d45bd]/12"
                        }`}
                      />
                    </div>
                    {fieldErrors.name && <span className="block mt-1 ml-1 text-red-600 text-[11px] leading-tight font-medium">{fieldErrors.name}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="email">
                      Email Address <span className="text-[#6d45bd]">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6d45bd]/60 pointer-events-none" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className={`w-full pl-10 pr-3 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 shadow-xs transition-all disabled:opacity-50 focus:outline-none focus:ring-4 ${
                          fieldErrors.email
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
                            : "border-slate-200 focus:border-[#6d45bd] focus:ring-[#6d45bd]/12"
                        }`}
                      />
                    </div>
                    {fieldErrors.email && <span className="block mt-1 ml-1 text-red-600 text-[11px] leading-tight font-medium">{fieldErrors.email}</span>}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="phone">
                    Phone Number <span className="text-slate-400 font-normal lowercase">(optional, for SMS alerts)</span>
                  </label>
                  <div className="relative">
                    <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6d45bd]/60 pointer-events-none" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      placeholder="+880 1712-345678"
                      autoComplete="tel"
                      className={`w-full pl-10 pr-3 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 shadow-xs transition-all disabled:opacity-50 focus:outline-none focus:ring-4 ${
                        fieldErrors.phone
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
                          : "border-slate-200 focus:border-[#6d45bd] focus:ring-[#6d45bd]/12"
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && <span className="block mt-1 ml-1 text-red-600 text-[11px] leading-tight font-medium">{fieldErrors.phone}</span>}
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="password">
                      Password <span className="text-[#6d45bd]">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6d45bd]/60 pointer-events-none" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        placeholder="Create strong password"
                        autoComplete="new-password"
                        className={`w-full pl-10 pr-10 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 shadow-xs transition-all disabled:opacity-50 focus:outline-none focus:ring-4 ${
                          fieldErrors.password
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
                            : "border-slate-200 focus:border-[#6d45bd] focus:ring-[#6d45bd]/12"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.password && <span className="block mt-1 ml-1 text-red-600 text-[11px] leading-tight font-medium">{fieldErrors.password}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" htmlFor="confirmPassword">
                      Confirm Password <span className="text-[#6d45bd]">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6d45bd]/60 pointer-events-none" />
                      <input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        placeholder="Re-type password"
                        className={`w-full pl-10 pr-10 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 shadow-xs transition-all disabled:opacity-50 focus:outline-none focus:ring-4 ${
                          fieldErrors.confirmPassword
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
                            : "border-slate-200 focus:border-[#6d45bd] focus:ring-[#6d45bd]/12"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((s) => !s)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && <span className="block mt-1 ml-1 text-red-600 text-[11px] leading-tight font-medium">{fieldErrors.confirmPassword}</span>}
                  </div>
                </div>

                {/* Password strength & checklist */}
                {password && (
                  <div className="p-3.5 rounded-2xl bg-[#faf6fe] border border-[#6d45bd]/20 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Security Score:</span>
                      <span className={`font-semibold ${strength.textClass}`}>{strength.text}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className={`h-full w-1/4 rounded-full transition-all duration-300 ${segmentColor(i)}`} />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                      {[
                        { label: "8-64 characters", valid: password.length >= 8 && password.length <= 64 },
                        { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
                        { label: "Lowercase letter", valid: /[a-z]/.test(password) },
                        { label: "At least one number", valid: /[0-9]/.test(password) },
                        { label: "Special char (recommended)", valid: /[^A-Za-z0-9]/.test(password) },
                        { label: "No outer spaces", valid: password === password.trim() },
                      ].map((req) => (
                        <div key={req.label} className={`flex items-center gap-1.5 transition-colors ${req.valid ? "text-emerald-700 font-medium" : "text-slate-400"}`}>
                          {req.valid ? <CheckCircle2 size={12} className="text-emerald-600 shrink-0" /> : <Circle size={12} className="shrink-0" />}
                          <span>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Terms */}
                <div className="flex flex-col pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      disabled={loading}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#6d45bd] focus:ring-[#6d45bd]/20 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 leading-normal">
                      I agree to the <span className="text-[#6d45bd] font-medium hover:underline">Terms of Service</span> and <span className="text-[#6d45bd] font-medium hover:underline">Privacy Policy</span>.
                    </span>
                  </label>
                  {fieldErrors.agree && <span className="mt-0.5 ml-1 text-red-600 text-[11px] leading-tight font-medium">{fieldErrors.agree}</span>}
                </div>

                {/* Submit button with shimmer sweep */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-12 relative py-3 px-4 bg-gradient-to-r from-[#35206f] via-[#54309a] to-[#6d45bd] hover:from-[#2a1758] hover:to-[#57319e] text-white font-semibold rounded-xl text-sm transition-all duration-300 shadow-md shadow-[#6d45bd]/25 hover:shadow-xl hover:shadow-[#6d45bd]/40 active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                  >
                    <span
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)",
                        backgroundSize: "220% 220%",
                        animation: "shimmerSweep 1.6s ease-in-out infinite",
                      }}
                    />
                    <span className="relative z-10 flex items-center gap-2 font-semibold">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
                          </svg>
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Create PortionBridge Account</span>
                          <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </form>

              {/* Divider */}
              <div className="relative my-5 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative px-3 bg-white text-[10px] uppercase tracking-wider text-slate-400 font-semibold font-mono">Or continue with</span>
              </div>

              <div className="flex justify-center [&>button]:w-full">
                <GoogleAuthButton
                  label="Continue with Google"
                  disabled={loading}
                  onSuccess={handleGoogleSuccess}
                  onError={(message) => setError(message)}
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="font-semibold text-[#6d45bd] hover:text-[#35206f] hover:underline cursor-pointer ml-1"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
