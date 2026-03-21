// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, LogIn } from "lucide-react";

export default function Login() {
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  // Use plain div inputs instead of shadcn Input to avoid
  // browser native HTML5 email pattern validation conflicts
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearError();
    try {
      await login(email, password);
      navigate("/");
    } catch {
      // error already set in useAuth
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Branding */}
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Blue Lotus
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            HR Management System
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* noValidate disables browser native HTML5 validation */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="text"          // ← text not email, avoids pattern error
                  inputMode="email"    // ← still shows email keyboard on mobile
                  autoComplete="email"
                  placeholder="you@bluelotus.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Test credentials — remove in production */}
            <div className="mt-4 rounded-md bg-muted p-3 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Test Credentials
              </p>
              <div className="space-y-1">
                {[
                  { role: "Admin",      email: "admin@hrharmony.com",      pass: "Admin@1234" },
                  { role: "HR",         email: "hr@hrharmony.com",         pass: "Hr@12345"   },
                  { role: "Accountant", email: "accountant@hrharmony.com", pass: "Account@1"  },
                  { role: "Manager",    email: "manager@hrharmony.com",    pass: "Manager@1"  },
                  { role: "Employee",   email: "employee@hrharmony.com",   pass: "Employee@1" },
                ].map(({ role, email: e, pass }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setEmail(e); setPassword(pass); }}
                    className="block w-full text-left text-xs text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 rounded px-1 py-0.5 transition-colors"
                  >
                    <span className="font-medium">{role}:</span> {e}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Click a role to auto-fill credentials
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}