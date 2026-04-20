import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { Alert } from "../components/Alert.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatCurrency, formatTokens } from "../utils/format.js";

function submitEsewaForm(action, fields) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

export function LoadWallet() {
  const { user } = useAuth();
  const [amount, setAmount] = useState("1000");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const data = await apiRequest("/payments/esewa/initiate", {
        method: "POST",
        body: { amount: Number(amount) }
      });
      submitEsewaForm(data.gatewayUrl, data.formFields);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const tokens = Number(amount || 0) / 100;

  return (
    <section className="bg-zinc-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase text-emerald-700">Wallet</p>
          <h1 className="mt-2 text-4xl font-black text-zinc-950">Load your balance</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
            Use the eSewa sandbox to add tokens. This flow is for developer testing only.
          </p>
        </div>
        <form className="rounded-md border border-zinc-200 bg-white p-6 shadow-soft" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <Alert>{error}</Alert>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm text-zinc-500">Current wallet</p>
                <p className="mt-2 text-3xl font-black text-zinc-950">{formatTokens(user?.walletBalance)}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm text-zinc-500">NPR equivalent</p>
                <p className="mt-2 text-3xl font-black text-zinc-950">{formatCurrency((user?.walletBalance || 0) * 100)}</p>
              </div>
            </div>
            <label className="form-label">
              Amount to load
              <input
                className="input"
                min="100"
                step="100"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </label>
            <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-950">
              {formatCurrency(amount)} converts to {formatTokens(tokens)}.
            </div>
            <button className="btn-primary w-full" disabled={submitting} type="submit">
              {submitting ? "Redirecting..." : "Continue to eSewa sandbox"}
            </button>
            <p className="text-center text-sm text-zinc-600">
              Test wallet IDs and token `123456` are available in the eSewa sandbox.
            </p>
            <p className="text-center text-sm">
              <Link className="font-semibold text-emerald-700 hover:text-emerald-900" to="/dashboard">
                Back to dashboard
              </Link>
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
