import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { GitHubIcon } from "@/components/ui/custom-icons";
import Layout from "../components/Layout";

const API = import.meta.env.VITE_API_BASE;


const AuthPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get the page user was trying to access before being redirected to login

  // Handle OAuth errors from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const error = urlParams.get('error');

    if (error) {
      let errorMessage = "Authentication failed";

      switch (error) {
        case 'oauth_error':
          errorMessage = "GitHub OAuth authentication failed";
          break;
        case 'no_code':
          errorMessage = "No authorization code received from GitHub";
          break;
        case 'invalid_state':
          errorMessage = "Invalid OAuth state parameter - please try again";
          break;
        case 'token_exchange_failed':
          errorMessage = "Failed to exchange authorization code for token";
          break;
        case 'profile_fetch_failed':
          errorMessage = "Failed to fetch user profile from GitHub";
          break;
        case 'gitea_user_creation_failed':
          errorMessage = "Failed to create user account";
          break;
        case 'oauth_callback_failed':
          errorMessage = "OAuth callback processing failed";
          break;
        case 'session_save_failed':
          errorMessage = "Failed to save authentication session";
          break;
        case 'oauth_init_failed':
          errorMessage = "Failed to initialize GitHub OAuth";
          break;
        case 'github_api_error':
          errorMessage = "GitHub API error occurred";
          break;
        case 'database_error':
          errorMessage = "Database error during authentication";
          break;
        default:
          errorMessage = `Authentication error: ${error}`;
      }

      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });

      // Clean up URL by removing error parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [location.search]);

  const handleGitHubSignIn = () => {
    // Redirect to GitHub OAuth endpoint
    window.location.href = `${API}/api/auth/github`;
  };

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Token is now stored in HTTP-only cookie, no need to store in localStorage
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
                  <h1 className="text-2xl font-bold">Welcome to Rastion</h1>
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

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGitHubSignIn}
                    disabled={loading}
                  >
                    <GitHubIcon className="mr-2 h-4 w-4" />
                    Sign in with GitHub
                  </Button>
                </div>

              </form>
        </div>
      </div>
    </Layout>
  );
};

export default AuthPage;
