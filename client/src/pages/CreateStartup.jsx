import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest, assetUrl } from "../api/client.js";
import { Alert } from "../components/Alert.jsx";
import { SearchableSelectInput } from "../components/SearchableSelectInput.jsx";
import { CATEGORY_OPTIONS, INDUSTRY_OPTIONS, NEPAL_LOCATION_TREE } from "../data/startupMetadata.js";
import { formatStructuredValue, normalizeStructuredValue } from "../utils/startupMetadata.js";

const SOCIAL_PLATFORM_OPTIONS = [
  { value: "linkedin", label: "LinkedIn", badge: "in", className: "bg-sky-100 text-sky-800" },
  { value: "instagram", label: "Instagram", badge: "ig", className: "bg-pink-100 text-pink-800" },
  { value: "facebook", label: "Facebook", badge: "f", className: "bg-blue-100 text-blue-800" },
  { value: "x", label: "X / Twitter", badge: "x", className: "bg-zinc-100 text-zinc-800" },
  { value: "youtube", label: "YouTube", badge: "yt", className: "bg-rose-100 text-rose-800" },
  { value: "github", label: "GitHub", badge: "gh", className: "bg-violet-100 text-violet-800" },
  { value: "website", label: "Website", badge: "www", className: "bg-emerald-100 text-emerald-800" }
];

const initialForm = {
  basicInfo: {
    name: "",
    tagline: "",
    description: ""
  },
  classification: {
    category: "General",
    industry: "",
    stage: "idea",
    location: {
      province: "",
      district: "",
      city: ""
    }
  },
  problem: {
    problemStatement: "",
    solution: "",
    uniqueValueProposition: ""
  },
  business: {
    website: "",
    socialLinks: [{ platform: "linkedin", url: "" }]
  },
  funding: {
    goal: "",
    equityOffered: "",
    deadline: ""
  },
  financials: {
    monthlyRevenue: "",
    yearlyRevenue: "",
    monthlyExpenses: "",
    profitMargin: "",
    burnRate: "",
    runwayMonths: ""
  },
  traction: {
    users: "",
    revenue: "",
    growthRate: ""
  },
  valuation: {
    initialValuation: "",
    valuationMode: "auto"
  },
  media: {
    logo: "",
    coverImage: "",
    pitchDeck: "",
    documents: []
  }
};

const initialMediaMeta = {
  logoName: "",
  coverImageName: "",
  pitchDeckName: "",
  documentNames: []
};

const steps = [
  { id: "basic", title: "Basic Info", description: "Tell investors what the startup does and why it matters." },
  { id: "classification", title: "Classification", description: "Place the startup correctly for marketplace discovery." },
  { id: "problem", title: "Problem & Business", description: "Explain the problem, solution, and public channels." },
  { id: "financials", title: "Financials & Traction", description: "Add the funding target and the key operating metrics." },
  { id: "media", title: "Media", description: "Upload the visual identity and supporting files." },
  { id: "review", title: "Review & Submit", description: "Pause, review the payload, and submit with confidence." }
];

function toNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function updateNestedValue(target, path, value) {
  const keys = path.split(".");
  const clone = { ...target };
  let current = clone;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
      return;
    }

    current[key] = { ...(current[key] || {}) };
    current = current[key];
  });

  return clone;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function getRequiredFields(index) {
  if (index === 0) {
    return ["Startup name", "Tagline", "Description"];
  }

  if (index === 1) {
    return ["Category", "Industry", "Stage"];
  }

  if (index === 3) {
    return ["Funding goal", "Initial valuation"];
  }

  return [];
}

function inferSocialPlatform(url = "") {
  const normalized = url.toLowerCase();

  if (normalized.includes("linkedin")) {
    return "linkedin";
  }
  if (normalized.includes("instagram")) {
    return "instagram";
  }
  if (normalized.includes("facebook")) {
    return "facebook";
  }
  if (normalized.includes("twitter") || normalized.includes("x.com")) {
    return "x";
  }
  if (normalized.includes("youtube")) {
    return "youtube";
  }
  if (normalized.includes("github")) {
    return "github";
  }

  return "website";
}

function resolveSocialPlatform(platform) {
  return SOCIAL_PLATFORM_OPTIONS.find((option) => option.value === platform) || SOCIAL_PLATFORM_OPTIONS.at(-1);
}

function buildPayload(form) {
  const socialLinks = form.business.socialLinks
    .map((item) => item.url.trim())
    .filter(Boolean);

  return {
    basicInfo: {
      name: form.basicInfo.name.trim(),
      tagline: form.basicInfo.tagline.trim(),
      description: form.basicInfo.description.trim()
    },
    classification: {
      category: normalizeStructuredValue(form.classification.category),
      industry: normalizeStructuredValue(form.classification.industry),
      stage: form.classification.stage,
      location: {
        province: normalizeStructuredValue(form.classification.location.province),
        district: normalizeStructuredValue(form.classification.location.district),
        city: normalizeStructuredValue(form.classification.location.city)
      }
    },
    problem: {
      problemStatement: form.problem.problemStatement.trim(),
      solution: form.problem.solution.trim(),
      uniqueValueProposition: form.problem.uniqueValueProposition.trim()
    },
    business: {
      website: form.business.website.trim(),
      socialLinks
    },
    funding: {
      goal: toNumber(form.funding.goal),
      equityOffered: toNumber(form.funding.equityOffered),
      deadline: form.funding.deadline || undefined
    },
    financials: {
      monthlyRevenue: toNumber(form.financials.monthlyRevenue),
      yearlyRevenue: toNumber(form.financials.yearlyRevenue),
      monthlyExpenses: toNumber(form.financials.monthlyExpenses),
      profitMargin: toNumber(form.financials.profitMargin),
      burnRate: toNumber(form.financials.burnRate),
      runwayMonths: toNumber(form.financials.runwayMonths)
    },
    traction: {
      users: toNumber(form.traction.users),
      revenue: toNumber(form.traction.revenue),
      growthRate: toNumber(form.traction.growthRate)
    },
    valuation: {
      initialValuation: toNumber(form.valuation.initialValuation) ?? 0,
      currentValuation: toNumber(form.valuation.initialValuation) ?? 0,
      valuationMode: form.valuation.valuationMode
    },
    media: {
      logo: form.media.logo.trim(),
      coverImage: form.media.coverImage.trim(),
      pitchDeck: form.media.pitchDeck.trim(),
      documents: form.media.documents.filter(Boolean)
    }
  };
}

function buildFormFromStartup(startup) {
  const socialLinks = (startup.business?.socialLinks || []).map((url) => ({
    platform: inferSocialPlatform(url),
    url
  }));

  return {
    basicInfo: {
      name: startup.basicInfo?.name || startup.name || "",
      tagline: startup.basicInfo?.tagline || startup.tagline || "",
      description: startup.basicInfo?.description || startup.description || ""
    },
    classification: {
      category: formatStructuredValue(startup.classification?.category || startup.category, "General"),
      industry: formatStructuredValue(startup.classification?.industry || startup.industry),
      stage: startup.classification?.stage || startup.stage || "idea",
      location: {
        province: formatStructuredValue(startup.classification?.location?.province),
        district: formatStructuredValue(startup.classification?.location?.district),
        city: formatStructuredValue(startup.classification?.location?.city)
      }
    },
    problem: {
      problemStatement: startup.problem?.problemStatement || "",
      solution: startup.problem?.solution || "",
      uniqueValueProposition: startup.problem?.uniqueValueProposition || ""
    },
    business: {
      website: startup.business?.website || "",
      socialLinks: socialLinks.length ? socialLinks : [{ platform: "linkedin", url: "" }]
    },
    funding: {
      goal: startup.funding?.goal ? String(startup.funding.goal) : "",
      equityOffered: startup.funding?.equityOffered ? String(startup.funding.equityOffered) : "",
      deadline: startup.funding?.deadline ? new Date(startup.funding.deadline).toISOString().split("T")[0] : ""
    },
    financials: {
      monthlyRevenue: startup.financials?.monthlyRevenue ? String(startup.financials.monthlyRevenue) : "",
      yearlyRevenue: startup.financials?.yearlyRevenue ? String(startup.financials.yearlyRevenue) : "",
      monthlyExpenses: startup.financials?.monthlyExpenses ? String(startup.financials.monthlyExpenses) : "",
      profitMargin: startup.financials?.profitMargin ? String(startup.financials.profitMargin) : "",
      burnRate: startup.financials?.burnRate ? String(startup.financials.burnRate) : "",
      runwayMonths: startup.financials?.runwayMonths ? String(startup.financials.runwayMonths) : ""
    },
    traction: {
      users: startup.traction?.users ? String(startup.traction.users) : "",
      revenue: startup.traction?.revenue ? String(startup.traction.revenue) : "",
      growthRate: startup.traction?.growthRate ? String(startup.traction.growthRate) : ""
    },
    valuation: {
      initialValuation: startup.valuation?.initialValuation ? String(startup.valuation.initialValuation) : "",
      valuationMode: startup.valuation?.valuationMode || "auto"
    },
    media: {
      logo: startup.media?.logo || "",
      coverImage: startup.media?.coverImage || startup.images?.[0] || "",
      pitchDeck: startup.media?.pitchDeck || "",
      documents: startup.media?.documents || []
    }
  };
}

function buildMediaMetaFromStartup(startup) {
  const documents = startup.media?.documents || [];

  return {
    logoName: startup.media?.logo ? "Existing logo asset" : "",
    coverImageName: startup.media?.coverImage || startup.images?.[0] ? "Existing cover asset" : "",
    pitchDeckName: startup.media?.pitchDeck ? "Existing pitch deck" : "",
    documentNames: documents.map((_, index) => `Existing document ${index + 1}`)
  };
}

function reviewItems(payload, form, mediaMeta) {
  return [
    {
      title: "Basic Info",
      rows: [
        ["Name", payload.basicInfo.name || "Not set"],
        ["Tagline", payload.basicInfo.tagline || "Not set"],
        ["Description", payload.basicInfo.description || "Not set"]
      ]
    },
    {
      title: "Classification",
      rows: [
        ["Category", formatStructuredValue(payload.classification.category, "Not set")],
        ["Industry", formatStructuredValue(payload.classification.industry, "Not set")],
        ["Stage", payload.classification.stage || "Not set"],
        [
          "Location",
          [
            formatStructuredValue(payload.classification.location.province),
            formatStructuredValue(payload.classification.location.district),
            formatStructuredValue(payload.classification.location.city)
          ]
            .filter(Boolean)
            .join(", ") || "Not set"
        ]
      ]
    },
    {
      title: "Problem & Business",
      rows: [
        ["Problem", payload.problem.problemStatement || "Not set"],
        ["Solution", payload.problem.solution || "Not set"],
        ["Unique value proposition", payload.problem.uniqueValueProposition || "Not set"],
        ["Website", payload.business.website || "Not set"],
        [
          "Social links",
          form.business.socialLinks
            .filter((item) => item.url.trim())
            .map((item) => `${resolveSocialPlatform(item.platform).label}: ${item.url.trim()}`)
            .join("\n") || "Not set"
        ]
      ]
    },
    {
      title: "Financials & Traction",
      rows: [
        ["Funding Goal", payload.funding.goal ?? "Not set"],
        ["Equity Offered", payload.funding.equityOffered ?? "Not set"],
        ["Funding Deadline", payload.funding.deadline || "Not set"],
        ["Monthly Revenue", payload.financials.monthlyRevenue ?? "Not set"],
        ["Monthly Expenses", payload.financials.monthlyExpenses ?? "Not set"],
        ["Growth Rate", payload.traction.growthRate ?? "Not set"],
        ["Runway Months", payload.financials.runwayMonths ?? "Not set"],
        ["Initial Valuation", payload.valuation.initialValuation ?? "Not set"],
        ["Valuation Mode", payload.valuation.valuationMode || "auto"]
      ]
    },
    {
      title: "Media",
      rows: [
        ["Logo", mediaMeta.logoName || (payload.media.logo ? "Asset ready" : "Not set")],
        ["Cover Image", mediaMeta.coverImageName || (payload.media.coverImage ? "Asset ready" : "Not set")],
        ["Pitch Deck", mediaMeta.pitchDeckName || (payload.media.pitchDeck ? "Asset ready" : "Not set")],
        ["Documents", mediaMeta.documentNames.join(", ") || (payload.media.documents.length ? `${payload.media.documents.length} file(s)` : "Not set")]
      ]
    }
  ];
}

function RequiredBadge() {
  return <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-rose-700">Required</span>;
}

function SectionFrame({ eyebrow, title, description, requiredFields, children }) {
  return (
    <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>
          <h3 className="mt-2 text-2xl font-black text-zinc-950">{title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">{description}</p>
        </div>
        {requiredFields.length ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <p className="font-bold uppercase tracking-[0.14em]">Required in this step</p>
            <p className="mt-2">{requiredFields.join(", ")}</p>
          </div>
        ) : null}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function MediaUploadCard({ title, subtitle, accept, preview, fileName, onSelect, onClear }) {
  return (
    <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">{title}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{subtitle}</p>
        </div>
        <button className="text-sm font-semibold text-zinc-500 hover:text-zinc-900" type="button" onClick={onClear}>
          Clear
        </button>
      </div>
      {preview ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <img className="h-44 w-full object-cover" src={preview} alt={title} />
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
          No asset selected yet.
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="btn-secondary cursor-pointer">
          Choose file
          <input className="hidden" type="file" accept={accept} onChange={onSelect} />
        </label>
        <span className="text-sm text-zinc-500">{fileName || "No local file selected"}</span>
      </div>
    </div>
  );
}

export function CreateStartup() {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [mediaMeta, setMediaMeta] = useState(initialMediaMeta);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(Boolean(editId));
  const [reviewArmed, setReviewArmed] = useState(false);

  const currentStep = steps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);
  const payload = useMemo(() => buildPayload(form), [form]);
  const summarySections = useMemo(() => reviewItems(payload, form, mediaMeta), [payload, form, mediaMeta]);
  const requiredFields = useMemo(() => getRequiredFields(stepIndex), [stepIndex]);
  const selectedProvince = useMemo(
    () => NEPAL_LOCATION_TREE.find((province) => province.value === normalizeStructuredValue(form.classification.location.province)) || null,
    [form.classification.location.province]
  );
  const districtOptions = selectedProvince?.districts || [];
  const selectedDistrict = useMemo(
    () => districtOptions.find((district) => district.value === normalizeStructuredValue(form.classification.location.district)) || null,
    [districtOptions, form.classification.location.district]
  );
  const cityOptions = selectedDistrict?.cities || [];

  useEffect(() => {
    if (!editId) {
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError("");

    apiRequest(`/startups/${editId}`)
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setForm(buildFormFromStartup(data.startup));
        setMediaMeta(buildMediaMetaFromStartup(data.startup));
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
  }, [editId]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => updateNestedValue(current, name, value));
  }

  function updateSocialLink(index, key, value) {
    setForm((current) => ({
      ...current,
      business: {
        ...current.business,
        socialLinks: current.business.socialLinks.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [key]: value } : item
        )
      }
    }));
  }

  function addSocialLink() {
    setForm((current) => ({
      ...current,
      business: {
        ...current.business,
        socialLinks: [...current.business.socialLinks, { platform: "website", url: "" }]
      }
    }));
  }

  function removeSocialLink(index) {
    setForm((current) => ({
      ...current,
      business: {
        ...current.business,
        socialLinks:
          current.business.socialLinks.length > 1
            ? current.business.socialLinks.filter((_, itemIndex) => itemIndex !== index)
            : [{ platform: "linkedin", url: "" }]
      }
    }));
  }

  function handleProvinceChange(event) {
    const nextValue = event.target.value;

    setForm((current) => ({
      ...current,
      classification: {
        ...current.classification,
        location: {
          province: nextValue,
          district: "",
          city: ""
        }
      }
    }));
  }

  function handleDistrictChange(event) {
    const nextValue = event.target.value;

    setForm((current) => ({
      ...current,
      classification: {
        ...current.classification,
        location: {
          ...current.classification.location,
          district: nextValue,
          city: ""
        }
      }
    }));
  }

  async function handleMediaFileSelect(field, event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm((current) => ({
        ...current,
        media: {
          ...current.media,
          [field]: dataUrl
        }
      }));
      setMediaMeta((current) => ({
        ...current,
        [`${field}Name`]: file.name
      }));
      setError("");
    } catch (fileError) {
      setError(fileError.message);
    } finally {
      event.target.value = "";
    }
  }

  async function handleDocumentsSelect(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    try {
      const dataUrls = await Promise.all(files.map((file) => readFileAsDataUrl(file)));
      setForm((current) => ({
        ...current,
        media: {
          ...current.media,
          documents: dataUrls
        }
      }));
      setMediaMeta((current) => ({
        ...current,
        documentNames: files.map((file) => file.name)
      }));
      setError("");
    } catch (fileError) {
      setError(fileError.message);
    } finally {
      event.target.value = "";
    }
  }

  function clearMediaField(field) {
    setForm((current) => ({
      ...current,
      media: {
        ...current.media,
        [field]: ""
      }
    }));
    setMediaMeta((current) => ({
      ...current,
      [`${field}Name`]: ""
    }));
  }

  function clearDocuments() {
    setForm((current) => ({
      ...current,
      media: {
        ...current.media,
        documents: []
      }
    }));
    setMediaMeta((current) => ({
      ...current,
      documentNames: []
    }));
  }

  function validateStep(index) {
    const nextErrors = [];

    if (index === 0) {
      if (!form.basicInfo.name.trim()) {
        nextErrors.push("Startup name is required.");
      }
      if (!form.basicInfo.tagline.trim()) {
        nextErrors.push("Tagline is required.");
      }
      if (!form.basicInfo.description.trim()) {
        nextErrors.push("Description is required.");
      } else if (form.basicInfo.description.trim().length < 20) {
        nextErrors.push("Description must be at least 20 characters.");
      }
    }

    if (index === 1) {
      if (!form.classification.category.trim()) {
        nextErrors.push("Category is required.");
      }
      if (!form.classification.industry.trim()) {
        nextErrors.push("Industry is required.");
      }
      if (!form.classification.stage.trim()) {
        nextErrors.push("Stage is required.");
      }
    }

    if (index === 2) {
      if (form.business.website && !/^https?:\/\//i.test(form.business.website)) {
        nextErrors.push("Website must start with http:// or https://");
      }

      const invalidSocial = form.business.socialLinks.find((item) => item.url.trim() && !/^https?:\/\//i.test(item.url.trim()));
      if (invalidSocial) {
        nextErrors.push("Each social link must start with http:// or https://");
      }
    }

    if (index === 3) {
      const goal = Number(form.funding.goal);
      const initialValuation = Number(form.valuation.initialValuation);

      if (!form.funding.goal || !Number.isFinite(goal) || goal < 1) {
        nextErrors.push("Funding goal must be at least 1.");
      }

      if (form.valuation.initialValuation === "" || !Number.isFinite(initialValuation) || initialValuation < 1) {
        nextErrors.push("Initial valuation must be at least 1.");
      }
    }

    setError(nextErrors[0] || "");
    return nextErrors.length === 0;
  }

  function handleNext() {
    setFieldErrors([]);

    if (!validateStep(stepIndex)) {
      return;
    }

    setError("");
    setReviewArmed(false);
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function handlePrevious() {
    setError("");
    setFieldErrors([]);
    setReviewArmed(false);
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setFieldErrors([]);

    try {
      await apiRequest(editId ? `/startups/${editId}` : "/startups", {
        method: editId ? "PUT" : "POST",
        body: payload
      });
      navigate(editId ? `/startups/${editId}` : "/dashboard");
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.errors || []);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="bg-zinc-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">Loading startup...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Founder tools</p>
            <h1 className="mt-3 text-4xl font-black text-zinc-950">{editId ? "Edit Startup" : "Create Startup"}</h1>
            <p className="mt-3 text-base leading-7 text-zinc-600">
              Build a complete startup profile with a guided six-step workflow, stronger required-field cues, and local media
              previews.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-zinc-200 bg-white px-5 py-4 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Step progress</p>
            <p className="mt-2 text-3xl font-black text-zinc-950">{progress}%</p>
            <p className="mt-1 text-sm text-zinc-500">
              Step {stepIndex + 1} of {steps.length}
            </p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">{currentStep.title}</p>
                <p className="mt-2 text-sm text-zinc-600">{currentStep.description}</p>
              </div>
              <div className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700">{progress}% complete</div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-zinc-200">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    index === stepIndex
                      ? "bg-emerald-100 text-emerald-900"
                      : index < stepIndex
                        ? "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
                        : "bg-zinc-50 text-zinc-400"
                  }`}
                  type="button"
                  onClick={() => {
                    if (index <= stepIndex) {
                      setReviewArmed(false);
                      setStepIndex(index);
                    }
                  }}
                >
                  {step.title}
                </button>
              ))}
            </div>
          </div>

          <Alert>{error}</Alert>
          {fieldErrors.length > 0 && (
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900 shadow-soft">
              {fieldErrors.map((item) => (
                <p key={`${item.field}-${item.message}`}>{item.message}</p>
              ))}
            </div>
          )}

          {stepIndex === 0 && (
            <SectionFrame
              eyebrow="Step 1"
              title="Tell the core startup story"
              description="These fields drive the hero section, marketplace cards, and first impression for investors."
              requiredFields={requiredFields}
            >
              <div className="grid gap-5">
                <label className="form-label">
                  <span className="flex items-center gap-2">
                    Startup name
                    <RequiredBadge />
                  </span>
                  <input className="input" name="basicInfo.name" value={form.basicInfo.name} onChange={updateField} required />
                </label>
                <label className="form-label">
                  <span className="flex items-center gap-2">
                    Tagline
                    <RequiredBadge />
                  </span>
                  <input className="input" name="basicInfo.tagline" value={form.basicInfo.tagline} onChange={updateField} required />
                </label>
                <label className="form-label">
                  <span className="flex items-center gap-2">
                    Description
                    <RequiredBadge />
                  </span>
                  <textarea
                    className="input min-h-[220px] resize-y"
                    name="basicInfo.description"
                    value={form.basicInfo.description}
                    onChange={updateField}
                    required
                  />
                </label>
              </div>
            </SectionFrame>
          )}

          {stepIndex === 1 && (
            <SectionFrame
              eyebrow="Step 2"
              title="Improve discoverability"
              description="Classification data controls startup discovery, filtering, and how investors interpret your market position."
              requiredFields={requiredFields}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <label className="form-label">
                  <span className="flex items-center gap-2">
                    Category
                    <RequiredBadge />
                  </span>
                  <SearchableSelectInput
                    id="classification-category"
                    name="classification.category"
                    value={form.classification.category}
                    onChange={updateField}
                    options={CATEGORY_OPTIONS}
                    placeholder="Search or type a category"
                    helperText="Categories shape marketplace placement and search filters."
                  />
                </label>
                <label className="form-label">
                  <span className="flex items-center gap-2">
                    Industry
                    <RequiredBadge />
                  </span>
                  <SearchableSelectInput
                    id="classification-industry"
                    name="classification.industry"
                    value={form.classification.industry}
                    onChange={updateField}
                    options={INDUSTRY_OPTIONS}
                    placeholder="Search or type an industry"
                    helperText="Industry appears in investor analytics and portfolio breakdowns."
                  />
                </label>
                <label className="form-label">
                  <span className="flex items-center gap-2">
                    Stage
                    <RequiredBadge />
                  </span>
                  <select className="input" name="classification.stage" value={form.classification.stage} onChange={updateField}>
                    <option value="idea">Idea</option>
                    <option value="prototype">Prototype</option>
                    <option value="growth">Growth</option>
                  </select>
                </label>
                <div className="md:col-span-2 grid gap-5 md:grid-cols-3">
                  <label className="form-label">
                    Province
                    <select
                      className="input"
                      name="classification.location.province"
                      value={form.classification.location.province}
                      onChange={handleProvinceChange}
                    >
                      <option value="">Select a province</option>
                      {NEPAL_LOCATION_TREE.map((province) => (
                        <option key={province.value} value={province.label}>
                          {province.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-label">
                    District
                    <select
                      className="input"
                      name="classification.location.district"
                      value={form.classification.location.district}
                      onChange={handleDistrictChange}
                      disabled={!selectedProvince}
                    >
                      <option value="">{selectedProvince ? "Select a district" : "Select province first"}</option>
                      {districtOptions.map((district) => (
                        <option key={district.value} value={district.label}>
                          {district.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-label">
                    City
                    <select
                      className="input"
                      name="classification.location.city"
                      value={form.classification.location.city}
                      onChange={updateField}
                      disabled={!selectedDistrict}
                    >
                      <option value="">{selectedDistrict ? "Select a city" : "Select district first"}</option>
                      {cityOptions.map((city) => (
                        <option key={city.value} value={city.label}>
                          {city.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </SectionFrame>
          )}

          {stepIndex === 2 && (
            <SectionFrame
              eyebrow="Step 3"
              title="Problem, solution, and public links"
              description="Use this section to explain the startup clearly and present investor-facing channels in a structured way."
              requiredFields={requiredFields}
            >
              <div className="grid gap-5">
                <label className="form-label">
                  Problem statement
                  <textarea className="input min-h-32 resize-y" name="problem.problemStatement" value={form.problem.problemStatement} onChange={updateField} />
                </label>
                <label className="form-label">
                  Solution
                  <textarea className="input min-h-32 resize-y" name="problem.solution" value={form.problem.solution} onChange={updateField} />
                </label>
                <label className="form-label">
                  Unique value proposition
                  <textarea
                    className="input min-h-28 resize-y"
                    name="problem.uniqueValueProposition"
                    value={form.problem.uniqueValueProposition}
                    onChange={updateField}
                  />
                </label>
                <label className="form-label">
                  Website
                  <input
                    className="input"
                    name="business.website"
                    placeholder="https://example.com"
                    type="url"
                    value={form.business.website}
                    onChange={updateField}
                  />
                </label>

                <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Social links</p>
                      <p className="mt-2 text-sm text-zinc-600">Add platform links one by one so the profile looks cleaner on the startup page.</p>
                    </div>
                    <button className="btn-secondary" type="button" onClick={addSocialLink}>
                      Add link
                    </button>
                  </div>
                  <div className="mt-5 space-y-4">
                    {form.business.socialLinks.map((item, index) => {
                      const platform = resolveSocialPlatform(item.platform);

                      return (
                        <div className="grid gap-3 rounded-[1.25rem] border border-zinc-200 bg-white p-4 md:grid-cols-[auto_180px_minmax(0,1fr)_auto]" key={`${item.platform}-${index}`}>
                          <span className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-black uppercase ${platform.className}`}>
                            {platform.badge}
                          </span>
                          <select className="input" value={item.platform} onChange={(event) => updateSocialLink(index, "platform", event.target.value)}>
                            {SOCIAL_PLATFORM_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <input
                            className="input"
                            placeholder="https://..."
                            type="url"
                            value={item.url}
                            onChange={(event) => updateSocialLink(index, "url", event.target.value)}
                          />
                          <button className="btn-secondary" type="button" onClick={() => removeSocialLink(index)}>
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SectionFrame>
          )}

          {stepIndex === 3 && (
            <SectionFrame
              eyebrow="Step 4"
              title="Funding target and traction"
              description="Set the round size and supporting metrics that investors use to evaluate this startup."
              requiredFields={requiredFields}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <label className="form-label">
                  <span className="flex items-center gap-2">
                    Funding goal
                    <RequiredBadge />
                  </span>
                  <input className="input" min="1" name="funding.goal" step="1" type="number" value={form.funding.goal} onChange={updateField} required />
                </label>
                <label className="form-label">
                  Equity offered %
                  <input className="input" min="0" max="100" name="funding.equityOffered" step="0.1" type="number" value={form.funding.equityOffered} onChange={updateField} />
                </label>
                <label className="form-label">
                  Funding deadline
                  <input className="input" name="funding.deadline" type="date" value={form.funding.deadline} onChange={updateField} />
                </label>
                <label className="form-label">
                  Monthly revenue
                  <input className="input" name="financials.monthlyRevenue" step="0.01" type="number" value={form.financials.monthlyRevenue} onChange={updateField} />
                </label>
                <label className="form-label">
                  Yearly revenue
                  <input className="input" name="financials.yearlyRevenue" step="0.01" type="number" value={form.financials.yearlyRevenue} onChange={updateField} />
                </label>
                <label className="form-label">
                  Monthly expenses
                  <input className="input" name="financials.monthlyExpenses" step="0.01" type="number" value={form.financials.monthlyExpenses} onChange={updateField} />
                </label>
                <label className="form-label">
                  Profit margin %
                  <input className="input" name="financials.profitMargin" step="0.1" type="number" value={form.financials.profitMargin} onChange={updateField} />
                </label>
                <label className="form-label">
                  Burn rate
                  <input className="input" name="financials.burnRate" step="0.01" type="number" value={form.financials.burnRate} onChange={updateField} />
                </label>
                <label className="form-label">
                  Runway months
                  <input className="input" min="0" name="financials.runwayMonths" step="0.1" type="number" value={form.financials.runwayMonths} onChange={updateField} />
                </label>
                <label className="form-label">
                  Users
                  <input className="input" min="0" name="traction.users" step="1" type="number" value={form.traction.users} onChange={updateField} />
                </label>
                <label className="form-label">
                  Traction revenue
                  <input className="input" name="traction.revenue" step="0.01" type="number" value={form.traction.revenue} onChange={updateField} />
                </label>
                <label className="form-label">
                  Growth rate %
                  <input className="input" name="traction.growthRate" step="0.1" type="number" value={form.traction.growthRate} onChange={updateField} />
                </label>
                <label className="form-label">
                  <span className="flex items-center gap-2">
                    Initial valuation
                    <RequiredBadge />
                  </span>
                  <input
                    className="input"
                    min="0"
                    name="valuation.initialValuation"
                    step="0.01"
                    type="number"
                    value={form.valuation.initialValuation}
                    onChange={updateField}
                  />
                </label>
                <label className="form-label">
                  Valuation mode
                  <select className="input" name="valuation.valuationMode" value={form.valuation.valuationMode} onChange={updateField}>
                    <option value="auto">Auto</option>
                    <option value="manual">Manual</option>
                  </select>
                </label>
              </div>
            </SectionFrame>
          )}

          {stepIndex === 4 && (
            <SectionFrame
              eyebrow="Step 5"
              title="Local media uploads"
              description="Select local files and we’ll embed them into the startup record so founders can preview them immediately without a separate upload service."
              requiredFields={requiredFields}
            >
              <div className="grid gap-5 xl:grid-cols-2">
                <MediaUploadCard
                  title="Logo"
                  subtitle="Square brand mark used in cards and the startup detail header."
                  accept="image/*"
                  preview={form.media.logo ? assetUrl(form.media.logo) : ""}
                  fileName={mediaMeta.logoName}
                  onSelect={(event) => handleMediaFileSelect("logo", event)}
                  onClear={() => clearMediaField("logo")}
                />
                <MediaUploadCard
                  title="Cover image"
                  subtitle="Wide banner image used as the hero section on the startup detail page."
                  accept="image/*"
                  preview={form.media.coverImage ? assetUrl(form.media.coverImage) : ""}
                  fileName={mediaMeta.coverImageName}
                  onSelect={(event) => handleMediaFileSelect("coverImage", event)}
                  onClear={() => clearMediaField("coverImage")}
                />
                <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">Pitch deck</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-600">Attach a PDF deck directly from your computer.</p>
                    </div>
                    <button className="text-sm font-semibold text-zinc-500 hover:text-zinc-900" type="button" onClick={() => clearMediaField("pitchDeck")}>
                      Clear
                    </button>
                  </div>
                  <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-6 text-sm text-zinc-500">
                    {mediaMeta.pitchDeckName || (form.media.pitchDeck ? "Pitch deck attached." : "No pitch deck selected yet.")}
                  </div>
                  <label className="btn-secondary mt-4 cursor-pointer">
                    Choose PDF
                    <input className="hidden" type="file" accept="application/pdf" onChange={(event) => handleMediaFileSelect("pitchDeck", event)} />
                  </label>
                </div>
                <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">Documents</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-600">Attach supporting PDFs or images for due diligence.</p>
                    </div>
                    <button className="text-sm font-semibold text-zinc-500 hover:text-zinc-900" type="button" onClick={clearDocuments}>
                      Clear
                    </button>
                  </div>
                  <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-6 text-sm text-zinc-500">
                    {mediaMeta.documentNames.length ? (
                      <div className="space-y-2">
                        {mediaMeta.documentNames.map((name) => (
                          <p key={name}>{name}</p>
                        ))}
                      </div>
                    ) : (
                      "No supporting documents selected yet."
                    )}
                  </div>
                  <label className="btn-secondary mt-4 cursor-pointer">
                    Choose files
                    <input className="hidden" type="file" accept="image/*,application/pdf" multiple onChange={handleDocumentsSelect} />
                  </label>
                </div>
              </div>
            </SectionFrame>
          )}

          {stepIndex === 5 && (
            <SectionFrame
              eyebrow="Step 6"
              title="Review checkpoint"
              description="This final screen is intentionally read-only so you can verify every important detail before the startup goes into review."
              requiredFields={requiredFields}
            >
              <div className="space-y-6">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Pause here before you submit</p>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
                    Check the classification, the funding round, the valuation, and the media assets one last time. When you are
                    happy with everything, continue to unlock the final submit button.
                  </p>
                </div>
                {summarySections.map((section) => (
                  <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5" key={section.title}>
                    <h3 className="text-lg font-black text-zinc-950">{section.title}</h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {section.rows.map(([label, value]) => (
                        <div key={`${section.title}-${label}`} className="rounded-2xl bg-white p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-800">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SectionFrame>
          )}

          <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button className="btn-secondary" type="button" disabled={stepIndex === 0} onClick={handlePrevious}>
                Previous
              </button>
              <div className="flex flex-wrap gap-3">
                {stepIndex < steps.length - 1 ? (
                  <button className="btn-primary" type="button" onClick={handleNext}>
                    Next
                  </button>
                ) : !reviewArmed ? (
                  <button className="btn-secondary" type="button" onClick={() => setReviewArmed(true)}>
                    Continue to submit
                  </button>
                ) : (
                  <button className="btn-primary" type="submit" disabled={submitting}>
                    {submitting ? (editId ? "Saving..." : "Creating...") : editId ? "Save Changes" : "Submit Startup"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
