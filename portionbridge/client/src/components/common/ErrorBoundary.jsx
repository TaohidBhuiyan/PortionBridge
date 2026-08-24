import React from "react";

/**
 * Root-level Error Boundary.
 *
 * Catches render/lifecycle errors anywhere below it in the tree and shows a
 * PortionBridge-styled fallback instead of an unrecoverable blank screen.
 * Error Boundaries only catch errors during rendering, in lifecycle methods,
 * and in constructors of the tree below them — they do NOT catch errors in
 * event handlers, async code, or SSR (React limitation, not a gap here).
 *
 * "Try again" resets the boundary's own state so a transient error (e.g. a
 * bad API response that a re-render might not hit again) can recover
 * without a full page reload. "Reload page" is the harder fallback for
 * errors that "Try again" doesn't clear. "Go to dashboard" gives a safe
 * escape route back to a known-good screen instead of a dead end.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.handleRetry = this.handleRetry.bind(this);
    this.handleGoHome = this.handleGoHome.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Dev-mode debugging stays available; production never surfaces the
    // stack trace in the UI (only this console log, same as the server's
    // error handler convention of hiding stacks from the response body).
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleRetry() {
    this.setState({ hasError: false });
  }

  handleGoHome() {
    this.setState({ hasError: false });
    window.location.href = "/";
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--pb-page)",
            padding: "24px",
          }}
        >
          <div
            style={{
              maxWidth: "420px",
              width: "100%",
              background: "var(--pb-surface)",
              border: "1px solid var(--pb-border)",
              borderRadius: "16px",
              padding: "32px",
              textAlign: "center",
              boxShadow: "0 4px 24px rgba(15, 23, 42, 0.06)",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "var(--pb-danger-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--pb-danger)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 9v4M12 17h.01" />
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>

            <h1
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "var(--pb-text-primary)",
                margin: "0 0 8px",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "var(--pb-text-secondary)",
                margin: "0 0 24px",
                lineHeight: 1.5,
              }}
            >
              This page hit an unexpected error. You can try again, or head
              back to your dashboard.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={this.handleRetry}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "1px solid var(--pb-border)",
                  background: "var(--pb-surface)",
                  color: "var(--pb-text-primary)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "var(--pb-primary)",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Go to dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
