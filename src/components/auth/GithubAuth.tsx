import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

const GithubAuth = () => {
  const handleGithubLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          scopes: "repo user",
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
