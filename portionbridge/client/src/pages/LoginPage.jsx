import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * PortionBridge — Login page
 * Left: purple branding / impact-stats panel.
 * Right: EXACTLY the user-provided Flowbite login card (unmodified styling —
 * bg-white / dark:bg-gray-900 card, its own border/shadow), just wired up
 * with React state + submit handler.
 *
 * Integrated with existing AuthContext and backend authentication API.
 */
export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'donor': return '/donor/dashboard';
      case 'volunteer': return '/volunteer/dashboard';
      case 'leader': return '/leader/dashboard';
      case 'admin': return '/admin/dashboard';
      default: return '/';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password, 'volunteer');

      if (!result.success) {
        setError(result.error || "Login failed. Please try again.");
        return;
      }

      navigate(getDashboardPath());
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
    // TODO: Implement forgot password functionality when backend API is ready
    console.log("Forgot password clicked");
  };

  const handleGoogleClick = () => {
    // TODO: Implement Google OAuth when backend API is ready
    console.log("Google login clicked");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-[1100px] flex flex-col md:flex-row items-stretch gap-6">
        {/* LEFT PANEL — purple branding / impact stats (unchanged) */}
        <div
          className="hidden md:flex flex-1 relative rounded-2xl overflow-hidden flex-col items-center justify-end px-10 py-12 text-center"
          style={{
            background:
              "radial-gradient(ellipse 75% 45% at 50% 2%, #f0e4fb 0%, rgba(240,228,251,0) 65%), linear-gradient(180deg, #b487e8 0%, #9256e0 16%, #7c3aed 32%, #5b21b6 50%, #35127a 68%, #180a35 85%, #050208 100%)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.05]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/></svg>\")",
            }}
          />

          <div className="relative z-10 flex items-center justify-center gap-2 text-white text-sm font-semibold mb-3.5">
            <span className="w-4 h-4 border-2 border-white rounded-full inline-block" />
            PortionBridge
          </div>
          <h1 className="relative z-10 text-white text-2xl font-bold mb-2.5">
            Get Started with Us
          </h1>
          <p className="relative z-10 text-white/65 text-[13.5px] leading-relaxed max-w-[280px] mb-7">
            Bridging Abundance with Those in Need
          </p>

          <div className="relative z-10 w-full max-w-[300px] flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-[10px] bg-white text-[#111] text-[13.5px] font-medium">
              <span className="w-5 h-5 rounded-full bg-[#111] text-white flex items-center justify-center text-[11px] shrink-0">
                🍲
              </span>
              12,500+ meals shared to date
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-[10px] bg-white/[0.08] backdrop-blur-md text-white/55 text-[13.5px] font-medium">
              <span className="w-5 h-5 rounded-full bg-white/15 text-white flex items-center justify-center text-[11px] shrink-0">
                👕
              </span>
              3,200+ clothing items donated
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-[10px] bg-white/[0.08] backdrop-blur-md text-white/55 text-[13.5px] font-medium">
              <span className="w-5 h-5 rounded-full bg-white/15 text-white flex items-center justify-center text-[11px] shrink-0">
                🤝
              </span>
              180+ verified volunteers
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — exact user-provided Flowbite login card */}
        <div className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="flex h-full items-center justify-center">
            <div className="rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900 flex-col flex h-full items-center justify-center sm:px-4">
              <div className="flex h-full flex-col justify-center gap-4 p-10 min-w-[380px]">
                <div className="left-0 right-0 inline-block border-gray-200 px-2 py-2.5 sm:px-4">
                  <form className="flex flex-col gap-4 pb-4" onSubmit={handleSubmit}>
                    <h1 className="mb-4 text-2xl font-bold dark:text-white">Login</h1>

                    {error && (
                      <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                        {error}
                      </div>
                    )}

                    <div>
                      <div className="mb-2">
                        <label
                          className="text-sm font-medium text-gray-900 dark:text-gray-300"
                          htmlFor="email"
                        >
                          Email:
                        </label>
                      </div>
                      <div className="flex w-full rounded-lg pt-1">
                        <div className="relative w-full">
                          <input
                            className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                            id="email"
                            type="email"
                            name="email"
                            placeholder="email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="mb-2">
                        <label
                          className="text-sm font-medium text-gray-900 dark:text-gray-300"
                          htmlFor="password"
                        >
                          Password
                        </label>
                      </div>
                      <div className="flex w-full rounded-lg pt-1">
                        <div className="relative w-full">
                          <input
                            className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                            id="password"
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <p
                        className="mt-2 cursor-pointer text-purple-600 hover:text-purple-700"
                        onClick={handleForgotPasswordClick}
                      >
                        Forgot password?
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="border transition-colors focus:ring-2 p-0.5 disabled:cursor-not-allowed border-transparent bg-gradient-to-r from-purple-400 via-purple-600 to-purple-900 hover:from-purple-500 hover:via-purple-700 hover:to-purple-950 text-white disabled:bg-gray-300 disabled:text-gray-700 rounded-lg"
                      >
                        <span className="flex items-center justify-center gap-1 font-medium py-1 px-2.5 text-base">
                          {loading ? "Logging in..." : "Login"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleGoogleClick}
                        className="transition-colors focus:ring-2 p-0.5 disabled:cursor-not-allowed bg-white hover:bg-gray-100 text-gray-900 border border-gray-200 disabled:bg-gray-300 disabled:text-gray-700 rounded-lg"
                      >
                        <span className="flex items-center justify-center gap-1 font-medium py-1 px-2.5 text-base">
                          <svg
                            stroke="currentColor"
                            fill="currentColor"
                            strokeWidth="0"
                            version="1.1"
                            viewBox="0 0 48 48"
                            height="1em"
                            width="1em"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fill="#FFC107"
                              d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                            />
                            <path
                              fill="#FF3D00"
                              d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                            />
                            <path
                              fill="#4CAF50"
                              d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                            />
                            <path
                              fill="#1976D2"
                              d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                            />
                          </svg>
                          Sign in with Google
                        </span>
                      </button>
                    </div>
                  </form>

                  <div className="min-w-[270px]">
                    <div className="mt-4 text-center dark:text-gray-200">
                      New user?{" "}
                      <a
                        className="text-purple-600 underline hover:text-purple-700"
                        href="/register"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSignupClick();
                        }}
                      >
                        Create account here
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
