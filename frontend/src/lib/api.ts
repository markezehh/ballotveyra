export const API_BASE_URL = "https://ballotveyra.onrender.com";

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
      window.location.href = "/login";
    }
    const error = new Error(data.message ?? "Request failed") as Error & { status?: number; code?: string };
    error.status = response.status;
    error.code = typeof data.code === "string" ? data.code : undefined;
    throw error;
  }
  return data as T;
}
