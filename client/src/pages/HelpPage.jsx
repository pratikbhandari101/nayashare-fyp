import { Link } from "react-router-dom";

const sections = [
  { id: "overview", label: "Overview" },
  { id: "investor", label: "Investor role" },
  { id: "founder", label: "Founder role" },
  { id: "journey", label: "How it flows" }
];

function SidebarIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 17h.01M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4" />
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" />
    </svg>
  );
}

function RoleCard({ eyebrow, title, description, bullets, tone }) {
  const toneMap = {
    emerald: "hover:border-emerald-300 hover:shadow-[0_26px_70px_rgba(16,185,129,0.14)]",
    cyan: "hover:border-cyan-300 hover:shadow-[0_26px_70px_rgba(6,182,212,0.14)]"
  };

  return (
    <article
      className={`rounded-[2rem] border border-zinc-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,248,0.96))] p-6 shadow-soft transition duration-300 hover:-translate-y-1 ${toneMap[tone]}`}
    >
      <p className={`text-xs font-bold uppercase tracking-[0.18em] ${tone === "emerald" ? "text-emerald-700" : "text-cyan-700"}`}>{eyebrow}</p>
      <h3 className="mt-3 text-3xl font-black text-zinc-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-zinc-600">{description}</p>
      <div className="mt-5 space-y-3">
        {bullets.map((bullet) => (
          <div key={bullet} className="rounded-[1.4rem] border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-600">
            {bullet}
          </div>
        ))}
      </div>
    </article>
  );
}

export function HelpPage() {
  return (
    <section className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2.2rem] border border-emerald-900/10 bg-[linear-gradient(145deg,#072f2b_0%,#0f5a4d_52%,#14b87e_130%)] p-6 text-white shadow-[0_32px_90px_rgba(6,78,59,0.22)] lg:p-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <img alt="NayaShare" className="h-11 w-11 object-contain" src="/nayashare-logo.png" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-100">Help Center</p>
                <p className="text-sm text-white/72">Understand how each role works inside NayaShare.</p>
              </div>
            </div>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.24em] text-emerald-100">Guided help</p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">Everything a founder or investor needs to get productive fast.</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/76">
              This guide explains how NayaShare works for investors and founders, what each dashboard is for, and how people move through the platform without confusion.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-soft lg:sticky lg:top-24">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">On this page</p>
            <nav className="mt-4 space-y-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold text-zinc-600 transition hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-950"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <SidebarIcon />
                  </span>
                  <span>{section.label}</span>
                </a>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 space-y-6">
            <section id="overview" className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Overview</p>
              <h2 className="mt-3 text-3xl font-black text-zinc-950">Two core roles, two different goals.</h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-600">
                NayaShare is built around two public user roles. Investors discover startups, save opportunities, invest, and monitor portfolio performance.
                Founders create startup profiles, manage traction updates, and follow fundraising progress from their dashboard.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.6rem] border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Investor focus</p>
                  <p className="mt-3 text-sm leading-7 text-zinc-600">Evaluate opportunities, save promising startups, invest through the platform, and track returns over time.</p>
                </div>
                <div className="rounded-[1.6rem] border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Founder focus</p>
                  <p className="mt-3 text-sm leading-7 text-zinc-600">Showcase the startup, keep metrics updated, engage with funding progress, and manage visibility from one workspace.</p>
                </div>
              </div>
            </section>

            <section id="investor">
              <RoleCard
                eyebrow="Investor role"
                title="How investors use NayaShare"
                description="Investor accounts are designed for discovery, investment, and portfolio monitoring. The platform helps investors move from browsing to informed action."
                tone="cyan"
                bullets={[
                  "Browse startups from the marketplace and use filters like category, growth, stage, and funding goal to narrow decisions.",
                  "Save interesting startups so they stay easy to revisit later from the saved section.",
                  "Load the wallet, invest in startups, and track how each position changes over time from the investor dashboard.",
                  "Use the public profile and startup detail pages to inspect traction, description, and funding progress before committing capital."
                ]}
              />
            </section>

            <section id="founder">
              <RoleCard
                eyebrow="Founder role"
                title="How founders use NayaShare"
                description="Founder accounts are structured around presenting the startup clearly and keeping fundraising momentum visible. The founder dashboard acts as the command center."
                tone="emerald"
                bullets={[
                  "Create a startup profile with branding, tagline, category, and funding details so investors can understand the business quickly.",
                  "Manage startup records from the founder dashboard, review progress, and edit startup information when the company evolves.",
                  "Track raised amount versus funding goal and use the dashboard analytics to understand how the startup is performing.",
                  "Share traction and keep the public startup presence polished so the profile stays investor-ready."
                ]}
              />
            </section>

            <section id="journey" className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-soft">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">How it flows</p>
              <h2 className="mt-3 text-3xl font-black text-zinc-950">A simple mental model for users.</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.6rem] border border-zinc-200 bg-zinc-50 p-5 transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">1. Join</p>
                  <p className="mt-3 text-lg font-black text-zinc-950">Choose investor or founder during registration.</p>
                </div>
                <div className="rounded-[1.6rem] border border-zinc-200 bg-zinc-50 p-5 transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">2. Build context</p>
                  <p className="mt-3 text-lg font-black text-zinc-950">Complete profile details so the account looks credible and useful.</p>
                </div>
                <div className="rounded-[1.6rem] border border-zinc-200 bg-zinc-50 p-5 transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">3. Act</p>
                  <p className="mt-3 text-lg font-black text-zinc-950">Investors explore and invest. Founders create and manage startup listings.</p>
                </div>
                <div className="rounded-[1.6rem] border border-zinc-200 bg-zinc-50 p-5 transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">4. Monitor</p>
                  <p className="mt-3 text-lg font-black text-zinc-950">Dashboards keep progress, activity, and performance visible over time.</p>
                </div>
              </div>
              <div className="mt-6 rounded-[1.6rem] border border-zinc-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,248,0.96))] p-5">
                <p className="text-sm leading-7 text-zinc-600">
                  Need to jump back into the product? Go to the <Link className="font-semibold text-emerald-700 hover:text-emerald-900" to="/">marketplace</Link> to explore startups or open the <Link className="font-semibold text-emerald-700 hover:text-emerald-900" to="/dashboard">dashboard</Link> if you’re already signed in.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
