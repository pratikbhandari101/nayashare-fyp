import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { formatCurrency } from "../utils/format.js";
import { getFundingCurrent, getFundingPercent } from "../utils/funding.js";
import { formatStructuredValue } from "../utils/startupMetadata.js";

export function SavedStartupsSection() {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    apiRequest("/startups/saved/me")
      .then((data) => {
        if (isMounted) {
          setStartups(data.startups || []);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="mt-10 rounded-md border border-zinc-200 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-emerald-700">Saved Startups</p>
          <h2 className="mt-2 text-3xl font-black text-zinc-950">Quick access</h2>
        </div>
        <Link className="btn-secondary" to="/">
          Browse
        </Link>
      </div>
      {loading ? (
        <p className="mt-5 text-sm text-zinc-500">Loading saved startups...</p>
      ) : error ? (
        <p className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>
      ) : startups.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {startups.map((startup) => {
            const fundingCurrent = getFundingCurrent(startup);
            const fundingPercent = getFundingPercent(startup);

            return (
            <Link
              key={startup._id}
              className="rounded-md border border-zinc-200 bg-zinc-50 p-4 transition hover:border-emerald-300 hover:bg-white"
              to={`/startups/${startup._id}`}
            >
              <p className="text-xs font-bold uppercase text-cyan-700">{formatStructuredValue(startup.category, "General")}</p>
              <h3 className="mt-2 text-xl font-black text-zinc-950">{startup.name}</h3>
              <p className="mt-2 text-sm text-zinc-600">{startup.description}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-500">
                <span>{formatCurrency(fundingCurrent)} raised</span>
                <span>{fundingPercent}% funded</span>
              </div>
            </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-zinc-500">
          No saved startups yet.
        </div>
      )}
    </section>
  );
}
