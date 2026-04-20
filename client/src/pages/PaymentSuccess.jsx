import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert } from "../components/Alert.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatCurrency, formatTokens } from "../utils/format.js";

export function PaymentSuccess() {
  const { refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshProfile()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const amount = Number(searchParams.get("amount") || 0);
  const tokens = Number(searchParams.get("tokens") || 0);

  return (
    <section className="bg-zinc-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-soft">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-bold uppercase text-emerald-700">Wallet</p>
              <h1 className="mt-2 text-4xl font-black text-zinc-950">Balance updated</h1>
              <p className="mt-3 text-zinc-600">Your eSewa sandbox payment completed successfully.</p>
            </div>
            <Alert>{error}</Alert>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md bg-zinc-50 p-4">
                <p className="text-sm text-zinc-500">Loaded amount</p>
                <p className="mt-2 text-2xl font-black text-zinc-950">{formatCurrency(amount)}</p>
              </div>
              <div className="rounded-md bg-zinc-50 p-4">
                <p className="text-sm text-zinc-500">Tokens added</p>
                <p className="mt-2 text-2xl font-black text-zinc-950">{formatTokens(tokens)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="btn-primary" to="/dashboard">
                Go to dashboard
              </Link>
              <Link className="btn-secondary" to="/">
                Browse startups
              </Link>
            </div>
            {loading && <p className="text-sm text-zinc-500">Refreshing wallet balance...</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
