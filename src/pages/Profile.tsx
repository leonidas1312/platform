import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Key } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // This will store the GitHub OAuth token from Supabase's session.
  const [githubToken, setGithubToken] = useState("");

  // Retrieve the session from Supabase and store the GitHub user token.
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        if (session.provider_token) {
          console.log("GitHub user token:", session.provider_token);
          setGithubToken(session.provider_token);
          // Optionally, you could save this token in localStorage for CLI use:
          // localStorage.setItem("github_user_token", session.provider_token);
        }
      }
      setLoading(false);
    };
    getSession();
  }, []);

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(githubToken);
      toast({
        title: "Copied!",
        description: "Token copied to clipboard.",
      });
    } catch (err) {
      console.error("Copy failed:", err);
      toast({
        title: "Error",
        description: "Failed to copy token.",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not authenticated</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12 max-w-2xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Profile</h1>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={user.user_metadata.avatar_url}
              alt="Profile"
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h2 className="text-xl font-semibold">
                {user.user_metadata.full_name || "Anonymous"}
              </h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Key className="w-5 h-5" />
            Your GitHub Token
          </h3>
          <p className="text-gray-700 mb-4">
            Below is your GitHub OAuth token. You can copy it and use it with Rastion.
          </p>
          {githubToken ? (
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input type="text" readOnly value={githubToken} />
                <Button onClick={handleCopyToken}>Copy</Button>
              </div>
              <p className="mt-2 font-mono text-sm text-gray-700">{githubToken}</p>
            </div>
          ) : (
            <p className="text-gray-600">No GitHub token found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
