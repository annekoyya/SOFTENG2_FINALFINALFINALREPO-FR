import { useState, useCallback, useEffect } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: "Employee" | "HR" | "Manager" | "Accountant" | "Admin";
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  // Role helpers
  isAdmin: () => boolean;
  isHR: () => boolean;
  isManager: () => boolean;
  isAccountant: () => boolean;
  canApproveLeave: () => boolean;
  canManagePayroll: () => boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: User["role"];
}

const TOKEN_KEY = "hr_auth_token";
const USER_KEY  = "hr_auth_user";

// ─── Token helpers (localStorage) ────────────────────────────────────────────
const saveSession  = (token: string, user: User) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};
const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
const getUser  = (): User | null => {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
};

// ─── Authenticated fetch helper ───────────────────────────────────────────────
const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
};

// Export so other hooks (useEmployees, useAttendance, etc.) can reuse it
export { authFetch };

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): UseAuthReturn {
  const [user, setUser]                = useState<User | null>(getUser);
  const [token, setToken]              = useState<string | null>(getToken);
  const [isLoading, setIsLoading]      = useState(false);
  const [error, setError]              = useState<string | null>(null);

  const isAuthenticated = token !== null && user !== null;

  // On mount: verify the stored token is still valid
  useEffect(() => {
    if (!token) return;

    authFetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          // Token expired or revoked — clear session
          clearSession();
          setToken(null);
          setUser(null);
        }
      })
      .catch(() => {
        clearSession();
        setToken(null);
        setUser(null);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    setError(message);
  };

  // ─── Actions ───────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Laravel validation errors come back as { errors: { email: [...] } }
        const msg = data.errors?.email?.[0] ?? data.message ?? "Login failed";
        throw new Error(msg);
      }

      saveSession(data.data.token, data.data.user);
      setToken(data.data.token);
      setUser(data.data.user);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (formData: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.message ?? "Registration failed";
        throw new Error(msg);
      }

      saveSession(data.data.token, data.data.user);
      setToken(data.data.token);
      setUser(data.data.user);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Best-effort — revoke token on server, then clear locally regardless
      await authFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    } finally {
      clearSession();
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await authFetch("/api/auth/change-password", {
          method: "POST",
          body: JSON.stringify({
            current_password:      currentPassword,
            password:              newPassword,
            password_confirmation: newPassword,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.errors?.current_password?.[0] ?? data.message ?? "Failed to change password");
        }

        // Server revokes all tokens — force re-login
        clearSession();
        setToken(null);
        setUser(null);
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  // ─── Role helpers ──────────────────────────────────────────────────────────
  const isAdmin         = useCallback(() => user?.role === "Admin", [user]);
  const isHR            = useCallback(() => user?.role === "HR", [user]);
  const isManager       = useCallback(() => user?.role === "Manager", [user]);
  const isAccountant    = useCallback(() => user?.role === "Accountant", [user]);
  const canApproveLeave = useCallback(() => ["Admin", "HR", "Manager"].includes(user?.role ?? ""), [user]);
  const canManagePayroll= useCallback(() => ["Admin", "Accountant"].includes(user?.role ?? ""), [user]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    changePassword,
    clearError,
    isAdmin,
    isHR,
    isManager,
    isAccountant,
    canApproveLeave,
    canManagePayroll,
  };
}