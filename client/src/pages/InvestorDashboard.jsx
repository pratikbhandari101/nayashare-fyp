import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { apiRequest } from "../api/client.js";
import { Alert } from "../components/Alert.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatCurrency, formatDate, formatTokens, startupImage, tokensToNpr } from "../utils/format.js";
import { formatStructuredValue } from "../utils/startupMetadata.js";

const CHART_COLORS = ["#0f766e", "#f97316", "#0ea5e9", "#eab308", "#ec4899", "#8b5cf6", "#22c55e"];

function formatAxisCurrency(value) {
  if (Math.abs(value) >= 1000000) {
    return `${Math.round(value / 100000) / 10}M`;
  }

  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 100) / 10}k`;
  }

  return `${Math.round(value)}`;
}

function formatChartDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

function MetricCard({ title, value, detail, tone = "zinc", onClick }) {
  const toneClasses = {
    zinc: "border-zinc-200 bg-white text-zinc-950",
    emerald: "border-emerald-200 bg-[linear-gradient(140deg,#ecfdf5,white)] text-emerald-950",
    rose: "border-rose-200 bg-[linear-gradient(140deg,#fff1f2,white)] text-rose-950"
  };

  const Component = onClick ? "button" : "section";

  return (
    <Component
      className={`rounded-md border p-5 shadow-soft transition duration-300 ${toneClasses[tone] || toneClasses.zinc} ${onClick ? "text-left hover:-translate-y-1 hover:shadow-lg" : ""}`}
      type={onClick ? "button" : undefined}
      onClick={onClick}
    >
      <p className="text-sm font-semibold text-zinc-500">{title}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
      <p className="mt-2 text-sm text-zinc-500">{detail}</p>
    </Component>
  );
}

function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <section className={`rounded-[28px] border border-zinc-200 bg-[radial-gradient(circle_at_top_left,#ffffff,rgba(236,253,245,0.75))] p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lg ${className}`}>
      <div className="mb-5">
        <p className="text-sm font-bold uppercase text-emerald-700">{title}</p>
        <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function ChartEmptyState({ label }) {
  return (
    <div className="flex h-[320px] items-center justify-center rounded-[22px] border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500">
      {label}
    </div>
  );
}

function InvestmentCard({ investment, exitTarget, onExit, exited = false }) {
  const startup = investment.startupId || investment.startup;

  return (
    <article className="rounded-md border border-zinc-200 bg-white p-5 shadow-soft">
      <div className="grid gap-5 md:grid-cols-[180px_1fr_auto] md:items-center">
        <img
          className="aspect-[16/10] w-full rounded-md object-cover"
          src={startupImage(startup)}
          alt={`${startup?.name || "Startup"} team`}
        />
        <div className="min-w-0 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase text-cyan-700">
              {formatStructuredValue(startup?.category, "General")}
            </p>
            <Link className="text-2xl font-black text-zinc-950 hover:text-emerald-700" to={`/startups/${startup?._id}`}>
              {startup?.name || "Startup removed"}
            </Link>
            <p className="mt-1 text-sm text-zinc-500">
              {exited
                ? `Exited on ${formatDate(investment?.exitedAt)}`
                : `Invested on ${formatDate(investment?.createdAt)}`}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-zinc-50 p-3">
              <p className="text-xs font-bold uppercase text-zinc-500">Invested</p>
              <p className="mt-2 font-semibold text-zinc-950">{formatCurrency(investment.amount)}</p>
            </div>
            <div className="rounded-md bg-zinc-50 p-3">
              <p className="text-xs font-bold uppercase text-zinc-500">{exited ? "Returned" : "Current value"}</p>
              <p className="mt-2 font-semibold text-zinc-950">
                {formatCurrency(exited ? investment.returnedAmount || investment.currentValue : investment.currentValue)}
              </p>
            </div>
            <div className="rounded-md bg-zinc-50 p-3">
              <p className="text-xs font-bold uppercase text-zinc-500">Profit / Loss</p>
              <p className={`mt-2 font-semibold ${investment.profitLoss >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {investment.profitLoss >= 0 ? "+" : ""}
                {formatCurrency(investment.profitLoss)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-md bg-zinc-50 px-4 py-3 text-left md:text-right">
          <p className="text-sm text-zinc-500">Ownership</p>
          <p className="text-2xl font-black text-zinc-950">{((investment.ownershipPercentage || 0) * 100).toFixed(2)}%</p>
          <p className="mt-1 text-sm text-zinc-500">Entry valuation {formatCurrency(investment.entryValuation)}</p>
          {exited ? (
            <p className="mt-3 text-sm text-zinc-500">Exit completed</p>
          ) : (
            <>
              <p className="mt-3 text-sm text-zinc-500">Remaining {formatTokens(investment.tokensRemaining)}</p>
              <button
                className="btn-primary mt-4 w-full md:ml-auto md:w-auto"
                type="button"
                disabled={Boolean(exitTarget)}
                onClick={() => onExit(investment._id)}
              >
                {exitTarget === investment._id ? "Exiting..." : "Exit"}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function DashboardModal({ title, subtitle, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 px-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-md border border-zinc-200 bg-white p-6 shadow-soft" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase text-emerald-700">Investor insight</p>
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

export function InvestorDashboard() {
  const { mergeStoredUser, user } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [exitTarget, setExitTarget] = useState("");
  const [activePanel, setActivePanel] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [exitedPage, setExitedPage] = useState(1);
  const [aiSummary, setAiSummary] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiRequested, setAiRequested] = useState(false);
  const sectionPageSize = 3;

  useEffect(() => {
    let isMounted = true;

    async function loadInvestments() {
      try {
        const data = await apiRequest("/investments/me");
        if (isMounted) {
          setInvestments(data.investments || []);
        }
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

    function handleFocus() {
      loadInvestments();
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        loadInvestments();
      }
    }

    const refreshInterval = window.setInterval(loadInvestments, 30000);
    loadInvestments();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  async function handleExit(investmentId) {
    const confirmed = window.confirm("Exit this investment now?");

    if (!confirmed) {
      return;
    }

    setExitTarget(investmentId);
    setError("");
    setSuccess("");

    try {
      const data = await apiRequest(`/investments/${investmentId}/exit`, {
        method: "POST"
      });

      setInvestments((current) => current.map((investment) => (investment._id === investmentId ? data.investment : investment)));
      mergeStoredUser({ walletBalance: data.walletBalance });
      setSuccess(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setExitTarget("");
    }
  }

  async function handleMetricOpen(panel) {
    setActivePanel(panel);

    if (panel === "wallet-history" && !transactionsLoaded) {
      try {
        const data = await apiRequest("/investments/transactions/me");
        setTransactions(data.transactions || []);
        setTransactionsLoaded(true);
      } catch (err) {
        setError(err.message);
      }
    }
  }

  const metrics = useMemo(() => {
    const totalInvested = investments.reduce((sum, investment) => sum + (investment.amount || 0), 0);
    const currentValue = investments.reduce(
      (sum, investment) => sum + ((investment.tokensRemaining ?? 0) > 0 ? investment.currentValue || 0 : 0),
      0
    );
    const profitLoss = investments.reduce(
      (sum, investment) => sum + ((investment.tokensRemaining ?? 0) > 0 ? investment.profitLoss || 0 : investment.returnedAmount ? (investment.returnedAmount - investment.amount) : 0),
      0
    );

    return {
      totalInvested,
      currentValue,
      profitLoss
    };
  }, [investments]);

  const activeInvestments = investments.filter((investment) => (investment.tokensRemaining ?? 0) > 0);
  const exitedInvestments = investments.filter((investment) => (investment.tokensRemaining ?? 0) <= 0);

  const activePagination = useMemo(() => {
    const totalPages = Math.max(Math.ceil(activeInvestments.length / sectionPageSize), 1);
    const page = Math.min(activePage, totalPages);
    const startIndex = (page - 1) * sectionPageSize;

    return {
      page,
      totalPages,
      items: activeInvestments.slice(startIndex, startIndex + sectionPageSize)
    };
  }, [activeInvestments, activePage]);

  const exitedPagination = useMemo(() => {
    const totalPages = Math.max(Math.ceil(exitedInvestments.length / sectionPageSize), 1);
    const page = Math.min(exitedPage, totalPages);
    const startIndex = (page - 1) * sectionPageSize;

    return {
      page,
      totalPages,
      items: exitedInvestments.slice(startIndex, startIndex + sectionPageSize)
    };
  }, [exitedInvestments, exitedPage]);

  const chartData = useMemo(() => {
    const portfolioTimelineMap = new Map();
    const distributionMap = new Map();
    const profitByStartupMap = new Map();

    const sortedInvestments = [...investments].sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
    let cumulativePortfolioValue = 0;

    sortedInvestments.forEach((investment) => {
      const startup = investment.startupId || investment.startup || {};
      const currentValue = (investment.tokensRemaining ?? 0) > 0
        ? investment.currentValue || 0
        : investment.returnedAmount || investment.currentValue || 0;
      const profitLoss = (investment.tokensRemaining ?? 0) > 0
        ? investment.profitLoss || 0
        : (investment.returnedAmount || 0) - (investment.amount || 0);
      const industry = startup.classification?.industry || startup.industry || "Unspecified";
      const startupName = startup.name || "Startup";
      const timelineKey = formatChartDate(investment.createdAt);

      cumulativePortfolioValue += currentValue;
      portfolioTimelineMap.set(timelineKey, {
        date: timelineKey,
        value: Number(cumulativePortfolioValue.toFixed(2))
      });

      distributionMap.set(industry, (distributionMap.get(industry) || 0) + (investment.amount || 0));

      const existingStartupPoint = profitByStartupMap.get(startupName) || {
        startup: startupName,
        profit: 0,
        invested: 0,
        currentValue: 0
      };
      profitByStartupMap.set(startupName, {
        startup: startupName,
        profit: Number((existingStartupPoint.profit + profitLoss).toFixed(2)),
        invested: Number((existingStartupPoint.invested + (investment.amount || 0)).toFixed(2)),
        currentValue: Number((existingStartupPoint.currentValue + currentValue).toFixed(2))
      });
    });

    return {
      portfolioValueOverTime: Array.from(portfolioTimelineMap.values()),
      investmentDistribution: Array.from(distributionMap.entries())
        .map(([industry, amount]) => ({ industry, amount: Number(amount.toFixed(2)) }))
        .sort((left, right) => right.amount - left.amount),
      profitLossByStartup: Array.from(profitByStartupMap.values()).sort((left, right) => right.profit - left.profit)
    };
  }, [investments]);

  const aiData = useMemo(() => {
    const topIndustry = chartData.investmentDistribution[0]?.industry || "Unspecified";
    const sortedStartupPerformance = [...chartData.profitLossByStartup].sort((left, right) => right.profit - left.profit);
    const bestStartup = sortedStartupPerformance[0]?.startup || "No active startup";
    const worstStartup = sortedStartupPerformance[sortedStartupPerformance.length - 1]?.startup || "No active startup";

    return {
      totalInvested: metrics.totalInvested,
      currentValue: metrics.currentValue,
      profitLoss: metrics.profitLoss,
      topIndustry,
      bestStartup,
      worstStartup
    };
  }, [chartData.investmentDistribution, chartData.profitLossByStartup, metrics.currentValue, metrics.profitLoss, metrics.totalInvested]);

  async function handleGenerateAI() {
    if (aiData.totalInvested <= 0) {
      setAiSummary("Your portfolio summary is currently unavailable. Please try again later.");
      setAiRequested(true);
      return;
    }

    try {
      setAiRequested(true);
      setLoadingAI(true);
      const data = await apiRequest("/ai/summary", {
        method: "POST",
        body: aiData
      });
      setAiSummary(data.summary || "Your portfolio summary is currently unavailable. Please try again later.");
    } catch (err) {
      setAiSummary(err.message || "Your portfolio summary is currently unavailable. Please try again later.");
    } finally {
      setLoadingAI(false);
    }
  }

  const modalContent = useMemo(() => {
    if (activePanel === "investments") {
      return {
        title: "Investment list",
        subtitle: "Every active and exited position tied to your account.",
        body: (
          <div className="grid gap-4">
            {investments.map((investment) => (
              <div key={investment._id} className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-zinc-950">{investment.startup?.name || investment.startupId?.name || "Startup"}</p>
                    <p className="text-sm text-zinc-500">
                      Invested {formatCurrency(investment.amount)} on {formatDate(investment.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-700">
                    {(investment.tokensRemaining ?? 0) > 0 ? "Active" : "Exited"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      };
    }

    if (activePanel === "profit-loss") {
      return {
        title: "Profit and loss breakdown",
        subtitle: "Live position performance from the latest startup valuations.",
        body: (
          <div className="grid gap-4">
            {activeInvestments.map((investment) => (
              <div key={investment._id} className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-zinc-950">{investment.startup?.name || investment.startupId?.name || "Startup"}</p>
                    <p className="text-sm text-zinc-500">Current value {formatCurrency(investment.currentValue)}</p>
                  </div>
                  <p className={`text-lg font-black ${investment.profitLoss >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {investment.profitLoss >= 0 ? "+" : ""}
                    {formatCurrency(investment.profitLoss)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      };
    }

    if (activePanel === "wallet-history") {
      return {
        title: "Wallet history",
        subtitle: "Recent wallet-affecting transactions from loads, investments, and exits.",
        body: (
          <div className="space-y-4">
            <Link className="btn-primary inline-flex" to="/wallet/load" onClick={() => setActivePanel("")}>
              Load wallet
            </Link>
            {transactions.length ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction._id} className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-zinc-950">{transaction.type}</p>
                        <p className="text-sm text-zinc-500">
                          {transaction.startup?.name || transaction.investment?.startup?.name || "Wallet"} • {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                      <p className="font-semibold text-zinc-950">{formatCurrency(transaction.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-zinc-500">
                No wallet history yet.
              </div>
            )}
          </div>
        )
      };
    }

    return null;
  }, [activeInvestments, activePanel, investments, transactions]);

  if (loading) {
    return (
      <section className="bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 rounded-md bg-zinc-200" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase text-emerald-700">Investor dashboard</p>
            <h1 className="mt-2 text-4xl font-black text-zinc-950">Portfolio</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
              Real investment values based on current startup valuation and your recorded ownership.
            </p>
          </div>
          <Link className="btn-secondary" to="/wallet/load">
            Load wallet
          </Link>
        </div>

        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Total Invested" value={formatCurrency(metrics.totalInvested)} detail="Open your full investment list." onClick={() => handleMetricOpen("investments")} />
          <MetricCard title="Current Value" value={formatCurrency(metrics.currentValue)} detail="Active investment value today." />
          <MetricCard
            title="Profit / Loss"
            value={`${metrics.profitLoss >= 0 ? "+" : ""}${formatCurrency(metrics.profitLoss)}`}
            detail="Open the live profit and loss breakdown."
            tone={metrics.profitLoss >= 0 ? "emerald" : "rose"}
            onClick={() => handleMetricOpen("profit-loss")}
          />
          <MetricCard
            title="Token Balance"
            value={formatTokens(user?.walletBalance)}
            detail={formatCurrency(tokensToNpr(user?.walletBalance))}
            onClick={() => handleMetricOpen("wallet-history")}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-3 overflow-hidden rounded-[30px] border border-zinc-200 bg-[linear-gradient(130deg,rgba(15,118,110,0.06),rgba(255,255,255,0.92)_38%,rgba(236,253,245,0.96)_100%)] shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="border-b border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.96),rgba(240,253,250,0.92))] px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button className="btn-primary" type="button" disabled={loadingAI} onClick={handleGenerateAI}>
                    {loadingAI ? "Generating..." : aiRequested ? "Refresh Insights" : "Generate Insights"}
                  </button>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-zinc-950">AI Portfolio Insights</h2>
                    <p className="mt-1 text-sm text-zinc-500">Generate a concise portfolio read based on your current live investment data.</p>
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
                  <div className="h-4 w-11/12 animate-pulse rounded bg-zinc-100" />
                  <div className="h-4 w-10/12 animate-pulse rounded bg-zinc-100" />
                </div>
              ) : aiSummary ? (
                <div className="whitespace-pre-line text-[15px] leading-8 text-zinc-700">
                  {aiSummary}
                </div>
              ) : (
                <div className="rounded-[22px] border border-dashed border-zinc-300 bg-white/70 px-5 py-6 text-sm leading-7 text-zinc-500">
                  Click <span className="font-semibold text-zinc-700">Generate Insights</span> to create a fresh AI summary of your portfolio.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5">
          <ChartCard
            title="Portfolio Value Over Time"
            subtitle="Current portfolio value grouped across your investment dates, using live startup valuations."
          >
            {chartData.portfolioValueOverTime.length ? (
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.portfolioValueOverTime} margin={{ top: 12, right: 18, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="portfolioGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0f766e" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#0f766e" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e4e4e7" />
                    <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 12 }} />
                    <YAxis tickFormatter={formatAxisCurrency} tick={{ fill: "#71717a", fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#0f766e"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
                      activeDot={{ r: 6 }}
                      fill="url(#portfolioGlow)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmptyState label="Portfolio value history appears once you have live investments." />
            )}
          </ChartCard>

          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <ChartCard
              title="Investment Distribution"
              subtitle="Diversification by startup industry based on your invested capital."
            >
              {chartData.investmentDistribution.length ? (
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.investmentDistribution}
                        dataKey="amount"
                        nameKey="industry"
                        innerRadius={72}
                        outerRadius={110}
                        paddingAngle={3}
                        stroke="rgba(255,255,255,0.85)"
                        strokeWidth={3}
                      >
                        {chartData.investmentDistribution.map((entry, index) => (
                          <Cell key={entry.industry} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmptyState label="Industry diversification appears once investments are recorded." />
              )}
            </ChartCard>

            <ChartCard
              title="Profit / Loss Per Startup"
              subtitle="Compare which startups are contributing gains or losses right now."
            >
              {chartData.profitLossByStartup.length ? (
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.profitLossByStartup} margin={{ top: 12, right: 18, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#e4e4e7" />
                      <XAxis dataKey="startup" tick={{ fill: "#71717a", fontSize: 12 }} />
                      <YAxis tickFormatter={formatAxisCurrency} tick={{ fill: "#71717a", fontSize: 12 }} />
                      <Tooltip
                        formatter={(value, name) => [formatCurrency(value), name === "profit" ? "Profit / Loss" : name]}
                        labelFormatter={(value) => value}
                      />
                      <Bar dataKey="profit" radius={[10, 10, 0, 0]}>
                        {chartData.profitLossByStartup.map((entry) => (
                          <Cell key={entry.startup} fill={entry.profit >= 0 ? "#16a34a" : "#dc2626"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmptyState label="Startup performance appears once your holdings have value movement." />
              )}
            </ChartCard>
          </div>
        </div>

        <div className="mt-8 grid gap-8">
          <section>
            <div className="mb-4">
              <p className="text-sm font-bold uppercase text-emerald-700">Active investments</p>
              <h2 className="mt-2 text-3xl font-black text-zinc-950">Current positions</h2>
            </div>
            {activeInvestments.length ? (
              <div className="grid gap-5">
                {activePagination.items.map((investment) => (
                  <InvestmentCard
                    key={investment._id}
                    investment={investment}
                    exitTarget={exitTarget}
                    onExit={handleExit}
                  />
                ))}
                {activeInvestments.length > sectionPageSize ? (
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-zinc-200 bg-white p-4 shadow-soft">
                    <p className="text-sm text-zinc-500">
                      Page {activePagination.page} of {activePagination.totalPages} | {activeInvestments.length} active investments
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button className="btn-secondary" type="button" disabled={activePagination.page === 1} onClick={() => setActivePage((current) => Math.max(current - 1, 1))}>
                        Prev
                      </button>
                      {Array.from({ length: activePagination.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                        <button
                          key={pageNumber}
                          className={pageNumber === activePagination.page ? "btn-primary" : "btn-secondary"}
                          type="button"
                          onClick={() => setActivePage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      ))}
                      <button className="btn-secondary" type="button" disabled={activePagination.page === activePagination.totalPages} onClick={() => setActivePage((current) => Math.min(current + 1, activePagination.totalPages))}>
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
                No active investments right now.
              </div>
            )}
          </section>

          <section>
            <div className="mb-4">
              <p className="text-sm font-bold uppercase text-emerald-700">Exited investments</p>
              <h2 className="mt-2 text-3xl font-black text-zinc-950">Closed positions</h2>
            </div>
            {exitedInvestments.length ? (
              <div className="grid gap-5">
                {exitedPagination.items.map((investment) => (
                  <InvestmentCard key={investment._id} investment={investment} exited />
                ))}
                {exitedInvestments.length > sectionPageSize ? (
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-zinc-200 bg-white p-4 shadow-soft">
                    <p className="text-sm text-zinc-500">
                      Page {exitedPagination.page} of {exitedPagination.totalPages} | {exitedInvestments.length} exited investments
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button className="btn-secondary" type="button" disabled={exitedPagination.page === 1} onClick={() => setExitedPage((current) => Math.max(current - 1, 1))}>
                        Prev
                      </button>
                      {Array.from({ length: exitedPagination.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                        <button
                          key={pageNumber}
                          className={pageNumber === exitedPagination.page ? "btn-primary" : "btn-secondary"}
                          type="button"
                          onClick={() => setExitedPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      ))}
                      <button className="btn-secondary" type="button" disabled={exitedPagination.page === exitedPagination.totalPages} onClick={() => setExitedPage((current) => Math.min(current + 1, exitedPagination.totalPages))}>
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
                No exited investments yet.
              </div>
            )}
          </section>
        </div>
      </div>
      {modalContent ? (
        <DashboardModal title={modalContent.title} subtitle={modalContent.subtitle} onClose={() => setActivePanel("")}>
          {modalContent.body}
        </DashboardModal>
      ) : null}
    </section>
  );
}
