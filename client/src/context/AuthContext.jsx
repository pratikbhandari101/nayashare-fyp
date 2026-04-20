import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client.js";

const AuthContext = createContext(null);

function readStoredSession() {
  const storage = sessionStorage.getItem("token") ? sessionStorage : localStorage;
  const token = storage.getItem("token");
  const storedUser = storage.getItem("user");

  return {
    storage,
    token,
    user: storedUser ? JSON.parse(storedUser) : null
  };
}

function clearStoredSessions() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
}

export function AuthProvider({ children }) {
  const initialSession = readStoredSession();
  const [user, setUser] = useState(initialSession.user);
  const [token, setToken] = useState(initialSession.token);
  const [loading, setLoading] = useState(Boolean(initialSession.token));

  useEffect(() => {
    let isMounted = true;
    const currentSession = readStoredSession();

    if (!currentSession.token) {
      setLoading(false);
      return undefined;
    }

    apiRequest("/auth/me", {
      authToken: currentSession.token
    })
      .then((data) => {
        if (!isMounted) {
          return;
        }

        currentSession.storage.setItem("user", JSON.stringify(data.user));
        setToken(currentSession.token);
        setUser(data.user);
      })
      .catch(() => {
        clearStoredSessions();
        if (isMounted) {
          setToken(null);
          setUser(null);
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
  }, []);

  function storeSession(data, { persist = true } = {}) {
    const storage = persist ? localStorage : sessionStorage;
    const otherStorage = persist ? sessionStorage : localStorage;

    otherStorage.removeItem("token");
    otherStorage.removeItem("user");
    storage.setItem("token", data.token);
    storage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function updateStoredUser(nextUser) {
    const storage = sessionStorage.getItem("token") ? sessionStorage : localStorage;
    storage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }

  function mergeStoredUser(patch) {
    const storage = sessionStorage.getItem("token") ? sessionStorage : localStorage;
    const currentUser = user || JSON.parse(storage.getItem("user") || "null");

    if (!currentUser) {
      return null;
    }

    return updateStoredUser({ ...currentUser, ...patch });
  }

  async function login(credentials) {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: credentials
    });
    return storeSession(data, { persist: true });
  }

  async function adminLogin(credentials) {
    const data = await apiRequest("/admin/login", {
      method: "POST",
      body: credentials
    });
    return storeSession(data, { persist: false });
  }

  async function register(payload) {
    return apiRequest("/auth/register", {
      method: "POST",
      body: payload
    });
  }

  async function sendVerification(email) {
    return apiRequest("/auth/send-verification", {
      method: "POST",
      body: { email }
    });
  }

  async function verifyEmail(payload) {
    const data = await apiRequest("/auth/verify-email", {
      method: "POST",
      body: payload
    });
    return storeSession(data, { persist: true });
  }

  async function googleLogin(payload) {
    const data = await apiRequest("/auth/google", {
      method: "POST",
      body: payload
    });
    if (data.needsRoleSelection) {
      return data;
    }
    return storeSession(data, { persist: true });
  }

  async function googleRegister(payload) {
    const data = await apiRequest("/auth/google-register", {
      method: "POST",
      body: payload
    });
    return storeSession(data, { persist: true });
  }

  async function refreshProfile() {
    const authToken = token || readStoredSession().token;
    const data = await apiRequest("/users/profile", { authToken });
    return updateStoredUser(data.user);
  }

  async function updateProfile(payload, file) {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("gender", payload.gender);
    formData.append("dateOfBirth", payload.dateOfBirth);
    formData.append("bio", payload.bio || "");
    formData.append("about", payload.about || "");
    formData.append("website", payload.website || "");
    formData.append("contactEmail", payload.contactEmail || "");
    formData.append("contactPhone", payload.contactPhone || "");
    formData.append("contactLocation", payload.contactLocation || "");
    formData.append("contactIsPublic", String(Boolean(payload.contactIsPublic)));
    formData.append("socialLinkedin", payload.linkedin || "");
    formData.append("socialTwitter", payload.twitter || "");
    formData.append("socialGithub", payload.github || "");
    formData.append("socialInstagram", payload.instagram || "");
    formData.append("languages", JSON.stringify(payload.languages || []));
    formData.append("interests", JSON.stringify(payload.interests || []));
    formData.append("experienceEntries", JSON.stringify(payload.experienceEntries || []));
    formData.append("educationEntries", JSON.stringify(payload.educationEntries || []));
    if (file) {
      formData.append("profileImage", file);
    }
    const authToken = token || readStoredSession().token;
    const data = await apiRequest("/users/profile", {
      method: "PUT",
      body: formData,
      authToken
    });
    return updateStoredUser(data.user);
  }

  async function updateProfileImage(file) {
    const formData = new FormData();
    formData.append("profileImage", file);
    const authToken = token || readStoredSession().token;
    const data = await apiRequest("/users/profile-image", {
      method: "PUT",
      body: formData,
      authToken
    });
    return updateStoredUser(data.user);
  }

  async function forgotPassword(email) {
    return apiRequest("/auth/forgot-password", {
      method: "POST",
      body: { email }
    });
  }

  async function resetPassword(payload) {
    return apiRequest("/auth/reset-password", {
      method: "POST",
      body: payload
    });
  }

  async function logout() {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // Local logout should still succeed if the API is unavailable.
    }
    clearStoredSessions();
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      adminLogin,
      logout,
      register,
      sendVerification,
      verifyEmail,
      googleLogin,
      googleRegister,
      refreshProfile,
      mergeStoredUser,
      updateProfile,
      updateProfileImage,
      forgotPassword,
      resetPassword
    }),
    [user, loading, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
