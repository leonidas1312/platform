
import { CategoryData } from "@/types/repository";
import { TrendingUp, Star, GitFork, Clock, LayoutGrid } from "lucide-react";

export const categories: Record<string, CategoryData> = {
  "all": {
    label: "All Repos",
    description: "View all repositories",
    icon: <LayoutGrid className="w-4 h-4" />,
    repos: []  // Empty array since this will show all repos
  },
  "trending": {
    label: "Trending",
    description: "Most active repositories in the last 30 days",
    icon: <TrendingUp className="w-4 h-4" />,
    repos: ["quantum-annealing", "graph-coloring", "neural-optimizer"]
  },
  "most-starred": {
    label: "Most Starred",
    description: "Repositories with the highest number of stars",
    icon: <Star className="w-4 h-4" />,
    repos: ["particle-swarm", "genetic-algorithm", "quantum-approximate-optimization"]
  },
  "most-forked": {
    label: "Most Forked",
    description: "Repositories with the highest number of forks",
    icon: <GitFork className="w-4 h-4" />,
    repos: ["traveling-salesman", "minimum-spanning-tree", "gradient-descent"]
  },
  "recently-updated": {
    label: "Recently Updated",
    description: "Latest updates and improvements",
    icon: <Clock className="w-4 h-4" />,
    repos: ["newton-method", "simplex", "portfolio-optimization"]
  }
};
