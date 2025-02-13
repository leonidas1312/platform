import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const supabase = createClient(
  'https://qpqtbkionqkpkoznkhtv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcXRia2lvbnFrcGtvem5raHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk5MzEwNjUsImV4cCI6MjAyNTUwNzA2NX0.oVDEhm-hXMqSBfIeYcvexWXzKi-jS3QUgTD3NDaZVvI'
);

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
