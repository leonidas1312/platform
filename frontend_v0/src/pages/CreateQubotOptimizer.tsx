// src/pages/CreateQubotOptimizer.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function CreateQubotOptimizer() {
  const [user, setUser] = useState<any>(null);
  const [owner, setOwner] = useState("");
  const [optimizerName, setOptimizerName] = useState("");
  const [license, setLicense] = useState("");
  const [visibility, setVisibility] = useState("public");

  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Use GitHub username if available; fallback to email.
        setOwner(user.user_metadata?.user_name || user.email || "");
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setOwner(session.user.user_metadata?.user_name || session.user.email || "");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const repoName = optimizerName.trim();
      if (!repoName) {
        // Optionally display an error message.
        return;
      }

      // --- Step 1: Create the user in Gitea ---
      // Prepare the payload with the details from your authenticated user.
      // NOTE: The password here is just a placeholder. In production, ensure you generate and handle a secure password.
      const userPayload = {
        email: user.email,
        username: owner,
        password: "defaultPassword123!" // Replace or generate securely
      };

      const userResponse = await fetch("http://localhost:3000/api/v1/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // IMPORTANT: This token should be an admin token. Also, consider a secure way to store and access this.
          "Authorization": "token 237eec6b950de0e47c54f48565f8853f49707873"
        },
        body: JSON.stringify(userPayload)
      });

      // If the user already exists or another non-critical error happens, you might choose to continue.
      if (!userResponse.ok) {
        // Optionally check if the error is due to the user already existing.
        console.warn("User creation in Gitea may have failed or the user already exists.");
      } else {
        const giteaUserData = await userResponse.json();
        console.log("Gitea user created:", giteaUserData);
      }

      // --- Step 2: Create and initialize the repository ---
      const repoPayload = {
        name: repoName,
        description: "Optimizer Qubot Repository",
        private: visibility === "private",
        auto_init: true  // This will auto-initialize the repository (e.g. with a README) if supported by your Gitea instance.
      };

      const repoResponse = await fetch("http://localhost:3000/api/v1/user/repos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // You might also need to use a token that has the appropriate scope for repository creation.
          "Authorization": "token 237eec6b950de0e47c54f48565f8853f49707873"
        },
        body: JSON.stringify(repoPayload)
      });

      if (!repoResponse.ok) {
        throw new Error("Failed to create repository");
      }
      const repoData = await repoResponse.json();
      console.log("Repository created:", repoData);

      // Redirect to the repository details page.
      navigate(`/optimizer/${repoData.name}`);
    } catch (error) {
      console.error("Error creating user or repository:", error);
      // Optionally, display an error message using your toast component.
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12 px-4 sm:px-6 lg:px-8">
        {/* Heading & Subheading */}
        <div className="text-center mb-16 space-y-6">
          <h1 className="text-5xl font-bold text-gray-900">
            Create a new Qubot Optimizer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Define your optimizer’s name, license, and visibility. Your GitHub account
            will automatically be used as the owner.
          </p>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Owner (auto-populated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner
              </label>
              <input
                type="text"
                value={owner}
                disabled
                className="w-full bg-gray-100 border border-gray-300 rounded-md p-3 focus:outline-none"
              />
            </div>

            {/* Optimizer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Optimizer Name
              </label>
              <input
                type="text"
                value={optimizerName}
                onChange={(e) => setOptimizerName(e.target.value)}
                placeholder="e.g. MyNewOptimizer"
                className="w-full bg-white border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* License */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License
              </label>
              <input
                type="text"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="MIT, Apache, etc."
                className="w-full bg-white border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center text-sm text-gray-700">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                    className="mr-2"
                  />
                  Public
                </label>
                <label className="flex items-center text-sm text-gray-700">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === "private"}
                    onChange={() => setVisibility("private")}
                    className="mr-2"
                  />
                  Private
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Public optimizers are visible to anyone. Private optimizers are visible only to you.
              </p>
            </div>

            {/* Submit Button */}
            <Button type="submit" variant="default" className="mt-4">
              Create Optimizer
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
