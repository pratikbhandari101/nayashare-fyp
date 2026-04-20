import { Link, useSearchParams } from "react-router-dom";

const failureReasons = {
  "missing-data": "The payment provider returned without transaction data.",
  "payment-not-found": "We could not match that payment attempt to your wallet.",
  "verification-failed": "The payment response could not be verified."
};

export function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason") || "";

  return (
    <section className="bg-zinc-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-soft">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-bold uppercase text-rose-700">Wallet</p>
              <h1 className="mt-2 text-4xl font-black text-zinc-950">Payment not completed</h1>
              <p className="mt-3 text-zinc-600">
                {failureReasons[reason] || "The eSewa sandbox payment did not complete, so your wallet balance was unchanged."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="btn-primary" to="/wallet/load">
                Try again
              </Link>
              <Link className="btn-secondary" to="/dashboard">
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
