import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { assetUrl, apiRequest } from "../api/client.js";
import { Alert } from "../components/Alert.jsx";
import { Loading } from "../components/Loading.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORY_OPTIONS, INDUSTRY_OPTIONS } from "../data/startupMetadata.js";
import { formatDate } from "../utils/format.js";
import { formatStructuredValue } from "../utils/startupMetadata.js";

const TIME_OPTIONS = [
  { label: "This month", value: "month" },
  { label: "This week", value: "week" },
  { label: "Today", value: "today" }
];

const initialComposer = {
  content: "",
  image: "",
  link: "",
  category: "general",
  industry: ""
};

function HomeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="m3 10.5 9-7 9 7M5.25 9.75V20h13.5V9.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="19" cy="12" r="1.7" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Zm3 8 2.5-2.5L13 16l2.5-3 2.5 2.5M9 10.5h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M13.5 10.5 10.5 13.5m-2.12 4.62-1.76 1.76a3 3 0 1 1-4.24-4.24l3.18-3.18a3 3 0 0 1 4.24 0m5.96-5.96 1.76-1.76a3 3 0 1 1 4.24 4.24l-3.18 3.18a3 3 0 0 1-4.24 0M8.88 15.12l6.24-6.24" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Zm6 11 1 2.5L21.5 18 19 19l-1 2.5L17 19l-2.5-1 2.5-1.5 1-2.5ZM5 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 19V5m0 0-6 6m6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 5v14m0 0-6-6m6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 10h8M8 14h4m8-2a8 8 0 1 1-3.7-6.73L20 4l-1.24 3.72A7.96 7.96 0 0 1 20 12Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 12v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5M12 3v12m0-12 4 4m-4-4-4 4" strokeLinecap="round" strokeLinejoin="round" />
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

function initials(name) {
  return name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function createLinkPreview(link) {
  if (!link) {
    return null;
  }

  try {
    const url = new URL(link);
    return {
      host: url.hostname.replace(/^www\./i, ""),
      href: url.href
    };
  } catch {
    return null;
  }
}

function FeedAction({ icon, label, count, active = false, tone = "neutral", onClick, disabled = false }) {
  const baseClass =
    tone === "positive" && active
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      : tone === "negative" && active
        ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
        : active
          ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950";

  return (
    <button
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${baseClass}`}
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined ? <span className="text-xs font-bold">{count}</span> : null}
    </button>
  );
}

export function Feed() {
  const { mergeStoredUser, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [composer, setComposer] = useState(initialComposer);
  const [imageName, setImageName] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    industry: "",
    time: "month"
  });
  const [editingId, setEditingId] = useState("");
  const [connectionsOpen, setConnectionsOpen] = useState("");
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connections, setConnections] = useState([]);
  const remainingCharacters = 280 - composer.content.length;

  async function loadPosts() {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    const data = await apiRequest(`/feed${params.toString() ? `?${params}` : ""}`);
    setPosts(data.posts || []);
  }

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    setError("");

    loadPosts()
      .catch((err) => {
        if (isActive) {
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
    };
  }, [filters.category, filters.industry, filters.time]);

  function resetComposer() {
    setComposer(initialComposer);
    setImageName("");
    setEditingId("");
  }

  async function handleImageSelect(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Only image uploads are supported in the feed.");
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await readImageAsDataUrl(file);
      setComposer((current) => ({
        ...current,
        image: dataUrl
      }));
      setImageName(file.name);
      setError("");
    } catch (fileError) {
      setError(fileError.message);
    } finally {
      event.target.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const data = await apiRequest(editingId ? `/feed/${editingId}` : "/feed", {
        method: editingId ? "PUT" : "POST",
        body: composer
      });

      setPosts((current) => {
        if (editingId) {
          return current.map((post) => (post._id === editingId ? data.post : post));
        }

        return [data.post, ...current];
      });

      resetComposer();
      setSuccess(editingId ? "Post updated." : "Post published.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(postId, type) {
    setActionLoading(`${type}-${postId}`);
    setError("");

    try {
      const data = await apiRequest(`/feed/${postId}/${type}`, {
        method: "POST"
      });
      setPosts((current) => current.map((post) => (post._id === postId ? data.post : post)));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading("");
    }
  }

  async function toggleComments(postId) {
    const isOpen = Boolean(openComments[postId]);

    if (isOpen) {
      setOpenComments((current) => ({ ...current, [postId]: false }));
      return;
    }

    setOpenComments((current) => ({ ...current, [postId]: true }));

    if (commentsByPost[postId]) {
      return;
    }

    setActionLoading(`comments-${postId}`);
    setError("");

    try {
      const data = await apiRequest(`/feed/${postId}/comments`);
      setCommentsByPost((current) => ({ ...current, [postId]: data.comments || [] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading("");
    }
  }

  async function handleCommentSubmit(postId) {
    const text = String(commentInputs[postId] || "").trim();

    if (!text) {
      setError("Comment text is required.");
      return;
    }

    setActionLoading(`comment-${postId}`);
    setError("");

    try {
      const data = await apiRequest(`/feed/${postId}/comments`, {
        method: "POST",
        body: { text }
      });

      setCommentsByPost((current) => ({
        ...current,
        [postId]: [...(current[postId] || []), data.comment]
      }));
      setCommentInputs((current) => ({ ...current, [postId]: "" }));
      setPosts((current) =>
        current.map((post) => (post._id === postId ? { ...post, commentCount: data.commentCount } : post))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading("");
    }
  }

  async function handleCommentDelete(postId, commentId) {
    setActionLoading(`delete-comment-${commentId}`);
    setError("");

    try {
      const data = await apiRequest(`/feed/${postId}/comments/${commentId}`, {
        method: "DELETE"
      });
      setCommentsByPost((current) => ({
        ...current,
        [postId]: (current[postId] || []).filter((comment) => comment._id !== commentId)
      }));
      setPosts((current) =>
        current.map((post) => (post._id === postId ? { ...post, commentCount: data.commentCount } : post))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading("");
    }
  }

  async function handleDelete(postId) {
    const confirmed = window.confirm("Delete this post?");

    if (!confirmed) {
      return;
    }

    setActionLoading(`delete-${postId}`);
    setError("");

    try {
      await apiRequest(`/feed/${postId}`, {
        method: "DELETE"
      });
      setPosts((current) => current.filter((post) => post._id !== postId));
      if (editingId === postId) {
        resetComposer();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading("");
    }
  }

  function handleEdit(post) {
    setEditingId(post._id);
    setComposer({
      content: post.content || "",
      image: post.image || "",
      link: post.link || "",
      category: post.category || "general",
      industry: post.industry || ""
    });
    setImageName(post.image ? "Current attached image" : "");
    setSuccess("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleFollowToggle(post) {
    if (!post.user?.id) {
      return;
    }

    const endpoint = post.user.isFollowing ? "unfollow" : "follow";
    setActionLoading(`follow-${post._id}`);
    setError("");

    try {
      const data = await apiRequest(`/users/${post.user.id}/${endpoint}`, {
        method: "POST"
      });
      mergeStoredUser(data.currentUser);
      setPosts((current) =>
        current.map((item) =>
          item.user?.id === post.user.id
            ? {
                ...item,
                user: {
                  ...item.user,
                  isFollowing: data.profile?.isFollowing ?? !item.user.isFollowing,
                  followersCount: data.profile?.followersCount ?? item.user.followersCount
                }
              }
            : item
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading("");
    }
  }

  async function handleShare(post) {
    const shareUrl = `${window.location.origin}/user/${post.user?.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${post.user?.name || "User"} on NayaShare`,
          text: post.content,
          url: shareUrl
        });
        return;
      }

      await navigator.clipboard.writeText(`${post.content}\n${shareUrl}`);
      setSuccess("Post copied to clipboard.");
    } catch {
      setError("Unable to share this post right now.");
    }
  }

  async function openConnections(type) {
    if (!user?.id && !user?._id) {
      return;
    }

    setConnectionsOpen(type);
    setConnectionsLoading(true);
    setError("");

    try {
      const data = await apiRequest(`/users/${user.id || user._id}/${type}`);
      setConnections(data.users || []);
    } catch (err) {
      setError(err.message);
      setConnections([]);
    } finally {
      setConnectionsLoading(false);
    }
  }

  async function handleConnectionToggle(person) {
    if (!person?.id || person.isOwnProfile) {
      return;
    }

    const endpoint = person.isFollowing ? "unfollow" : "follow";
    setActionLoading(`connection-${person.id}`);
    setError("");

    try {
      const data = await apiRequest(`/users/${person.id}/${endpoint}`, {
        method: "POST"
      });

      mergeStoredUser(data.currentUser);
      setConnections((current) =>
        current.map((item) =>
          item.id === person.id
            ? {
                ...item,
                isFollowing: data.profile?.isFollowing ?? !item.isFollowing,
                followersCount: data.profile?.followersCount ?? item.followersCount
              }
            : item
        )
      );
      setPosts((current) =>
        current.map((post) =>
          post.user?.id === person.id
            ? {
                ...post,
                user: {
                  ...post.user,
                  isFollowing: data.profile?.isFollowing ?? !post.user.isFollowing,
                  followersCount: data.profile?.followersCount ?? post.user.followersCount
                }
              }
            : post
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading("");
    }
  }

  const trendItems = useMemo(() => {
    const counts = new Map();

    posts.forEach((post) => {
      const categoryKey = post.category ? `category:${post.category}` : "";
      const industryKey = post.industry ? `industry:${post.industry}` : "";

      if (categoryKey) {
        counts.set(categoryKey, (counts.get(categoryKey) || 0) + 1);
      }

      if (industryKey) {
        counts.set(industryKey, (counts.get(industryKey) || 0) + 1);
      }
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([key, count]) => {
        const [type, rawValue] = key.split(":");
        return {
          key,
          type: type === "industry" ? "Industry" : "Category",
          label: `#${formatStructuredValue(rawValue, rawValue).replace(/\s+/g, "")}`,
          count
        };
      });
  }, [posts]);

  const suggestedUsers = useMemo(() => {
    const seen = new Map();

    posts.forEach((post) => {
      if (!post.user?.id || seen.has(post.user.id) || user?.id === post.user.id) {
        return;
      }

      seen.set(post.user.id, post.user);
    });

    return [...seen.values()].slice(0, 4);
  }, [posts, user?.id]);

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Community feed</p>
            <h1 className="mt-2 text-4xl font-black text-zinc-950">Startup conversations</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              Follow founders, investors, and ecosystem builders in one lightweight stream.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 shadow-soft">
            <HomeIcon />
            Feed home
          </div>
        </div>

        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="space-y-6 lg:w-72 lg:flex-shrink-0">
            <div className="rounded-[2rem] border border-zinc-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,253,250,0.96))] p-5 shadow-soft">
              <div className="flex flex-col items-center text-center">
                {user?.profileImage || user?.avatar ? (
                  <img
                    className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-sm"
                    src={assetUrl(user.profileImage || user.avatar)}
                    alt={user?.name || "Profile"}
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-emerald-100 text-2xl font-black text-emerald-900 shadow-sm">
                    {initials(user?.name) || "U"}
                  </div>
                )}
                <h2 className="mt-4 text-xl font-black text-zinc-950">{user?.name || "Community member"}</h2>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  {user?.role || "Member"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{user?.userId || user?.email || "Signed in"}</p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  className="rounded-[1.5rem] border border-zinc-100 bg-white/90 p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:bg-white"
                  type="button"
                  onClick={() => openConnections("followers")}
                >
                  <p className="text-xl font-black text-zinc-950">{user?.followersCount || 0}</p>
                  <p className="mt-1 text-xs text-zinc-500">Followers</p>
                </button>
                <button
                  className="rounded-[1.5rem] border border-zinc-100 bg-white/90 p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:bg-white"
                  type="button"
                  onClick={() => openConnections("following")}
                >
                  <p className="text-xl font-black text-zinc-950">{user?.followingCount || 0}</p>
                  <p className="mt-1 text-xs text-zinc-500">Following</p>
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-zinc-600">
                <div className="rounded-[1.4rem] bg-white/80 p-3 ring-1 ring-zinc-100">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Email</p>
                  <p className="mt-2 truncate font-medium text-zinc-950">{user?.email || "Not available"}</p>
                </div>
              </div>

              <Link
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[1.4rem] bg-zinc-900 px-4 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-600 hover:text-white"
                to={`/user/${user?.id || user?._id}`}
              >
                View my profile
              </Link>
            </div>
          </aside>

          <main className="space-y-6 lg:min-w-0 lg:flex-1">
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="flex gap-3">
                  {user?.profileImage || user?.avatar ? (
                    <img className="h-12 w-12 rounded-full object-cover" src={assetUrl(user.profileImage || user.avatar)} alt={user.name} />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-900">
                      {initials(user?.name) || "U"}
                    </div>
                  )}
                  <div className="flex-1 rounded-[1.4rem] bg-zinc-50 px-4 py-3">
                    <textarea
                      className="min-h-[78px] w-full resize-none border-0 bg-transparent text-[15px] leading-7 text-zinc-900 outline-none placeholder:text-zinc-400"
                      maxLength={280}
                      placeholder="Share a founder update, investor thought, or startup signal."
                      value={composer.content}
                      onChange={(event) => setComposer((current) => ({ ...current, content: event.target.value }))}
                      required
                    />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
                      <span>{remainingCharacters} characters left</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 shadow-sm">{formatStructuredValue(composer.category, "General")}</span>
                        {composer.industry ? <span className="rounded-full bg-white px-3 py-1 shadow-sm">{formatStructuredValue(composer.industry, "Industry")}</span> : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                      value={composer.category}
                      onChange={(event) => setComposer((current) => ({ ...current, category: event.target.value }))}
                    >
                      <option value="general">
                        General
                      </option>
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                      value={composer.industry}
                      onChange={(event) => setComposer((current) => ({ ...current, industry: event.target.value }))}
                    >
                      <option value="">
                        All industries
                      </option>
                      {INDUSTRY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
                      <PhotoIcon />
                      Photo
                      <input className="hidden" type="file" accept="image/*" onChange={handleImageSelect} />
                    </label>
                    <div className="flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                      <LinkIcon />
                      <input
                        className="w-full border-0 bg-transparent text-sm text-sky-800 outline-none placeholder:text-sky-500"
                        placeholder="Paste link"
                        type="url"
                        value={composer.link}
                        onChange={(event) => setComposer((current) => ({ ...current, link: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    {editingId ? (
                      <button
                        className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                        type="button"
                        onClick={resetComposer}
                      >
                        Cancel
                      </button>
                    ) : null}
                    <button
                      className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                      type="submit"
                      disabled={submitting || remainingCharacters < 0}
                    >
                      {submitting ? "Saving..." : editingId ? "Update" : "Post"}
                    </button>
                  </div>
                </div>

                {(composer.image || composer.link) && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[1.4rem] border border-zinc-200 bg-zinc-50 p-4">
                      <div className="flex items-center justify-between gap-3 text-sm text-zinc-700">
                        <span className="font-semibold">Image attachment</span>
                        <button
                          className="text-zinc-500 hover:text-zinc-950"
                          type="button"
                          onClick={() => {
                            setComposer((current) => ({ ...current, image: "" }));
                            setImageName("");
                          }}
                        >
                          Clear
                        </button>
                      </div>
                      {composer.image ? (
                        <>
                          <img className="mt-3 h-40 w-full rounded-[1rem] object-cover" src={assetUrl(composer.image)} alt="Composer attachment" />
                          <p className="mt-2 text-xs text-zinc-500">{imageName || "Attached image"}</p>
                        </>
                      ) : (
                        <p className="mt-3 text-sm text-zinc-500">No image attached.</p>
                      )}
                    </div>
                    <div className="rounded-[1.4rem] border border-zinc-200 bg-zinc-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                        <LinkIcon />
                        Link preview
                      </div>
                      {composer.link ? (
                        <div className="mt-3 rounded-[1rem] bg-white p-4 shadow-sm">
                          <p className="text-sm font-semibold text-zinc-900">{createLinkPreview(composer.link)?.host || composer.link}</p>
                          <p className="mt-2 truncate text-xs text-zinc-500">{composer.link}</p>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-zinc-500">No link attached.</p>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {loading ? (
              <Loading label="Loading feed" />
            ) : posts.length ? (
              <div className="space-y-5">
                {posts.map((post) => {
                  const authorImage = assetUrl(post.user?.profileImage || post.user?.avatar);
                  const linkPreview = createLinkPreview(post.link);

                  return (
                    <article key={post._id} className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          {authorImage ? (
                            <img className="h-12 w-12 rounded-full object-cover" src={authorImage} alt={`${post.user?.name || "User"} profile`} />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-sm font-black text-zinc-700">
                              {initials(post.user?.name) || "U"}
                            </div>
                          )}
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Link className="font-semibold text-zinc-950 hover:text-emerald-700" to={`/user/${post.user?.id}`}>
                                {post.user?.name || "User"}
                              </Link>
                              <span className="text-xs text-zinc-500">{post.user?.role}</span>
                            </div>
                            <p className="mt-1 text-xs text-zinc-500">{formatDate(post.createdAt)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {user && post.user?.id !== user.id ? (
                            <button
                              className={
                                post.user?.isFollowing
                                  ? "rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
                                  : "rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                              }
                              type="button"
                              disabled={actionLoading === `follow-${post._id}`}
                              onClick={() => handleFollowToggle(post)}
                            >
                              {actionLoading === `follow-${post._id}` ? "Saving..." : post.user?.isFollowing ? "Following" : "Follow"}
                            </button>
                          ) : null}
                          <button className="text-zinc-400 hover:text-zinc-950" type="button">
                            <DotsIcon />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                          {formatStructuredValue(post.category, "General")}
                        </span>
                        {post.industry ? (
                          <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-700">
                            {formatStructuredValue(post.industry, "Industry")}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-zinc-800">{post.content}</p>

                      {post.image ? (
                        <div className="mt-4 overflow-hidden rounded-[1.2rem] border border-zinc-200">
                          <img className="w-full object-cover" src={assetUrl(post.image)} alt="Post attachment" />
                        </div>
                      ) : null}

                      {linkPreview ? (
                        <a
                          className="mt-4 block rounded-[1.2rem] border border-zinc-200 bg-zinc-50 p-4 transition hover:bg-zinc-100"
                          href={linkPreview.href}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-zinc-500">
                            <LinkIcon />
                            Link preview
                          </div>
                          <p className="mt-3 font-semibold text-zinc-950">{linkPreview.host}</p>
                          <p className="mt-1 truncate text-sm text-zinc-500">{linkPreview.href}</p>
                        </a>
                      ) : null}

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <FeedAction
                            icon={<ArrowUpIcon />}
                            label="Like"
                            count={post.upvoteCount}
                            active={post.hasUpvoted}
                            tone="positive"
                            disabled={Boolean(actionLoading)}
                            onClick={() => handleVote(post._id, "upvote")}
                          />
                          <FeedAction
                            icon={<ArrowDownIcon />}
                            label="Down"
                            count={post.downvoteCount}
                            active={post.hasDownvoted}
                            tone="negative"
                            disabled={Boolean(actionLoading)}
                            onClick={() => handleVote(post._id, "downvote")}
                          />
                          <FeedAction
                            icon={<CommentIcon />}
                            label="Comment"
                            count={post.commentCount}
                            active={Boolean(openComments[post._id])}
                            disabled={Boolean(actionLoading)}
                            onClick={() => toggleComments(post._id)}
                          />
                          <FeedAction icon={<ShareIcon />} label="Share" disabled={Boolean(actionLoading)} onClick={() => handleShare(post)} />
                        </div>

                        {post.isOwner ? (
                          <div className="flex items-center gap-2">
                            <FeedAction icon={<EditIcon />} label="Edit" onClick={() => handleEdit(post)} />
                            <FeedAction
                              icon={<DeleteIcon />}
                              label={actionLoading === `delete-${post._id}` ? "Deleting..." : "Delete"}
                              disabled={actionLoading === `delete-${post._id}`}
                              onClick={() => handleDelete(post._id)}
                            />
                          </div>
                        ) : null}
                      </div>

                      {openComments[post._id] ? (
                        <div className="mt-5 rounded-[1.4rem] border border-zinc-200 bg-zinc-50 p-4">
                          <div className="space-y-4">
                            {commentsByPost[post._id]?.length ? (
                              commentsByPost[post._id].map((comment) => {
                                const commentAvatar = assetUrl(comment.user?.profileImage || comment.user?.avatar);

                                return (
                                  <div className="rounded-[1rem] bg-white p-4 shadow-sm" key={comment._id}>
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-start gap-3">
                                        {commentAvatar ? (
                                          <img className="h-10 w-10 rounded-full object-cover" src={commentAvatar} alt={`${comment.user?.name || "User"} profile`} />
                                        ) : (
                                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xs font-black text-zinc-700">
                                            {initials(comment.user?.name) || "U"}
                                          </div>
                                        )}
                                        <div>
                                          <Link className="font-semibold text-zinc-950 hover:text-emerald-700" to={`/user/${comment.user?.id || comment.user?._id}`}>
                                            {comment.user?.name || "User"}
                                          </Link>
                                          <p className="mt-1 text-xs text-zinc-500">{formatDate(comment.createdAt)}</p>
                                        </div>
                                      </div>
                                      {comment.isOwner ? (
                                        <button
                                          className="text-sm font-semibold text-zinc-500 hover:text-zinc-950"
                                          type="button"
                                          disabled={actionLoading === `delete-comment-${comment._id}`}
                                          onClick={() => handleCommentDelete(post._id, comment._id)}
                                        >
                                          {actionLoading === `delete-comment-${comment._id}` ? "Deleting..." : "Delete"}
                                        </button>
                                      ) : null}
                                    </div>
                                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{comment.text}</p>
                                  </div>
                                );
                              })
                            ) : actionLoading === `comments-${post._id}` ? (
                              <div className="rounded-[1rem] bg-white px-4 py-5 text-sm text-zinc-500 shadow-sm">Loading comments...</div>
                            ) : (
                              <div className="rounded-[1rem] bg-white px-4 py-5 text-sm text-zinc-500 shadow-sm">No comments yet.</div>
                            )}

                            {user ? (
                              <div className="rounded-[1rem] bg-white p-4 shadow-sm">
                                <textarea
                                  className="min-h-24 w-full resize-y rounded-[1rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-400 focus:bg-white"
                                  maxLength={1000}
                                  placeholder="Add a comment"
                                  value={commentInputs[post._id] || ""}
                                  onChange={(event) =>
                                    setCommentInputs((current) => ({ ...current, [post._id]: event.target.value }))
                                  }
                                />
                                <div className="mt-3 flex justify-end">
                                  <button
                                    className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                                    type="button"
                                    disabled={actionLoading === `comment-${post._id}`}
                                    onClick={() => handleCommentSubmit(post._id)}
                                  >
                                    {actionLoading === `comment-${post._id}` ? "Posting..." : "Post comment"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-[1rem] bg-white px-4 py-5 text-sm text-zinc-500 shadow-sm">Login to join the discussion.</div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-zinc-200 bg-white px-8 py-12 text-center shadow-soft">
                <h2 className="text-2xl font-black text-zinc-950">No posts yet for these filters</h2>
                <p className="mt-3 text-zinc-500">Try a broader category or be the first to add a new signal to the feed.</p>
              </div>
            )}
          </main>

          <aside className="space-y-5 lg:w-[280px] lg:flex-shrink-0">
            <div className="rounded-[1.6rem] border border-zinc-200 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-2 text-emerald-700">
                <SparkIcon />
                <p className="text-sm font-bold uppercase tracking-[0.18em]">Filters</p>
              </div>
              <div className="mt-4 space-y-4">
                <label className="block space-y-2 text-sm font-semibold text-zinc-700">
                  Category
                  <select
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                    value={filters.category}
                    onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
                  >
                    <option value="">All categories</option>
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2 text-sm font-semibold text-zinc-700">
                  Industry
                  <select
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                    value={filters.industry}
                    onChange={(event) => setFilters((current) => ({ ...current, industry: event.target.value }))}
                  >
                    <option value="">All industries</option>
                    {INDUSTRY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-zinc-700">Time</p>
                  <div className="flex flex-wrap gap-2">
                    {TIME_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        className={
                          filters.time === option.value
                            ? "rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                            : "rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100"
                        }
                        type="button"
                        onClick={() => setFilters((current) => ({ ...current, time: option.value }))}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  type="button"
                  onClick={() => setFilters({ category: "", industry: "", time: "month" })}
                >
                  Reset filters
                </button>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-zinc-200 bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-zinc-950">Trends</p>
                  <p className="mt-1 text-sm text-zinc-500">Startup categories and industries moving in the feed.</p>
                </div>
                <div className="text-emerald-700">
                  <SparkIcon />
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {trendItems.length ? (
                  trendItems.map((trend) => (
                    <div className="border-b border-zinc-100 pb-4 last:border-b-0 last:pb-0" key={trend.key}>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{trend.type} trending</p>
                      <p className="mt-2 font-semibold text-zinc-950">{trend.label}</p>
                      <p className="mt-1 text-sm text-zinc-500">{trend.count} posts</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">Trends will appear as people post more often.</p>
                )}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-zinc-200 bg-white p-5 shadow-soft">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Who to follow</p>
              <div className="mt-4 space-y-4">
                {suggestedUsers.length ? (
                  suggestedUsers.map((suggestedUser) => {
                    const isLoadingFollow = actionLoading === `follow-suggestion-${suggestedUser.id}`;

                    return (
                      <div className="flex items-center justify-between gap-3" key={suggestedUser.id}>
                        <div className="flex min-w-0 items-center gap-3">
                          {suggestedUser.profileImage || suggestedUser.avatar ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={assetUrl(suggestedUser.profileImage || suggestedUser.avatar)}
                              alt={suggestedUser.name}
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xs font-black text-zinc-700">
                              {initials(suggestedUser.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link className="block truncate font-semibold text-zinc-950 hover:text-emerald-700" to={`/user/${suggestedUser.id}`}>
                              {suggestedUser.name}
                            </Link>
                            <p className="truncate text-xs text-zinc-500">{suggestedUser.role}</p>
                          </div>
                        </div>
                        <button
                          className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                          type="button"
                          disabled={isLoadingFollow}
                          onClick={async () => {
                            setActionLoading(`follow-suggestion-${suggestedUser.id}`);
                            setError("");

                            try {
                              const data = await apiRequest(`/users/${suggestedUser.id}/${suggestedUser.isFollowing ? "unfollow" : "follow"}`, {
                                method: "POST"
                              });
                              mergeStoredUser(data.currentUser);
                              setPosts((current) =>
                                current.map((post) =>
                                  post.user?.id === suggestedUser.id
                                    ? {
                                        ...post,
                                        user: {
                                          ...post.user,
                                          isFollowing: data.profile?.isFollowing ?? !post.user.isFollowing,
                                          followersCount: data.profile?.followersCount ?? post.user.followersCount
                                        }
                                      }
                                    : post
                                )
                              );
                            } catch (err) {
                              setError(err.message);
                            } finally {
                              setActionLoading("");
                            }
                          }}
                        >
                          {isLoadingFollow ? "..." : suggestedUser.isFollowing ? "Following" : "Follow"}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-zinc-500">Suggested people will appear as the feed grows.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {connectionsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
                  {connectionsOpen === "followers" ? "Followers" : "Following"}
                </p>
                <h2 className="mt-2 text-2xl font-black text-zinc-950">
                  {connectionsOpen === "followers" ? "People who follow you" : "People you follow"}
                </h2>
              </div>
              <button
                className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
                type="button"
                onClick={() => {
                  setConnectionsOpen("");
                  setConnections([]);
                }}
              >
                Close
              </button>
            </div>

            <div className="mt-5 max-h-[65vh] space-y-3 overflow-y-auto pr-1">
              {connectionsLoading ? (
                <div className="rounded-[1.4rem] bg-zinc-50 px-4 py-5 text-sm text-zinc-500">Loading users...</div>
              ) : connections.length ? (
                connections.map((person) => (
                  <div className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-zinc-200 bg-zinc-50 p-4" key={person.id}>
                    <div className="flex min-w-0 items-center gap-3">
                      {person.profileImage || person.avatar ? (
                        <img className="h-11 w-11 rounded-full object-cover" src={assetUrl(person.profileImage || person.avatar)} alt={person.name} />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-900">
                          {initials(person.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link className="block truncate font-semibold text-zinc-950 hover:text-emerald-700" to={`/user/${person.id}`}>
                          {person.name}
                        </Link>
                        <p className="truncate text-xs uppercase tracking-[0.16em] text-zinc-500">{person.role}</p>
                      </div>
                    </div>
                    {!person.isOwnProfile ? (
                      <button
                        className={
                          person.isFollowing
                            ? "rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
                            : "rounded-full border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        }
                        type="button"
                        disabled={actionLoading === `connection-${person.id}`}
                        onClick={() => handleConnectionToggle(person)}
                      >
                        {actionLoading === `connection-${person.id}` ? "Saving..." : person.isFollowing ? "Unfollow" : "Follow back"}
                      </button>
                    ) : (
                      <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-500">You</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-[1.4rem] bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
                  {connectionsOpen === "followers" ? "No followers yet." : "You are not following anyone yet."}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
