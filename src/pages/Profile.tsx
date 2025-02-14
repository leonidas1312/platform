// src/pages/Profile.tsx

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Key } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [githubToken, setGithubToken] = useState("");
  const [installationId, setInstallationId] = useState("");

  useEffect(() => {
    const getUserAndToken = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
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

    getUserAndToken();
  }, []);

  const handleGenerateToken = async () => {
    if (!installationId) {
      toast({
        title: "Missing Installation ID",
        description: "Please provide your GitHub App installation ID.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/github/token?installationId=${installationId}`
      );
      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Token Generated",
          description: "Short-lived token generated successfully.",
        });
        setGithubToken(data.token);
      } else {
        throw new Error(data.error || "Token generation failed");
      }
    } catch (error) {
      console.error("Error generating token:", error);
      toast({
        title: "Error",
        description: "Failed to generate token.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>User not authenticated</div>;
  }

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
                {user.user_metadata.full_name}
              </h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Key className="w-5 h-5" />
            Generate GitHub Installation Token
          </h3>
          <div className="space-y-4">
            <Input
              type="text"
              value={installationId}
              onChange={(e) => setInstallationId(e.target.value)}
              placeholder="Enter your GitHub App installation ID"
              className="mb-2"
            />
            <div className="flex gap-4">
              <Button onClick={handleGenerateToken}>Generate Token</Button>
            </div>
            {githubToken && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Your generated token (valid for ~60 minutes):
                </p>
                <Input type="text" readOnly value={githubToken} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
