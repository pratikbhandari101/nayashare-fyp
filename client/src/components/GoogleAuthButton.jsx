import { useEffect, useRef, useState } from "react";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function GoogleGlyph() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M21.6 12.23c0-.68-.06-1.33-.17-1.96H12v3.71h5.39a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.97-4.34 2.97-7.27Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.96-.89 6.62-2.4l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.58-4.12H3.07v2.58A9.99 9.99 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.42 13.93A5.98 5.98 0 0 1 6.1 12c0-.67.11-1.32.32-1.93V7.49H3.07A9.99 9.99 0 0 0 2 12c0 1.61.38 3.13 1.07 4.51l3.35-2.58Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.95c1.47 0 2.8.5 3.84 1.5l2.88-2.88C16.95 2.91 14.7 2 12 2A9.99 9.99 0 0 0 3.07 7.49l3.35 2.58C7.2 7.71 9.4 5.95 12 5.95Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
    </svg>
  );
}

export function GoogleAuthButton({ onCredential, disabled }) {
  const buttonRef = useRef(null);
  const wrapperRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(Boolean(window.google?.accounts?.id));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!googleClientId) {
      return undefined;
    }

    if (window.google?.accounts?.id) {
      setScriptReady(true);
      return undefined;
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');

    if (existingScript) {
      existingScript.addEventListener("load", () => setScriptReady(true), { once: true });
      return undefined;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => setError("Google login could not be loaded.");
    document.body.appendChild(script);

    return undefined;
  }, []);

  useEffect(() => {
    if (!googleClientId || !scriptReady || !buttonRef.current || disabled) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => {
        if (response.credential) {
          onCredential(response.credential);
        }
      }
    });

    const containerWidth = Math.max(Math.floor(wrapperRef.current?.offsetWidth || 320), 240);

    buttonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "filled_blue",
      size: "large",
      shape: "pill",
      text: "continue_with",
      logo_alignment: "left",
      width: containerWidth
    });
  }, [disabled, onCredential, scriptReady]);

  if (!googleClientId) {
    return (
      <p className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Add `VITE_GOOGLE_CLIENT_ID` to enable Google login.
      </p>
    );
  }

  if (error) {
    return <p className="text-sm text-rose-700">{error}</p>;
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-60" : ""}>
      <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-[linear-gradient(135deg,#ffffff_0%,#f3f9ff_55%,#eefbf6_100%)] shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between gap-4 border-b border-zinc-200/70 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
              <GoogleGlyph />
            </span>
            <div>
              <p className="text-sm font-black text-zinc-950">Continue with Google</p>
              <p className="text-xs text-zinc-500">Fast sign-in with a trusted account</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800">
            <SparkleIcon />
            Quick
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <div
            className="rounded-[24px] border border-white/80 bg-white/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
            ref={wrapperRef}
          >
            <div className="flex justify-center" ref={buttonRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
