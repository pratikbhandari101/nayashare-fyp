import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert } from "../components/Alert.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export function ResetPassword() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const token = searchParams.get("token") || "";

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setSubmitting(false);
      return;
    }

    try {
      const data = await resetPassword({ token, password });
      setSuccess(data.message);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="bg-zinc-50">
      <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-2xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <form className="w-full rounded-md border border-zinc-200 bg-white p-6 shadow-soft" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-bold uppercase text-emerald-700">New password</p>
              <h1 className="mt-2 text-4xl font-black text-zinc-950">Choose a new password</h1>
              <p className="mt-3 text-sm leading-6 text-zinc-600">Use at least 6 characters.</p>
            </div>
            {!token && <Alert>Reset token is missing. Request a new password reset link.</Alert>}
            <Alert>{error}</Alert>
            <Alert type="success">{success}</Alert>
            <label className="form-label">
              New password
              <input
                className="input"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
                required
              />
            </label>
            <label className="form-label">
              Confirm password
              <input
                className="input"
                minLength={6}
                onChange={(event) => setConfirmPassword(event.target.value)}
                type="password"
                value={confirmPassword}
                required
              />
            </label>
            <button className="btn-primary w-full" disabled={submitting || !token} type="submit">
              {submitting ? "Updating..." : "Reset password"}
            </button>
            <p className="text-center text-sm">
              <Link className="font-semibold text-emerald-700 hover:text-emerald-900" to="/forgot-password">
                Request a new link
              </Link>
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
