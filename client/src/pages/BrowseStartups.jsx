import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client.js";
import { Alert } from "../components/Alert.jsx";
import { Loading } from "../components/Loading.jsx";
import { StartupCard } from "../components/StartupCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORY_OPTIONS, INDUSTRY_OPTIONS, NEPAL_LOCATION_TREE } from "../data/startupMetadata.js";
import { formatCurrency } from "../utils/format.js";

const STAGE_OPTIONS = [
  { label: "All stages", value: "" },
  { label: "Idea", value: "idea" },
  { label: "Prototype", value: "prototype" },
  { label: "Growth", value: "growth" }
];

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Active", value: "active" },
  { label: "Funded", value: "funded" },
  { label: "Closed", value: "closed" },
  { label: "Rejected", value: "rejected" }
];

const SORT_OPTIONS = [
  { label: "Newest first", value: "new" },
  { label: "Most funded", value: "funded" },
  { label: "Fastest growth", value: "growth" }
];

const initialFilters = {
  search: "",
  sort: "new",
  category: "",
  industry: "",
  stage: "",
  status: "",
  province: "",
  district: "",
  city: "",
  minFunding: "",
  maxFunding: "",
  growthRate: 0
};

function FilterLabel({ children, htmlFor }) {
  return (
    <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

function HeroMetric({ label, value, tone = "emerald" }) {
  const toneClass = {
    emerald: "from-emerald-500/20 to-emerald-300/10 text-emerald-50",
    cyan: "from-cyan-500/20 to-cyan-300/10 text-cyan-50",
    amber: "from-amber-400/20 to-amber-200/10 text-amber-50"
  };

  return (
    <div className={`rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))] p-4 backdrop-blur-sm`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">{label}</p>
      <p className={`mt-3 bg-gradient-to-r ${toneClass[tone]} bg-clip-text text-2xl font-black text-transparent`}>{value}</p>
    </div>
  );
}

export function BrowseStartups() {
  const { user } = useAuth();
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false
  });

  const selectedProvince = useMemo(
    () => NEPAL_LOCATION_TREE.find((province) => province.value === filters.province) || null,
    [filters.province]
  );
  const districtOptions = selectedProvince?.districts || [];
  const selectedDistrict = useMemo(
    () => districtOptions.find((district) => district.value === filters.district) || null,
    [districtOptions, filters.district]
  );
  const cityOptions = selectedDistrict?.cities || [];
  const totalRaisedSnapshot = useMemo(
    () =>
      startups.reduce((sum, startup) => {
        const value = Number(startup?.funding?.current || startup?.fundingRaised || startup?.currentFunding || 0);
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0),
    [startups]
  );
  const featuredCategoryCount = useMemo(() => new Set(startups.map((startup) => startup.category).filter(Boolean)).size, [startups]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFilters((current) => (current.search === searchInput ? current : { ...current, search: searchInput }));
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined && !(key === "growthRate" && Number(value) <= 0)) {
        params.set(key, String(value));
      }
    });

    if (user?.role !== "admin") {
      params.delete("status");
    }

    params.set("page", String(page));
    params.set("limit", "4");

    setLoading(true);
    setError("");

    apiRequest(`/startups?${params.toString()}`, {
      signal: controller.signal
    })
      .then((data) => {
        if (!isActive) {
          return;
        }

        setStartups(data.startups || []);
        setPagination(
          data.pagination || {
            page,
            total: (data.startups || []).length,
            totalPages: 1,
            hasPrevPage: false,
            hasNextPage: false
          }
        );
      })
      .catch((err) => {
        if (isActive && err.name !== "AbortError") {
          setError(err.message);
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [filters, page, user?.role]);

  function updateFilters(nextPartial) {
    setFilters((current) => ({ ...current, ...nextPartial }));
    setPage(1);
  }

  function resetFilters() {
    setSearchInput("");
    setFilters(initialFilters);
    setPage(1);
  }

  return (
    <section className="border-b border-zinc-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-[2.2rem] border border-emerald-900/10 bg-[linear-gradient(145deg,#072f2b_0%,#0f5a4d_52%,#14b87e_130%)] p-6 text-white shadow-[0_32px_90px_rgba(6,78,59,0.22)] lg:p-8">
            <div className="pointer-events-none absolute inset-0">
              <img
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.08]"
                src="/nepali-mountain.png"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_24%),linear-gradient(180deg,rgba(4,18,17,0.04),rgba(4,18,17,0.18))]" />
            <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <img
                    alt="NayaShare"
                    className="h-12 w-12 object-contain transition duration-300 hover:-translate-y-1 hover:rotate-[-8deg] hover:scale-110"
                    src="/nayashare-logo.png"
                  />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-100">NayaShare</p>
                    <p className="text-sm text-white/72">A more inviting way to discover startup momentum.</p>
                  </div>
                </div>

                <p className="mt-6 text-sm font-bold uppercase tracking-[0.24em] text-emerald-100">Startup Discovery</p>
                <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                  Nepal’s startup marketplace, made brighter, bolder, and easier to believe in.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-white/76">
                  Explore promising ventures, meet ambitious founders, and move from curiosity to confidence with a marketplace
                  that feels professional, energetic, and genuinely welcoming.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                    href="#startup-marketplace"
                  >
                    Explore live startups
                  </a>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <HeroMetric label="Visible rounds" value={`${pagination.total || startups.length || 0}+`} tone="emerald" />
                  <HeroMetric label="Funding snapshot" value={formatCurrency(totalRaisedSnapshot)} tone="cyan" />
                  <HeroMetric label="Categories moving" value={`${featuredCategoryCount || 0}`} tone="amber" />
                </div>
              </div>

              <div className="relative z-10 flex min-h-[420px] items-center justify-center overflow-hidden p-6">
                <div className="absolute left-8 top-10 h-40 w-40 rounded-full bg-emerald-200/10 blur-3xl" />
                <div className="absolute bottom-8 right-8 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_42%)]" />
                <div className="group relative">
                  <div className="absolute left-[53%] top-[79%] h-8 w-[22%] -translate-x-1/2 rotate-[-10deg] rounded-[999px] bg-zinc-950/40 blur-md" />
                  <div className="absolute left-[53%] top-[83%] h-12 w-[34%] -translate-x-1/2 rotate-[-10deg] rounded-[999px] bg-zinc-950/28 blur-lg" />
                  <div className="absolute left-[53%] top-[88%] h-16 w-[48%] -translate-x-1/2 rotate-[-10deg] rounded-[999px] bg-zinc-950/18 blur-2xl" />
                  <div className="absolute left-[50%] top-[71%] h-32 w-[60%] -translate-x-1/2 rounded-full bg-emerald-300/10 blur-3xl" />
                  <img
                    alt="NayaShare logo"
                    className="relative w-[330px] rotate-[-14deg] object-contain transition duration-500 ease-out group-hover:-translate-y-3 group-hover:rotate-[-18deg] group-hover:scale-105 group-hover:drop-shadow-[0_30px_38px_rgba(0,0,0,0.22)] sm:w-[420px] lg:w-[500px]"
                    src="/nayashare-logo.png"
                  />
                </div>
              </div>
            </div>
          </div>

          <div id="startup-marketplace" className="flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Marketplace search</p>
              <h2 className="mt-3 text-4xl font-black leading-tight text-zinc-950 sm:text-5xl">
                Search promising startups with real filters.
              </h2>
              <p className="mt-3 text-base leading-7 text-zinc-600">
                Explore active rounds, filter by funding, growth, and location, and discover founders across the network.
              </p>
            </div>
            <div className="grid w-full gap-3 lg:max-w-2xl lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-emerald-300">
                <FilterLabel htmlFor="browse-search">Search startups</FilterLabel>
                <input
                  id="browse-search"
                  className="mt-2 w-full border-0 bg-transparent p-0 text-base font-medium text-zinc-950 outline-none placeholder:text-zinc-400"
                  placeholder="Search by startup name or tagline"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-emerald-300">
                <FilterLabel htmlFor="browse-sort">Sort by</FilterLabel>
                <select
                  id="browse-sort"
                  className="mt-2 w-full border-0 bg-transparent p-0 text-base font-medium text-zinc-950 outline-none"
                  value={filters.sort}
                  onChange={(event) => updateFilters({ sort: event.target.value })}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Filters</p>
                  <p className="mt-1 text-sm text-zinc-500">Refine the marketplace in real time.</p>
                </div>
                <button className="text-sm font-semibold text-zinc-500 hover:text-zinc-900" type="button" onClick={resetFilters}>
                  Reset
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <FilterLabel htmlFor="filter-category">Category</FilterLabel>
                  <select
                    id="filter-category"
                    className="input"
                    value={filters.category}
                    onChange={(event) => updateFilters({ category: event.target.value })}
                  >
                    <option value="">All categories</option>
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <FilterLabel htmlFor="filter-industry">Industry</FilterLabel>
                  <select
                    id="filter-industry"
                    className="input"
                    value={filters.industry}
                    onChange={(event) => updateFilters({ industry: event.target.value })}
                  >
                    <option value="">All industries</option>
                    {INDUSTRY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <FilterLabel htmlFor="filter-stage">Stage</FilterLabel>
                  <select
                    id="filter-stage"
                    className="input"
                    value={filters.stage}
                    onChange={(event) => updateFilters({ stage: event.target.value })}
                  >
                    {STAGE_OPTIONS.map((option) => (
                      <option key={option.value || "all"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {user?.role === "admin" && (
                  <div className="space-y-2">
                    <FilterLabel htmlFor="filter-status">Status</FilterLabel>
                    <select
                      id="filter-status"
                      className="input"
                      value={filters.status}
                      onChange={(event) => updateFilters({ status: event.target.value })}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value || "all"} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="space-y-2">
                    <FilterLabel htmlFor="filter-province">Province</FilterLabel>
                    <select
                      id="filter-province"
                      className="input"
                      value={filters.province}
                      onChange={(event) =>
                        updateFilters({
                          province: event.target.value,
                          district: "",
                          city: ""
                        })
                      }
                    >
                      <option value="">All provinces</option>
                      {NEPAL_LOCATION_TREE.map((province) => (
                        <option key={province.value} value={province.value}>
                          {province.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <FilterLabel htmlFor="filter-district">District</FilterLabel>
                    <select
                      id="filter-district"
                      className="input"
                      disabled={!selectedProvince}
                      value={filters.district}
                      onChange={(event) => updateFilters({ district: event.target.value, city: "" })}
                    >
                      <option value="">{selectedProvince ? "All districts" : "Select province first"}</option>
                      {districtOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <FilterLabel htmlFor="filter-city">City</FilterLabel>
                  <select
                    id="filter-city"
                    className="input"
                    disabled={!selectedDistrict}
                    value={filters.city}
                    onChange={(event) => updateFilters({ city: event.target.value })}
                  >
                    <option value="">{selectedDistrict ? "All cities" : "Select district first"}</option>
                    {cityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="space-y-2">
                    <FilterLabel htmlFor="filter-min-funding">Min funding goal</FilterLabel>
                    <input
                      id="filter-min-funding"
                      className="input"
                      type="number"
                      min="0"
                      placeholder="NPR 0"
                      value={filters.minFunding}
                      onChange={(event) => updateFilters({ minFunding: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <FilterLabel htmlFor="filter-max-funding">Max funding goal</FilterLabel>
                    <input
                      id="filter-max-funding"
                      className="input"
                      type="number"
                      min="0"
                      placeholder="Any"
                      value={filters.maxFunding}
                      onChange={(event) => updateFilters({ maxFunding: event.target.value })}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Growth threshold</p>
                      <p className="mt-1 text-sm text-zinc-600">Minimum monthly growth rate.</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-900">
                      {filters.growthRate}%
                    </span>
                  </div>
                  <input
                    className="mt-4 h-2 w-full cursor-pointer accent-emerald-600"
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={filters.growthRate}
                    onChange={(event) => updateFilters({ growthRate: Number(event.target.value) })}
                  />
                </div>
              </div>
            </aside>

            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-zinc-200 bg-white px-5 py-4 shadow-soft">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Results</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {loading ? "Refreshing startups..." : `${pagination.total || 0} startup${pagination.total === 1 ? "" : "s"} found`}
                  </p>
                </div>
                <div className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
              </div>

              <Alert>{error}</Alert>

              {loading ? (
                <Loading label="Loading startups" />
              ) : startups.length ? (
                <>
                  <div className="grid gap-6 md:grid-cols-2">
                    {startups.map((startup) => (
                      <div className="transition duration-300 hover:-translate-y-1" key={startup._id}>
                        <StartupCard startup={startup} />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-zinc-200 bg-white px-5 py-4 shadow-soft">
                    <p className="text-sm text-zinc-500">
                      Showing page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className="btn-secondary"
                        type="button"
                        disabled={!pagination.hasPrevPage || loading}
                        onClick={() => setPage((current) => Math.max(current - 1, 1))}
                      >
                        Prev
                      </button>
                      {Array.from({ length: pagination.totalPages || 1 }, (_, index) => index + 1).map((pageNumber) => (
                        <button
                          key={pageNumber}
                          className={pageNumber === pagination.page ? "btn-primary" : "btn-secondary"}
                          type="button"
                          onClick={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      ))}
                      <button
                        className="btn-secondary"
                        type="button"
                        disabled={!pagination.hasNextPage || loading}
                        onClick={() => setPage((current) => current + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-[2rem] border border-dashed border-zinc-300 bg-white px-8 py-12 text-center shadow-soft">
                  <h2 className="text-2xl font-black text-zinc-950">No startups match these filters</h2>
                  <p className="mt-3 text-zinc-600">Try broadening the search, adjusting funding ranges, or clearing the location filters.</p>
                  <button className="btn-primary mt-6" type="button" onClick={resetFilters}>
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
