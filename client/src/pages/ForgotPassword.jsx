import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "../components/Alert.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const data = await forgotPassword(email);
      setSuccess(data.devResetUrl ? `${data.message} Development reset link: ${data.devResetUrl}` : data.message);
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
              <p className="text-sm font-bold uppercase text-emerald-700">Password recovery</p>
              <h1 className="mt-2 text-4xl font-black text-zinc-950">Reset your password</h1>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Enter your account email and we will send a reset link that expires in 15 minutes.
              </p>
            </div>
            <Alert>{error}</Alert>
            <Alert type="success">{success}</Alert>
            <label className="form-label">
              Email
              <input className="input" onChange={(event) => setEmail(event.target.value)} type="email" value={email} required />
            </label>
            <button className="btn-primary w-full" disabled={submitting} type="submit">
              {submitting ? "Sending..." : "Send reset link"}
            </button>
            <p className="text-center text-sm">
              <Link className="font-semibold text-emerald-700 hover:text-emerald-900" to="/login">
                Back to login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
