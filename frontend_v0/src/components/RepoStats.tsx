import React from "react";
import { GitHubRepo } from "@/types/repository";

interface RepoStatsProps {
  repos: GitHubRepo[];
}

const RepoStats = ({ repos }: RepoStatsProps) => {
  // Count repositories based on the 'type' field
  const totalProblems = repos.filter(repo => repo.repoType === "problem").length;
  const totalOptimizers = repos.filter(repo => repo.repoType === "optimizer").length;

  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-github-gray mb-2">Qubots created</h3>
      <div className="flex justify-between">
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">{totalProblems}</p>
          <p className="text-sm text-github-gray">Problems</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{totalOptimizers}</p>
          <p className="text-sm text-github-gray">Optimizers</p>
        </div>
      </div>
    </div>
  );
};

export default RepoStats;
