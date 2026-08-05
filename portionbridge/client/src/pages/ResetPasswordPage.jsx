import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

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
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfe] dark:bg-[#0a0518] px-4 py-6 md:py-10">
      <div className="w-full max-w-[520px] rounded-2xl border border-gray-200 dark:border-purple-950/30 bg-[#faf9fc] dark:bg-[#120721] shadow-2xl p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            🔑
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Create a new password for your PortionBridge account.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-600 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-xl border-2 border-gray-300 bg-gray-50 p-2.5 pr-10 text-sm text-gray-900 focus:border-purple-500 focus:ring-purple-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                placeholder="Enter a strong password"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                onClick={() => setShowNewPassword((prev) => !prev)}
              >
                {showNewPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-xl border-2 border-gray-300 bg-gray-50 p-2.5 pr-10 text-sm text-gray-900 focus:border-purple-500 focus:ring-purple-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                placeholder="Re-enter password"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {newPassword && (
            <div className="rounded-lg border border-purple-100 bg-purple-50/70 p-3 text-sm text-purple-800 dark:border-purple-900/30 dark:bg-purple-950/20 dark:text-purple-200">
              <p className="mb-2 font-semibold">Password requirements</p>
              <div className="grid gap-1 sm:grid-cols-2">
                <div>{passwordChecks.length ? "✓" : "○"} 8-64 characters</div>
                <div>{passwordChecks.uppercase ? "✓" : "○"} Uppercase</div>
                <div>{passwordChecks.lowercase ? "✓" : "○"} Lowercase</div>
                <div>{passwordChecks.number ? "✓" : "○"} Number</div>
                <div>{passwordChecks.special ? "✓" : "○"} Special character</div>
                <div>{passwordChecks.match ? "✓" : "○"} Passwords match</div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border border-transparent bg-gradient-to-r from-purple-400 via-purple-600 to-purple-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-purple-500 hover:via-purple-700 hover:to-purple-950 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
          <button type="button" onClick={() => navigate("/login")} className="font-semibold text-purple-600 hover:text-purple-700">
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}
