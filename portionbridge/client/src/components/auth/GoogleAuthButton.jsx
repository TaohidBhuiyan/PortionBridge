import { useEffect, useState } from "react";

const SCRIPT_ID = "google-gsi-script";

export function GoogleAuthButton({ onSuccess, onError, label = "Continue with Google", disabled = false }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.google?.accounts?.id) {
      // Synchronizing with an external system (the Google script's load
      // state on `window`) is a textbook valid effect use case.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true);
      return undefined;
    }

    const existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => setReady(true));
      return undefined;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setReady(true);
    script.onerror = () => {
      onError?.("Google sign-in is currently unavailable.");
    };

    document.body.appendChild(script);
    return undefined;
  }, [onError]);

  const handleClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const isPlaceholder = typeof clientId === "string" && clientId.includes("your_google") && clientId.includes("googleusercontent.com");

    if (!clientId || isPlaceholder) {
      onError?.("Google OAuth is not configured yet. Add your Google client ID to the client .env file.");
      return;
    }

    if (!window.google?.accounts?.id) {
      onError?.("Google sign-in is currently unavailable.");
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          await onSuccess?.(response.credential);
        } catch (error) {
          onError?.(error?.message || "Google sign-in failed.");
        }
      },
    });

    window.google.accounts.id.prompt();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || !ready}
      className="transition-colors focus:ring-2 p-0.5 disabled:cursor-not-allowed bg-white hover:bg-gray-100 text-gray-900 border border-gray-200 disabled:bg-gray-300 disabled:text-gray-700 rounded-lg"
    >
      <span className="flex items-center justify-center gap-2 font-medium py-2 px-3 text-sm sm:text-base">
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
        {label}
      </span>
    </button>
  );
}