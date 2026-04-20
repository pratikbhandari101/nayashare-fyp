const attemptStore = new Map();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

function getClientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.ip || "unknown";
  const email = String(req.body?.email || "").trim().toLowerCase();
  return `${ip}:${email || "unknown"}`;
}

function cleanupEntry(entry, now) {
  if (!entry) {
    return null;
  }

  if (entry.lockUntil && entry.lockUntil > now) {
    return entry;
  }

  const freshAttempts = entry.attempts.filter((timestamp) => now - timestamp < WINDOW_MS);

  if (!freshAttempts.length) {
    return null;
  }

  return {
    attempts: freshAttempts,
    lockUntil: null
  };
}

export function adminLoginThrottle(req, res, next) {
  const now = Date.now();
  const key = getClientKey(req);
  const currentEntry = cleanupEntry(attemptStore.get(key), now);

  if (!currentEntry) {
    attemptStore.delete(key);
    req.adminLoginThrottleKey = key;
    return next();
  }

  attemptStore.set(key, currentEntry);

  if (currentEntry.lockUntil && currentEntry.lockUntil > now) {
    const error = new Error("Too many admin login attempts. Please wait 15 minutes and try again.");
    error.statusCode = 429;
    return next(error);
  }

  req.adminLoginThrottleKey = key;
  return next();
}

export function recordAdminLoginFailure(key) {
  if (!key) {
    return;
  }

  const now = Date.now();
  const currentEntry = cleanupEntry(attemptStore.get(key), now) || { attempts: [], lockUntil: null };
  const attempts = [...currentEntry.attempts, now];

  if (attempts.length >= MAX_ATTEMPTS) {
    attemptStore.set(key, {
      attempts,
      lockUntil: now + LOCK_MS
    });
    return;
  }

  attemptStore.set(key, {
    attempts,
    lockUntil: null
  });
}

export function clearAdminLoginFailures(key) {
  if (!key) {
    return;
  }

  attemptStore.delete(key);
}
