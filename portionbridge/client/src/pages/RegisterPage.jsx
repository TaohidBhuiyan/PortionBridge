import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, User, Mail, Phone, MapPin, Lock, Eye, EyeOff, HandHeart, Users, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/**
 * RegisterPage - Integrated with existing AuthContext and backend API
 * Uses exact UI from provided CreateAccount component
 */
export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("donor");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!name || !email || !password || !phone || !address) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agree) {
      setError("Please agree to the Terms & Conditions.");
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        name,
        email,
        password,
        role,
        phone,
        address,
      });

      if (!result.success) {
        setError(result.error || "Registration failed. Please try again.");
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden" style={{backgroundColor: "#2e1065"}}>
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-purple-500/40 blur-3xl"></div>
      <div className="absolute -bottom-24 -right-16 w-96 h-96 rounded-full bg-fuchsia-500/30 blur-3xl"></div>
      <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-violet-600/30 blur-3xl"></div>
      <div
        className="w-full max-w-md rounded-3xl p-8 shadow-2xl relative z-10"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 0%, #8b5cf6 0%, #7c3aed 35%, #4c1d95 70%, #0d0512 100%)",
        }}
      >
        {/* Header */}
        <h1 className="text-white text-2xl font-bold">Create Account</h1>
        <p className="text-purple-200/80 text-sm mt-1">
          Join PortionBridge and start sharing.
        </p>

        {/* Avatar upload - placeholder for future implementation */}
        <div className="flex flex-col items-center mt-6 mb-6">
          <button
            type="button"
            className="w-20 h-20 rounded-full border-2 border-dashed border-purple-200/50 flex items-center justify-center hover:bg-white/5 transition-colors"
            disabled={loading}
          >
            <Upload className="w-6 h-6 text-purple-100/80" strokeWidth={1.5} />
          </button>
          <span className="text-purple-100/70 text-xs mt-2">
            Add a profile photo (optional)
          </span>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3 mb-4">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Form fields */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <InputField 
                icon={<User className="w-4 h-4" />} 
                placeholder="Full Name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
              <InputField 
                icon={<Mail className="w-4 h-4" />} 
                placeholder="Email" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField 
                icon={<Phone className="w-4 h-4" />} 
                placeholder="Phone Number" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
              <InputField 
                icon={<MapPin className="w-4 h-4" />} 
                placeholder="Location" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
            </div>
          </div>

          {/* Role selection */}
          <p className="text-purple-100/90 text-sm mt-5 mb-2">I want to join as</p>
          <div className="grid grid-cols-2 gap-3">
            <RoleButton
              active={role === "donor"}
              onClick={() => setRole("donor")}
              icon={<HandHeart className="w-5 h-5" />}
              label="Donor"
              iconColor="#fb7185"
              disabled={loading}
            />
            <RoleButton
              active={role === "volunteer"}
              onClick={() => setRole("volunteer")}
              icon={<Users className="w-5 h-5" />}
              label="Volunteer"
              iconColor="#38bdf8"
              disabled={loading}
            />
          </div>

          {/* Terms checkbox */}
          <label className="flex items-center gap-2 mt-5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 rounded border-purple-300/50 accent-purple-500 bg-transparent"
            />
            <span className="text-purple-100/90 text-sm">
              I agree to the Terms &amp; Conditions
            </span>
          </label>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-5 py-3 rounded-full font-semibold text-white flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(90deg, #a855f7 0%, #7c3aed 100%)",
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-purple-100/80 text-sm mt-4">
          Already have an account?{" "}
          <button onClick={handleLoginClick} className="text-white font-semibold underline hover:text-purple-200">
            Login here
          </button>
        </p>
      </div>
    </div>
  );
}

function InputField({ icon, placeholder, type = "text", value, onChange, disabled, rightIcon }) {
  return (
    <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2.5 backdrop-blur-sm">
      <span className="text-purple-100/70">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="bg-transparent outline-none text-sm text-white placeholder-purple-100/60 w-full disabled:opacity-50"
      />
      {rightIcon && <span className="text-purple-100/70">{rightIcon}</span>}
    </div>
  );
}

function RoleButton({ active, onClick, icon, label, iconColor, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        active
          ? "bg-white/15 border-purple-200/40"
          : "bg-black/20 border-white/10 hover:bg-white/5"
      }`}
    >
      <span style={{ color: iconColor }}>{icon}</span>
      <span className="text-white text-sm font-medium">{label}</span>
    </button>
  );
}
