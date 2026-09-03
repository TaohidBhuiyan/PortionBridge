import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { KeyRound } from "lucide-react";
import { Button } from "../components/common/Button";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

/**
 * PortionBridge — Forgot Password page.
 * PHASE 7: restyled onto the sky-blue premium design system (was purple/violet).
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/forgot-password`, { email: email.trim() });
      setSuccess(res.data?.message || "If an account exists, a reset link has been sent.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send reset link right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4 py-6 md:py-10">
      <div className="w-full max-w-[440px] rounded-2xl border border-border bg-surface shadow-pb-elevated p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-dash-primary-soft text-dash-primary">
            <KeyRound size={20} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Forgot Password</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Enter your email and we&apos;ll send a secure reset link.
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
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-text-primary">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-xl border border-border bg-input p-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-dash-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 transition-all"
              placeholder="email@example.com"
              disabled={loading}
            />
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-text-secondary">
          <button type="button" onClick={() => navigate("/login")} className="font-semibold text-dash-primary hover:text-dash-primary-hover">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
