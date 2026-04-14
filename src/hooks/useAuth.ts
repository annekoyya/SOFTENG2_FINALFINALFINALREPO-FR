// src/hooks/useAuth.ts
import { useState, useCallback, useEffect } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: "Employee" | "HR" | "Manager" | "Accountant" | "Admin";
  created_at: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: User["role"];
}

interface UseAuthReturn {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  isAdmin: () => boolean;
  isHR: () => boolean;
  isManager: () => boolean;
  isAccountant: () => boolean;
  canApproveLeave: () => boolean;
  canManagePayroll: () => boolean;
}

const TOKEN_KEY = "hr_auth_token";
const USER_KEY = "hr_auth_user";

const saveSession = (token: string, user: User) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
const getUser = (): User | null => {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
};

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(getUser);
  const [token, setToken] = useState<string | null>(getToken);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = token !== null && user !== null;

  // Verify stored token on mount
  useEffect(() => {
    if (!token) return;

    fetch("/api/auth/me", {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) {
          clearSession();
          setToken(null);
          setUser(null);
        } else {
          return res.json();
        }
      })
      .then((data) => {
        if (data?.success && data?.data) {
          setUser(data.data);
        }
      })
      .catch(() => {
        clearSession();
        setToken(null);
        setUser(null);
      });
  }, []);

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    setError(message);
  };

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Login failed");
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Registration failed");
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
      const currentToken = getToken();
      if (currentToken) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => {});
      }
    } finally {
      clearSession();
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const currentToken = getToken();
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          'Authorization': `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: newPassword,
        }),
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to change password");
      }

      clearSession();
      setToken(null);
      setUser(null);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const isAdmin = useCallback(() => user?.role === "Admin", [user]);
  const isHR = useCallback(() => user?.role === "HR", [user]);
  const isManager = useCallback(() => user?.role === "Manager", [user]);
  const isAccountant = useCallback(() => user?.role === "Accountant", [user]);
  const canApproveLeave = useCallback(() => ["Admin", "HR", "Manager"].includes(user?.role ?? ""), [user]);
  const canManagePayroll = useCallback(() => ["Admin", "Accountant"].includes(user?.role ?? ""), [user]);

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