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
    iconColor: "text-cyan-400",
    title: "Surplus & Donors",
    description: "Restaurants, households, and shops log surplus food or clothing in seconds.",
    emphasized: false,
  },
  {
    icon: ShieldCheck,
    iconColor: "text-cyan-300",
    title: "PortionBridge Protocol",
    badge: "Auto-Match",
    description: "Smart auto-assignment matches your donation with a suitable nearby volunteer.",
    emphasized: true,
  },
  {
    icon: Truck,
    iconColor: "text-sky-400",
    title: "Active Volunteers",
    description: "Verified volunteer couriers pick up and transport donations to where they're needed.",
    emphasized: false,
  },
  {
    icon: Building2,
    iconColor: "text-emerald-400",
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
      1: { text: "Very Weak", textClass: "text-red-400" },
      2: { text: "Fair", textClass: "text-amber-400" },
      3: { text: "Good", textClass: "text-sky-400" },
      4: { text: "Strong & Secure", textClass: "text-emerald-400" },
    };
    return { segments: score, ...(levels[score] || { text: "None", textClass: "text-slate-500" }) };
  };

  const strength = getPasswordStrength();
  const segmentColor = (index) => {
    if (index >= strength.segments) return "bg-slate-800";
    if (strength.segments === 1) return "bg-red-500";
    if (strength.segments === 2) return "bg-amber-500";
    if (strength.segments === 3) return "bg-sky-400";
    return "bg-emerald-400";
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
        className="min-h-screen w-full bg-[#040D1A] text-slate-200 flex items-center justify-center p-4 relative overflow-hidden"
        style={FONT_FAMILY}
      >
        <div className="fixed top-[-10%] left-[-10%] w-[650px] h-[650px] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none" />
        <div className="fixed bottom-[-15%] right-[-10%] w-[700px] h-[700px] rounded-full bg-sky-500/10 blur-[150px] pointer-events-none" />
        <div className="w-full max-w-md bg-[#071527] border border-cyan-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 text-center">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-4">
            <MailCheck size={28} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Check your email</h1>
          <p className="text-sm text-slate-400 mt-2">
            We sent a verification link to <span className="font-medium text-cyan-300">{registeredEmail}</span>.
            Click the link inside to verify your account before logging in.
          </p>

          <div className="mt-6 p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-left text-xs text-slate-300 flex items-center gap-3">
            <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
            <span>
              Selected Role: <strong className="text-white">{role === 'donor' ? 'Donor' : 'Volunteer'}</strong>
            </span>
          </div>

          {resendMessage && (
            <div className="mt-4 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
              {resendMessage}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendStatus === "sending" || resendCooldown > 0}
              className="w-full py-2.5 rounded-xl font-semibold text-xs text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `Resend Verification Email (${resendCooldown}s)`
                : resendStatus === "sending"
                  ? "Sending..."
                  : "Resend Verification Email"}
            </button>
            <p className="text-xs text-slate-500 mt-1">Didn't receive it? Check your spam/junk folder.</p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#040D1A] text-slate-200 relative overflow-x-hidden selection:bg-cyan-500/20 selection:text-cyan-300" style={FONT_FAMILY}>
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] w-[550px] h-[550px] rounded-full bg-sky-500/10 blur-[140px] pointer-events-none" />

      <main className="min-h-screen flex items-center justify-center p-3 sm:p-5 lg:p-6 relative z-10">
        <div className="w-full max-w-5xl rounded-2xl bg-[#071527]/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 lg:min-h-[600px]">

          {/* LEFT: Brand, story & verified impact journey */}
          <section className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-gradient-to-br from-[#061222] via-[#07172c] to-[#040D1A]">
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-400 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-[#071527] rounded-[10px] flex items-center justify-center">
                    <Logo className="w-6 h-6" rounded={false} />
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight text-white">
                      Portion<span className="text-cyan-400">Bridge</span>
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Food &amp; Clothes Donation Network</span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight tracking-tight">
                  Give what you can.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-300 to-teal-200">
                    Connect with those who need it.
                  </span>
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Every surplus item becomes real relief. Join verified donors and volunteer couriers coordinating pickups and deliveries in real time.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-800/80">
                <span className="text-xs font-semibold tracking-wider text-cyan-400 uppercase">Verified Impact Journey</span>
                <div className="mt-4 space-y-3 relative before:absolute before:left-[17px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                  {JOURNEY_STEPS.map((step) => {
                    const StepIcon = step.icon;
                    return (
                      <div key={step.title} className="relative flex items-start gap-4 group">
                        <div
                          className={`w-9 h-9 rounded-full bg-slate-900 border flex items-center justify-center shrink-0 z-10 transition-colors ${
                            step.emphasized ? "border-cyan-500/50 ring-2 ring-cyan-500/20" : "border-slate-700 group-hover:border-cyan-400"
                          }`}
                        >
                          <StepIcon size={16} className={step.iconColor} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className={`text-sm font-semibold ${step.emphasized ? "text-white" : "text-slate-200"}`}>{step.title}</h2>
                            {step.badge && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                                {step.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 leading-snug mt-0.5">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800/80 relative z-10">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/90">
                <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                  <Users size={16} />
                </div>
                <div className="text-xs text-slate-300">
                  <span className="font-semibold text-white">Join the community</span> of food donors, pantry directors &amp; volunteer couriers making an impact together.
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: Create account form */}
          <section className="lg:col-span-7 p-5 sm:p-6 lg:p-8 flex flex-col justify-between overflow-y-auto max-h-[85vh] lg:max-h-none custom-scrollbar bg-[#050f1d]">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-cyan-300 transition-colors group"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                  Back to Login
                </button>
              </div>

              <div className="pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  <Lock size={16} />
                  Secure Registration
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight mt-1">Create your account</h2>
              </div>

              {/* Role Selector */}
              <div className="mt-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">I want to join as</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("donor")}
                    disabled={loading}
                    className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                      role === "donor"
                        ? "bg-gradient-to-b from-emerald-500/15 to-cyan-950/30 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                        : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        role === "donor" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}>
                        <HandHeart size={19} />
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight border ${
                        role === "donor" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "text-slate-400 border-slate-700 bg-slate-800/60 font-medium"
                      }`}>
                        {role === "donor" && <CheckCircle2 size={11} />}
                        {role === "donor" ? "Selected" : "Select"}
                      </span>
                    </div>
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <span className={`text-base font-bold tracking-tight ${role === "donor" ? "text-white" : "text-slate-300"}`}>Donor</span>
                        <span className={`text-[10px] uppercase font-semibold tracking-wider ${role === "donor" ? "text-emerald-400/90" : "text-slate-400"}`}>Give Surplus</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-snug">Share surplus food, meals, or clothing donations</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("volunteer")}
                    disabled={loading}
                    className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                      role === "volunteer"
                        ? "bg-gradient-to-b from-cyan-500/15 to-cyan-950/30 border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                        : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        role === "volunteer" ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}>
                        <Truck size={19} />
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight border ${
                        role === "volunteer" ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40" : "text-slate-400 border-slate-700 bg-slate-800/60 font-medium"
                      }`}>
                        {role === "volunteer" && <CheckCircle2 size={11} />}
                        {role === "volunteer" ? "Selected" : "Select"}
                      </span>
                    </div>
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <span className={`text-base font-bold tracking-tight ${role === "volunteer" ? "text-white" : "text-slate-300"}`}>Volunteer</span>
                        <span className={`text-[10px] uppercase font-semibold tracking-wider ${role === "volunteer" ? "text-cyan-400/90" : "text-slate-400"}`}>Hands-on Relief</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-snug">Pick up, transport &amp; deliver donations</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                {/* Profile photo upload */}
                <div className="p-3 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={handleProfilePhotoClick}
                      disabled={loading}
                      className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 overflow-hidden shrink-0 hover:border-cyan-500/40 transition-colors disabled:opacity-50"
                    >
                      {profilePhotoPreview ? (
                        <img src={profilePhotoPreview} alt="Profile preview" className="w-full h-full object-cover" />
                      ) : (
                        <Upload size={16} strokeWidth={1.5} />
                      )}
                    </button>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200">
                        Profile Photo <span className="text-slate-500 font-normal">(Optional)</span>
                      </p>
                      <p className="text-[11px] text-slate-400">JPG, PNG or WEBP up to 5MB</p>
                      {profilePhoto && <p className="text-[11px] text-cyan-300 mt-0.5 truncate">{profilePhoto.name}</p>}
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
                      className="text-xs text-slate-400 hover:text-white transition shrink-0"
                    >
                      Remove
                    </button>
                  ) : (
                    <label
                      htmlFor="avatarInput"
                      className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/20 transition-colors shrink-0"
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
                  <span className="block -mt-2 text-red-300 text-[11px] ml-1 leading-tight">{fieldErrors.profilePhoto}</span>
                )}

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="fullName">
                      Full Name <span className="text-cyan-400">*</span>
                    </label>
                    <div className="relative">
                      <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input
                        id="fullName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        placeholder="e.g., Marcus Vance"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition disabled:opacity-50"
                      />
                    </div>
                    {fieldErrors.name && <span className="block mt-1 ml-1 text-red-300 text-[11px] leading-tight">{fieldErrors.name}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="email">
                      Email Address <span className="text-cyan-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition disabled:opacity-50"
                      />
                    </div>
                    {fieldErrors.email && <span className="block mt-1 ml-1 text-red-300 text-[11px] leading-tight">{fieldErrors.email}</span>}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="phone">
                    Phone Number <span className="text-slate-500">(Optional, for SMS alerts)</span>
                  </label>
                  <div className="relative">
                    <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      placeholder="+880 1712-345678"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition disabled:opacity-50"
                    />
                  </div>
                  {fieldErrors.phone && <span className="block mt-1 ml-1 text-red-300 text-[11px] leading-tight">{fieldErrors.phone}</span>}
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="password">
                      Password <span className="text-cyan-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        placeholder="Create strong password"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.password && <span className="block mt-1 ml-1 text-red-300 text-[11px] leading-tight">{fieldErrors.password}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="confirmPassword">
                      Confirm Password <span className="text-cyan-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        placeholder="Re-type password"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((s) => !s)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && <span className="block mt-1 ml-1 text-red-300 text-[11px] leading-tight">{fieldErrors.confirmPassword}</span>}
                  </div>
                </div>

                {/* Password strength & checklist */}
                {password && (
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Security Score:</span>
                      <span className={`font-medium ${strength.textClass}`}>{strength.text}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex gap-1">
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
                        <div key={req.label} className={`flex items-center gap-1.5 transition-colors ${req.valid ? "text-emerald-400" : "text-slate-500"}`}>
                          {req.valid ? <CheckCircle2 size={12} /> : <Circle size={12} />}
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
                      className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400/30 focus:ring-offset-0 focus:ring-1"
                    />
                    <span className="text-xs text-slate-400 leading-normal">I agree to the Terms of Service and Privacy Policy.</span>
                  </label>
                  {fieldErrors.agree && <span className="mt-0.5 ml-1 text-red-300 text-[11px] leading-tight">{fieldErrors.agree}</span>}
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-400 hover:from-cyan-300 hover:to-sky-200 transition shadow-lg shadow-cyan-500/20 active:scale-[0.99] flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span>{loading ? "Creating Account..." : "Create PortionBridge Account"}</span>
                    {!loading && <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />}
                  </button>
                </div>
              </form>

              {/* Divider */}
              <div className="relative my-5 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <span className="relative px-3 bg-[#050f1d] text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Or continue with</span>
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

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
              <p className="text-xs text-slate-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 ml-1"
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
