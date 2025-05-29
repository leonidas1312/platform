import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import Layout from "../components/Layout";

const API = import.meta.env.VITE_API_BASE;


const AuthPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get the page user was trying to access before being redirected to login
  const from = location.state?.from?.pathname || `/u/${username}`;

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.token) {
          localStorage.setItem("gitea_token", data.token);
        }
        toast({ title: "Success!", description: "Login successful!" });
        // Redirect to the page user was trying to access, or profile if no specific page
        const redirectTo = location.state?.from?.pathname || `/u/${username}`;
        navigate(redirectTo, { replace: true });
      } else {
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
        }
      } catch (e) {
        toast({
          title: "Error",
          description: `Operation failed: ${(e as Error).message}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

  return (
    <Layout hideNavbar>
      <div className="min-h-screen flex items-center justify-center p-6 md:p-10 bg-background">
        <div className="w-full max-w-md">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Welcome Back</h1>
                  <p className="text-sm text-muted-foreground">
                    {location.state?.from ?
                      "Please sign in to access optimization tools" :
                      "Enter your credentials to log in"
                    }
                  </p>
                </div>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Processing..." : "Login"}
                  </Button>
                </div>

              </form>
        </div>
      </div>
    </Layout>
  );
};

export default AuthPage;
