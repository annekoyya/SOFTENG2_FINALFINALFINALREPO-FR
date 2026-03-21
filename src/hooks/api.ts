/**
 * src/hooks/api.ts
 *
 * Central authenticated fetch helper.
 * All hooks (useEmployees, usePayroll, useAttendance) import authFetch from HERE.
 * This avoids any circular dependency with useAuth.ts.
 */

const TOKEN_KEY = "hr_auth_token";

/**
 * A drop-in replacement for fetch() that automatically attaches
 * the stored Bearer token to every request.
 */
export const authFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem(TOKEN_KEY);

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
};