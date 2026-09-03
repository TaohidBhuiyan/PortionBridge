import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { KeyRound, Eye, EyeOff, Check } from "lucide-react";
import { Button } from "../components/common/Button";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      // Synchronizing local error state with the URL's token param is a
      // valid effect use case, not the data-fetching pattern this rule targets.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Missing reset token. Please use the link from your email.");
    }
  }, [token]);

  const passwordChecks = useMemo(() => ({
    length: newPassword.length >= 8 && newPassword.length <= 64,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    match: newPassword && confirmPassword && newPassword === confirmPassword,
  }), [newPassword, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Missing reset token. Please use the link from your email.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please complete both password fields.");
      return;
    }

    const checks = Object.values(passwordChecks).slice(0, 5);
    if (checks.some((value) => !value)) {
      setError("Please meet the password requirements below.");
      return;
    }

    if (!passwordChecks.match) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/reset-password/${token}`, { newPassword });
      setSuccess(res.data?.message || "Your password has been reset successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4 py-6 md:py-10">
      <div className="w-full max-w-[460px] rounded-2xl border border-border bg-surface shadow-pb-elevated p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-dash-primary-soft text-dash-primary">
            <KeyRound size={20} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Reset Password</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Create a new password for your PortionBridge account.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-sm text-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-text-primary">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-xl border border-border bg-input p-2.5 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:border-dash-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 transition-all"
                placeholder="Enter a strong password"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-secondary"
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-text-primary">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-xl border border-border bg-input p-2.5 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:border-dash-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 transition-all"
                placeholder="Re-enter password"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-secondary"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {newPassword && (
            <div className="rounded-lg border border-border bg-dash-primary-soft p-3 text-sm text-text-secondary">
              <p className="mb-2 font-semibold text-text-primary">Password requirements</p>
              <div className="grid gap-1 sm:grid-cols-2">
                <div className={`flex items-center gap-1.5 ${passwordChecks.length ? 'text-success' : ''}`}>{passwordChecks.length ? <Check size={13} /> : <span className="w-[13px] inline-block">○</span>} 8-64 characters</div>
                <div className={`flex items-center gap-1.5 ${passwordChecks.uppercase ? 'text-success' : ''}`}>{passwordChecks.uppercase ? <Check size={13} /> : <span className="w-[13px] inline-block">○</span>} Uppercase</div>
                <div className={`flex items-center gap-1.5 ${passwordChecks.lowercase ? 'text-success' : ''}`}>{passwordChecks.lowercase ? <Check size={13} /> : <span className="w-[13px] inline-block">○</span>} Lowercase</div>
                <div className={`flex items-center gap-1.5 ${passwordChecks.number ? 'text-success' : ''}`}>{passwordChecks.number ? <Check size={13} /> : <span className="w-[13px] inline-block">○</span>} Number</div>
                <div className={`flex items-center gap-1.5 ${passwordChecks.special ? 'text-success' : ''}`}>{passwordChecks.special ? <Check size={13} /> : <span className="w-[13px] inline-block">○</span>} Special character</div>
                <div className={`flex items-center gap-1.5 ${passwordChecks.match ? 'text-success' : ''}`}>{passwordChecks.match ? <Check size={13} /> : <span className="w-[13px] inline-block">○</span>} Passwords match</div>
              </div>
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-text-secondary">
          <button type="button" onClick={() => navigate("/login")} className="font-semibold text-dash-primary hover:text-dash-primary-hover">
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}
