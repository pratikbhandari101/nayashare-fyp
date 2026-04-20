import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "../components/Alert.jsx";
import { GoogleAuthButton } from "../components/GoogleAuthButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const authHighlights = [
  {
    title: "Investor-ready discovery",
    description: "Browse vetted startup opportunities, fund faster, and keep your portfolio moving."
  },
  {
    title: "Founder momentum",
    description: "Launch your startup profile, track traction, and present your story with confidence."
  },
  {
    title: "One clean workspace",
    description: "Wallet, performance insights, saved startups, and role-based tools stay in one place."
  }
];

const authStats = [
  { label: "Startup-first", value: "Fast onboarding" },
  { label: "Secure access", value: "Email OTP" },
  { label: "Role based", value: "Investor + Founder" }
];

function SparkIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3 5 6v5c0 4.25 2.8 8.15 7 9 4.2-.85 7-4.75 7-9V6l-7-3Z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function AuthFeature({ title, description, icon }) {
  return (
    <div className="rounded-[26px] border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          {icon}
        </span>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-100">{title}</p>
          <p className="mt-2 text-sm leading-6 text-white/78">{description}</p>
        </div>
      </div>
    </div>
  );
}

function AuthShell({ children, eyebrow, title, description, isRegister }) {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_32%),linear-gradient(180deg,#f8fffc_0%,#eef8f4_48%,#f6fbff_100%)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute right-[-4rem] top-24 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute bottom-[-5rem] left-1/3 h-72 w-72 rounded-full bg-lime-200/20 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative overflow-hidden rounded-[36px] border border-emerald-900/10 bg-[linear-gradient(145deg,#072f2b_0%,#0e5f50_52%,#14b87e_130%)] p-6 text-white shadow-[0_28px_80px_rgba(6,78,59,0.28)] sm:p-8 lg:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.22),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.12),_transparent_28%)]" />
            <div className="relative flex h-full flex-col">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <img alt="NayaShare" className="h-10 w-10 rounded-2xl bg-white object-contain p-1" src="/nayashare-logo.png" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-100">NayaShare</p>
                    <p className="text-sm text-white/70">Startup investing, made inviting.</p>
                  </div>
                </div>
                <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-50 backdrop-blur-sm">
                  {isRegister ? "Create your access" : "Welcome back"}
                </div>
              </div>

              <div className="mt-10 max-w-2xl">
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-100">{eyebrow}</p>
                <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">{title}</h1>
                <p className="mt-5 max-w-xl text-base leading-8 text-white/78">{description}</p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {authStats.map((stat) => (
                  <div key={stat.label} className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">{stat.label}</p>
                    <p className="mt-3 text-lg font-black text-white">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4">
                <AuthFeature icon={<SparkIcon />} title={authHighlights[0].title} description={authHighlights[0].description} />
                <AuthFeature icon={<ArrowIcon />} title={authHighlights[1].title} description={authHighlights[1].description} />
                <AuthFeature icon={<ShieldIcon />} title={authHighlights[2].title} description={authHighlights[2].description} />
              </div>

              <div className="mt-8 rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">Why it feels easy</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm font-semibold text-white">Clear role paths</p>
                    <p className="mt-2 text-sm leading-6 text-white/72">Investors and founders get purpose-built flows from the first screen.</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm font-semibold text-white">Branded and trustworthy</p>
                    <p className="mt-2 text-sm leading-6 text-white/72">The entry experience now feels like a real product, not a placeholder form.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center">{children}</div>
        </div>
      </div>
    </section>
  );
}

function FieldErrorList({ fieldErrors }) {
  if (!fieldErrors.length) {
    return null;
  }

  return (
    <div className="rounded-[24px] border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-900 shadow-sm">
      {fieldErrors.map((item) => (
        <p key={`${item.field}-${item.message}`}>{item.message}</p>
      ))}
    </div>
  );
}

export function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const { googleLogin, login, register, sendVerification, verifyEmail } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "investor",
    gender: "male",
    dateOfBirth: ""
  });
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function navigateAfterLogin(user) {
    navigate(user.role === "investor" ? "/" : "/dashboard");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    setFieldErrors([]);

    try {
      if (isRegister) {
        const data = await register(form);
        setPendingEmail(data.email || form.email);
        setSuccess(data.devOtp ? `${data.message} Development OTP: ${data.devOtp}` : data.message);
        return;
      }

      const user = await login({ email: form.email, password: form.password });
      navigateAfterLogin(user);
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.errors || []);
      if (!isRegister && err.message.toLowerCase().includes("verify")) {
        setPendingEmail(form.email);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    setFieldErrors([]);

    try {
      const user = await verifyEmail({ email: pendingEmail || form.email, otp });
      navigateAfterLogin(user);
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.errors || []);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const data = await sendVerification(pendingEmail || form.email);
      setPendingEmail(data.email || pendingEmail || form.email);
      setSuccess(data.devOtp ? `${data.message} Development OTP: ${data.devOtp}` : data.message);
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.errors || []);
    } finally {
      setSubmitting(false);
    }
  }

  const handleGoogleCredential = useCallback(
    async (credential) => {
      setSubmitting(true);
      setError("");
      setSuccess("");
      setFieldErrors([]);

      try {
        const result = await googleLogin({ credential });
        if (result.needsRoleSelection) {
          const pendingGoogleRegistration = {
            email: result.email,
            name: result.name,
            avatar: result.avatar,
            googleRegistrationToken: result.googleRegistrationToken
          };
          sessionStorage.setItem("pendingGoogleRegistration", JSON.stringify(pendingGoogleRegistration));
          navigate("/select-role", { state: pendingGoogleRegistration });
          return;
        }
        const user = result;
        navigateAfterLogin(user);
      } catch (err) {
        setError(err.message);
        setFieldErrors(err.errors || []);
      } finally {
        setSubmitting(false);
      }
    },
    [googleLogin, navigate]
  );

  if (pendingEmail) {
    return (
      <AuthShell
        eyebrow="Verify your email"
        title="One last step before you enter NayaShare."
        description={`We sent a secure 6-digit OTP to ${pendingEmail}. Enter it below to activate your access and continue into the platform.`}
        isRegister={isRegister}
      >
        <form
          className="w-full rounded-[36px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8"
          onSubmit={handleVerify}
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <ShieldIcon />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Verification</p>
                <h2 className="mt-1 text-3xl font-black text-zinc-950">Enter your OTP</h2>
              </div>
            </div>

            <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-4 text-sm leading-6 text-zinc-700">
              Your verification code was sent to <span className="font-semibold text-zinc-950">{pendingEmail}</span>.
            </div>

            <Alert>{error}</Alert>
            <Alert type="success">{success}</Alert>
            <FieldErrorList fieldErrors={fieldErrors} />

            <label className="block space-y-2 text-sm font-semibold text-zinc-800">
              Verification code
              <input
                className="w-full rounded-[20px] border border-zinc-200 bg-white px-4 py-4 text-center text-2xl font-black tracking-[0.35em] text-zinc-950 outline-none transition placeholder:text-zinc-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                inputMode="numeric"
                maxLength={6}
                minLength={6}
                name="otp"
                onChange={(event) => setOtp(event.target.value)}
                placeholder="123456"
                required
                value={otp}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <button className="btn-primary min-h-[52px] w-full rounded-2xl" disabled={submitting} type="submit">
                {submitting ? "Verifying..." : "Verify email"}
              </button>
              <button className="btn-secondary min-h-[52px] w-full rounded-2xl" disabled={submitting} onClick={handleResend} type="button">
                Resend OTP
              </button>
            </div>

            <button
              className="w-full rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold text-zinc-600 transition hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-950"
              onClick={() => setPendingEmail("")}
              type="button"
            >
              Back to {isRegister ? "registration" : "login"}
            </button>
          </div>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={isRegister ? "Create an account" : "Welcome back"}
      title={isRegister ? "Step into startup investing with energy and clarity." : "Sign in and jump right back into the action."}
      description={
        isRegister
          ? "Create your NayaShare account to explore startups, monitor momentum, and build with a platform designed for both founders and investors."
          : "Access your dashboard, saved startups, wallet activity, and live portfolio tools through a sharper, more polished entry experience."
      }
      isRegister={isRegister}
    >
      <form
        className="w-full rounded-[36px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8"
        onSubmit={handleSubmit}
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">{isRegister ? "Join NayaShare" : "Access your account"}</p>
              <h2 className="mt-2 text-3xl font-black text-zinc-950">{isRegister ? "Create your profile" : "Login to continue"}</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">
                {isRegister
                  ? "Pick your role, set up your details, and get ready to discover or launch startups."
                  : "Use your email or continue with Google for a fast, familiar sign-in flow."}
              </p>
            </div>
            <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 p-1">
              <Link
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  !isRegister ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                }`}
                to="/login"
              >
                Login
              </Link>
              <Link
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isRegister ? "bg-emerald-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                }`}
                to="/register"
              >
                Register
              </Link>
            </div>
          </div>

          <Alert>{error}</Alert>
          <Alert type="success">{success}</Alert>
          <FieldErrorList fieldErrors={fieldErrors} />

          <div className="rounded-[28px] border border-zinc-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Continue instantly</p>
            <GoogleAuthButton disabled={submitting} onCredential={handleGoogleCredential} />
          </div>

          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
            <span className="h-px flex-1 bg-zinc-200" />
            Or continue with email
            <span className="h-px flex-1 bg-zinc-200" />
          </div>

          <div className="grid gap-4">
            {isRegister ? (
              <label className="block space-y-2 text-sm font-semibold text-zinc-800">
                Full name
                <input
                  className="w-full rounded-[18px] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  name="name"
                  onChange={updateField}
                  placeholder="Enter your full name"
                  required
                  value={form.name}
                />
              </label>
            ) : null}

            <div className={`grid gap-4 ${isRegister ? "sm:grid-cols-2" : ""}`}>
              <label className="block space-y-2 text-sm font-semibold text-zinc-800">
                Email
                <input
                  className="w-full rounded-[18px] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  name="email"
                  onChange={updateField}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={form.email}
                />
              </label>

              <label className="block space-y-2 text-sm font-semibold text-zinc-800">
                Password
                <input
                  className="w-full rounded-[18px] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  minLength={6}
                  name="password"
                  onChange={updateField}
                  placeholder={isRegister ? "Create a password" : "Enter your password"}
                  required
                  type="password"
                  value={form.password}
                />
              </label>
            </div>

            {isRegister ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2 text-sm font-semibold text-zinc-800">
                  Gender
                  <select
                    className="w-full rounded-[18px] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    name="gender"
                    onChange={updateField}
                    required
                    value={form.gender}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <label className="block space-y-2 text-sm font-semibold text-zinc-800">
                  Date of birth
                  <input
                    className="w-full rounded-[18px] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    max={new Date().toISOString().split("T")[0]}
                    name="dateOfBirth"
                    onChange={updateField}
                    required
                    type="date"
                    value={form.dateOfBirth}
                  />
                </label>
              </div>
            ) : null}

            {isRegister ? (
              <div className="rounded-[28px] border border-emerald-100 bg-[linear-gradient(180deg,rgba(236,253,245,1),rgba(248,250,252,1))] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Choose your role</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label
                    className={`cursor-pointer rounded-[22px] border p-4 transition ${
                      form.role === "investor" ? "border-emerald-400 bg-white shadow-sm" : "border-zinc-200 bg-white/80 hover:border-zinc-300"
                    }`}
                  >
                    <input checked={form.role === "investor"} className="sr-only" name="role" onChange={updateField} type="radio" value="investor" />
                    <p className="text-sm font-black text-zinc-950">Investor</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">Discover startups, invest with confidence, and track your portfolio over time.</p>
                  </label>
                  <label
                    className={`cursor-pointer rounded-[22px] border p-4 transition ${
                      form.role === "founder" ? "border-cyan-400 bg-white shadow-sm" : "border-zinc-200 bg-white/80 hover:border-zinc-300"
                    }`}
                  >
                    <input checked={form.role === "founder"} className="sr-only" name="role" onChange={updateField} type="radio" value="founder" />
                    <p className="text-sm font-black text-zinc-950">Startup founder</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">Create your startup presence, share traction, and manage funding progress in one dashboard.</p>
                  </label>
                </div>
              </div>
            ) : null}
          </div>

          <button className="btn-primary min-h-[56px] w-full rounded-2xl text-base" disabled={submitting} type="submit">
            {submitting ? "Submitting..." : isRegister ? "Create account" : "Login"}
          </button>

          {!isRegister ? (
            <p className="text-center text-sm">
              <Link className="font-semibold text-emerald-700 hover:text-emerald-900" to="/forgot-password">
                Forgot Password?
              </Link>
            </p>
          ) : null}

          <p className="text-center text-sm text-zinc-600">
            {isRegister ? "Already registered? " : "New here? "}
            <Link className="font-semibold text-emerald-700 hover:text-emerald-900" to={isRegister ? "/login" : "/register"}>
              {isRegister ? "Login" : "Create an account"}
            </Link>
          </p>

        </div>
      </form>
    </AuthShell>
  );
}
