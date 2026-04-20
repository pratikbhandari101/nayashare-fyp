import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { apiRequest, assetUrl } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { formatDate } from "../utils/format.js";

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-semibold transition ${
    isActive ? "bg-emerald-100 text-emerald-900" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
  }`;

function BellIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17H9.143m10.286 0H19a2 2 0 0 1-2-2v-3.382a5 5 0 0 0-1.464-3.536l-.829-.829A4 4 0 0 0 12 6a4 4 0 0 0-2.707 1.253l-.829.829A5 5 0 0 0 7 11.618V15a2 2 0 0 1-2 2h-.429m10.286 0a2.857 2.857 0 1 1-5.714 0"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v2.25M12 18.75V21M5.64 5.64l1.6 1.6M16.76 16.76l1.6 1.6M3 12h2.25M18.75 12H21M5.64 18.36l1.6-1.6M16.76 7.24l1.6-1.6M15.75 12A3.75 3.75 0 1 1 8.25 12a3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 17h.01M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4" />
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" />
    </svg>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const avatar = user?.profileImage || user?.avatar;
  const avatarUrl = avatar ? assetUrl(avatar) : "";
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [markingRead, setMarkingRead] = useState(false);
  const [clearingNotifications, setClearingNotifications] = useState(false);
  const [notificationAnimating, setNotificationAnimating] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchError, setUserSearchError] = useState("");
  if (user) {
    console.debug("Navbar profile image URL:", avatarUrl || "No profile image");
  }
  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  async function loadNotifications() {
    if (!user) {
      return;
    }

    setNotificationLoading(true);
    setNotificationError("");

    try {
      const data = await apiRequest("/notifications");
      const nextNotifications = data.notifications || [];
      const nextUnreadCount =
        typeof data.unreadCount === "number"
          ? data.unreadCount
          : nextNotifications.filter((notification) => !notification.isRead).length;

      setNotifications(nextNotifications);
      setUnreadCount(nextUnreadCount);
    } catch (error) {
      setNotificationError(error.message);
    } finally {
      setNotificationLoading(false);
    }
  }

  async function handleMarkAsRead() {
    setMarkingRead(true);
    setNotificationError("");

    try {
      const data = await apiRequest("/notifications/read-all", {
        method: "PATCH"
      });
      const nextNotifications = data.notifications || [];
      setNotifications(nextNotifications);
      setUnreadCount(nextNotifications.filter((notification) => !notification.isRead).length);
    } catch (error) {
      setNotificationError(error.message);
    } finally {
      setMarkingRead(false);
    }
  }

  async function handleNotificationClick(notificationId) {
    setNotificationError("");

    try {
      const data = await apiRequest(`/notifications/${notificationId}/read`, {
        method: "PATCH"
      });
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? { ...notification, isRead: true } : notification
        )
      );
      setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : Math.max(0, unreadCount - 1));
    } catch (error) {
      setNotificationError(error.message);
    }
  }

  async function handleClearNotifications() {
    setClearingNotifications(true);
    setNotificationError("");

    try {
      const data = await apiRequest("/notifications", {
        method: "DELETE"
      });
      setNotifications(data.notifications || []);
      setUnreadCount(0);
    } catch (error) {
      setNotificationError(error.message);
    } finally {
      setClearingNotifications(false);
    }
  }

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setNotificationOpen(false);
      return;
    }

    loadNotifications();
  }, [user]);

  useEffect(() => {
    if (!notificationOpen) {
      return undefined;
    }

    setNotificationAnimating(true);
    loadNotifications();
    return () => {
      setNotificationAnimating(false);
    };
  }, [notificationOpen]);

  useEffect(() => {
    if (!user || userSearch.trim().length < 2) {
      setUserResults([]);
      setUserSearchLoading(false);
      setUserSearchError("");
      return undefined;
    }

    let isActive = true;
    const timeoutId = window.setTimeout(async () => {
      setUserSearchLoading(true);
      setUserSearchError("");

      try {
        const data = await apiRequest(`/users/search?q=${encodeURIComponent(userSearch.trim())}`);

        if (isActive) {
          setUserResults(data.users || []);
          setUserSearchOpen(true);
        }
      } catch (error) {
        if (isActive) {
          setUserSearchError(error.message);
        }
      } finally {
        if (isActive) {
          setUserSearchLoading(false);
        }
      }
    }, 220);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [user, userSearch]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }

      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setUserSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleUserSelect(userId) {
    setUserSearch("");
    setUserResults([]);
    setUserSearchOpen(false);
    navigate(`/user/${userId}`);
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:flex-nowrap lg:gap-5 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3 rounded-full pr-2 transition hover:bg-zinc-100">
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black shadow-sm ring-1 ring-zinc-200">
              <img className="h-full w-full scale-[1.8] object-cover" src="/nayashare-logo.png" alt="NayaShare logo" />
            </span>
            <span className="text-xl font-black tracking-normal text-zinc-950">NayaShare</span>
          </Link>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 lg:flex-nowrap lg:gap-3">
            {user && (
              <div className="relative order-last w-full sm:order-none sm:max-w-xs lg:mr-3 lg:w-full lg:max-w-[320px]" ref={searchRef}>
                <div className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 transition focus-within:border-emerald-300 focus-within:bg-white">
                  <input
                    aria-label="Search users"
                    className="w-full border-0 bg-transparent text-sm font-medium text-zinc-900 outline-none placeholder:text-zinc-400"
                    placeholder="Search users by name or email"
                    value={userSearch}
                    onChange={(event) => {
                      setUserSearch(event.target.value);
                      setUserSearchOpen(true);
                    }}
                    onFocus={() => setUserSearchOpen(true)}
                  />
                </div>
                {userSearchOpen && (
                  <div className="absolute right-0 top-12 z-40 w-full rounded-2xl border border-zinc-200 bg-white p-3 shadow-soft">
                    <p className="px-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">User discovery</p>
                    <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                      {userSearch.trim().length < 2 ? (
                        <div className="rounded-2xl bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
                          Type at least 2 characters to search people.
                        </div>
                      ) : userSearchLoading ? (
                        <div className="rounded-2xl bg-zinc-50 px-3 py-4 text-sm text-zinc-500">Searching users...</div>
                      ) : userSearchError ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-4 text-sm text-rose-900">
                          {userSearchError}
                        </div>
                      ) : userResults.length ? (
                        userResults.map((result) => {
                          const resultAvatar = assetUrl(result.profileImage || result.avatar);
                          const resultInitials = result.name
                            ?.split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase();

                          return (
                            <button
                              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-zinc-50"
                              key={result.id}
                              type="button"
                              onClick={() => handleUserSelect(result.id)}
                            >
                              {resultAvatar ? (
                                <img className="h-11 w-11 rounded-full object-cover" src={resultAvatar} alt={`${result.name} profile`} />
                              ) : (
                                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-900">
                                  {resultInitials || "U"}
                                </span>
                              )}
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-zinc-950">{result.name}</p>
                                <p className="truncate text-sm text-zinc-500">{result.email}</p>
                                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                  {result.role}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl bg-zinc-50 px-3 py-4 text-sm text-zinc-500">No matching users found.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
              className="theme-toggle"
              type="button"
              onClick={toggleTheme}
            >
              <span className={`theme-toggle-track ${isDark ? "justify-end" : "justify-start"}`}>
                <span className="theme-toggle-thumb">
                  {isDark ? <MoonIcon /> : <SunIcon />}
                </span>
              </span>
              <span className="hidden text-xs font-bold uppercase tracking-[0.16em] sm:inline">
                {isDark ? "Dark" : "Light"}
              </span>
            </button>
            <NavLink to="/" className={navLinkClass}>
              Browse
            </NavLink>
            <NavLink to="/news" className={navLinkClass}>
              News
            </NavLink>
            {user ? (
              <>
                <NavLink to="/feed" className={navLinkClass}>
                  Feed
                </NavLink>
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                {user.role !== "admin" && user.role !== "founder" && (
                  <NavLink to="/saved-startups" className={navLinkClass}>
                    Saved
                  </NavLink>
                )}
                <div className="relative shrink-0" ref={dropdownRef}>
                  <button
                    aria-label="Notifications"
                    className="relative rounded-md px-3 py-2 text-sm font-semibold text-zinc-700 transition duration-200 hover:bg-zinc-100 hover:text-zinc-950"
                    type="button"
                    onClick={() => setNotificationOpen((current) => !current)}
                  >
                    <span className="flex items-center justify-center">
                      <BellIcon />
                    </span>
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                  {notificationOpen && (
                    <div
                      className={`absolute right-0 top-12 z-40 w-80 rounded-md border border-zinc-200 bg-white p-4 shadow-soft transition duration-200 ${
                        notificationAnimating ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold uppercase text-emerald-700">Notifications</p>
                          <p className="text-sm text-zinc-500">{unreadCount} unread</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                            type="button"
                            disabled={markingRead || !unreadCount}
                            onClick={handleMarkAsRead}
                          >
                            {markingRead ? "Saving..." : "Mark all read"}
                          </button>
                          <button
                            className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                            type="button"
                            disabled={clearingNotifications || !notifications.length}
                            onClick={handleClearNotifications}
                          >
                            {clearingNotifications ? "Clearing..." : "Clear all"}
                          </button>
                        </div>
                      </div>
                      {notificationError && (
                        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                          {notificationError}
                        </div>
                      )}
                      <div className="mt-4 max-h-96 space-y-3 overflow-y-auto">
                        {notificationLoading ? (
                          <div className="text-sm text-zinc-500">Loading notifications...</div>
                        ) : notifications.length ? (
                          notifications.map((notification) => (
                            <button
                              className={`rounded-md border px-3 py-3 text-sm ${
                                notification.isRead
                                  ? "border-zinc-200 bg-zinc-50 text-zinc-700"
                                  : "border-emerald-200 bg-emerald-50 text-zinc-900"
                              }`}
                              key={notification.id}
                              type="button"
                              onClick={() => handleNotificationClick(notification.id)}
                            >
                              <p className="font-medium text-left">{notification.message}</p>
                              <p className="mt-1 text-xs text-zinc-500">{formatDate(notification.createdAt)}</p>
                            </button>
                          ))
                        ) : (
                          <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-5 text-center text-sm text-zinc-500">
                            No notifications yet.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <NavLink
                  aria-label="Profile"
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold transition ${
                      isActive ? "bg-emerald-100 text-emerald-900" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                    }`
                  }
                  to="/profile"
                >
                  {avatar ? (
                    <img className="h-9 w-9 rounded-full object-cover" src={avatarUrl} alt={`${user.name} profile`} />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-900">
                      {initials || user.name}
                    </span>
                  )}
                  <span className="hidden sm:inline">{user.name}</span>
                </NavLink>
                <button className="btn-secondary" onClick={handleLogout} type="button">
                  Logout
                </button>
                <NavLink
                  to="/help"
                  aria-label="Help"
                  className={({ isActive }) =>
                    `inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
                      isActive ? "bg-emerald-100 text-emerald-900" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                    }`
                  }
                >
                  <HelpIcon />
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  Login
                </NavLink>
                <NavLink to="/register" className="btn-primary">
                  Register
                </NavLink>
                <NavLink
                  to="/help"
                  aria-label="Help"
                  className={({ isActive }) =>
                    `inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
                      isActive ? "bg-emerald-100 text-emerald-900" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                    }`
                  }
                >
                  <HelpIcon />
                </NavLink>
              </>
            )}
          </div>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
