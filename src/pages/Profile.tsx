// src/pages/Profile.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Key } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [githubToken, setGithubToken] = useState("");

  useEffect(() => {
    const getUserAndEnsureProfile = async () => {
      try {
        // Fetch the authenticated user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Check if the profile exists in the "profiles" table
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (profileError || !profile) {
            // If not, insert a new profile record
            const { error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: user.id,
                full_name: user.user_metadata?.full_name || "",
                avatar_url: user.user_metadata?.avatar_url || "",
                updated_at: new Date().toISOString(),
              });
            if (insertError) {
              console.error("Error creating profile:", insertError);
              toast({
                title: "Error",
                description: "Failed to create profile",
                variant: "destructive",
              });
            }
          }

          // Fetch GitHub token if one exists
          const { data, error } = await supabase
            .from("github_tokens")
            .select("token")
            .eq("user_id", user.id)
            .single();
          if (data?.token) {
            setGithubToken(data.token);
          }
          if (error && error.code !== "PGRST116") {
            // PGRST116 means no row was found—this is expected.
            console.error("Error fetching token:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    getUserAndEnsureProfile();
  }, []);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  const handleTokenUpdate = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("github_tokens")
        .upsert({
          user_id: user.id,
          token: githubToken,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      toast({
        title: "Success",
        description: "GitHub token updated successfully",
      });
    } catch (error) {
      console.error("Error updating token:", error);
      toast({
        title: "Error",
        description: "Failed to update GitHub token",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12 max-w-2xl">
        <h1 className="text-4xl font-bold text-github-gray mb-8">Profile</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={user.user_metadata.avatar_url}
              alt="Profile"
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h2 className="text-xl font-semibold">
                {user.user_metadata.full_name}
              </h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Key className="w-5 h-5" />
            GitHub Token Management
          </h3>

          <div className="space-y-4">
            <div>
              <Input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="Enter your GitHub token"
                className="mb-2"
              />
              <p className="text-sm text-gray-600 mb-4">
                This token will be used to create repositories in the Rastion
                organization.
              </p>
            </div>
            <div className="flex gap-4">
              <Button onClick={handleTokenUpdate}>Update Token</Button>
              <Button
                variant="outline"
                onClick={() =>
                  window.open("https://github.com/settings/tokens/new", "_blank")
                }
              >
                Generate New Token
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
