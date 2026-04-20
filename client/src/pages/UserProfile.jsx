import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { assetUrl, apiRequest } from "../api/client.js";
import { Alert } from "../components/Alert.jsx";
import { Loading } from "../components/Loading.jsx";
import { ProgressBar } from "../components/ProgressBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatCurrency, formatDate, startupImage } from "../utils/format.js";
import { formatStructuredValue } from "../utils/startupMetadata.js";

function initials(name) {
  return name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">{title}</p>
      {subtitle ? <p className="mt-2 text-sm text-zinc-500">{subtitle}</p> : null}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function SocialIcon({ kind }) {
  const common = "h-5 w-5";
  const icons = {
    linkedin: <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3A1.97 1.97 0 1 0 5.25 6.94 1.97 1.97 0 0 0 5.25 3ZM20.44 12.8c0-3.45-1.84-5.05-4.29-5.05-1.98 0-2.87 1.09-3.37 1.86V8.5H9.4c.04.74 0 11.5 0 11.5h3.38v-6.42c0-.34.02-.68.12-.92.27-.68.9-1.39 1.95-1.39 1.38 0 1.93 1.05 1.93 2.59V20h3.38v-7.2Z" />,
    twitter: <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.25l-4.9-6.38L6.47 22H3.36l7.24-8.27L1 2h6.4l4.43 5.84L18.9 2Zm-1.1 18h1.73L6.46 3.9H4.61L17.8 20Z" />,
    github: <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.71.5.09.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.7.12 2.5.36 1.9-1.33 2.74-1.05 2.74-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.95-2.35 4.81-4.59 5.06.36.32.68.95.68 1.92 0 1.39-.01 2.5-.01 2.84 0 .27.18.59.69.49A10.25 10.25 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />,
    instagram: <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm8.33 1.92a1.08 1.08 0 1 0 0 2.16 1.08 1.08 0 0 0 0-2.16ZM12 7.23A4.77 4.77 0 1 0 16.77 12 4.77 4.77 0 0 0 12 7.23Zm0 1.92A2.85 2.85 0 1 1 9.15 12 2.85 2.85 0 0 1 12 9.15Z" />
  };

  return (
    <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {icons[kind]}
    </svg>
  );
}

function SocialLinkButton({ href, kind, label }) {
  if (!href) return null;

  return (
    <a
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
    >
      <SocialIcon kind={kind} />
    </a>
  );
}

function PeopleModal({ title, users, onClose, onToggleFollow, activeId, currentUserId }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 px-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">{title}</p>
            <h3 className="mt-2 text-2xl font-black text-zinc-950">{users.length} profiles</h3>
          </div>
          <button className="btn-secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-6 space-y-3">
          {users.length ? (
            users.map((person) => {
              const avatar = assetUrl(person.profileImage || person.avatar);

              return (
                <div key={person.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-center gap-4">
                    {avatar ? (
                      <img className="h-12 w-12 rounded-full object-cover" src={avatar} alt={person.name} />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-800">
                        {initials(person.name) || "U"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link className="font-black text-zinc-950 hover:text-emerald-700" to={`/users/${person.id}`} onClick={onClose}>
                        {person.name}
                      </Link>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">{person.role}</p>
                      <p className="mt-1 break-words text-sm text-zinc-500">{person.bio || "No bio added yet."}</p>
                    </div>
                  </div>
                  {!person.isOwnProfile && currentUserId ? (
                    <button
                      className={person.isFollowing ? "btn-secondary" : "btn-primary"}
                      type="button"
                      disabled={activeId === person.id}
                      onClick={() => onToggleFollow(person)}
                    >
                      {activeId === person.id ? "Saving..." : person.isFollowing ? "Unfollow" : "Follow"}
                    </button>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="rounded-[22px] border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
              No profiles to show here yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function UserProfile() {
  const { id } = useParams();
  const { mergeStoredUser, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [peopleModal, setPeopleModal] = useState({ type: "", users: [] });
  const [peopleLoadingId, setPeopleLoadingId] = useState("");
  const [investmentPage, setInvestmentPage] = useState(1);
  const [startupPage, setStartupPage] = useState(1);
  const investmentPageSize = 2;
  const startupPageSize = 2;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");
    setSuccess("");

    apiRequest(`/users/${id}`)
      .then((data) => {
        if (!isMounted) return;
        setProfile(data.profile);
        setInvestments(data.investments || []);
        setStartups(data.startups || []);
        setInvestmentPage(1);
        setStartupPage(1);
      })
      .catch((err) => isMounted && setError(err.message))
      .finally(() => isMounted && setLoading(false));

    return () => {
      isMounted = false;
    };
  }, [id]);

  const startupPagination = useMemo(() => {
    const totalPages = Math.max(Math.ceil(startups.length / startupPageSize), 1);
    const page = Math.min(startupPage, totalPages);
    const startIndex = (page - 1) * startupPageSize;

    return {
      page,
      totalPages,
      items: startups.slice(startIndex, startIndex + startupPageSize)
    };
  }, [startupPage, startups]);

  const investmentPagination = useMemo(() => {
    const totalPages = Math.max(Math.ceil(investments.length / investmentPageSize), 1);
    const page = Math.min(investmentPage, totalPages);
    const startIndex = (page - 1) * investmentPageSize;

    return {
      page,
      totalPages,
      items: investments.slice(startIndex, startIndex + investmentPageSize)
    };
  }, [investmentPage, investments]);

  async function handleFollowToggle(nextAction, targetId = id) {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const data = await apiRequest(`/users/${targetId}/${nextAction}`, { method: "POST" });

      if (targetId === id) {
        setProfile(data.profile);
      } else {
        setPeopleModal((current) => ({
          ...current,
          users: current.users.map((person) =>
            person.id === targetId ? { ...person, isFollowing: !person.isFollowing } : person
          )
        }));
      }

      mergeStoredUser(data.currentUser);
      setSuccess(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
      setPeopleLoadingId("");
    }
  }

  async function openPeople(type) {
    try {
      const data = await apiRequest(`/users/${id}/${type}`);
      setPeopleModal({ type, users: data.users || [] });
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <Loading label="Loading profile" />;
  if (!profile) return <div className="mx-auto max-w-3xl px-4 py-12"><Alert>{error || "Profile not found"}</Alert></div>;

  const avatar = assetUrl(profile.profileImage || profile.avatar);

  return (
    <section className="overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
              <div className="flex flex-col items-center text-center">
                {avatar ? (
                  <img className="h-32 w-32 rounded-full object-cover" src={avatar} alt={`${profile.name} profile`} />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full bg-emerald-100 text-4xl font-black text-emerald-900">
                    {initials(profile.name) || "U"}
                  </div>
                )}
                <p className="mt-4 break-words text-2xl font-black text-zinc-950">{profile.name}</p>
                <p className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">{profile.role}</p>
                <p className="mt-1 text-xs text-zinc-500">{profile.userId || "ID pending"}</p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center transition hover:border-emerald-300 hover:bg-white" type="button" onClick={() => openPeople("followers")}>
                  <p className="text-2xl font-black text-zinc-950">{profile.followersCount}</p>
                  <p className="text-sm text-zinc-500">Followers</p>
                </button>
                <button className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center transition hover:border-emerald-300 hover:bg-white" type="button" onClick={() => openPeople("following")}>
                  <p className="text-2xl font-black text-zinc-950">{profile.followingCount}</p>
                  <p className="text-sm text-zinc-500">Following</p>
                </button>
              </div>
              <div className="mt-6 space-y-3 text-sm text-zinc-600">
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Bio</p>
                  <p className="mt-2 break-words leading-6 [overflow-wrap:anywhere]">{profile.bio || "No bio added yet."}</p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Gender</p>
                  <p className="mt-2 font-medium capitalize text-zinc-950">{profile.gender || "Not set"}</p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Languages</p>
                  <p className="mt-2 break-words font-medium text-zinc-950">{profile.languages?.length ? profile.languages.join(", ") : "No languages added yet."}</p>
                </div>
                {profile.contactInfo?.isPublic ? (
                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Contact Info</p>
                    <div className="mt-2 space-y-2">
                      {profile.contactInfo.email ? <p className="break-words font-medium text-zinc-950">{profile.contactInfo.email}</p> : null}
                      {profile.contactInfo.phone ? <p className="break-words font-medium text-zinc-950">{profile.contactInfo.phone}</p> : null}
                      {profile.contactInfo.location ? <p className="break-words font-medium text-zinc-950">{profile.contactInfo.location}</p> : null}
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <SocialLinkButton href={profile.socialLinks?.linkedin} kind="linkedin" label="LinkedIn" />
                  <SocialLinkButton href={profile.socialLinks?.twitter} kind="twitter" label="Twitter" />
                  <SocialLinkButton href={profile.socialLinks?.github} kind="github" label="GitHub" />
                  <SocialLinkButton href={profile.socialLinks?.instagram} kind="instagram" label="Instagram" />
                </div>
              </div>
            </div>
            <Alert>{error}</Alert>
            <Alert type="success">{success}</Alert>
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
              {profile.isOwnProfile ? (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-500">This is your public profile preview.</p>
                  <Link className="btn-primary w-full justify-center" to="/profile">
                    Edit your profile
                  </Link>
                </div>
              ) : (
                <button
                  className={profile.isFollowing ? "btn-secondary w-full justify-center" : "btn-primary w-full justify-center"}
                  type="button"
                  disabled={submitting || !user}
                  onClick={() => handleFollowToggle(profile.isFollowing ? "unfollow" : "follow")}
                >
                  {submitting ? "Saving..." : profile.isFollowing ? "Unfollow" : "Follow"}
                </button>
              )}
            </div>
          </div>

          <div className="min-w-0 space-y-6">
            <SectionCard title="User profile" subtitle="Discovery-friendly profile details, recent activity, and role-specific portfolio context.">
              <h1 className="break-words text-4xl font-black text-zinc-950">{profile.name}</h1>
              <p className="mt-3 max-w-3xl break-words text-base leading-7 text-zinc-600 [overflow-wrap:anywhere]">
                {profile.about || "This user has not added an about section yet."}
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] bg-zinc-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Experience</p>
                  <div className="mt-3 space-y-3">
                    {profile.experience?.length ? (
                      profile.experience.map((entry, index) => (
                        <div key={`exp-${index}`} className="rounded-[18px] bg-white p-4">
                          <p className="break-words font-bold text-zinc-950">{entry.role || "Role not set"}</p>
                          <p className="break-words text-sm font-medium text-emerald-700">{entry.company || "Company not set"}</p>
                          <p className="mt-1 text-xs text-zinc-400">{entry.startDate || "Start"} - {entry.endDate || "Present"}</p>
                          {entry.summary ? <p className="mt-2 break-words text-sm leading-6 text-zinc-600 [overflow-wrap:anywhere]">{entry.summary}</p> : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm leading-7 text-zinc-600">No experience added yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-zinc-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Education</p>
                  <div className="mt-3 space-y-3">
                    {profile.education?.length ? (
                      profile.education.map((entry, index) => (
                        <div key={`edu-${index}`} className="rounded-[18px] bg-white p-4">
                          <p className="break-words font-bold text-zinc-950">{entry.degree || "Degree not set"}</p>
                          <p className="break-words text-sm font-medium text-emerald-700">{entry.institution || "Institution not set"}</p>
                          <p className="mt-1 text-xs text-zinc-400">{entry.startDate || "Start"} - {entry.endDate || "End"}</p>
                          {entry.summary ? <p className="mt-2 break-words text-sm leading-6 text-zinc-600 [overflow-wrap:anywhere]">{entry.summary}</p> : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm leading-7 text-zinc-600">No education added yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-zinc-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Website</p>
                  {profile.website ? (
                    <a className="mt-2 inline-flex break-all font-semibold text-emerald-700 hover:text-emerald-900" href={profile.website} target="_blank" rel="noreferrer">
                      Visit website
                    </a>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-600">No website added yet.</p>
                  )}
                </div>

                <div className="rounded-[1.5rem] bg-zinc-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Interests</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.interests?.length ? (
                      profile.interests.map((interest) => (
                        <span key={interest} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700">
                          {interest}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-600">No interests selected yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            {profile.role === "investor" ? (
              <SectionCard title="Investments" subtitle="Latest portfolio positions linked to this investor, now shown as cards with pagination.">
                {investments.length ? (
                  <>
                    <div className="grid gap-5 md:grid-cols-2">
                      {investmentPagination.items.map((investment) => (
                        <Link
                          key={investment.id}
                          to={`/startups/${investment.startup?._id || investment.startup?.id || ""}`}
                          className="overflow-hidden rounded-[1.9rem] border border-zinc-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,248,0.96))] shadow-soft transition hover:-translate-y-1 hover:border-emerald-300"
                        >
                          <img
                            className="aspect-[16/10] w-full object-cover"
                            src={startupImage(investment.startup)}
                            alt={investment.startup?.name || "Startup"}
                          />
                          <div className="space-y-4 p-5">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
                                {formatStructuredValue(investment.startup?.industry, "Unspecified")}
                              </p>
                              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
                                {formatDate(investment.createdAt)}
                              </span>
                            </div>
                            <div>
                              <h2 className="break-words text-2xl font-black text-zinc-950">{investment.startup?.name || "Startup"}</h2>
                              <p className="mt-2 min-h-[4.5rem] break-words text-sm leading-6 text-zinc-600 [overflow-wrap:anywhere]">
                                {investment.startup?.tagline || "No tagline available for this investment yet."}
                              </p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="rounded-2xl bg-zinc-50 p-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Invested</p>
                                <p className="mt-2 text-base font-black text-zinc-950">{formatCurrency(investment.amount)}</p>
                              </div>
                              <div className="rounded-2xl bg-zinc-50 p-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Current</p>
                                <p className="mt-2 text-base font-black text-zinc-950">{formatCurrency(investment.currentValue)}</p>
                              </div>
                              <div className="rounded-2xl bg-zinc-50 p-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">P/L</p>
                                <p className={`mt-2 text-base font-black ${investment.profitLoss >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                                  {investment.profitLoss >= 0 ? "+" : ""}
                                  {formatCurrency(investment.profitLoss)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {investments.length > investmentPageSize ? (
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 pt-5">
                        <p className="text-sm text-zinc-500">
                          Page {investmentPagination.page} of {investmentPagination.totalPages} | {investments.length} investments total
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            className="btn-secondary"
                            type="button"
                            disabled={investmentPagination.page === 1}
                            onClick={() => setInvestmentPage((current) => Math.max(current - 1, 1))}
                          >
                            Prev
                          </button>
                          {Array.from({ length: investmentPagination.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                            <button
                              key={pageNumber}
                              className={pageNumber === investmentPagination.page ? "btn-primary" : "btn-secondary"}
                              type="button"
                              onClick={() => setInvestmentPage(pageNumber)}
                            >
                              {pageNumber}
                            </button>
                          ))}
                          <button
                            className="btn-secondary"
                            type="button"
                            disabled={investmentPagination.page === investmentPagination.totalPages}
                            onClick={() => setInvestmentPage((current) => Math.min(current + 1, investmentPagination.totalPages))}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
                    No investments to show yet.
                  </div>
                )}
              </SectionCard>
            ) : null}

            {profile.role === "founder" ? (
              <SectionCard title="Startups" subtitle="Recent startups created by this founder, now shown as cards with pagination.">
                {startups.length ? (
                  <>
                    <div className="grid gap-5 md:grid-cols-2">
                      {startupPagination.items.map((startup) => (
                        <Link
                          key={startup.id}
                          to={`/startups/${startup._id || startup.id}`}
                          className="overflow-hidden rounded-[1.9rem] border border-zinc-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,248,0.96))] shadow-soft transition hover:-translate-y-1 hover:border-emerald-300"
                        >
                          <img className="aspect-[16/10] w-full object-cover" src={startupImage(startup)} alt={startup.name} />
                          <div className="space-y-4 p-5">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
                                {formatStructuredValue(startup.category, "General")}
                              </p>
                              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold capitalize text-zinc-600">
                                {startup.status}
                              </span>
                            </div>
                            <div>
                              <h2 className="break-words text-2xl font-black text-zinc-950">{startup.name}</h2>
                              <p className="mt-2 min-h-[4.5rem] break-words text-sm leading-6 text-zinc-600 [overflow-wrap:anywhere]">
                                {startup.tagline || "No tagline added for this startup yet."}
                              </p>
                            </div>
                            <div className="rounded-[1.4rem] border border-zinc-200 bg-white p-4">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Funding progress</p>
                                <p className="text-sm font-semibold text-zinc-700">{startup.funding.percent}% funded</p>
                              </div>
                              <ProgressBar value={startup.funding.percent} />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="rounded-2xl bg-zinc-50 p-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Raised</p>
                                <p className="mt-2 text-base font-black text-zinc-950">{formatCurrency(startup.funding.current)}</p>
                              </div>
                              <div className="rounded-2xl bg-zinc-50 p-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Goal</p>
                                <p className="mt-2 text-base font-black text-zinc-950">{formatCurrency(startup.funding.goal)}</p>
                              </div>
                              <div className="rounded-2xl bg-zinc-50 p-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Funded</p>
                                <p className="mt-2 text-base font-black text-zinc-950">{startup.funding.percent}%</p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {startups.length > startupPageSize ? (
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 pt-5">
                        <p className="text-sm text-zinc-500">
                          Page {startupPagination.page} of {startupPagination.totalPages} | {startups.length} startups total
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            className="btn-secondary"
                            type="button"
                            disabled={startupPagination.page === 1}
                            onClick={() => setStartupPage((current) => Math.max(current - 1, 1))}
                          >
                            Prev
                          </button>
                          {Array.from({ length: startupPagination.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                            <button
                              key={pageNumber}
                              className={pageNumber === startupPagination.page ? "btn-primary" : "btn-secondary"}
                              type="button"
                              onClick={() => setStartupPage(pageNumber)}
                            >
                              {pageNumber}
                            </button>
                          ))}
                          <button
                            className="btn-secondary"
                            type="button"
                            disabled={startupPagination.page === startupPagination.totalPages}
                            onClick={() => setStartupPage((current) => Math.min(current + 1, startupPagination.totalPages))}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
                    No startups to show yet.
                  </div>
                )}
              </SectionCard>
            ) : null}
          </div>
        </div>
      </div>
      {peopleModal.type ? (
        <PeopleModal
          title={peopleModal.type === "followers" ? "Followers" : "Following"}
          users={peopleModal.users}
          activeId={peopleLoadingId}
          currentUserId={user?.id}
          onClose={() => setPeopleModal({ type: "", users: [] })}
          onToggleFollow={(person) => {
            setPeopleLoadingId(person.id);
            handleFollowToggle(person.isFollowing ? "unfollow" : "follow", person.id);
          }}
        />
      ) : null}
    </section>
  );
}
