import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MailCheck, MailWarning, Clock, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "../components/common/Button";
import { useAuth } from "../context/AuthContext";

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * VerifyEmailPage — lands here from the link in the verification email
 * (${CLIENT_URL}/verify-email?token=...). Calls the existing
 * verifyEmail(token) from AuthContext (which already existed but had no
 * page using it) and shows one of four distinct states rather than a
 * single generic "invalid or expired" message — see
 * server/services/auth.service.js#verifyEmail for how the backend now
 * tells these apart.
 */
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth();

  // 'verifying' | 'success' | 'already_verified' | 'expired' | 'invalid'
  const [status, setStatus] = useState("verifying");

  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState("idle"); // idle | sending | sent
  const [resendMessage, setResendMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        if (!cancelled) setStatus("invalid");
        return;
      }

      const result = await verifyEmail(token);
      if (cancelled) return;

      if (result.success) {
        setStatus(result.alreadyVerified ? "already_verified" : "success");
      } else if (result.code === "TOKEN_EXPIRED") {
        setStatus("expired");
      } else {
        setStatus("invalid");
      }
    }

    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- token/verifyEmail are stable for the life of this page
  }, [token]);

  useEffect(() => {
    return () => clearInterval(cooldownRef.current);
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim() || cooldown > 0) return;

    setResendStatus("sending");
    const result = await resendVerification(resendEmail.trim());
    setResendMessage(result.success ? result.message : result.error);
    setResendStatus("sent");
    startCooldown();
  };

  const CONTENT = {
    verifying: {
      icon: Loader2,
      iconClassName: "animate-spin",
      title: "Verifying your email...",
      description: "Just a moment while we confirm your verification link.",
    },
    success: {
      icon: MailCheck,
      title: "Email verified successfully!",
      description: "Your PortionBridge account is now verified.",
      cta: { label: "Continue to Login", onClick: () => navigate("/login") },
    },
    already_verified: {
      icon: MailCheck,
      title: "Your email is already verified.",
      description: "You can go ahead and log in.",
      cta: { label: "Go to Login", onClick: () => navigate("/login") },
    },
    expired: {
      icon: Clock,
      title: "This verification link has expired.",
      description: "Verification links are only valid for a limited time. Request a new one below.",
      showResend: true,
    },
    invalid: {
      icon: ShieldAlert,
      title: "This verification link is invalid.",
      description: "It may have already been used, or the link may be incomplete. Request a new one below.",
      showResend: true,
    },
  };

  const content = CONTENT[status];
  const Icon = content.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4 py-6 md:py-10">
      <div className="w-full max-w-[460px] rounded-2xl border border-border bg-surface shadow-pb-elevated p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-dash-primary-soft text-dash-primary">
            <Icon size={20} className={content.iconClassName} />
          </div>
          <h1 className="text-xl font-bold text-text-primary">{content.title}</h1>
          <p className="mt-2 text-sm text-text-secondary">{content.description}</p>
        </div>

        {content.cta && (
          <Button onClick={content.cta.onClick} className="w-full" size="lg">
            {content.cta.label}
          </Button>
        )}

        {content.showResend && (
          <form onSubmit={handleResend} className="space-y-3">
            <div>
              <label htmlFor="resend-email" className="mb-2 block text-sm font-medium text-text-primary">
                Email address
              </label>
              <input
                id="resend-email"
                type="email"
                required
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={resendStatus === "sending"}
                className="block w-full rounded-xl border border-border bg-input p-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-dash-primary focus:outline-none focus:ring-4 focus:ring-dash-primary/10 transition-all disabled:opacity-60"
              />
            </div>

            {resendMessage && (
              <div className="rounded-lg border border-dash-primary/30 bg-dash-primary-soft px-3 py-2 text-sm text-dash-primary" role="status" aria-live="polite">
                {resendMessage}
              </div>
            )}

            <Button
              type="submit"
              loading={resendStatus === "sending"}
              disabled={cooldown > 0}
              className="w-full"
              size="lg"
            >
              {cooldown > 0 ? `Resend Verification Email (${cooldown}s)` : "Resend Verification Email"}
            </Button>
          </form>
        )}

        {(content.showResend || content.cta) && (
          <div className="mt-6 text-center text-sm text-text-secondary">
            <MailWarning size={14} className="inline mr-1 -mt-0.5" />
            Wrong account?{" "}
            <button type="button" onClick={() => navigate("/login")} className="font-semibold text-dash-primary hover:text-dash-primary-hover">
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
