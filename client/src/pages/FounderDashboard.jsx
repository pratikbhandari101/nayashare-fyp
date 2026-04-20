import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { apiRequest } from "../api/client.js";
import { Alert } from "../components/Alert.jsx";
import { ProgressBar } from "../components/ProgressBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatCurrency, formatDate, formatTokens, startupImage, tokensToNpr } from "../utils/format.js";
import { getFundingCurrent, getFundingGoal, getFundingPercent, getRemainingFunding } from "../utils/funding.js";
import { formatStructuredValue } from "../utils/startupMetadata.js";

function shortLabel(value, maxLength = 18) {
  if (!value) {
    return "Untitled";
  }

  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function MetricIcon({ kind }) {
  const common = "h-5 w-5";

  if (kind === "startups") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 7.5h16M7 4h10a1 1 0 0 1 1 1v14l-6-3-6 3V5a1 1 0 0 1 1-1Z" />
      </svg>
    );
  }

  if (kind === "funding") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v18M8 7.5C8 6.119 9.79 5 12 5s4 1.119 4 2.5S14.21 10 12 10s-4 1.119-4 2.5S9.79 15 12 15s4 1.119 4 2.5S14.21 20 12 20s-4-1.119-4-2.5" />
      </svg>
    );
  }

  if (kind === "investors") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM21 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  return (
    <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 12h4l2 7 4-14 2 7h4" />
    </svg>
  );
}

function PortfolioActionIcon({ kind }) {
  const common = "h-4 w-4";

  if (kind === "saved") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3-6 3V5a1 1 0 0 1 1-1Z" />
      </svg>
    );
  }

  return (
    <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MetricCard({ title, value, detail, tone, icon, onClick }) {
  const toneClasses = {
    emerald: "bg-emerald-50 text-emerald-900",
    cyan: "bg-cyan-50 text-cyan-900",
    rose: "bg-rose-50 text-rose-900",
    amber: "bg-amber-50 text-amber-900"
  };

  return (
    <button
      className="group rounded-md border border-zinc-200 bg-white p-5 text-left shadow-soft transition duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
      type="button"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-500">{title}</p>
          <p className="mt-3 text-3xl font-black text-zinc-950">{value}</p>
          <p className="mt-2 text-sm text-zinc-500">{detail}</p>
        </div>
        <span className={`rounded-md p-3 transition group-hover:scale-105 ${toneClasses[tone] || toneClasses.emerald}`}>
          <MetricIcon kind={icon} />
        </span>
      </div>
    </button>
  );
}

function SectionCard({ title, subtitle, children, className = "", headerAction = null }) {
  return (
    <section className={`rounded-md border border-zinc-200 bg-white p-6 shadow-soft ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-emerald-700">{title}</p>
          {subtitle ? <p className="mt-2 text-sm text-zinc-500">{subtitle}</p> : null}
        </div>
        {headerAction}
      </div>
      {children}
    </section>
  );
}

function InsightModal({ title, subtitle, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 px-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(248,250,252,0.98))] p-6 shadow-[0_30px_90px_rgba(15,23,42,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase text-emerald-700">Founder insight</p>
            <h2 className="mt-2 text-3xl font-black text-zinc-950">{title}</h2>
            {subtitle ? <p className="mt-2 text-sm text-zinc-500">{subtitle}</p> : null}
          </div>
          <button className="btn-secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function ChartEmptyState({ label }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500">
      {label}
    </div>
  );
}

const ANALYTICS_PIE_COLORS = ["#10b981", "#06b6d4"];

function AnalyticsTooltip({ active, payload, formatter }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-zinc-950">{item.name}</p>
      <p className="mt-1 text-sm text-zinc-600">{formatter ? formatter(item.value) : item.value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <section className="bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="h-40 rounded-md bg-zinc-200" />
            <div className="h-40 rounded-md bg-zinc-200" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 rounded-md bg-zinc-200" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="h-80 rounded-md bg-zinc-200 xl:col-span-2" />
            <div className="h-80 rounded-md bg-zinc-200" />
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="h-96 rounded-md bg-zinc-200 xl:col-span-2" />
            <div className="h-96 rounded-md bg-zinc-200" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function FounderDashboard() {
  const { user } = useAuth();
  const [startups, setStartups] = useState([]);
  const [investmentsByStartup, setInvestmentsByStartup] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionTarget, setActionTarget] = useState("");
  const [activeInsight, setActiveInsight] = useState("");
  const [portfolioPage, setPortfolioPage] = useState(1);
  const [aiSummary, setAiSummary] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiRequested, setAiRequested] = useState(false);
  const [startupAiSummaries, setStartupAiSummaries] = useState({});
  const [startupAiLoading, setStartupAiLoading] = useState("");
  const portfolioPageSize = 3;
  const startupPreviewLimit = 3;

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const data = await apiRequest("/startups/founder/mine?limit=100");
        const nextStartups = data.startups || [];

        if (!isMounted) {
          return;
        }

        setStartups(nextStartups);

        if (!nextStartups.length) {
          setInvestmentsByStartup({});
          return;
        }

        const investmentResponses = await Promise.all(
          nextStartups.map(async (startup) => {
            try {
              const investmentData = await apiRequest(`/startups/${startup._id}/investments`);
              return [startup._id, investmentData.investments || []];
            } catch {
              return [startup._id, []];
            }
          })
        );

        if (!isMounted) {
          return;
        }

        setInvestmentsByStartup(Object.fromEntries(investmentResponses));
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleDelete(startupId) {
    const confirmed = window.confirm("Delete this startup? This cannot be undone.");

    if (!confirmed) {
      return;
    }

    setActionTarget(startupId);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/startups/${startupId}`, {
        method: "DELETE"
      });
      setStartups((current) => current.filter((startup) => startup._id !== startupId));
      setInvestmentsByStartup((current) => {
        const next = { ...current };
        delete next[startupId];
        return next;
      });
      setSuccess("Startup deleted.");
    } catch (err) {
      setError(err.message);
    } finally {
      setActionTarget("");
    }
  }

  const analytics = useMemo(() => {
    const totalFundingRaised = startups.reduce((sum, startup) => sum + getFundingCurrent(startup), 0);
    const activeStartups = startups.filter((startup) => startup.status === "active").length;
    const allInvestments = Object.entries(investmentsByStartup).flatMap(([startupId, investments]) =>
      investments.map((investment) => ({
        ...investment,
        startupId,
        startupName: startups.find((startup) => startup._id === startupId)?.name || "Startup"
      }))
    );
    const uniqueInvestorIds = new Set(
      allInvestments.map((investment) => investment.investor?._id || investment.investor).filter(Boolean)
    );

    const investorsPerStartup = startups.map((startup) => {
      const uniqueInvestors = new Set(
        (investmentsByStartup[startup._id] || [])
          .map((investment) => investment.investor?._id || investment.investor)
          .filter(Boolean)
      );

      return {
        id: startup._id,
        name: shortLabel(startup.name),
        fullName: startup.name,
        investors: uniqueInvestors.size
      };
    });

    const fundingGrowth = allInvestments
      .slice()
      .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt))
      .reduce((points, investment) => {
        const previous = points[points.length - 1]?.raised || 0;
        points.push({
          date: formatDate(investment.createdAt),
          raised: previous + (investment.amount || 0)
        });
        return points;
      }, []);

    const startupPerformance = startups.map((startup) => {
      const startupInvestments = investmentsByStartup[startup._id] || [];
      const uniqueInvestors = new Set(
        startupInvestments.map((investment) => investment.investor?._id || investment.investor).filter(Boolean)
      );

      return {
        ...startup,
        investorCount: uniqueInvestors.size,
        progress: getFundingPercent(startup)
      };
    });

    return {
      totalFundingRaised,
      activeStartups,
      totalInvestors: uniqueInvestorIds.size,
      investorsPerStartup,
      fundingGrowth,
      startupPerformance
    };
  }, [investmentsByStartup, startups]);

  const fundingBreakdown = useMemo(
    () =>
      analytics.startupPerformance.map((startup) => ({
        id: startup._id,
        name: startup.name,
        raised: getFundingCurrent(startup),
        goal: getFundingGoal(startup),
        investors: startup.investorCount
      })),
    [analytics.startupPerformance]
  );

  const founderAiData = useMemo(() => {
    const rankedStartups = [...analytics.startupPerformance].sort(
      (left, right) => getFundingCurrent(right) - getFundingCurrent(left)
    );

    return {
      summaryType: "founder",
      totalStartups: startups.length,
      activeStartups: analytics.activeStartups,
      totalFundingRaised: analytics.totalFundingRaised,
      totalInvestors: analytics.totalInvestors,
      topStartup: rankedStartups[0]?.name || "No startup yet",
      weakestStartup: rankedStartups[rankedStartups.length - 1]?.name || "No startup yet"
    };
  }, [analytics.activeStartups, analytics.startupPerformance, analytics.totalFundingRaised, analytics.totalInvestors, startups.length]);

  async function handleGenerateAI() {
    if (!founderAiData.totalStartups) {
      setAiRequested(true);
      setAiSummary("Founder insights are currently unavailable. Please try again later.");
      return;
    }

    try {
      setAiRequested(true);
      setLoadingAI(true);
      const data = await apiRequest("/ai/summary", {
        method: "POST",
        body: founderAiData
      });
      setAiSummary(data.summary || "Founder insights are currently unavailable. Please try again later.");
    } catch (err) {
      setAiSummary(err.message || "Founder insights are currently unavailable. Please try again later.");
    } finally {
      setLoadingAI(false);
    }
  }

  async function handleGenerateStartupAI(startup) {
    if (!startup?._id) {
      return;
    }

    const startupInvestments = investmentsByStartup[startup._id] || [];
    const totalInvestmentCount = startupInvestments.length;
    const topBackerAmount = startupInvestments.reduce((largest, investment) => {
      const amount = Number(investment.amount) || 0;
      return amount > largest ? amount : largest;
    }, 0);

    setStartupAiLoading(startup._id);
    setStartupAiSummaries((current) => ({
      ...current,
      [startup._id]: {
        requested: true,
        summary: current[startup._id]?.summary || "",
        error: ""
      }
    }));

    try {
      const data = await apiRequest("/ai/summary", {
        method: "POST",
        body: {
          summaryType: "founder-startup-analytics",
          startupName: startup.name,
          category: formatStructuredValue(startup.category, "General"),
          status: startup.status || "pending",
          totalRaised: getFundingCurrent(startup),
          fundingGoal: getFundingGoal(startup),
          fundingPercent: getFundingPercent(startup),
          remainingFunding: getRemainingFunding(startup),
          totalInvestors: startup.investorCount || 0,
          totalInvestments: totalInvestmentCount,
          topBackerAmount,
          lastUpdated: startup.updatedAt || startup.createdAt
        }
      });

      setStartupAiSummaries((current) => ({
        ...current,
        [startup._id]: {
          requested: true,
          summary:
            data.summary ||
            "AI insights are currently unavailable for this startup. The dashboard metrics above still reflect the latest live data.",
          error: ""
        }
      }));
    } catch (err) {
      setStartupAiSummaries((current) => ({
        ...current,
        [startup._id]: {
          requested: true,
          summary:
            "AI insights are currently unavailable for this startup. The dashboard metrics above still reflect the latest live data.",
          error: err.message || "AI insights are currently unavailable for this startup."
        }
      }));
    } finally {
      setStartupAiLoading("");
    }
  }

  const portfolioPagination = useMemo(() => {
    const totalPages = Math.max(Math.ceil(startups.length / portfolioPageSize), 1);
    const page = Math.min(portfolioPage, totalPages);
    const startIndex = (page - 1) * portfolioPageSize;

    return {
      page,
      totalPages,
      items: startups.slice(startIndex, startIndex + portfolioPageSize)
    };
  }, [portfolioPage, startups]);

  const modalContent = useMemo(() => {
    if (activeInsight === "startups") {
      return {
        title: "Startup portfolio",
        subtitle: "Every startup you have created, with current status and funding progress.",
        body: (
          <div className="grid gap-4">
            {analytics.startupPerformance.map((startup) => (
              <Link
                key={startup._id}
                className="rounded-md border border-zinc-200 bg-zinc-50 p-4 transition hover:border-emerald-300 hover:bg-white"
                to={`/startups/${startup._id}`}
                onClick={() => setActiveInsight("")}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-zinc-950">{startup.name}</p>
                    <p className="text-sm text-zinc-500">{formatStructuredValue(startup.category, "General")}</p>
                  </div>
                  <span className="rounded-md bg-zinc-100 px-3 py-2 text-xs font-bold uppercase text-zinc-700">
                    {startup.status || "pending"}
                  </span>
                </div>
                <div className="mt-4">
                  <ProgressBar value={startup.progress} />
                </div>
              </Link>
            ))}
          </div>
        )
      };
    }

    if (activeInsight === "funding") {
      return {
        title: "Funding breakdown",
        subtitle: "Raised amounts and goals across all founder startups.",
        body: (
          <div className="space-y-4">
            {fundingBreakdown.map((startup) => (
              <div key={startup.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-zinc-950">{startup.name}</p>
                    <p className="text-sm text-zinc-500">{startup.investors} investors</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-zinc-950">{formatCurrency(startup.raised)}</p>
                    <p className="text-sm text-zinc-500">Goal {formatCurrency(startup.goal)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      };
    }

    if (activeInsight === "investors") {
      return {
        title: "Investor reach",
        subtitle: "Unique investor count across your startups and per-startup engagement.",
        body: (
          <div className="grid gap-4">
            {analytics.investorsPerStartup.map((item) => (
              <div key={item.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-zinc-950">{item.fullName}</p>
                  <p className="text-lg font-black text-zinc-950">{item.investors}</p>
                </div>
              </div>
            ))}
          </div>
        )
      };
    }

    if (activeInsight === "active") {
      return {
        title: "Active startups",
        subtitle: "Startups currently live in the marketplace.",
        body: (
          <div className="grid gap-4">
            {analytics.startupPerformance.filter((startup) => startup.status === "active").map((startup) => (
              <Link
                key={startup._id}
                className="rounded-md border border-zinc-200 bg-zinc-50 p-4 transition hover:border-emerald-300 hover:bg-white"
                to={`/startups/${startup._id}`}
                onClick={() => setActiveInsight("")}
              >
                <p className="font-black text-zinc-950">{startup.name}</p>
                <p className="mt-1 text-sm text-zinc-500">{startup.progress}% funded</p>
              </Link>
            ))}
            {!analytics.startupPerformance.some((startup) => startup.status === "active") && (
              <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-zinc-500">
                No active startups yet.
              </div>
            )}
          </div>
        )
      };
    }

    if (activeInsight === "funding-progress") {
      return {
        title: "Funding progress",
        subtitle: "Full funding progress across all your startups.",
        body: (
          <div className="space-y-4">
            {analytics.startupPerformance.map((startup) => (
              <div key={startup._id} className="rounded-[22px] border border-zinc-200 bg-zinc-50/90 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-zinc-950">{startup.name}</p>
                    <p className="text-sm text-zinc-500">
                      {formatCurrency(getFundingCurrent(startup))} of {formatCurrency(getFundingGoal(startup))}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-700">{startup.progress}% funded</p>
                </div>
                <div className="mt-3">
                  <ProgressBar value={startup.progress} />
                </div>
              </div>
            ))}
          </div>
        )
      };
    }

    if (activeInsight === "startup-overview") {
      return {
        title: "Startup overview",
        subtitle: "Full startup list with status and funding pace.",
        body: (
          <div className="space-y-3">
            {analytics.startupPerformance.map((startup) => (
              <Link
                key={startup._id}
                className="block rounded-[22px] border border-zinc-200 bg-zinc-50/90 p-5 transition hover:border-emerald-300 hover:bg-white"
                to={`/startups/${startup._id}`}
                onClick={() => setActiveInsight("")}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-zinc-950">{startup.name}</p>
                    <p className="text-sm text-zinc-500">{startup.progress}% funded</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-2 text-xs font-bold uppercase text-zinc-700 shadow-sm">
                    {startup.status || "pending"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )
      };
    }

    if (activeInsight.startsWith("analytics:")) {
      const startupId = activeInsight.split(":")[1];
      const startup = analytics.startupPerformance.find((item) => item._id === startupId);

      if (!startup) {
        return null;
      }

      const startupInvestments = investmentsByStartup[startupId] || [];
      const totalRaised = getFundingCurrent(startup);
      const goal = getFundingGoal(startup);
      const remaining = getRemainingFunding(startup);
      const aiState = startupAiSummaries[startupId] || { requested: false, summary: "", error: "" };
      const topBackerAmount = startupInvestments.reduce((largest, investment) => {
        const amount = Number(investment.amount) || 0;
        return amount > largest ? amount : largest;
      }, 0);
      const fundingPieData = [
        { name: "Raised", value: totalRaised },
        { name: "Remaining", value: Math.max(remaining, 0) }
      ].filter((item) => item.value > 0);
      const analyticsBarData = [
        { name: "Raised", amount: totalRaised },
        { name: "Remaining", amount: Math.max(remaining, 0) },
        { name: "Goal", amount: goal },
        { name: "Top backer", amount: topBackerAmount }
      ];

      return {
        title: `${startup.name} analytics`,
        subtitle: "A polished snapshot of funding health, backer momentum, and AI-assisted founder insight.",
        body: (
          <div className="space-y-5">
            <section className="rounded-[26px] border border-white/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(239,246,255,0.9))] p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">AI Feature</p>
                  <h3 className="mt-2 text-2xl font-black text-zinc-950">Founder insight request</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600">
                    Request an AI summary for this startup when you need it. If AI is unavailable, a graceful fallback message keeps the
                    panel usable.
                  </p>
                </div>
                <button
                  className="btn-primary"
                  type="button"
                  disabled={startupAiLoading === startupId}
                  onClick={() => handleGenerateStartupAI(startup)}
                >
                  {startupAiLoading === startupId ? "Requesting..." : aiState.requested ? "Request Again" : "Request Insight"}
                </button>
              </div>
              <div className="mt-4 rounded-[22px] border border-white/80 bg-white/85 p-4">
                {aiState.summary ? (
                  <div className="whitespace-pre-line text-[15px] leading-8 text-zinc-700">{aiState.summary}</div>
                ) : (
                  <p className="text-sm leading-7 text-zinc-500">
                    Click <span className="font-semibold text-zinc-700">Request Insight</span> to generate an AI summary for this startup.
                    If the AI service is temporarily unavailable, you will see a fallback message here instead.
                  </p>
                )}
              </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-[1.05fr_1.25fr]">
              <div className="rounded-[26px] border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">Funding Mix</p>
                  <p className="mt-2 text-sm text-zinc-500">Raised versus remaining capital to goal.</p>
                </div>
                {fundingPieData.length ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={fundingPieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={4}
                        >
                          {fundingPieData.map((entry, index) => (
                            <Cell key={entry.name} fill={ANALYTICS_PIE_COLORS[index % ANALYTICS_PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<AnalyticsTooltip formatter={(value) => formatCurrency(value)} />} />
                        <Legend verticalAlign="bottom" iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <ChartEmptyState label="Funding allocation appears after a funding goal is available." />
                )}
              </div>

              <div className="rounded-[26px] border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">Vital Metrics</p>
                  <p className="mt-2 text-sm text-zinc-500">Key funding amounts presented as a multi-bar startup snapshot.</p>
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsBarData} barCategoryGap={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#71717a", fontSize: 12 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                      <Tooltip content={<AnalyticsTooltip formatter={(value) => formatCurrency(value)} />} />
                      <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
                        {analyticsBarData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={["#10b981", "#f59e0b", "#06b6d4", "#0f766e"][index % 4]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Raised</p>
                <p className="mt-2 text-2xl font-black text-zinc-950">{formatCurrency(totalRaised)}</p>
              </div>
              <div className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Goal</p>
                <p className="mt-2 text-2xl font-black text-zinc-950">{formatCurrency(goal)}</p>
              </div>
              <div className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Funded</p>
                <p className="mt-2 text-2xl font-black text-zinc-950">{getFundingPercent(startup)}%</p>
              </div>
              <div className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Remaining</p>
                <p className="mt-2 text-2xl font-black text-zinc-950">{formatCurrency(remaining)}</p>
              </div>
              <div className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Investors</p>
                <p className="mt-2 text-2xl font-black text-zinc-950">{startup.investorCount}</p>
              </div>
              <div className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Updated</p>
                <p className="mt-2 text-2xl font-black text-zinc-950">{formatDate(startup.updatedAt || startup.createdAt)}</p>
              </div>
            </div>

            <div className="rounded-[26px] border border-zinc-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,253,250,0.95))] p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">Top Backer</p>
                  <p className="mt-2 text-sm text-zinc-500">Largest single investment received so far, shown without investor identity.</p>
                </div>
                <div className="rounded-[22px] bg-white px-5 py-4 text-right shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Amount Invested</p>
                  <p className="mt-2 text-3xl font-black text-zinc-950">{formatCurrency(topBackerAmount)}</p>
                </div>
              </div>
              {topBackerAmount <= 0 ? (
                <p className="mt-4 text-sm text-zinc-500">No investment has been recorded yet, so the top backer amount will appear here later.</p>
              ) : null}
            </div>
          </div>
        )
      };
    }

    return null;
  }, [activeInsight, analytics.investorsPerStartup, analytics.startupPerformance, fundingBreakdown, investmentsByStartup, startupAiLoading, startupAiSummaries]);

  const startupPreview = analytics.startupPerformance.slice(0, startupPreviewLimit);
  const hasMoreStartups = analytics.startupPerformance.length > startupPreviewLimit;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <section className="bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-md border border-zinc-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-bold uppercase text-emerald-700">Founder dashboard</p>
            <h1 className="mt-2 text-4xl font-black text-zinc-950">Your startup portfolio</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
              Track startup performance, investor momentum, and funding progress from one place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="btn-secondary" to="/wallet/load">
                Load Wallet
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-100"
                to="/saved-startups"
              >
                <PortfolioActionIcon kind="saved" />
                <span>Saved Startups</span>
              </Link>
              <Link className="btn-primary" to="/create-startup">
                Create Startup
              </Link>
            </div>
          </section>
          <section className="rounded-md border border-zinc-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-bold uppercase text-cyan-700">Wallet snapshot</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-md bg-zinc-50 p-4">
                <p className="text-sm text-zinc-500">Tokens</p>
                <p className="mt-2 text-3xl font-black text-zinc-950">{formatTokens(user?.walletBalance)}</p>
              </div>
              <div className="rounded-md bg-zinc-50 p-4">
                <p className="text-sm text-zinc-500">Balance</p>
                <p className="mt-2 text-3xl font-black text-zinc-950">{formatCurrency(tokensToNpr(user?.walletBalance))}</p>
              </div>
            </div>
          </section>
        </div>

        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Startups Created"
            value={startups.length}
            detail="All startups created from this founder account"
            tone="emerald"
            icon="startups"
            onClick={() => setActiveInsight("startups")}
          />
          <MetricCard
            title="Total Funding Raised"
            value={formatCurrency(analytics.totalFundingRaised)}
            detail="Combined raised amount across all startups"
            tone="cyan"
            icon="funding"
            onClick={() => setActiveInsight("funding")}
          />
          <MetricCard
            title="Total Investors"
            value={analytics.totalInvestors}
            detail="Unique investors across every founder startup"
            tone="rose"
            icon="investors"
            onClick={() => setActiveInsight("investors")}
          />
          <MetricCard
            title="Active Startups"
            value={analytics.activeStartups}
            detail="Currently visible in the public marketplace"
            tone="amber"
            icon="active"
            onClick={() => setActiveInsight("active")}
          />
        </div>

        <section className="mt-6 overflow-hidden rounded-[30px] border border-zinc-200 bg-[linear-gradient(130deg,rgba(12,74,110,0.05),rgba(255,255,255,0.94)_40%,rgba(236,253,245,0.96)_100%)] shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="border-b border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.96),rgba(239,246,255,0.92))] px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button className="btn-primary" type="button" disabled={loadingAI} onClick={handleGenerateAI}>
                  {loadingAI ? "Generating..." : aiRequested ? "Refresh Insights" : "Generate Insights"}
                </button>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-zinc-950">AI Founder Insights</h2>
                  <p className="mt-1 text-sm text-zinc-500">Generate an AI summary of startup traction, funding momentum, and portfolio risk.</p>
                </div>
              </div>
              <span className="rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                AI-generated
              </span>
            </div>
          </div>
          <div className="px-6 py-6">
            {loadingAI ? (
              <div className="space-y-3">
                <div className="h-4 w-40 animate-pulse rounded bg-zinc-200" />
                <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
                <div className="h-4 w-10/12 animate-pulse rounded bg-zinc-100" />
                <div className="h-4 w-11/12 animate-pulse rounded bg-zinc-100" />
              </div>
            ) : aiSummary ? (
              <div className="whitespace-pre-line text-[15px] leading-8 text-zinc-700">{aiSummary}</div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-zinc-300 bg-white/70 px-5 py-6 text-sm leading-7 text-zinc-500">
                Click <span className="font-semibold text-zinc-700">Generate Insights</span> to create a fresh AI summary of your founder dashboard.
              </div>
            )}
          </div>
        </section>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <SectionCard
            title="Funding Growth"
            subtitle="Cumulative funding over time based on real investment records."
            className="xl:col-span-2"
          >
            {analytics.fundingGrowth.length ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.fundingGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#71717a", fontSize: 12 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="raised" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmptyState label="Funding growth will appear after the first investment arrives." />
            )}
          </SectionCard>

          <SectionCard title="Investors per Startup" subtitle="Unique investor count for each startup.">
            {analytics.investorsPerStartup.length ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.investorsPerStartup}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: "#71717a", fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="investors" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmptyState label="Investor distribution appears once your startups receive backing." />
            )}
          </SectionCard>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <SectionCard
            title="Funding Progress"
            subtitle="Per-startup progress toward funding goals."
            className="xl:col-span-2"
            headerAction={
              hasMoreStartups ? (
                <button
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                  type="button"
                  onClick={() => setActiveInsight("funding-progress")}
                >
                  View more
                </button>
              ) : null
            }
          >
            {analytics.startupPerformance.length ? (
              <div className="space-y-4">
                {startupPreview.map((startup) => (
                  <div key={startup._id} className="rounded-[22px] bg-zinc-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-zinc-950">{startup.name}</p>
                        <p className="text-sm text-zinc-500">
                          {formatCurrency(getFundingCurrent(startup))} of {formatCurrency(getFundingGoal(startup))}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-zinc-700">{startup.progress}% funded</p>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={startup.progress} />
                    </div>
                  </div>
                ))}
                {hasMoreStartups ? (
                  <div className="rounded-[22px] border border-dashed border-zinc-300 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-500">
                    Showing {startupPreview.length} of {analytics.startupPerformance.length} startups.
                  </div>
                ) : null}
              </div>
            ) : (
              <ChartEmptyState label="Funding progress will show up after your first startup is created." />
            )}
          </SectionCard>

          <SectionCard
            title="Startup Overview"
            subtitle="Status and funding pace across your startups."
            headerAction={
              hasMoreStartups ? (
                <button
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                  type="button"
                  onClick={() => setActiveInsight("startup-overview")}
                >
                  View more
                </button>
              ) : null
            }
          >
            {analytics.startupPerformance.length ? (
              <div className="space-y-3">
                {startupPreview.map((startup) => (
                  <Link
                    key={startup._id}
                    className="block rounded-[22px] border border-zinc-200 bg-zinc-50 p-4 transition hover:border-emerald-300 hover:bg-white"
                    to={`/startups/${startup._id}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-zinc-950">{startup.name}</p>
                        <p className="text-sm text-zinc-500">{startup.progress}% funded</p>
                      </div>
                      <span className="rounded-md bg-white px-3 py-2 text-xs font-bold uppercase text-zinc-700">
                        {startup.status || "pending"}
                      </span>
                    </div>
                  </Link>
                ))}
                {hasMoreStartups ? (
                  <div className="rounded-[22px] border border-dashed border-zinc-300 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-500">
                    Showing {startupPreview.length} of {analytics.startupPerformance.length} startups.
                  </div>
                ) : null}
              </div>
            ) : (
              <ChartEmptyState label="Startup metrics will appear once startups are available." />
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Startup Portfolio"
          subtitle="Interactive startup cards with funding progress, status, and pending-state actions."
          className="mt-4"
        >
          {startups.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {portfolioPagination.items.map((startup) => {
                const investorCount = new Set(
                  (investmentsByStartup[startup._id] || [])
                    .map((investment) => investment.investor?._id || investment.investor)
                    .filter(Boolean)
                ).size;
                const fundingCurrent = getFundingCurrent(startup);
                const fundingGoal = getFundingGoal(startup);
                const fundingPercent = getFundingPercent(startup);

                return (
                  <article
                    className="group overflow-hidden rounded-[28px] border border-zinc-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,247,245,0.98))] p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl"
                    key={startup._id}
                  >
                    <div className="flex h-full flex-col gap-4">
                      <img
                        className="aspect-[16/10] w-full rounded-[22px] object-cover"
                        src={startupImage(startup)}
                        alt={`${startup.name} team`}
                      />
                      <div className="flex min-w-0 flex-1 flex-col space-y-4">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-700">
                              {formatStructuredValue(startup.category, "General")}
                            </p>
                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase text-zinc-700 shadow-sm">
                              {startup.status || "pending"}
                            </span>
                          </div>
                          <Link className="mt-3 block text-2xl font-black leading-tight text-zinc-950 transition group-hover:text-emerald-700" to={`/startups/${startup._id}`}>
                            {startup.name}
                          </Link>
                          <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-zinc-600">
                            {startup.basicInfo?.tagline || startup.tagline || startup.description || "No description added yet."}
                          </p>
                        </div>
                        <div className="rounded-[22px] bg-white/80 p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Funding Progress</p>
                            <p className="text-sm font-semibold text-zinc-700">{fundingPercent}% funded</p>
                          </div>
                          <ProgressBar value={fundingPercent} />
                        </div>
                        <div className="grid flex-1 grid-cols-2 gap-3">
                          <div className="rounded-[20px] bg-white p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Raised</p>
                            <p className="mt-2 text-base font-semibold text-zinc-950">{formatCurrency(fundingCurrent)}</p>
                          </div>
                          <div className="rounded-[20px] bg-white p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Goal</p>
                            <p className="mt-2 text-base font-semibold text-zinc-950">{formatCurrency(fundingGoal)}</p>
                          </div>
                          <div className="rounded-[20px] bg-white p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Investors</p>
                            <p className="mt-2 text-base font-semibold text-zinc-950">{investorCount}</p>
                          </div>
                          <div className="rounded-[20px] bg-white p-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Updated</p>
                            <p className="mt-2 text-base font-semibold text-zinc-950">{formatDate(startup.updatedAt || startup.createdAt)}</p>
                          </div>
                        </div>
                        <div className="mt-auto flex flex-wrap gap-3 border-t border-zinc-200/80 pt-4">
                          <Link className="btn-secondary flex-1 justify-center text-center" to={`/startups/${startup._id}`}>
                            View Details
                          </Link>
                          <Link className="btn-secondary flex-1 justify-center text-center" to={`/startups/${startup._id}/edit`}>
                            Edit Startup
                          </Link>
                          <button
                            className="btn-primary w-full justify-center"
                            type="button"
                            onClick={() => setActiveInsight(`analytics:${startup._id}`)}
                          >
                            View Analytics
                          </button>
                          {startup.status === "pending" ? (
                            <button
                              className="btn-secondary w-full justify-center"
                              type="button"
                              disabled={actionTarget === startup._id}
                              onClick={() => handleDelete(startup._id)}
                            >
                              {actionTarget === startup._id ? "Deleting..." : "Delete"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
              <h2 className="text-2xl font-bold text-zinc-950">No startups yet</h2>
              <p className="mt-2 text-zinc-600">Create your first startup profile to start collecting investments.</p>
              <Link className="btn-primary mt-5" to="/create-startup">
                Create Startup
              </Link>
            </div>
          )}
          {startups.length > portfolioPageSize ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 pt-5">
              <p className="text-sm text-zinc-500">
                Page {portfolioPagination.page} of {portfolioPagination.totalPages} | {startups.length} startups total
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button className="btn-secondary" type="button" disabled={portfolioPagination.page === 1} onClick={() => setPortfolioPage((current) => Math.max(current - 1, 1))}>
                  Prev
                </button>
                {Array.from({ length: portfolioPagination.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    className={pageNumber === portfolioPagination.page ? "btn-primary" : "btn-secondary"}
                    type="button"
                    onClick={() => setPortfolioPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button className="btn-secondary" type="button" disabled={portfolioPagination.page === portfolioPagination.totalPages} onClick={() => setPortfolioPage((current) => Math.min(current + 1, portfolioPagination.totalPages))}>
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </SectionCard>

      </div>

      {modalContent ? (
        <InsightModal title={modalContent.title} subtitle={modalContent.subtitle} onClose={() => setActiveInsight("")}>
          {modalContent.body}
        </InsightModal>
      ) : null}
    </section>
  );
}
