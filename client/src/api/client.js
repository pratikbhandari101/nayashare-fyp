const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

function getStoredToken() {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
}

export class ApiError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
  }
}

export async function apiRequest(path, options = {}) {
  const { authToken, ...fetchOptions } = options;
  const token = authToken || getStoredToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(options.headers || {})
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
    body: options.body ? (isFormData ? options.body : JSON.stringify(options.body)) : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.message || "Something went wrong", data.errors || []);
  }

  return data;
}

export function assetUrl(path) {
  if (!path) {
    return "";
  }

  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }

  return `${API_ORIGIN}${path}`;
}
