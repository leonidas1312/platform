import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

async function fetchGitHubUsername(token) {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `token ${token}` },
  });
  const data = await res.json();
  return data.login;
}

const GithubAuth = () => {
  useEffect(() => {
    const getSessionAndUpdateUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.provider_token) {
        console.log("GitHub user token1:", session.provider_token);
        try {
          const githubUsername = await fetchGitHubUsername(session.provider_token);
          console.log("GitHub username:", githubUsername);
          // Update the user's metadata to store the GitHub username.
          const { error } = await supabase.auth.updateUser({
            data: { username: githubUsername },
          });
          if (error) {
            console.error("Error updating user metadata:", error);
          }
        } catch (err) {
          console.error("Error fetching GitHub username:", err);
        }
      }
    };
    getSessionAndUpdateUser();
  }, []);

  const handleGithubLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          scopes: "read:user repo", // Request needed scopes
          redirectTo: `${window.location.origin}/profile`,
        },
      });

      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("GitHub auth error:", error);
      toast({
        title: "Authentication Error",
        description: "Failed to authenticate with GitHub",
        variant: "destructive",
      });
    }
  };

  return (
    <Button onClick={handleGithubLogin} className="w-full">
      <Github className="mr-2" />
      Sign in with GitHub
    </Button>
  );
};

export default GithubAuth;
