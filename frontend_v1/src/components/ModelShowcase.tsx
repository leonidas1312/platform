import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ModelCard, { ModelData } from "./ModelCard";

const API = import.meta.env.VITE_API_BASE;


const ModelShowcase = () => {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("gitea_token");
    if (!token) {
      // If no token, user is not logged in. 
      // Possibly redirect or show a message.
      setLoading(false);
      return;
    }

    fetch(`${API}/user-repos`, {
      headers: {
        Authorization: `token ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setRepos(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch repos:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center p-8">Loading Repositories...</div>;
  }

  // Example: no categories (optional). 
  // If you want categories, you'd define them from your repo data (like "private"/"public" or something).
  
  return (
    <section id="repos" className="py-24 px-4 container mx-auto">
      <div className="mb-12 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold mb-4"
        >
          My Gitea Repositories
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg text-foreground/70 max-w-2xl mx-auto"
        >
          Browse through your repositories hosted on Gitea
        </motion.p>
      </div>

      {repos.length === 0 ? (
        <div className="text-center text-sm text-gray-600">
          You have no repositories.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {repos.map((repo: any, index: number) => (
            <ModelCard
              key={repo.id}
              model={{
                id: repo.id.toString(),
                name: repo.name,
                description: repo.description || "No description provided.",
                category: repo.private ? "Private" : "Public",
                downloads: 0, // Gitea doesn't track downloads by default
                stars: repo.stars_count || 0,
                author: repo.owner?.login || "Unknown",
                imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
              }}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default ModelShowcase;
