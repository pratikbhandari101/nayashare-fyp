import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_ORIGIN, apiRequest, assetUrl } from "../api/client.js";
import { Alert } from "../components/Alert.jsx";
import { Loading } from "../components/Loading.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const BIO_LIMIT = 160;
const ABOUT_LIMIT = 600;
const INTEREST_OPTIONS = ["Fintech", "SaaS", "AI", "Healthtech", "Edtech", "Climate", "E-commerce", "Food", "Logistics", "Creator economy"];

function toDateInput(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().split("T")[0];
}

function initials(name) {
  return name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function parseList(value) {
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function emptyExperience() {
  return { company: "", role: "", startDate: "", endDate: "", summary: "" };
}

function emptyEducation() {
  return { institution: "", degree: "", startDate: "", endDate: "", summary: "" };
}

function CharacterLabel({ label, count, limit }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="text-xs font-medium text-zinc-400">{count}/{limit}</span>
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
  return <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{icons[kind]}</svg>;
}

function SocialLinkButton({ href, kind, label }) {
  if (!href) return null;
  return <a className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700" href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}><SocialIcon kind={kind} /></a>;
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-[20px] border border-zinc-200 bg-white px-4 py-3">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <span className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-emerald-500" : "bg-zinc-300"}`}>
        <input className="sr-only" type="checkbox" checked={checked} onChange={onChange} />
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`} />
      </span>
    </label>
  );
}

function EntryEditor({ title, items, onAdd, onRemove, onChange, fields }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-zinc-700">{title}</p>
        <button className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 transition hover:bg-emerald-100" type="button" onClick={onAdd}>
          Add
        </button>
      </div>
      {items.length ? items.map((item, index) => (
        <div key={`${title}-${index}`} className="rounded-[24px] border border-zinc-200 bg-zinc-50/80 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{title} #{index + 1}</p>
            <button className="text-xs font-semibold text-rose-600 hover:text-rose-700" type="button" onClick={() => onRemove(index)}>
              Remove
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <label key={field.name} className={`form-label ${field.full ? "md:col-span-2" : ""}`}>
                {field.label}
                {field.multiline ? (
                  <textarea className="input min-h-[96px] resize-y" value={item[field.name] || ""} onChange={(event) => onChange(index, field.name, event.target.value)} />
                ) : (
                  <input className="input" type={field.type || "text"} value={item[field.name] || ""} onChange={(event) => onChange(index, field.name, event.target.value)} />
                )}
              </label>
            ))}
          </div>
        </div>
      )) : (
        <div className="rounded-[22px] border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
          No {title.toLowerCase()} entries yet.
        </div>
      )}
    </div>
  );
}

export function Profile() {
  const { refreshProfile, updateProfile, user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    gender: user?.gender || "other",
    dateOfBirth: toDateInput(user?.dateOfBirth),
    bio: user?.bio || "",
    about: user?.about || "",
    website: user?.website || "",
    contactEmail: user?.contactInfo?.email || user?.email || "",
    contactPhone: user?.contactInfo?.phone || "",
    contactLocation: user?.contactInfo?.location || "",
    contactIsPublic: Boolean(user?.contactInfo?.isPublic),
    linkedin: user?.socialLinks?.linkedin || "",
    twitter: user?.socialLinks?.twitter || "",
    github: user?.socialLinks?.github || "",
    instagram: user?.socialLinks?.instagram || "",
    languages: (user?.languages || []).join(", ")
  });
  const [experienceEntries, setExperienceEntries] = useState(user?.experience || []);
  const [educationEntries, setEducationEntries] = useState(user?.education || []);
  const [selectedInterests, setSelectedInterests] = useState(user?.interests || []);
  const [preview, setPreview] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    let isMounted = true;
    refreshProfile().then((profile) => {
      if (!isMounted) return;
      setForm({
        name: profile.name || "",
        gender: profile.gender || "other",
        dateOfBirth: toDateInput(profile.dateOfBirth),
        bio: profile.bio || "",
        about: profile.about || "",
        website: profile.website || "",
        contactEmail: profile.contactInfo?.email || profile.email || "",
        contactPhone: profile.contactInfo?.phone || "",
        contactLocation: profile.contactInfo?.location || "",
        contactIsPublic: Boolean(profile.contactInfo?.isPublic),
        linkedin: profile.socialLinks?.linkedin || "",
        twitter: profile.socialLinks?.twitter || "",
        github: profile.socialLinks?.github || "",
        instagram: profile.socialLinks?.instagram || "",
        languages: (profile.languages || []).join(", ")
      });
      setExperienceEntries(profile.experience || []);
      setEducationEntries(profile.education || []);
      setSelectedInterests(profile.interests || []);
    }).catch((err) => setError(err.message)).finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedFile) return undefined;
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateEntry(setter, index, field, value) {
    setter((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  }

  function toggleInterest(interest) {
    setSelectedInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : current.length >= 5 ? current : [...current, interest]);
  }

  async function handleProfileSave(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const updatedUser = await updateProfile({ ...form, interests: selectedInterests, languages: parseList(form.languages), experienceEntries, educationEntries }, selectedFile);
      setSelectedFile(null);
      setPreview(assetUrl(updatedUser.profileImage || updatedUser.avatar));
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault();
    setPasswordSubmitting(true);
    setPasswordError("");
    setPasswordSuccess("");
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("All password fields are required.");
      setPasswordSubmitting(false);
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirm password must match.");
      setPasswordSubmitting(false);
      return;
    }
    try {
      const data = await apiRequest("/admin/change-password", { method: "PUT", body: { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword } });
      setPasswordSuccess(data.message);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordSubmitting(false);
    }
  }

  if (loading) return <Loading label="Loading profile" />;

  const avatar = preview || assetUrl(user?.profileImage || user?.avatar);
  console.debug("Profile image URL:", avatar || "No profile image", "Backend:", API_ORIGIN);

  return (
    <section className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.08),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Profile</p>
          <h1 className="mt-2 text-4xl font-black text-zinc-950">Build a stronger founder and investor identity</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600">Shape a more professional public profile with clearer structure, richer experience history, and better discoverability.</p>
        </div>
        <form className="space-y-6" onSubmit={handleProfileSave}>
          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="space-y-6">
              <div className="overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-soft">
                <div className="bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(239,246,255,0.9))] px-6 py-6">
                  <div className="flex flex-col items-center text-center">
                    {avatar ? <img className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-md" src={avatar} alt={`${user.name} profile`} /> : <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-emerald-100 text-4xl font-black text-emerald-900 shadow-md">{initials(user.name) || "U"}</div>}
                    <p className="mt-4 text-2xl font-black text-zinc-950">{form.name || user.name}</p>
                    <p className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">{user.role}</p>
                    <p className="mt-2 max-w-[250px] text-sm leading-6 text-zinc-600">{form.bio || "Add a short headline-style bio to make your profile memorable."}</p>
                  </div>
                </div>
                <div className="space-y-5 p-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[22px] bg-zinc-50 p-4 text-center"><p className="text-2xl font-black text-zinc-950">{user.followersCount || 0}</p><p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Followers</p></div>
                    <div className="rounded-[22px] bg-zinc-50 p-4 text-center"><p className="text-2xl font-black text-zinc-950">{user.followingCount || 0}</p><p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Following</p></div>
                  </div>
                  <div className="rounded-[22px] bg-zinc-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Public preview</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">Your public page will show the richer profile details below, with contact info visible only when you make it public.</p>
                    <Link className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-900" to={`/users/${user.id}`}>View public profile</Link>
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-700">Profile image</span>
                    <div className="rounded-[24px] border border-dashed border-zinc-300 bg-[linear-gradient(135deg,rgba(236,253,245,0.7),rgba(255,255,255,1))] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-zinc-900">Upload a modern portrait</p>
                          <p className="mt-1 text-sm text-zinc-500">Use a sharp square image for a cleaner public profile.</p>
                        </div>
                        <label className="cursor-pointer rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
                          Choose image
                          <input accept="image/*" className="sr-only" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} type="file" />
                        </label>
                      </div>
                      <p className="mt-3 text-xs text-zinc-400">{selectedFile?.name || "No file selected yet."}</p>
                    </div>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <SocialLinkButton href={form.linkedin} kind="linkedin" label="LinkedIn" />
                    <SocialLinkButton href={form.twitter} kind="twitter" label="Twitter" />
                    <SocialLinkButton href={form.github} kind="github" label="GitHub" />
                    <SocialLinkButton href={form.instagram} kind="instagram" label="Instagram" />
                  </div>
                </div>
              </div>
            </aside>
            <div className="space-y-6">
              <Alert>{error}</Alert>
              <Alert type="success">{success}</Alert>
              <section className="rounded-[30px] border border-zinc-200 bg-white p-6 shadow-soft">
                <div className="mb-5"><p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Core Profile</p><p className="mt-2 text-sm text-zinc-500">Keep the essentials sharp and professional.</p></div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="form-label md:col-span-2">Name<input className="input" name="name" value={form.name} onChange={updateField} required /></label>
                  <label className="form-label">Email<input className="input bg-zinc-100 text-zinc-500" readOnly value={user.email} /></label>
                  <label className="form-label">User ID<input className="input bg-zinc-100 text-zinc-500" readOnly value={user.userId || ""} /></label>
                  <label className="form-label">Gender<select className="input" name="gender" value={form.gender} onChange={updateField}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label>
                  <label className="form-label">Date of birth<input className="input" max={new Date().toISOString().split("T")[0]} name="dateOfBirth" onChange={updateField} type="date" value={form.dateOfBirth} required /></label>
                </div>
              </section>
              <section className="rounded-[30px] border border-zinc-200 bg-white p-6 shadow-soft">
                <div className="mb-5"><p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Identity</p><p className="mt-2 text-sm text-zinc-500">Add the kind of information people expect from a polished professional profile.</p></div>
                <div className="grid gap-4">
                  <label className="form-label"><CharacterLabel label="Bio" count={form.bio.length} limit={BIO_LIMIT} /><input className="input" maxLength={BIO_LIMIT} name="bio" value={form.bio} onChange={updateField} placeholder="Short profile headline" /></label>
                  <label className="form-label"><CharacterLabel label="About" count={form.about.length} limit={ABOUT_LIMIT} /><textarea className="input min-h-[140px] resize-y" maxLength={ABOUT_LIMIT} name="about" value={form.about} onChange={updateField} placeholder="Tell founders and investors what you do, what you care about, and what kind of opportunities interest you." /></label>
                  <EntryEditor
                    title="Experience"
                    items={experienceEntries}
                    onAdd={() => setExperienceEntries((current) => [...current, emptyExperience()])}
                    onRemove={(index) => setExperienceEntries((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    onChange={(index, field, value) => updateEntry(setExperienceEntries, index, field, value)}
                    fields={[
                      { name: "company", label: "Company" },
                      { name: "role", label: "Role / Position" },
                      { name: "startDate", label: "Start date", type: "month" },
                      { name: "endDate", label: "End date", type: "month" },
                      { name: "summary", label: "Summary", multiline: true, full: true }
                    ]}
                  />
                  <EntryEditor
                    title="Education"
                    items={educationEntries}
                    onAdd={() => setEducationEntries((current) => [...current, emptyEducation()])}
                    onRemove={(index) => setEducationEntries((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    onChange={(index, field, value) => updateEntry(setEducationEntries, index, field, value)}
                    fields={[
                      { name: "institution", label: "Institution" },
                      { name: "degree", label: "Degree" },
                      { name: "startDate", label: "Start date", type: "month" },
                      { name: "endDate", label: "End date", type: "month" },
                      { name: "summary", label: "Summary", multiline: true, full: true }
                    ]}
                  />
                </div>
              </section>
              <section className="rounded-[30px] border border-zinc-200 bg-white p-6 shadow-soft">
                <div className="mb-5"><p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Contact and Links</p><p className="mt-2 text-sm text-zinc-500">Decide whether others can reach you directly, and highlight your professional web presence.</p></div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2"><Toggle checked={form.contactIsPublic} onChange={() => setForm((current) => ({ ...current, contactIsPublic: !current.contactIsPublic }))} label={form.contactIsPublic ? "Contact info is public" : "Contact info is private"} /></div>
                  <label className="form-label">Contact email<input className="input" name="contactEmail" value={form.contactEmail} onChange={updateField} placeholder="Public email" /></label>
                  <label className="form-label">Phone<input className="input" name="contactPhone" value={form.contactPhone} onChange={updateField} placeholder="Phone number" /></label>
                  <label className="form-label md:col-span-2">Location<input className="input" name="contactLocation" value={form.contactLocation} onChange={updateField} placeholder="City, country" /></label>
                  <label className="form-label md:col-span-2">Website<input className="input" name="website" value={form.website} onChange={updateField} placeholder="https://yourwebsite.com" /></label>
                  <label className="form-label">LinkedIn<input className="input" name="linkedin" value={form.linkedin} onChange={updateField} placeholder="https://linkedin.com/in/..." /></label>
                  <label className="form-label">Twitter / X<input className="input" name="twitter" value={form.twitter} onChange={updateField} placeholder="https://x.com/..." /></label>
                  <label className="form-label">GitHub<input className="input" name="github" value={form.github} onChange={updateField} placeholder="https://github.com/..." /></label>
                  <label className="form-label">Instagram<input className="input" name="instagram" value={form.instagram} onChange={updateField} placeholder="https://instagram.com/..." /></label>
                </div>
              </section>
              <section className="rounded-[30px] border border-zinc-200 bg-white p-6 shadow-soft">
                <div className="mb-5"><p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Languages and Interests</p><p className="mt-2 text-sm text-zinc-500">Share how you communicate and what categories you care about most.</p></div>
                <div className="space-y-5">
                  <label className="form-label">Languages<input className="input" name="languages" value={form.languages} onChange={updateField} placeholder="English, Nepali, Hindi" /></label>
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-semibold text-zinc-700">Interests</p><p className="text-xs text-zinc-400">{selectedInterests.length}/5 selected</p></div>
                    <div className="flex flex-wrap gap-3">
                      {INTEREST_OPTIONS.map((interest) => {
                        const active = selectedInterests.includes(interest);
                        return <button key={interest} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-white text-zinc-600 hover:border-emerald-200 hover:text-emerald-700"}`} type="button" onClick={() => toggleInterest(interest)}>{interest}</button>;
                      })}
                    </div>
                  </div>
                </div>
              </section>
              <div className="flex flex-wrap items-center gap-3"><button className="btn-primary" disabled={submitting} type="submit">{submitting ? "Saving..." : "Save changes"}</button></div>
            </div>
          </div>
        </form>
        {user?.role === "admin" && (
          <div className="mt-8 rounded-[30px] border border-zinc-200 bg-white p-6 shadow-soft">
            <div className="mb-5"><p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Security Settings</p><h2 className="mt-2 text-3xl font-black text-zinc-950">Change admin password</h2></div>
            <Alert>{passwordError}</Alert>
            <Alert type="success">{passwordSuccess}</Alert>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handlePasswordChange}>
              <label className="form-label">Current Password<input className="input" type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} required /></label>
              <label className="form-label">New Password<input className="input" type="password" minLength={6} value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} required /></label>
              <label className="form-label md:col-span-2">Confirm Password<input className="input" type="password" minLength={6} value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} required /></label>
              <div className="md:col-span-2"><button className="btn-primary" disabled={passwordSubmitting} type="submit">{passwordSubmitting ? "Saving..." : "Update password"}</button></div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
