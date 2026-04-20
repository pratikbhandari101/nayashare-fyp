import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "../components/Alert.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function LockIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

const securityNotes = [
  "Admin sessions stay in browser session storage and clear when the session ends.",
  "The admin login endpoint now throttles repeated failed attempts.",
  "An optional admin access key can be required server-side for an extra gate."
];

export function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    accessKey: ""
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await adminLogin(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_32%),linear-gradient(180deg,#f7faf9_0%,#edf6f2_52%,#f8fbff_100%)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-4rem] top-12 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute right-[-4rem] top-24 h-72 w-72 rounded-full bg-cyan-200/25 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.02fr_0.98fr]">
          <section className="overflow-hidden rounded-[36px] border border-emerald-900/10 bg-[linear-gradient(145deg,#071f1d_0%,#0c3f38_48%,#0f766e_120%)] p-7 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] sm:p-9">
            <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm w-fit">
              <img alt="NayaShare" className="h-10 w-10 rounded-2xl bg-white object-contain p-1" src="/nayashare-logo.png" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-100">NayaShare</p>
                <p className="text-sm text-white/72">Restricted administrator access</p>
              </div>
            </div>

            <div className="mt-10 max-w-xl">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-100">Private Entry</p>
              <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">Admin access is now quieter and harder to abuse.</h1>
              <p className="mt-5 text-base leading-8 text-white/76">
                This screen is intentionally separated from the normal user flow. Use an approved admin account and, when configured on the server,
                a dedicated access key.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              {securityNotes.map((item) => (
                <div key={item} className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 text-white">
                      <LockIcon />
                    </span>
                    <p className="text-sm leading-6 text-white/78">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <form
            className="w-full rounded-[36px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8"
            onSubmit={handleSubmit}
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <LockIcon />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Admin Portal</p>
                  <h2 className="mt-1 text-3xl font-black text-zinc-950">Sign in to continue</h2>
                </div>
              </div>

              <div className="rounded-[24px] border border-amber-200 bg-amber-50/90 p-4 text-sm leading-6 text-amber-900">
                This page is meant for internal administrators only. Public navigation links to admin access have been removed.
              </div>

              <Alert>{error}</Alert>

              <label className="block space-y-2 text-sm font-semibold text-zinc-800">
                Admin email
                <input
                  className="w-full rounded-[18px] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  name="email"
                  onChange={updateField}
                  placeholder="admin@company.com"
                  required
                  type="email"
                  value={form.email}
                />
              </label>

              <label className="block space-y-2 text-sm font-semibold text-zinc-800">
                Password
                <input
                  className="w-full rounded-[18px] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  name="password"
                  onChange={updateField}
                  placeholder="Enter your admin password"
                  required
                  type="password"
                  value={form.password}
                />
              </label>

              <label className="block space-y-2 text-sm font-semibold text-zinc-800">
                Access key
                <input
                  className="w-full rounded-[18px] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  name="accessKey"
                  onChange={updateField}
                  placeholder="Only needed if your server requires one"
                  type="password"
                  value={form.accessKey}
                />
                <p className="text-xs font-medium text-zinc-500">If `ADMIN_LOGIN_KEY` is configured on the server, this field becomes an extra security gate.</p>
              </label>

              <button className="btn-primary min-h-[56px] w-full rounded-2xl text-base" disabled={submitting} type="submit">
                {submitting ? "Signing in..." : "Login as admin"}
              </button>

              <p className="text-center text-sm">
                <Link className="font-semibold text-emerald-700 hover:text-emerald-900" to="/login">
                  Back to user login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
