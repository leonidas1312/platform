// src/pages/CreateQubotProblemOptions.tsx (React Router)
// or pages/create-qubot-problem-options.tsx (Next.js pages directory)

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function CreateQubotProblemOptions() {
  const [user, setUser] = useState<any>(null);
  const [owner, setOwner] = useState("");
  const [problemName, setProblemName] = useState("");
  const [license, setLicense] = useState("");
  const [visibility, setVisibility] = useState("public");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
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
    // Add your create problem logic here.
    // For example, you might use supabase.from("problems").insert({...})
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12 px-4 sm:px-6 lg:px-8">
        {/* Heading & Subheading */}
        <div className="text-center mb-16 space-y-6">
          <h1 className="text-5xl font-bold text-gray-900">
            Create a new Qubot Problem
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Define your problem’s name, license, and visibility. Your GitHub account
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

            {/* Problem Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Problem Name
              </label>
              <input
                type="text"
                value={problemName}
                onChange={(e) => setProblemName(e.target.value)}
                placeholder="e.g. MyNewProblem"
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
                Public problems are visible to anyone. Private problems are visible only to you.
              </p>
            </div>

            {/* Submit Button */}
            <Button type="submit" variant="default" className="mt-4">
              Create Problem
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
