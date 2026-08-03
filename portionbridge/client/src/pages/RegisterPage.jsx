import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, User, Mail, Phone, Lock, Eye, EyeOff, HandHeart, Users, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/**
 * RegisterPage - Integrated with existing AuthContext and backend API
 * Uses exact UI from provided CreateAccount component
 */
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
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const getPasswordStrength = () => {
    if (!password) return { percent: 0, text: "", color: "bg-transparent" };
    let score = 0;
    if (password.length >= 8 && password.length <= 64) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    
    // Bonus point for special character
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { percent: 25, text: "Weak", color: "bg-red-500" };
    if (score <= 4) return { percent: 75, text: "Medium", color: "bg-yellow-500" };
    return { percent: 100, text: "Strong", color: "bg-green-500" };
  };

  const strength = getPasswordStrength();

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

    // Password validation
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

      // Redirect to login page after successful registration
      navigate("/login", { 
        state: { message: "Account created successfully. Please verify your email before logging in." }
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  useEffect(() => {
    if (!profilePhoto) {
      setProfilePhotoPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(profilePhoto);
    setProfilePhotoPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-3 py-8 sm:px-6 sm:py-10 relative overflow-hidden" style={{ backgroundColor: "#2e1065" }}>
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-purple-500/40 blur-3xl"></div>
      <div className="absolute -bottom-24 -right-16 w-96 h-96 rounded-full bg-fuchsia-500/30 blur-3xl"></div>
      <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-violet-600/30 blur-3xl"></div>
      <div
        className="w-full max-w-[420px] mx-auto rounded-[32px] border border-white/10 px-5 py-6 sm:px-6 sm:py-7 shadow-[0_36px_100px_rgba(15,23,42,0.35)] backdrop-blur-xl relative z-10"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 0%, #8b5cf6 0%, #7c3aed 35%, #4c1d95 70%, #0d0512 100%)",
        }}
      >
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="space-y-1">
            <h1 className="text-white text-3xl font-semibold tracking-tight">Create Account</h1>
            <p className="text-purple-200/80 text-sm sm:text-xs max-w-xl">
              Join PortionBridge and start sharing your impact with donors and volunteers.
            </p>
          </div>
        </div>

        {/* Avatar upload */}
        <div className="flex flex-col gap-2 mt-4 mb-5 bg-white/5 p-3.5 sm:p-4 rounded-[28px] border border-dashed border-white/10 shadow-sm shadow-black/20 max-w-[420px] mx-auto">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleProfilePhotoClick}
              className="w-12 h-12 rounded-3xl border border-dashed border-purple-200/50 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors duration-200 shrink-0"
              disabled={loading}
            >
              <Upload className="w-5 h-5 text-purple-100/80" strokeWidth={1.5} />
            </button>
            <div className="flex-1 flex flex-col text-left">
              <span className="text-white text-sm font-semibold">Profile Photo</span>
              <span className="text-purple-200/70 text-[11px]">Upload an image to personalize your profile.</span>
              {profilePhoto && (
                <span className="text-[11px] text-purple-100/80 mt-1 break-all">{profilePhoto.name}</span>
              )}
            </div>
            {profilePhoto && (
              <button
                type="button"
                onClick={() => {
                  setProfilePhoto(null);
                  fileInputRef.current.value = '';
                  setFieldErrors((prev) => ({ ...prev, profilePhoto: undefined }));
                }}
                className="text-xs text-purple-100/80 hover:text-white transition"
                disabled={loading}
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleProfilePhotoChange}
          />
          {fieldErrors.profilePhoto && (
            <span className="text-red-300 text-[11px] ml-1 leading-tight">{fieldErrors.profilePhoto}</span>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3 mb-4">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
        {profilePhotoPreview && (
          <div className="mb-4 rounded-2xl overflow-hidden border border-white/10">
            <img src={profilePhotoPreview} alt="Profile preview" className="w-full h-52 object-cover" />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Form fields */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col">
                <InputField 
                  icon={<User className="w-4 h-4" />} 
                  placeholder="Full Name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
                {fieldErrors.name && (
                  <span className="text-red-300 text-[11px] mt-1 ml-1 leading-tight">{fieldErrors.name}</span>
                )}
              </div>
              <div className="flex flex-col">
                <InputField 
                  icon={<Mail className="w-4 h-4" />} 
                  placeholder="Email" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                {fieldErrors.email && (
                  <span className="text-red-300 text-[11px] mt-1 ml-1 leading-tight">{fieldErrors.email}</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col">
                <InputField 
                  icon={<Phone className="w-4 h-4" />} 
                  placeholder="Phone Number" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                />
                {fieldErrors.phone && (
                  <span className="text-red-300 text-[11px] mt-1 ml-1 leading-tight">{fieldErrors.phone}</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col">
                <InputField
                  icon={<Lock className="w-4 h-4" />}
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword((s) => !s)} disabled={loading}>
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                />
                {fieldErrors.password && (
                  <span className="text-red-300 text-[11px] mt-1 ml-1 leading-tight">{fieldErrors.password}</span>
                )}
              </div>
              <div className="flex flex-col">
                <InputField
                  icon={<Lock className="w-4 h-4" />}
                  placeholder="Confirm Password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  rightIcon={
                    <button type="button" onClick={() => setShowConfirm((s) => !s)} disabled={loading}>
                      {showConfirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                />
                {fieldErrors.confirmPassword && (
                  <span className="text-red-300 text-[11px] mt-1 ml-1 leading-tight">{fieldErrors.confirmPassword}</span>
                )}
              </div>
            </div>
            {password && (
              <div className="text-purple-200/90 text-[10px] space-y-1 mt-2 p-2.5 bg-white/5 rounded-2xl border border-purple-500/20">
                <p className="font-semibold text-white">Password Requirements:</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div className={password.length >= 8 && password.length <= 64 ? "text-green-300" : "text-purple-200/50"}>
                    {password.length >= 8 && password.length <= 64 ? "✓" : "○"} At least 8 characters
                  </div>
                  <div className={/[A-Z]/.test(password) ? "text-green-300" : "text-purple-200/50"}>
                    {/[A-Z]/.test(password) ? "✓" : "○"} One uppercase letter
                  </div>
                  <div className={/[a-z]/.test(password) ? "text-green-300" : "text-purple-200/50"}>
                    {/[a-z]/.test(password) ? "✓" : "○"} One lowercase letter
                  </div>
                  <div className={/[0-9]/.test(password) ? "text-green-300" : "text-purple-200/50"}>
                    {/[0-9]/.test(password) ? "✓" : "○"} One number
                  </div>
                  <div className={/[^A-Za-z0-9]/.test(password) ? "text-green-300" : "text-purple-200/40"}>
                    {/[^A-Za-z0-9]/.test(password) ? "✓" : "○"} Special char (recommended)
                  </div>
                  <div className={password === password.trim() ? "text-green-300" : "text-purple-200/50"}>
                    {password === password.trim() ? "✓" : "○"} No outer spaces
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-purple-500/10">
                  <div className="flex justify-between text-[10px] text-purple-200/70 mb-1">
                    <span>Password Strength:</span>
                    <span className="font-bold text-white">{strength.text}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1">
                    <div className={`h-1 rounded-full ${strength.color} transition-all duration-300`} style={{ width: `${strength.percent}%` }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Role selection */}
          <p className="text-purple-100/95 text-xs mt-3 mb-2 font-medium text-left">I want to join as</p>
          <div className="grid grid-cols-2 gap-3">
            <RoleButton
              active={role === "donor"}
              onClick={() => setRole("donor")}
              icon={<HandHeart className="w-4.5 h-4.5" />}
              label="Donor"
              iconColor="#fb7185"
              disabled={loading}
            />
            <RoleButton
              active={role === "volunteer"}
              onClick={() => setRole("volunteer")}
              icon={<Users className="w-4.5 h-4.5" />}
              label="Volunteer"
              iconColor="#38bdf8"
              disabled={loading}
            />
          </div>

          {/* Terms checkbox */}
          <div className="flex flex-col mt-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                disabled={loading}
                className="w-3.5 h-3.5 rounded border-purple-300/50 accent-purple-500 bg-transparent"
              />
              <span className="text-purple-100/90 text-xs">
                I agree to the Terms &amp; Conditions
              </span>
            </label>
            {fieldErrors.agree && (
              <span className="text-red-300 text-[10px] mt-0.5 ml-1 leading-tight">{fieldErrors.agree}</span>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 rounded-full font-semibold text-white flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            style={{
              background: "linear-gradient(90deg, #a855f7 0%, #7c3aed 100%)",
            }}
          >
            <span>{loading ? "Creating Account..." : "Create Account"}</span>
            <span className="w-4 h-4 flex items-center justify-center">
              {!loading && <ArrowRight className="w-4 h-4" />}
            </span>
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-purple-100/80 text-xs mt-4">
          Already have an account?{" "}
          <button onClick={handleLoginClick} className="text-white font-semibold underline hover:text-purple-200 cursor-pointer">
            Login here
          </button>
        </p>
      </div>
    </div>
  );
}

function InputField({ icon, placeholder, type = "text", value, onChange, disabled, rightIcon }) {
  return (
    <div className="flex items-center gap-3 bg-white/10 rounded-2xl border border-white/10 px-3.5 py-3.5 backdrop-blur-sm min-h-[56px] transition-shadow duration-200 focus-within:shadow-[0_0_0_4px_rgba(124,58,237,0.18)]">
      <span className="text-purple-100/70">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="bg-transparent outline-none text-sm text-white placeholder-purple-100/60 w-full min-w-0 disabled:opacity-50"
      />
      {rightIcon && <span className="text-purple-100/70 flex items-center">{rightIcon}</span>}
    </div>
  );
}

function RoleButton({ active, onClick, icon, label, iconColor, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-2 min-h-[86px] rounded-2xl border px-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        active
          ? "bg-gradient-to-br from-purple-500/15 via-fuchsia-500/10 to-slate-900/20 border-purple-300/30 shadow-[0_12px_30px_rgba(124,58,237,0.12)]"
          : "bg-slate-950/70 border-white/10 hover:bg-white/5"
      }`}
    >
      <span style={{ color: iconColor }}>{icon}</span>
      <span className="text-white text-xs font-medium">{label}</span>
    </button>
  );
}
