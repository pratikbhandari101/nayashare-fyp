import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { Alert } from "../components/Alert.jsx";
import { Loading } from "../components/Loading.jsx";
import { ProgressBar } from "../components/ProgressBar.jsx";
import { startupImage, formatCurrency } from "../utils/format.js";
import { getFundingCurrent, getFundingPercent } from "../utils/funding.js";
import { formatStructuredValue } from "../utils/startupMetadata.js";

export function SavedStartups() {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionTarget, setActionTarget] = useState("");

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

  async function handleToggleSave(startup) {
    const isSaved = Boolean(startup.isSaved);
    const endpoint = isSaved ? "unsave" : "save";

    setActionTarget(startup._id);
    setError("");
    setSuccess("");

    try {
      const data = await apiRequest(`/startups/${startup._id}/${endpoint}`, {
        method: "POST"
      });

      if (isSaved) {
        setStartups((current) => current.filter((item) => item._id !== startup._id));
      } else {
        setStartups((current) =>
          current.map((item) => (item._id === startup._id ? data.startup : item))
        );
      }

      setSuccess(data.message || (isSaved ? "Startup removed from saved list." : "Startup saved."));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionTarget("");
    }
  }

  return (
    <section className="bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase text-emerald-700">Saved</p>
            <h1 className="mt-2 text-4xl font-black text-zinc-950">Saved startups</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600">
              Revisit the startups you bookmarked and remove them from your saved list when you are done.
            </p>
          </div>
          <Link className="btn-secondary" to="/">
            Browse startups
          </Link>
        </div>

        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>

        {loading ? (
          <Loading label="Loading saved startups" />
        ) : startups.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {startups.map((startup) => {
              const fundingCurrent = getFundingCurrent(startup);
              const fundingPercent = getFundingPercent(startup);

              return (
              <article
                key={startup._id}
                className="flex h-full flex-col overflow-hidden rounded-md border border-zinc-200 bg-white shadow-soft"
              >
                <Link to={`/startups/${startup._id}`}>
                  <img
                    className="aspect-[16/10] w-full object-cover"
                    src={startupImage(startup)}
                    alt={`${startup.name} team`}
                  />
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-semibold uppercase text-cyan-700">
                    {formatStructuredValue(startup.category, "General")}
                  </p>
                  <Link className="mt-2 block" to={`/startups/${startup._id}`}>
                    <h2 className="text-2xl font-black text-zinc-950 hover:text-emerald-700">{startup.name}</h2>
                  </Link>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">{startup.description}</p>

                  <div className="mt-5 space-y-3">
                    <ProgressBar value={fundingPercent} />
                    <div className="flex items-center justify-between text-sm text-zinc-500">
                      <span>{formatCurrency(fundingCurrent)} raised</span>
                      <span>{fundingPercent}% funded</span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link className="btn-secondary" to={`/startups/${startup._id}`}>
                      View
                    </Link>
                    <button
                      className="btn-primary"
                      type="button"
                      disabled={actionTarget === startup._id}
                      onClick={() => handleToggleSave(startup)}
                    >
                      {actionTarget === startup._id ? "Saving..." : startup.isSaved ? "Remove saved" : "Save"}
                    </button>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-zinc-300 bg-white p-8 text-center">
            <h2 className="text-2xl font-bold text-zinc-950">No saved startups yet</h2>
            <p className="mt-2 text-zinc-600">Save startups from the marketplace to keep them handy here.</p>
            <Link className="btn-primary mt-5" to="/">
              Explore startups
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
