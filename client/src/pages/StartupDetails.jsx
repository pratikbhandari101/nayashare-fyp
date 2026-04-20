import { useEffect, useMemo, useState } from "react";
import { assetUrl, apiRequest } from "../api/client.js";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert } from "../components/Alert.jsx";
import { Loading } from "../components/Loading.jsx";
import { ProgressBar } from "../components/ProgressBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatCurrency, formatDate, formatTokens, startupImage } from "../utils/format.js";
import { getFundingCurrent, getFundingGoal, getFundingPercent, getRemainingFunding } from "../utils/funding.js";
import { formatStructuredValue } from "../utils/startupMetadata.js";

function HeartIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M12 20.5s-7-4.35-7-10.14A4.36 4.36 0 0 1 9.34 6a4.7 4.7 0 0 1 2.66 1.06A4.7 4.7 0 0 1 14.66 6 4.36 4.36 0 0 1 19 10.36C19 16.15 12 20.5 12 20.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 4.75h10A1.25 1.25 0 0 1 18.25 6v13l-6.25-3-6.25 3V6A1.25 1.25 0 0 1 7 4.75Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 12v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5M12 3v12m0-12 4 4m-4-4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M3.75 12h16.5M12 3.75c2.83 2.7 4.5 5.84 4.5 8.25s-1.67 5.55-4.5 8.25c-2.83-2.7-4.5-5.84-4.5-8.25s1.67-5.55 4.5-8.25Zm0 0A8.25 8.25 0 1 1 3.75 12 8.25 8.25 0 0 1 12 3.75Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 3.75H7A2.25 2.25 0 0 0 4.75 6v12A2.25 2.25 0 0 0 7 20.25h10A2.25 2.25 0 0 0 19.25 18V9l-5.25-5.25Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3.75V9h5.25M8.75 13h6.5M8.75 16.25h6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3.75v10.5m0 0 4-4m-4 4-4-4M4.75 15.75V18A2.25 2.25 0 0 0 7 20.25h10A2.25 2.25 0 0 0 19.25 18v-2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M2.75 12S6.5 5.75 12 5.75 21.25 12 21.25 12 17.5 18.25 12 18.25 2.75 12 2.75 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="m16.86 4.49 2.65 2.65M7 17l3.15-.35L19 7.8a1.87 1.87 0 0 0 0-2.65l-.15-.15a1.87 1.87 0 0 0-2.65 0l-8.86 8.85L7 17Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16m-10 4v5m4-5v5M9 4h6l1 3H8l1-3Zm-1 3h8l-.7 11.2a2 2 0 0 1-2 1.8h-2.6a2 2 0 0 1-2-1.8L8 7Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function extractLinkValue(link) {
  if (!link) {
    return "";
  }

  return typeof link === "string" ? link : link.url || "";
}

function labelForLink(link) {
  const url = extractLinkValue(link);

  if (!url) {
    return "Link";
  }

  if (typeof link === "object" && link?.platform) {
    return String(link.platform).replace(/^\w/, (match) => match.toUpperCase());
  }

  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return "Link";
  }
}

function inferDocumentMeta(source, index) {
  const value = assetUrl(source);
  const lowerValue = String(source || "").toLowerCase();
  const isPdf = lowerValue.includes("application/pdf") || lowerValue.endsWith(".pdf");
  const extensionMatch = lowerValue.match(/\.([a-z0-9]+)(?:$|\?)/i);
  const extension = extensionMatch?.[1]?.toUpperCase() || (isPdf ? "PDF" : "FILE");

  return {
    id: `${index}-${extension}`,
    href: value,
    label: isPdf ? `Pitch document ${index + 1}` : `Document ${index + 1}`,
    type: extension,
    isPdf
  };
}

function IconActionButton({ icon, label, active = false, onClick, disabled = false }) {
  return (
    <button
      className={
        active
          ? "flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
          : "flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-zinc-200 bg-white text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-60"
      }
      title={label}
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  );
}

export function StartupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshProfile, user } = useAuth();
  const [startup, setStartup] = useState(null);
  const [comments, setComments] = useState([]);
  const [canComment, setCanComment] = useState(false);
  const [amount, setAmount] = useState("5");
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reactionSubmitting, setReactionSubmitting] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [ownerActionSubmitting, setOwnerActionSubmitting] = useState("");
  const [performanceSubmitting, setPerformanceSubmitting] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [performanceForm, setPerformanceForm] = useState({
    monthlyRevenue: "",
    monthlyExpenses: "",
    growthRate: ""
  });
  const [manualValuation, setManualValuation] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    apiRequest(`/startups/${id}`)
      .then((data) => {
        setStartup(data.startup);
        setComments(data.comments || []);
        setCanComment(Boolean(data.canComment));
        setPerformanceForm({
          monthlyRevenue: data.startup.financials?.monthlyRevenue ? String(data.startup.financials.monthlyRevenue) : "",
          monthlyExpenses: data.startup.financials?.monthlyExpenses ? String(data.startup.financials.monthlyExpenses) : "",
          growthRate: data.startup.traction?.growthRate ? String(data.startup.traction.growthRate) : ""
        });
        setManualValuation(
          data.startup.valuation?.currentValuation ? String(data.startup.valuation.currentValuation) : ""
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleInvest(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const data = await apiRequest("/investments", {
        method: "POST",
        body: {
          startupId: id,
          amount: Number(amount)
        }
      });
      setStartup((current) => ({
        ...current,
        ...data.startup,
        funding: data.startup.funding || current?.funding
      }));
      await refreshProfile();
      setSuccess(`Investment recorded for ${formatTokens(amount)}.`);
      setAmount("5");
      setCanComment(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReaction(type) {
    if (!user) {
      setError("Login to interact with startups");
      return;
    }

    setReactionSubmitting(type);
    setError("");
    setSuccess("");

    const endpointMap = {
      like: startup?.isLiked ? "unlike" : "like",
      save: startup?.isSaved ? "unsave" : "save"
    };

    try {
      const data = await apiRequest(`/startups/${id}/${endpointMap[type]}`, {
        method: "POST"
      });
      setStartup(data.startup);
      setSuccess(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setReactionSubmitting("");
    }
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();
    setCommentSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const data = await apiRequest(`/startups/${id}/comment`, {
        method: "POST",
        body: {
          text: commentText
        }
      });

      setComments((current) => [data.comment, ...current]);
      setCommentText("");
      setSuccess(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function handleShare() {
    const shareUrl = window.location.href;
    setError("");
    setSuccess("");

    try {
      if (navigator.share) {
        await navigator.share({
          title: startup?.name || "NayaShare startup",
          text: startup?.tagline || startup?.description || "Check out this startup",
          url: shareUrl
        });
        setSuccess("Shared successfully");
        return;
      }

      setShareOpen(true);
    } catch (err) {
      if (err?.name !== "AbortError") {
        setError("Unable to open sharing options");
      }
    }
  }

  async function handleCopyShareLink() {
    const shareUrl = window.location.href;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "absolute";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setSuccess("Link copied");
      setShareOpen(false);
    } catch (err) {
      setError("Unable to copy link");
    }
  }

  async function handleDeleteStartup() {
    const confirmed = window.confirm("Delete this startup? This cannot be undone.");

    if (!confirmed) {
      return;
    }

    setOwnerActionSubmitting("delete");
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/startups/${id}`, {
        method: "DELETE"
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setOwnerActionSubmitting("");
    }
  }

  async function handlePerformanceSubmit(event) {
    event.preventDefault();
    setPerformanceSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const data = await apiRequest(`/startups/${id}/performance-update`, {
        method: "POST",
        body: {
          monthlyRevenue: Number(performanceForm.monthlyRevenue),
          monthlyExpenses: Number(performanceForm.monthlyExpenses),
          growthRate: Number(performanceForm.growthRate)
        }
      });
      setSuccess(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setPerformanceSubmitting(false);
    }
  }

  async function handleManualValuationSave() {
    setOwnerActionSubmitting("valuation");
    setError("");
    setSuccess("");

    try {
      const data = await apiRequest(`/admin/startups/${id}/valuation`, {
        method: "PUT",
        body: {
          currentValuation: Number(manualValuation)
        }
      });
      setStartup(data.startup);
      setManualValuation(String(data.startup.valuation?.currentValuation || ""));
      setSuccess(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setOwnerActionSubmitting("");
    }
  }

  const documentItems = useMemo(() => {
    const sources = [startup?.media?.pitchDeck, ...(startup?.media?.documents || [])].filter(Boolean);
    return sources.map((source, index) => inferDocumentMeta(source, index));
  }, [startup?.media?.documents, startup?.media?.pitchDeck]);

  const socialItems = useMemo(
    () =>
      (startup?.business?.socialLinks || [])
        .map((link, index) => ({
          id: `${labelForLink(link)}-${index}`,
          href: extractLinkValue(link),
          label: labelForLink(link)
        }))
        .filter((item) => item.href),
    [startup?.business?.socialLinks]
  );

  if (loading) {
    return <Loading label="Loading startup" />;
  }

  if (!startup) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Alert>{error || "Startup not found"}</Alert>
      </div>
    );
  }

  const isFounderOwner = user?.role === "founder" && String(startup.founder?._id || startup.founder) === user.id;
  const isAdmin = user?.role === "admin";
  const canInvest = user && !isAdmin && !isFounderOwner;
  const isPending = startup.status === "pending";
  const fundingCurrent = getFundingCurrent(startup);
  const fundingGoal = getFundingGoal(startup);
  const fundingPercent = getFundingPercent(startup);
  const remaining = getRemainingFunding(startup);
  const coverImage = startup.media?.coverImage || startupImage(startup);
  const logoImage = startup.media?.logo ? assetUrl(startup.media.logo) : "";
  const socialLinks = startup.business?.socialLinks || [];
  const infoCards = [
    ["Category", formatStructuredValue(startup.category, "General")],
    ["Industry", formatStructuredValue(startup.classification?.industry, "Not set")],
    ["Stage", startup.classification?.stage || "Not set"],
    ["Status", startup.status || "pending"]
  ];
  const valuationRows = [
    ["Initial valuation", formatCurrency(startup.valuation?.initialValuation || startup.initialValuation || 0)],
    ["Current valuation", formatCurrency(startup.valuation?.currentValuation || startup.currentValuation || 0)],
    ["Valuation mode", startup.valuation?.valuationMode || "auto"]
  ];
  const fundingRows = [
    ["Goal", formatCurrency(fundingGoal)],
    ["Current", formatCurrency(fundingCurrent)],
    ["Equity", startup.funding?.equityOffered ? `${startup.funding.equityOffered}%` : "Not set"],
    ["Deadline", startup.funding?.deadline ? formatDate(startup.funding.deadline) : "Not set"]
  ];
  const financialRows = [
    ["Monthly revenue", startup.financials?.monthlyRevenue ? formatCurrency(startup.financials.monthlyRevenue) : "Not set"],
    ["Yearly revenue", startup.financials?.yearlyRevenue ? formatCurrency(startup.financials.yearlyRevenue) : "Not set"],
    ["Monthly expenses", startup.financials?.monthlyExpenses ? formatCurrency(startup.financials.monthlyExpenses) : "Not set"],
    ["Profit margin", startup.financials?.profitMargin ? `${startup.financials.profitMargin}%` : "Not set"],
    ["Burn rate", startup.financials?.burnRate ? formatCurrency(startup.financials.burnRate) : "Not set"],
    ["Runway", startup.financials?.runwayMonths ? `${startup.financials.runwayMonths} months` : "Not set"]
  ];
  const tractionRows = [
    ["Users", startup.traction?.users ?? "Not set"],
    ["Revenue", startup.traction?.revenue ? formatCurrency(startup.traction.revenue) : "Not set"],
    ["Growth rate", startup.traction?.growthRate ? `${startup.traction.growthRate}%` : "Not set"]
  ];
  const shareUrl = encodeURIComponent(typeof window !== "undefined" ? window.location.href : "");
  const shareText = encodeURIComponent(startup.name || "NayaShare startup");
  const shareLinks = [
    ["WhatsApp", `https://wa.me/?text=${shareText}%20${shareUrl}`],
    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`],
    ["Twitter/X", `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`],
    ["LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`]
  ];
  const locationLabel = [
    startup.classification?.location?.city,
    startup.classification?.location?.district,
    startup.classification?.location?.province
  ]
    .filter(Boolean)
    .join(", ");
  const operatingRows = [
    ["Funding goal", formatCurrency(fundingGoal)],
    ["Raised", formatCurrency(fundingCurrent)],
    ["Location", locationLabel || "Not set"],
    ["Equity offered", startup.funding?.equityOffered ? `${startup.funding.equityOffered}%` : "Not set"],
    ["Deadline", startup.funding?.deadline ? formatDate(startup.funding.deadline) : "Not set"]
  ];
  const problemSolutionRows = [
    {
      key: "problem",
      label: "Problem statement",
      value: startup.problem?.problemStatement || "Not set"
    },
    {
      key: "solution",
      label: "Solution",
      value: startup.problem?.solution || "Not set"
    },
    {
      key: "uvp",
      label: "Unique value proposition",
      value: startup.problem?.uniqueValueProposition || "Not set"
    }
  ];

  return (
    <section className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.08),_transparent_26%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="relative h-[300px] overflow-hidden rounded-[2.25rem] border border-zinc-200 bg-white shadow-soft sm:h-[340px]">
              <img className="h-full w-full object-cover object-center" src={coverImage} alt={`${startup.name} cover`} />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/35 to-transparent" />
              <div className="absolute inset-0 flex items-end p-6 text-white sm:p-8">
                <div className="flex min-h-[130px] w-full flex-wrap items-end gap-4 sm:min-h-[150px] sm:gap-5">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.6rem] border-4 border-white/90 bg-white p-2 shadow-soft sm:h-28 sm:w-28 sm:p-3">
                    {logoImage ? (
                      <img className="h-full w-full object-contain" src={logoImage} alt={`${startup.name} logo`} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-emerald-100 text-2xl font-black text-emerald-900">
                        {(startup.name || "S").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 max-w-3xl flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100 backdrop-blur">
                        {formatStructuredValue(startup.category, "General")}
                      </span>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/85 backdrop-blur">
                        {formatStructuredValue(startup.classification?.industry, "Industry")}
                      </span>
                    </div>
                    <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">{startup.name}</h1>
                    <p
                      className="mt-3 max-w-2xl text-sm leading-7 text-zinc-100 sm:text-base"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                    >
                      {startup.basicInfo?.tagline || startup.tagline || "No tagline yet."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Overview</p>
                  <p className="mt-3 text-sm text-zinc-500">
                    Founder:{" "}
                    {startup.founder?._id ? (
                      <Link className="font-semibold text-emerald-700 hover:text-emerald-900" to={`/user/${startup.founder._id}`}>
                        {startup.founder?.name || "Founder account"}
                      </Link>
                    ) : (
                      startup.founder?.name || "Founder account"
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className="rounded-[1.2rem] bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900">
                    {startup.likesCount || 0} likes
                  </span>
                  <span className="rounded-[1.2rem] bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-900">
                    {startup.savesCount || 0} saves
                  </span>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {infoCards.map(([label, value]) => (
                  <div key={label} className="rounded-[1.4rem] bg-zinc-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
                    <p className="mt-2 text-sm font-semibold text-zinc-950">{value}</p>
                  </div>
                ))}
              </div>
              {(startup.basicInfo?.tagline || startup.tagline) && (
                <p className="mt-6 text-xl font-semibold text-zinc-900">{startup.basicInfo?.tagline || startup.tagline}</p>
              )}
              <p
                className="mt-5 min-h-[96px] whitespace-pre-wrap text-base leading-8 text-zinc-700"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}
              >
                {startup.description}
              </p>
              <div className="mt-8 space-y-6">
                <div className="rounded-[1.8rem] border border-zinc-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.8),rgba(255,255,255,1))] p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Problem and solution</p>
                  <div className="mt-4 space-y-3">
                    {problemSolutionRows.map((item) => (
                      <button
                        key={item.key}
                        className="block w-full rounded-[1.3rem] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        type="button"
                        onClick={() => setDetailModal(item)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{item.label}</p>
                            <p
                              className="mt-3 text-sm leading-7 text-zinc-700"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden"
                              }}
                            >
                              {item.value}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600">
                            View
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Documents and files</p>
                  <div className="mt-4 flex flex-col gap-3">
                    {documentItems.length ? (
                      documentItems.map((item) => (
                        <div className="rounded-[1.2rem] bg-white p-4 shadow-sm" key={item.id}>
                          <div className="flex min-h-[96px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <DocumentIcon />
                                <p className="truncate text-sm font-semibold text-zinc-950">{item.label}</p>
                              </div>
                              <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{item.type}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              <a
                                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                                href={item.href}
                                rel="noreferrer"
                                target="_blank"
                              >
                                <EyeIcon />
                                View
                              </a>
                              <a
                                className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                                href={item.href}
                                download
                              >
                                <DownloadIcon />
                                Download
                              </a>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1.2rem] bg-white px-4 py-4 text-sm text-zinc-500 shadow-sm">No documents uploaded yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Operating snapshot</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {operatingRows.map(([label, value]) => (
                    <div key={label} className="flex min-h-[104px] flex-col justify-between rounded-[1.4rem] bg-zinc-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
                      <p className="mt-3 text-sm font-semibold leading-6 text-zinc-950">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Valuation</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {valuationRows.map(([label, value]) => (
                    <div key={label} className="flex min-h-[120px] flex-col justify-between rounded-[1.4rem] bg-zinc-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
                      <p className="mt-3 text-sm font-semibold leading-6 text-zinc-950">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Financials</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {financialRows.map(([label, value]) => (
                    <div key={label} className="rounded-[1.4rem] bg-zinc-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
                      <p className="mt-2 text-sm font-semibold text-zinc-950">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Traction</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {tractionRows.map(([label, value]) => (
                    <div key={label} className="rounded-[1.4rem] bg-zinc-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
                      <p className="mt-2 text-sm font-semibold text-zinc-950">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Comments</p>
                  <h2 className="mt-2 text-2xl font-black text-zinc-950">Investor discussion</h2>
                </div>
                <span className="rounded-[1.2rem] bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700">
                  {comments.length} comments
                </span>
              </div>

              {canComment ? (
                <form className="mt-6 space-y-3 border-t border-zinc-200 pt-5" onSubmit={handleCommentSubmit}>
                  <label className="form-label">
                    Add a comment
                    <textarea
                      className="input min-h-28 resize-y"
                      maxLength={1000}
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      required
                    />
                  </label>
                  <button className="btn-primary" type="submit" disabled={commentSubmitting}>
                    {commentSubmitting ? "Posting..." : "Post comment"}
                  </button>
                </form>
              ) : user ? (
                <div className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                  Only users who invested in this startup can comment.
                </div>
              ) : (
                <div className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                  Login and invest in this startup to join the discussion.
                </div>
              )}

              <div className="mt-6 space-y-4">
                {comments.length ? (
                  comments.map((comment) => {
                    const authorImage = assetUrl(comment.user?.profileImage || comment.user?.avatar);

                    return (
                      <article className="rounded-[1.6rem] border border-zinc-200 bg-zinc-50 p-4" key={comment._id}>
                        <div className="flex items-start gap-3">
                          {authorImage ? (
                            <img
                              className="h-11 w-11 rounded-full object-cover"
                              src={authorImage}
                              alt={`${comment.user?.name || "User"} profile`}
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-900">
                              {(comment.user?.name || "U").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {comment.user?._id ? (
                                <Link className="font-semibold text-zinc-950 hover:text-emerald-700" to={`/users/${comment.user._id}`}>
                                  {comment.user?.name || "User"}
                                </Link>
                              ) : (
                                <span className="font-semibold text-zinc-950">{comment.user?.name || "User"}</span>
                              )}
                              <span className="text-sm text-zinc-500">{formatDate(comment.createdAt)}</span>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-700">{comment.text}</p>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-zinc-500">
                    No comments yet.
                  </div>
                )}
              </div>
            </div>
          </div>
          <aside className="h-fit lg:sticky lg:top-24">
            <div className="grid gap-4">
              <Alert>{error}</Alert>
              <Alert type="success">{success}</Alert>
              <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(255,255,255,1))] p-5 xl:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Funding status</p>
                    <p className="mt-3 text-4xl font-black text-zinc-950">{formatCurrency(fundingCurrent)}</p>
                    <p className="mt-2 text-sm text-zinc-500">raised of {formatCurrency(fundingGoal)} goal</p>
                    <div className="mt-5">
                      <ProgressBar value={fundingPercent} />
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] bg-zinc-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Funded</p>
                    <p className="mt-2 text-2xl font-black text-zinc-950">{fundingPercent}%</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-zinc-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Remaining</p>
                    <p className="mt-2 text-2xl font-black text-zinc-950">{formatCurrency(remaining)}</p>
                  </div>
                  {user && (
                    <div className="rounded-[1.5rem] bg-zinc-50 p-5 xl:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Wallet</p>
                      <p className="mt-2 text-2xl font-black text-zinc-950">{formatTokens(user.walletBalance)}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Actions</p>
                <p className="mt-1 text-sm text-zinc-500">Quick interactions for this startup.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <IconActionButton
                    icon={<HeartIcon />}
                    label={startup.isLiked ? "Unlike" : "Like"}
                    active={startup.isLiked}
                    disabled={Boolean(reactionSubmitting)}
                    onClick={() => handleReaction("like")}
                  />
                  <IconActionButton
                    icon={<BookmarkIcon />}
                    label={startup.isSaved ? "Unsave" : "Save"}
                    active={startup.isSaved}
                    disabled={Boolean(reactionSubmitting)}
                    onClick={() => handleReaction("save")}
                  />
                  <IconActionButton icon={<ShareIcon />} label="Share" onClick={handleShare} />
                  {documentItems[0] ? (
                    <a
                      className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-zinc-200 bg-white text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                      href={documentItems[0].href}
                      rel="noreferrer"
                      target="_blank"
                      title="View pitch deck"
                    >
                      <DocumentIcon />
                      <span className="sr-only">View pitch deck</span>
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Links</p>
                <div className="mt-4 space-y-3">
                  {startup.business?.website ? (
                    <a
                      className="flex min-h-[64px] items-center gap-3 rounded-[1.2rem] bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:text-emerald-700"
                      href={startup.business.website}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <GlobeIcon />
                      <span className="truncate">{startup.business.website}</span>
                    </a>
                  ) : null}
                  {socialItems.length ? (
                    socialItems.map((item) => (
                      <a
                        key={item.id}
                        className="flex min-h-[64px] items-center gap-3 rounded-[1.2rem] bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:text-emerald-700"
                        href={item.href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <GlobeIcon />
                        <span className="truncate">{item.label}</span>
                      </a>
                    ))
                  ) : !startup.business?.website ? (
                    <div className="rounded-[1.2rem] bg-zinc-50 px-4 py-4 text-sm text-zinc-500 shadow-sm">No links added yet.</div>
                  ) : null}
                </div>
              </div>
              {isFounderOwner && isPending && (
                <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Founder controls</p>
                  <div className="mt-5 flex gap-3">
                    <Link
                      className="inline-flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
                      to={`/startups/${startup._id}/edit`}
                      title="Edit startup"
                    >
                      <EditIcon />
                    </Link>
                    <button
                      className="inline-flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                      type="button"
                      disabled={Boolean(ownerActionSubmitting)}
                      onClick={handleDeleteStartup}
                      title="Delete startup"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              )}
              {isFounderOwner && startup.status === "active" && (
                <form className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft space-y-3" onSubmit={handlePerformanceSubmit}>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Update performance</p>
                    <p className="mt-1 text-sm text-zinc-500">Submit revised operating metrics for admin review.</p>
                  </div>
                  <label className="form-label">
                    Monthly revenue
                    <input
                      className="input"
                      min="0"
                      step="0.01"
                      type="number"
                      value={performanceForm.monthlyRevenue}
                      onChange={(event) => setPerformanceForm((current) => ({ ...current, monthlyRevenue: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="form-label">
                    Monthly expenses
                    <input
                      className="input"
                      min="0"
                      step="0.01"
                      type="number"
                      value={performanceForm.monthlyExpenses}
                      onChange={(event) => setPerformanceForm((current) => ({ ...current, monthlyExpenses: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="form-label">
                    Growth rate %
                    <input
                      className="input"
                      step="0.01"
                      type="number"
                      value={performanceForm.growthRate}
                      onChange={(event) => setPerformanceForm((current) => ({ ...current, growthRate: event.target.value }))}
                      required
                    />
                  </label>
                  <button className="btn-primary w-full" type="submit" disabled={performanceSubmitting}>
                    {performanceSubmitting ? "Submitting..." : "Update Performance"}
                  </button>
                </form>
              )}
              {isAdmin && startup.valuation?.valuationMode === "manual" && (
                <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft space-y-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Manual valuation</p>
                    <p className="mt-1 text-sm text-zinc-500">Set the current valuation directly for manual-mode startups.</p>
                  </div>
                  <label className="form-label">
                    Current valuation
                    <input
                      className="input"
                      min="0"
                      step="0.01"
                      type="number"
                      value={manualValuation}
                      onChange={(event) => setManualValuation(event.target.value)}
                    />
                  </label>
                  <button
                    className="btn-primary w-full"
                    type="button"
                    disabled={ownerActionSubmitting === "valuation"}
                    onClick={handleManualValuationSave}
                  >
                    {ownerActionSubmitting === "valuation" ? "Saving..." : "Save Valuation"}
                  </button>
                </div>
              )}
              {canInvest ? (
                <form className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft space-y-3" onSubmit={handleInvest}>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Invest now</p>
                    <p className="mt-1 text-sm text-zinc-500">Allocate tokens directly from your wallet.</p>
                  </div>
                  <label className="form-label">
                    Invest tokens
                    <input
                      className="input"
                      min="1"
                      step="1"
                      type="number"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      required
                    />
                  </label>
                  <p className="text-sm text-zinc-500">1 token = NPR 100</p>
                  <button className="btn-primary w-full" type="submit" disabled={submitting}>
                    {submitting ? "Processing..." : "Invest"}
                  </button>
                </form>
              ) : user && !isAdmin ? (
                <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 text-sm text-zinc-700 shadow-soft">
                  You cannot invest in your own startup.
                </div>
              ) : isAdmin ? (
                <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 text-sm text-zinc-700 shadow-soft">
                  Admin accounts can review startups here but cannot invest.
                </div>
              ) : (
                <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
                  <Link className="btn-primary block text-center" to="/login">
                    Login to invest
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 px-4" onClick={() => setShareOpen(false)}>
          <div className="w-full max-w-md rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase text-emerald-700">Share</p>
                <h2 className="mt-2 text-2xl font-black text-zinc-950">{startup.name}</h2>
              </div>
              <button className="text-sm font-semibold text-zinc-500 hover:text-zinc-900" type="button" onClick={() => setShareOpen(false)}>
                Close
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {shareLinks.map(([label, href]) => (
                <a
                  key={label}
                  className="btn-secondary text-center"
                  href={href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {label}
                </a>
              ))}
            </div>
            <button className="btn-primary mt-4 w-full" type="button" onClick={handleCopyShareLink}>
              Copy link
            </button>
          </div>
        </div>
      )}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 px-4" onClick={() => setDetailModal(null)}>
          <div
            className="w-full max-w-2xl rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Startup detail</p>
                <h2 className="mt-2 text-2xl font-black text-zinc-950">{detailModal.label}</h2>
              </div>
              <button
                className="rounded-full border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
                type="button"
                onClick={() => setDetailModal(null)}
              >
                Close
              </button>
            </div>
            <div className="mt-5 rounded-[1.4rem] bg-zinc-50 p-5">
              <p className="whitespace-pre-wrap text-sm leading-8 text-zinc-700">{detailModal.value}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
