import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, assetUrl } from "../api/client.js";
import { Alert } from "../components/Alert.jsx";
import { Loading } from "../components/Loading.jsx";
import { formatCurrency, formatDate } from "../utils/format.js";
import { getFundingCurrent, getFundingGoal, getFundingPercent } from "../utils/funding.js";
import { formatStructuredValue } from "../utils/startupMetadata.js";

const statusClasses = {
  pending: "bg-amber-100 text-amber-900",
  active: "bg-emerald-100 text-emerald-900",
  rejected: "bg-rose-100 text-rose-900",
  approved: "bg-emerald-100 text-emerald-900"
};

const sidebarSections = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "transactions", label: "Transactions" },
  { id: "moderation", label: "Moderation" }
];

function SectionCard({ title, subtitle, children, action = null, className = "" }) {
  return (
    <section className={`rounded-[28px] border border-zinc-200 bg-white p-5 shadow-soft ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">{title}</p>
          {subtitle ? <p className="mt-2 text-sm text-zinc-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function PaginationBar({ pagination, onPageChange, label }) {
  const pageNumbers = Array.from({ length: pagination.totalPages || 1 }, (_, index) => index + 1);

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-zinc-200 bg-zinc-50 px-4 py-3">
      <p className="text-sm text-zinc-500">
        Page {pagination.page} of {pagination.totalPages}
        {pagination.total ? ` | ${pagination.total} ${label}` : ""}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-secondary" type="button" disabled={!pagination.hasPrevPage} onClick={() => onPageChange(Math.max(pagination.page - 1, 1))}>
          Prev
        </button>
        {pageNumbers.map((pageNumber) => (
          <button key={pageNumber} className={pageNumber === pagination.page ? "btn-primary" : "btn-secondary"} type="button" onClick={() => onPageChange(pageNumber)}>
            {pageNumber}
          </button>
        ))}
        <button className="btn-secondary" type="button" disabled={!pagination.hasNextPage} onClick={() => onPageChange(Math.min(pagination.page + 1, pagination.totalPages || pagination.page + 1))}>
          Next
        </button>
      </div>
    </div>
  );
}

function MetricCard({ title, value, detail }) {
  return (
    <div className="rounded-[24px] border border-zinc-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,247,245,0.96))] p-5">
      <p className="text-sm font-semibold text-zinc-500">{title}</p>
      <p className="mt-3 text-3xl font-black text-zinc-950">{value}</p>
      <p className="mt-2 text-sm text-zinc-500">{detail}</p>
    </div>
  );
}

function AnalyticsCard({ label, description, children }) {
  return (
    <div className="rounded-[24px] border border-zinc-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,250,248,0.96))] p-4">
      <div className="mb-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function ChartLegend({ items, colors, formatter = (value) => value }) {
  if (!items.length) {
    return <p className="text-sm text-zinc-500">No data available yet.</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      {items.map((item, index) => (
        <div key={item.name} className="flex items-center justify-between gap-3 rounded-[16px] bg-white/80 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
            <span className="text-sm font-medium text-zinc-700">{item.name}</span>
          </div>
          <span className="text-sm font-bold text-zinc-950">{formatter(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

function PieVisual({ items, colors }) {
  const total = items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  if (!total) {
    return <div className="flex h-[220px] items-center justify-center rounded-[20px] bg-zinc-50 text-sm text-zinc-500">No data available yet.</div>;
  }

  if (items.length === 1) {
    return (
      <div className="flex h-[220px] items-center justify-center">
        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: "176px",
            height: "176px",
            border: `18px solid ${colors[0]}`,
            boxShadow: "0 16px 40px rgba(16,185,129,0.16)"
          }}
        >
          <div
            className="absolute flex items-center justify-center rounded-full bg-white text-center shadow-sm ring-1 ring-zinc-100"
            style={{ inset: "28px" }}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Total</p>
              <p className="mt-1 text-2xl font-black text-zinc-950">{total}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  let progress = 0;
  const segmentBackground = `conic-gradient(${items
    .map((item, index) => {
      const value = Number(item.value) || 0;
      const start = progress;
      const end = progress + (value / total) * 100;
      progress = end;
      return `${colors[index % colors.length]} ${start}% ${end}%`;
    })
    .join(", ")})`;

  return (
    <div className="flex h-[220px] items-center justify-center">
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: "176px",
          height: "176px",
          border: "10px solid #ecfdf5",
          boxShadow: "0 16px 40px rgba(16,185,129,0.12)",
          background: segmentBackground
        }}
      >
        <div
          className="absolute flex items-center justify-center rounded-full bg-white text-center shadow-sm ring-1 ring-zinc-100"
          style={{ inset: "32px" }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Total</p>
            <p className="mt-1 text-2xl font-black text-zinc-950">{total}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BarVisual({ items, color }) {
  const maxValue = Math.max(...items.map((item) => Number(item.value) || 0), 0);

  if (!items.length || !maxValue) {
    return <div className="flex h-[220px] items-center justify-center rounded-[20px] bg-zinc-50 text-sm text-zinc-500">No data available yet.</div>;
  }

  return (
    <div className="space-y-4 rounded-[20px] bg-zinc-50 p-4">
      {items.map((item) => {
        const width = Math.max(((Number(item.value) || 0) / maxValue) * 100, 12);
        return (
          <div key={item.name} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-zinc-700">{item.name}</p>
              <p className="text-sm font-black text-zinc-950">{item.value}</p>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-white shadow-inner">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${width}%`, backgroundColor: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TransactionBars({ items }) {
  const maxValue = Math.max(...items.map((item) => Number(item.value) || 0), 0);
  const totalValue = items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const colors = ["#10b981", "#06b6d4", "#f59e0b", "#0f766e"];
  const labels = {
    INVEST: "Investment outflow",
    EXIT: "Investor payouts",
    LOAD: "Wallet top-ups"
  };

  if (!items.length || !maxValue) {
    return <div className="flex h-[280px] items-center justify-center rounded-[22px] bg-zinc-50 text-sm text-zinc-500">No transaction data available yet.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[22px] border border-zinc-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Total flow</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">{formatCurrency(totalValue)}</p>
          <p className="mt-2 text-sm text-zinc-500">Combined movement across tracked transactions.</p>
        </div>
        <div className="rounded-[22px] border border-zinc-200 bg-[linear-gradient(180deg,#f7fffb_0%,#effcf6_100%)] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Transaction types</p>
          <p className="mt-2 text-3xl font-black text-emerald-900">{items.length}</p>
          <p className="mt-2 text-sm text-emerald-900/70">Distinct money movement categories.</p>
        </div>
        <div className="rounded-[22px] border border-zinc-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Largest stream</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">{items[0]?.name || "-"}</p>
          <p className="mt-2 text-sm text-zinc-500">{items.length ? formatCurrency(Math.max(...items.map((item) => Number(item.value) || 0))) : "-"}</p>
        </div>
        <div className="rounded-[22px] border border-zinc-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Coverage</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">Live</p>
          <p className="mt-2 text-sm text-zinc-500">Snapshot from current admin transaction records.</p>
        </div>
      </div>

      <div className="rounded-[24px] border border-zinc-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,1))] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Flow overview</p>
            <p className="mt-2 text-3xl font-black text-zinc-950">{formatCurrency(totalValue)}</p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-zinc-600">
            Breakdown
          </span>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {items.map((item, index) => {
            const value = Number(item.value) || 0;
            const width = Math.max((value / maxValue) * 100, 8);
            return (
              <div key={item.name} className="rounded-[18px] border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                      <p className="text-sm font-bold uppercase tracking-[0.12em] text-zinc-800">{item.name}</p>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">{labels[item.name] || "System transaction volume"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-zinc-950">{formatCurrency(value)}</p>
                    <p className="text-xs text-zinc-500">{Math.round((value / totalValue) * 100)}% of total</p>
                  </div>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${width}%`, backgroundColor: colors[index % colors.length] }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InvestmentDistribution({ title, subtitle, items, colors }) {
  const maxValue = Math.max(...items.map((item) => Number(item.value) || 0), 0);
  const totalValue = items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  return (
    <div className="rounded-[24px] border border-zinc-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,250,248,0.96))] p-5">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{title}</p>
        <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
      </div>
      {!items.length || !maxValue ? (
        <div className="flex h-[220px] items-center justify-center rounded-[20px] bg-zinc-50 text-sm text-zinc-500">No investment distribution available yet.</div>
      ) : (
        <div className="space-y-4">
          <div className="grid h-[260px] grid-cols-[repeat(auto-fit,minmax(72px,1fr))] items-end gap-3 rounded-[20px] border border-zinc-200 bg-white p-4">
            {items.map((item, index) => {
              const value = Number(item.value) || 0;
              const height = Math.max((value / maxValue) * 100, 12);
              return (
                <div key={item.name} className="flex h-full min-w-0 flex-col justify-end gap-3">
                  <div className="flex-1 rounded-[16px] bg-zinc-50 p-2">
                    <div className="flex h-full items-end">
                      <div
                        className="w-full rounded-[12px] transition-all duration-500"
                        style={{ height: `${height}%`, backgroundColor: colors[index % colors.length] }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="truncate text-center text-xs font-bold uppercase tracking-[0.12em] text-zinc-700">{item.name}</p>
                    <p className="text-center text-xs font-semibold text-zinc-500">{Math.round((value / totalValue) * 100)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="space-y-2">
            {items.map((item, index) => {
              const value = Number(item.value) || 0;
              return (
                <div key={`${item.name}-legend`} className="flex items-center justify-between gap-3 rounded-[16px] bg-white px-3 py-3 ring-1 ring-zinc-100">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                    <p className="truncate text-sm font-semibold text-zinc-800">{item.name}</p>
                  </div>
                  <p className="text-sm font-black text-zinc-950">{formatCurrency(value)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminPanel() {
  const [startups, setStartups] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionTarget, setActionTarget] = useState("");
  const [startupPage, setStartupPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const [aiSummary, setAiSummary] = useState({ users: "", transactions: "" });
  const [loadingAI, setLoadingAI] = useState("");
  const [startupPagination, setStartupPagination] = useState({ page: 1, total: 0, totalPages: 1, hasPrevPage: false, hasNextPage: false });
  const [userPagination, setUserPagination] = useState({ page: 1, total: 0, totalPages: 1, hasPrevPage: false, hasNextPage: false });
  const [transactionPagination, setTransactionPagination] = useState({ page: 1, total: 0, totalPages: 1, hasPrevPage: false, hasNextPage: false });

  async function loadPanel(currentStartupPage = startupPage, currentUserPage = userPage, currentTransactionPage = transactionPage) {
    setLoading(true);
    setError("");

    try {
      const [startupData, updateData, overviewData, userData, transactionData] = await Promise.all([
        apiRequest(`/admin/startups?page=${currentStartupPage}&limit=4`),
        apiRequest("/admin/performance-updates"),
        apiRequest("/admin/overview"),
        apiRequest(`/admin/users?page=${currentUserPage}&limit=4`),
        apiRequest(`/admin/transactions?page=${currentTransactionPage}&limit=4`)
      ]);

      setStartups(startupData.startups || []);
      setStartupPagination(startupData.pagination || startupPagination);
      setUpdates(updateData.updates || []);
      setOverview(overviewData);
      setUsers(userData.users || []);
      setUserPagination(userData.pagination || userPagination);
      setTransactions(transactionData.transactions || []);
      setTransactionPagination(transactionData.pagination || transactionPagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPanel(startupPage, userPage, transactionPage);
  }, [startupPage, userPage, transactionPage]);

  async function handleStatusChange(startupId, nextStatus) {
    const confirmed = window.confirm(`Are you sure you want to ${nextStatus} this startup?`);
    if (!confirmed) return;
    setActionTarget(`${startupId}:${nextStatus}`);
    setError("");
    setSuccess("");
    try {
      const data = await apiRequest(`/admin/startups/${startupId}/${nextStatus}`, { method: "PUT" });
      setStartups((current) => current.map((startup) => (startup._id === startupId ? data.startup : startup)));
      setSuccess(`Startup ${nextStatus === "approve" ? "approved" : "rejected"} successfully.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionTarget("");
    }
  }

  async function handlePerformanceReview(updateId, action) {
    const adminNote = action === "reject" ? window.prompt("Reason for rejection", "") || "" : window.prompt("Optional admin note", "") || "";
    if (action === "reject" && !adminNote.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    setActionTarget(`${updateId}:${action}`);
    setError("");
    setSuccess("");
    try {
      await apiRequest(`/admin/performance-updates/${updateId}/${action}`, { method: "PUT", body: { adminNote } });
      await loadPanel(startupPage, userPage, transactionPage);
      setSuccess(`Performance update ${action === "approve" ? "approved" : "rejected"}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionTarget("");
    }
  }

  async function handleUserAction(userId, action) {
    const confirmed = window.confirm(`Are you sure you want to ${action} this user?`);
    if (!confirmed) return;
    setActionTarget(`${userId}:${action}`);
    setError("");
    setSuccess("");
    try {
      if (action === "delete") {
        await apiRequest(`/admin/users/${userId}`, { method: "DELETE" });
      } else {
        await apiRequest(`/admin/users/${userId}/${action}`, { method: "PUT" });
      }
      await loadPanel(startupPage, userPage, transactionPage);
      setSuccess(`User ${action} action completed.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionTarget("");
    }
  }

  async function handleGenerateAdminAI(type) {
    if (!overview) return;
    setLoadingAI(type);
    try {
      const payload =
        type === "users"
          ? {
              summaryType: "admin-users",
              totalUsers: overview.summary.totalUsers,
              founders: overview.summary.founders,
              investors: overview.summary.investors,
              suspendedUsers: overview.summary.suspendedUsers,
              genderBreakdown: JSON.stringify(overview.userCharts.genderBreakdown),
              ageRatio: JSON.stringify(overview.userCharts.ageRatio),
              joinTrend: JSON.stringify(overview.activity.filter((item) => item.type === "User joined").slice(0, 8))
            }
          : {
              summaryType: "admin-transactions",
              totalTransactions: overview.summary.totalTransactions,
              totalVolume: overview.summary.totalTransactionVolume,
              loadVolume: overview.transactionCharts.byType.LOAD,
              investVolume: overview.transactionCharts.byType.INVEST,
              exitVolume: overview.transactionCharts.byType.EXIT,
              failedPayments: overview.summary.failedPayments,
              activityTrend: JSON.stringify(transactions.slice(0, 8).map((item) => ({ type: item.type, amount: item.amount })))
            };

      const data = await apiRequest("/ai/summary", { method: "POST", body: payload });
      setAiSummary((current) => ({ ...current, [type]: data.summary || "AI insight unavailable." }));
    } catch (err) {
      setAiSummary((current) => ({ ...current, [type]: err.message || "AI insight unavailable." }));
    } finally {
      setLoadingAI("");
    }
  }

  const genderChart = useMemo(
    () =>
      Object.entries(overview?.userCharts?.genderBreakdown || {}).map(([name, value]) => ({
        name,
        value
      })),
    [overview]
  );

  const ageChart = useMemo(
    () =>
      Object.entries(overview?.userCharts?.ageRatio || {}).map(([name, value]) => ({
        name,
        value
      })),
    [overview]
  );

  const transactionChart = useMemo(
    () =>
      Object.entries(overview?.transactionCharts?.byType || {}).map(([name, value]) => ({
        name,
        value
      })),
    [overview]
  );

  const investmentByIndustry = useMemo(
    () =>
      Object.entries(overview?.investmentCharts?.byIndustry || {})
        .map(([name, value]) => ({ name, value }))
        .sort((left, right) => right.value - left.value),
    [overview]
  );

  const investmentByCategory = useMemo(
    () =>
      Object.entries(overview?.investmentCharts?.byCategory || {})
        .map(([name, value]) => ({ name, value }))
        .sort((left, right) => right.value - left.value),
    [overview]
  );

  if (loading && !overview) {
    return <Loading label="Loading admin console" />;
  }

  return (
    <section className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.08),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="w-full rounded-[30px] border border-zinc-200 bg-white p-5 shadow-soft lg:sticky lg:top-24 lg:w-[280px] lg:flex-shrink-0">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Admin</p>
            <h1 className="mt-2 text-3xl font-black text-zinc-950">System control</h1>
            <p className="mt-3 text-sm leading-7 text-zinc-600">Monitor users, moderation, transactions, and system risk with a premium admin workspace.</p>
            <div className="mt-6 space-y-2">
              {sidebarSections.map((section) => (
                <a key={section.id} href={`#${section.id}`} className="block rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
                  {section.label}
                </a>
              ))}
            </div>
            <div className="mt-6 rounded-[24px] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_55%),linear-gradient(180deg,_#f7fffb_0%,_#effcf6_100%)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Live snapshot</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-[18px] bg-white/90 px-3 py-3">
                  <span className="text-sm text-zinc-500">Users</span>
                  <span className="text-lg font-black text-zinc-950">{overview?.summary?.totalUsers || 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-[18px] bg-white/90 px-3 py-3">
                  <span className="text-sm text-zinc-500">Transactions</span>
                  <span className="text-lg font-black text-zinc-950">{overview?.summary?.totalTransactions || 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-[18px] bg-white/90 px-3 py-3">
                  <span className="text-sm text-zinc-500">At risk</span>
                  <span className="text-lg font-black text-rose-600">{overview?.summary?.failedPayments || 0}</span>
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1 space-y-6">
            <div className="rounded-[30px] border border-zinc-200 bg-white p-6 shadow-soft">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Admin</p>
              <h2 className="mt-2 text-4xl font-black text-zinc-950">Operations command center</h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600">Manage users, transactions, moderation, and operational risk with bento-style analytics and on-demand AI summaries.</p>
            </div>

            <Alert>{error}</Alert>
            <Alert type="success">{success}</Alert>

            <section id="overview" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Total Users" value={overview?.summary?.totalUsers || 0} detail="All non-admin accounts" />
              <MetricCard title="Suspended Users" value={overview?.summary?.suspendedUsers || 0} detail="Accounts currently restricted" />
              <MetricCard title="Transactions" value={overview?.summary?.totalTransactions || 0} detail="Recorded system transactions" />
              <MetricCard title="Volume" value={formatCurrency(overview?.summary?.totalTransactionVolume || 0)} detail="Total movement across system" />
            </section>

            <section className="grid gap-4 lg:items-start lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
              <SectionCard title="User Analytics" subtitle="Visualize the user base with quick-read distribution charts and on-demand AI commentary." action={<button className="btn-primary" type="button" onClick={() => handleGenerateAdminAI("users")}>{loadingAI === "users" ? "Generating..." : "Generate AI Insight"}</button>}>
                <div className="grid gap-4 lg:grid-cols-2">
                  <AnalyticsCard label="Gender spread" description="Share of users by gender.">
                    <PieVisual items={genderChart} colors={["#10b981", "#06b6d4", "#f59e0b", "#71717a"]} />
                    <ChartLegend items={genderChart} colors={["#10b981", "#06b6d4", "#f59e0b", "#71717a"]} />
                  </AnalyticsCard>
                  <AnalyticsCard label="Age ratio" description="Users grouped by age band.">
                    <BarVisual items={ageChart} color="#10b981" />
                    <ChartLegend items={ageChart} colors={["#10b981"]} />
                  </AnalyticsCard>
                </div>
                <div className="mt-4">
                  <AnalyticsCard label="User mix" description="Quick ratios for account composition.">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-[18px] bg-zinc-50 px-4 py-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Founders</p>
                        <p className="mt-2 text-3xl font-black text-zinc-950">{overview?.summary?.founders || 0}</p>
                      </div>
                      <div className="rounded-[18px] bg-zinc-50 px-4 py-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Investors</p>
                        <p className="mt-2 text-3xl font-black text-zinc-950">{overview?.summary?.investors || 0}</p>
                      </div>
                      <div className="rounded-[18px] bg-zinc-50 px-4 py-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Suspended</p>
                        <p className="mt-2 text-3xl font-black text-rose-600">{overview?.summary?.suspendedUsers || 0}</p>
                      </div>
                    </div>
                  </AnalyticsCard>
                </div>
                {aiSummary.users ? <div className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50/60 p-4 whitespace-pre-line text-sm leading-7 text-zinc-700">{aiSummary.users}</div> : null}
              </SectionCard>

              <SectionCard className="self-start" title="Risk Alerts" subtitle="High-level indicators for moderation and billing health.">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[22px] bg-zinc-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Pending startups</p><p className="mt-2 text-2xl font-black text-zinc-950">{overview?.summary?.pendingStartups || 0}</p></div>
                  <div className="rounded-[22px] bg-zinc-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Active startups</p><p className="mt-2 text-2xl font-black text-zinc-950">{overview?.summary?.activeStartups || 0}</p></div>
                  <div className="rounded-[22px] bg-zinc-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Failed payments</p><p className="mt-2 text-2xl font-black text-rose-600">{overview?.summary?.failedPayments || 0}</p></div>
                </div>
              </SectionCard>
            </section>

            <section id="users">
              <SectionCard title="Users" subtitle="Manage account visibility, suspension, profile review, and lifecycle actions.">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200">
                    <thead className="bg-zinc-50">
                      <tr className="text-left text-sm font-semibold text-zinc-700">
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Gender</th>
                        <th className="px-4 py-3">Joined</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {users.map((user) => {
                        const avatar = assetUrl(user.profileImage || user.avatar);
                        return (
                          <tr key={user._id} className="text-sm text-zinc-700">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                {avatar ? <img className="h-11 w-11 rounded-full object-cover" src={avatar} alt={user.name} /> : <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-900">{user.name?.slice(0, 1)}</div>}
                                <div>
                                  <p className="font-semibold text-zinc-950">{user.name}</p>
                                  <p className="text-zinc-500">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">{user.role}</td>
                            <td className="px-4 py-4">{user.gender || "Not set"}</td>
                            <td className="px-4 py-4">{formatDate(user.createdAt)}</td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <Link className="btn-secondary" to={`/users/${user._id}`}>View profile</Link>
                                <button className="btn-secondary" type="button" disabled={Boolean(actionTarget)} onClick={() => handleUserAction(user._id, user.isSuspended ? "unsuspend" : "suspend")}>
                                  {actionTarget === `${user._id}:${user.isSuspended ? "unsuspend" : "suspend"}` ? "Saving..." : user.isSuspended ? "Unsuspend" : "Suspend"}
                                </button>
                                <button className="btn-secondary" type="button" disabled={Boolean(actionTarget)} onClick={() => handleUserAction(user._id, "delete")}>
                                  {actionTarget === `${user._id}:delete` ? "Deleting..." : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <PaginationBar pagination={userPagination} onPageChange={setUserPage} label="users" />
              </SectionCard>
            </section>

            <section id="transactions" className="grid gap-4">
              <SectionCard title="Transaction Analytics" subtitle="Billing and transaction behavior across the system." action={<button className="btn-primary" type="button" onClick={() => handleGenerateAdminAI("transactions")}>{loadingAI === "transactions" ? "Generating..." : "Generate AI Insight"}</button>}>
                <TransactionBars items={transactionChart} />
                {aiSummary.transactions ? <div className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50/60 p-4 whitespace-pre-line text-sm leading-7 text-zinc-700">{aiSummary.transactions}</div> : null}
              </SectionCard>

              <SectionCard title="Investment Distribution" subtitle="See where capital is flowing across startup industries and categories.">
                <div className="grid gap-4 lg:grid-cols-2">
                  <InvestmentDistribution
                    title="By industry"
                    subtitle="Investment volume grouped by startup industry."
                    items={investmentByIndustry}
                    colors={["#10b981", "#06b6d4", "#f59e0b", "#0f766e", "#84cc16"]}
                  />
                  <InvestmentDistribution
                    title="By category"
                    subtitle="Investment volume grouped by startup category."
                    items={investmentByCategory}
                    colors={["#0f766e", "#10b981", "#f59e0b", "#06b6d4", "#eab308"]}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Billing History" subtitle="All system transactions with user and startup context.">
                <div className="overflow-hidden rounded-[22px] border border-zinc-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] divide-y divide-zinc-200">
                    <thead className="bg-zinc-50">
                      <tr className="text-left text-sm font-semibold text-zinc-700">
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Startup</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                      <tbody className="divide-y divide-zinc-200 bg-white">
                        {transactions.map((transaction) => (
                          <tr key={transaction._id} className="text-sm text-zinc-700">
                            <td className="px-4 py-4 align-top">
                              <p className="font-semibold text-zinc-950">{transaction.user?.name || "User"}</p>
                              <p className="text-zinc-500">{transaction.user?.email || ""}</p>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-zinc-700">
                                {transaction.type}
                              </span>
                            </td>
                            <td className="px-4 py-4 align-top">{transaction.startup?.name || "-"}</td>
                            <td className="px-4 py-4 align-top font-semibold text-zinc-950">{formatCurrency(transaction.amount)}</td>
                            <td className="px-4 py-4 align-top text-zinc-500">{formatDate(transaction.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <PaginationBar pagination={transactionPagination} onPageChange={setTransactionPage} label="transactions" />
              </SectionCard>
            </section>

            <section id="moderation" className="grid gap-4">
              <SectionCard title="Startup Moderation" subtitle="Review listing health with paginated admin controls.">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200">
                    <thead className="bg-zinc-50">
                      <tr className="text-left text-sm font-semibold text-zinc-700">
                        <th className="px-4 py-3">Startup</th>
                        <th className="px-4 py-3">Founder</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Goal</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {startups.map((startup) => {
                        const status = startup.status || "pending";
                        const fundingCurrent = getFundingCurrent(startup);
                        const fundingGoal = getFundingGoal(startup);
                        const fundingPercent = getFundingPercent(startup);
                        return (
                          <tr key={startup._id} className="text-sm text-zinc-700">
                            <td className="px-4 py-4">
                              <p className="font-semibold text-zinc-950">{startup.name}</p>
                              <p className="text-zinc-500">{formatStructuredValue(startup.category, "General")}</p>
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-medium text-zinc-950">{startup.founder?.name || "Unknown founder"}</p>
                              <p className="text-zinc-500">{startup.founder?.email || ""}</p>
                            </td>
                            <td className="px-4 py-4"><span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold uppercase ${statusClasses[status] || "bg-zinc-100 text-zinc-900"}`}>{status}</span></td>
                            <td className="px-4 py-4"><p className="font-semibold text-zinc-950">{formatCurrency(fundingCurrent)}</p><p className="text-zinc-500">of {formatCurrency(fundingGoal)} • {fundingPercent}%</p></td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-2">
                                <Link className="btn-secondary" to={`/startups/${startup._id}`}>View Startup</Link>
                                <button className="btn-primary" type="button" disabled={Boolean(actionTarget) || status === "active"} onClick={() => handleStatusChange(startup._id, "approve")}>
                                  {actionTarget === `${startup._id}:approve` ? "Approving..." : "Approve"}
                                </button>
                                <button className="btn-secondary" type="button" disabled={Boolean(actionTarget) || status === "rejected"} onClick={() => handleStatusChange(startup._id, "reject")}>
                                  {actionTarget === `${startup._id}:reject` ? "Rejecting..." : "Reject"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <PaginationBar pagination={startupPagination} onPageChange={setStartupPage} label="startups" />
              </SectionCard>

              <SectionCard title="Performance Updates" subtitle="Founder-submitted operating changes with review controls.">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200">
                    <thead className="bg-zinc-50">
                      <tr className="text-left text-sm font-semibold text-zinc-700">
                        <th className="px-4 py-3">Startup</th>
                        <th className="px-4 py-3">Proposed revenue</th>
                        <th className="px-4 py-3">Growth rate</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {updates.slice(0, 6).map((update) => {
                        const status = update.status || "pending";
                        const isPending = update.status === "pending";
                        return (
                          <tr key={update._id} className="text-sm text-zinc-700">
                            <td className="px-4 py-4"><p className="font-semibold text-zinc-950">{update.startup?.name || "Startup removed"}</p><p className="text-zinc-500">{update.founder?.name || "Founder"}</p></td>
                            <td className="px-4 py-4">{formatCurrency(update.proposedRevenue)}</td>
                            <td className="px-4 py-4">{update.proposedGrowthRate}%</td>
                            <td className="px-4 py-4"><span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold uppercase ${statusClasses[status] || "bg-zinc-100 text-zinc-900"}`}>{status}</span></td>
                            <td className="px-4 py-4">{formatDate(update.createdAt)}</td>
                            <td className="px-4 py-4">
                              {isPending ? (
                                <div className="flex flex-wrap gap-2">
                                  <button className="btn-primary" type="button" disabled={Boolean(actionTarget)} onClick={() => handlePerformanceReview(update._id, "approve")}>{actionTarget === `${update._id}:approve` ? "Approving..." : "Approve"}</button>
                                  <button className="btn-secondary" type="button" disabled={Boolean(actionTarget)} onClick={() => handlePerformanceReview(update._id, "reject")}>{actionTarget === `${update._id}:reject` ? "Rejecting..." : "Reject"}</button>
                                </div>
                              ) : (
                                <span className="text-zinc-500">Reviewed</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </section>

          </div>
        </div>
      </div>
    </section>
  );
}
