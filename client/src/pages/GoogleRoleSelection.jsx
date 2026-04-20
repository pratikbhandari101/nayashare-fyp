import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Alert } from "../components/Alert.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function getPendingRegistration(locationState) {
  if (locationState?.googleRegistrationToken) {
    return locationState;
  }

  const stored = sessionStorage.getItem("pendingGoogleRegistration");
  try {
    return stored ? JSON.parse(stored) : null;
  } catch {
    sessionStorage.removeItem("pendingGoogleRegistration");
    return null;
  }
}

export function GoogleRoleSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { googleRegister, user } = useAuth();
  const pendingRegistration = useMemo(() => getPendingRegistration(location.state), [location.state]);
  const [error, setError] = useState("");
  const [submittingRole, setSubmittingRole] = useState("");

  if (user) {
    return <Navigate to={user.role === "founder" ? "/dashboard" : "/"} replace />;
  }

  if (!pendingRegistration) {
    return <Navigate to="/login" replace />;
  }

  async function selectRole(role) {
    setSubmittingRole(role);
    setError("");

    try {
      const authenticatedUser = await googleRegister({
        email: pendingRegistration.email,
        name: pendingRegistration.name,
        googleRegistrationToken: pendingRegistration.googleRegistrationToken,
        role
      });
      sessionStorage.removeItem("pendingGoogleRegistration");
      navigate(authenticatedUser.role === "founder" ? "/dashboard" : "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingRole("");
    }
  }

  return (
    <section className="bg-zinc-50">
      <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-5xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full">
          <div className="mx-auto max-w-2xl text-center">
            {pendingRegistration.avatar && (
              <img
                alt={`${pendingRegistration.name} avatar`}
                className="mx-auto mb-5 h-16 w-16 rounded-md object-cover"
                src={pendingRegistration.avatar}
              />
            )}
            <p className="text-sm font-bold uppercase text-emerald-700">Choose your NayaShare role</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-zinc-950">How do you want to join?</h1>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              Continue as <span className="font-semibold text-zinc-950">{pendingRegistration.name}</span> with{" "}
              <span className="font-semibold text-zinc-950">{pendingRegistration.email}</span>.
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-3xl">
            <Alert>{error}</Alert>
          </div>
          <div className="mx-auto mt-6 grid max-w-3xl gap-5 md:grid-cols-2">
            <button
              className="rounded-md border border-zinc-200 bg-white p-6 text-left shadow-soft transition hover:-translate-y-1 hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={Boolean(submittingRole)}
              onClick={() => selectRole("investor")}
              type="button"
            >
              <p className="text-sm font-bold uppercase text-cyan-700">Investor</p>
              <h2 className="mt-3 text-2xl font-black text-zinc-950">Join as Investor</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Browse startup raises, load your wallet, invest, and track your portfolio.
              </p>
              <span className="mt-5 inline-flex text-sm font-bold text-emerald-700">
                {submittingRole === "investor" ? "Creating account..." : "Select investor"}
              </span>
            </button>
            <button
              className="rounded-md border border-zinc-200 bg-white p-6 text-left shadow-soft transition hover:-translate-y-1 hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={Boolean(submittingRole)}
              onClick={() => selectRole("founder")}
              type="button"
            >
              <p className="text-sm font-bold uppercase text-cyan-700">Founder</p>
              <h2 className="mt-3 text-2xl font-black text-zinc-950">Join as Founder</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Create startup profiles, set funding goals, and monitor funding progress.
              </p>
              <span className="mt-5 inline-flex text-sm font-bold text-emerald-700">
                {submittingRole === "founder" ? "Creating account..." : "Select founder"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
