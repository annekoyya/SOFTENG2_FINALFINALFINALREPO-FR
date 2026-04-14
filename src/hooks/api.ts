// src/hooks/api.ts
const API_BASE_URL = '';

export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem("hr_auth_token");

  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
  };

  // Use relative URL (Vite proxy will handle it)
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("hr_auth_token");
    localStorage.removeItem("hr_auth_user");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  return response;
};