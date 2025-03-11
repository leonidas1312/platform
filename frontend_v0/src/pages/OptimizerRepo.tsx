// src/pages/OptimizerRepo.tsx

import { useParams } from "react-router-dom";

export default function OptimizerRepo() {
  const { repoName } = useParams();

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Repository: {repoName}
        </h1>
        <p className="text-xl text-gray-600">
          Here you can view the details of your optimizer repository and get started with managing your code.
        </p>
        {/* You can add more details or even fetch repository info from Gitea's API here */}
      </div>
    </div>
  );
}
