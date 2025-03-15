import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import Layout from "../components/Layout";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    const endpoint = isLogin ? "login" : "register";
    // For login: { username, password }
    // For register: { username, email, password }
    const body = isLogin
      ? { username, password }
      : { username, email, password };

    try {
      const res = await fetch(`http://localhost:4000/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        if (isLogin) {
          // If login successful, store token from server, navigate to profile
          if (data.token) {
            localStorage.setItem('gitea_token', data.token);
          }
          toast({ title: "Success!", description: "Login successful!" });
          navigate('/profile');
        } else {
          toast({
            title: "Success!",
            description: "Account created. Please check your email for verification."});
          navigate('/');
        }
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: `Operation failed: ${ (e as Error).message }`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-full max-w-md space-y-6 px-4">
          <h1 className="text-2xl font-bold text-center">
            {isLogin ? 'Welcome Back' : 'Create Your Account'}
          </h1>

          <div className="space-y-4">
            {/* If logging in, only show username/password. If registering, show username/email/password */}
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            {!isLogin && (
              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}

            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? "Processing..." : isLogin ? "Login" : "Create Account"}
            </Button>
          </div>

          <p className="text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
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
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AuthPage;
