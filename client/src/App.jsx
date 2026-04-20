import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { AdminLogin } from "./pages/AdminLogin.jsx";
import { AuthPage } from "./pages/AuthPage.jsx";
import { BrowseStartups } from "./pages/BrowseStartups.jsx";
import { CreateStartup } from "./pages/CreateStartup.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Feed } from "./pages/Feed.jsx";
import { ForgotPassword } from "./pages/ForgotPassword.jsx";
import { GoogleRoleSelection } from "./pages/GoogleRoleSelection.jsx";
import { HelpPage } from "./pages/HelpPage.jsx";
import { LoadWallet } from "./pages/LoadWallet.jsx";
import { News } from "./pages/News.jsx";
import { PaymentFailure } from "./pages/PaymentFailure.jsx";
import { PaymentSuccess } from "./pages/PaymentSuccess.jsx";
import { Profile } from "./pages/Profile.jsx";
import { ResetPassword } from "./pages/ResetPassword.jsx";
import { SavedStartups } from "./pages/SavedStartups.jsx";
import { StartupDetails } from "./pages/StartupDetails.jsx";
import { UserProfile } from "./pages/UserProfile.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<BrowseStartups />} />
        <Route path="/startups/:id" element={<StartupDetails />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/news" element={<News />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/select-role" element={<GoogleRoleSelection />} />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet/load"
          element={
            <ProtectedRoute>
              <LoadWallet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-success"
          element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-failure"
          element={
            <ProtectedRoute>
              <PaymentFailure />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-startup"
          element={
            <ProtectedRoute roles={["founder"]}>
              <CreateStartup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/startups/:id/edit"
          element={
            <ProtectedRoute roles={["founder"]}>
              <CreateStartup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/:id"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved-startups"
          element={
            <ProtectedRoute roles={["investor", "founder"]}>
              <SavedStartups />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
