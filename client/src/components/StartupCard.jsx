import { Link } from "react-router-dom";
import { formatCurrency } from "../utils/format.js";
import { getFundingCurrent, getFundingPercent } from "../utils/funding.js";
import { formatStructuredValue } from "../utils/startupMetadata.js";
import { ProgressBar } from "./ProgressBar.jsx";
import { startupImage } from "../utils/format.js";

export function StartupCard({ startup }) {
  const fundingCurrent = getFundingCurrent(startup);
  const fundingPercent = getFundingPercent(startup);
  const tagline = startup.basicInfo?.tagline || startup.tagline || startup.description || "No description added yet.";
  const status = startup.status || startup.system?.status || "pending";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,248,0.96))] shadow-soft transition duration-300 hover:-translate-y-1.5 hover:border-emerald-300 hover:shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
      <Link to={`/startups/${startup._id}`} className="relative block overflow-hidden">
        <img
          className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105"
          src={startupImage(startup)}
          alt={`${startup.name} team`}
        />
        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.74))] p-4">
          <div className="flex items-end justify-between gap-3">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-700 backdrop-blur">
              {formatStructuredValue(startup.category, "General")}
            </span>
            <span className="rounded-full bg-zinc-950/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
              {status}
            </span>
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <Link to={`/startups/${startup._id}`} className="mt-2 block">
            <h3 className="text-2xl font-black leading-tight text-zinc-950 transition group-hover:text-emerald-700">{startup.name}</h3>
          </Link>
          <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-zinc-600">{tagline}</p>
        </div>
        <div className="mt-auto space-y-3">
          <div className="rounded-[22px] border border-zinc-200 bg-white/90 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Funding progress</p>
              <span className="text-sm font-semibold text-zinc-700">{fundingPercent}% of goal</span>
            </div>
            <ProgressBar value={fundingPercent} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[20px] bg-zinc-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Raised</p>
              <p className="mt-2 text-base font-black text-zinc-950">{formatCurrency(fundingCurrent)}</p>
            </div>
            <div className="rounded-[20px] bg-zinc-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Traction</p>
              <p className="mt-2 text-base font-black text-zinc-950">{startup.likesCount || 0} likes</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-2 text-sm text-zinc-500">
            <span>{startup.savesCount || 0} saves</span>
            <Link
              to={`/startups/${startup._id}`}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 font-semibold text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700"
            >
              Explore
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
