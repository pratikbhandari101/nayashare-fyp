import { AdminPanel } from "./AdminPanel.jsx";
import { FounderDashboard } from "./FounderDashboard.jsx";
import { InvestorDashboard } from "./InvestorDashboard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export function Dashboard() {
  const { user } = useAuth();

  if (user.role === "admin") {
    return <AdminPanel />;
  }

  return user.role === "founder" ? <FounderDashboard /> : <InvestorDashboard />;
}
