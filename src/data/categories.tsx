
import { CategoryData } from "@/types/repository";
import { TrendingUp, Star, GitFork, Clock } from "lucide-react";

export const categories: Record<string, CategoryData> = {
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
  },
  "graph-theory": {
    label: "Graph Theory",
    description: "Optimization problems related to graphs and networks",
    repos: ["graph-coloring", "traveling-salesman", "minimum-spanning-tree"]
  },
  "quantum": {
    label: "Quantum Computing",
    description: "Quantum-inspired algorithms and optimizers",
    repos: ["quantum-annealing", "quantum-approximate-optimization"]
  },
  "machine-learning": {
    label: "Machine Learning",
    description: "ML-based optimization techniques",
    repos: ["neural-optimizer", "reinforcement-learning-solver"]
  }
};
