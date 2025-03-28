import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GalleryVerticalEnd } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import Layout from "../components/Layout";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    setLoading(true);
    const endpoint = isLogin ? "login" : "register";
    const body = isLogin ? { username, password } : { username, email, password };

    try {
      const res = await fetch(`http://localhost:4000/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        if (isLogin) {
          if (data.token) {
            localStorage.setItem("gitea_token", "123");
          }
          toast({ title: "Success!", description: "Login successful!" });
          navigate("/profile");
        } else {
          toast({
            title: "Success!",
            description: "Account created. Please check your email for verification.",
          });
          navigate("/");
        }
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
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Side - Form */}
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">
                    {isLogin ? "Welcome Back" : "Create Your Account"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {isLogin
                      ? "Enter your credentials to log in"
                      : "Enter your details to sign up"}
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
                  {!isLogin && (
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  )}
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
                    {loading
                      ? "Processing..."
                      : isLogin
                      ? "Login"
                      : "Create Account"}
                  </Button>
                </div>
                <div className="text-center text-sm">
                  {isLogin
                    ? "Don't have an account? "
                    : "Already have an account? "}
                  <button
                    type="button"
                    className="text-primary underline hover:text-primary/80"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setUsername("");
                      setEmail("");
                      setPassword("");
                    }}
                  >
                    {isLogin ? "Sign up" : "Login"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="relative hidden bg-muted lg:block">
          <img
            src="/rastion1.svg"
            alt="Image"
            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      </div>
    </Layout>
  );
};

export default AuthPage;
