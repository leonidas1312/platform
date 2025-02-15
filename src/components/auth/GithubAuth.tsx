import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

const GithubAuth = () => {
  // When this component mounts, check the current session and log the GitHub OAuth token (if available)
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.provider_token) {
        console.log("GitHub user token:", session.provider_token);
      }
    };
    getSession();
  }, []);

  const handleGithubLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          scopes: "read:user repo", // Make sure to request needed scopes (e.g. read:org if required)
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
