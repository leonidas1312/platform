// src/data.tsx
import { CategoryData } from "@/types/repository";
import {
  Clock,
  LayoutGrid,
  // Problem Category Icons:
  Dice1,         // For combinatorial optimization (or related metaheuristics)
  Hash,          // For linear & integer programming
  Aperture,      // For graph-based optimization
  CheckSquare,   // For constraint satisfaction
  Puzzle,        // For metaheuristics & heuristics
  Atom,          // For quantum optimization
  // Optimizer Category Icons:
  Target,        // For exact solvers
  Smile,         // For heuristic approaches
  // Reusing Dice1 for metaheuristic approaches
  TrendingDown,  // For gradient-based optimization
  Atom as AtomIcon, // For quantum algorithms (reusing Atom)
  Layers,        // For hybrid methods
  // Other icons:
  Calendar,
  MapPin,
} from "lucide-react";

export const categories: Record<string, CategoryData> = {
  // General categories
  "all": {
    label: "All Repos",
    description: "View all repositories",
    icon: <LayoutGrid className="w-4 h-4" />,
    repos: []
  },
  "recently-updated": {
    label: "Recently Updated",
    description: "Latest updates and improvements",
    icon: <Clock className="w-4 h-4" />,
    repos: []
  },

  // --- Problem Categories (by Optimization Problem Type) ---

  "bin-packing": {
    label: "Bin packing",
    description: "",
    icon: <Dice1 className="w-4 h-4" />,
    repos: [
      "combinatorial"
    ]
  },
  "scheduling": {
    label: "Scheduling",
    description: "",
    icon: <Hash className="w-4 h-4" />,
    repos: [
      "linear programming",
      "integer programming",
      "milp"
    ]
  },
  "mathematical-functions": {
    label: "Mathematical functions",
    description: "",
    icon: <Aperture className="w-4 h-4" />,
    repos: [
      "mathematical function"
    ]
  },
  "vehicle-routing": {
    label: "Vehicle routing",
    description: "",
    icon: <CheckSquare className="w-4 h-4" />,
    repos: [
      "vehicle routing",
      "routing"
    ]
  },

  // --- Optimizer Categories (by Algorithm Type) ---

  "exact-solvers": {
    label: "Exact Solvers",
    description: "Optimizers using exact methods (e.g. Branch & Bound, Dynamic Programming)",
    icon: <Target className="w-4 h-4" />,
    repos: [
      "dynamic programming",
      "exact",
    ]
  },
  "heuristic-approaches": {
    label: "Heuristic Approaches",
    description: "Optimizers using heuristic methods (e.g. Greedy Algorithms, Local Search)",
    icon: <Smile className="w-4 h-4" />,
    repos: [
      "heuristic"
    ]
  },
  "gradient-based": {
    label: "Gradient-Based Optimization",
    description: "Optimizers based on gradient descent (e.g. SGD, Adam)",
    icon: <TrendingDown className="w-4 h-4" />,
    repos: [
      "stochastic gradient descent",
      "gradient descent",
      "gradient"
    ]
  },
  "quantum-algorithms": {
    label: "Quantum Optimizers",
    description: "Optimizers using quantum methods (e.g. QAOA, VQE)",
    icon: <AtomIcon className="w-4 h-4" />,
    repos: [
      "quantum algorithm"
    ]
  },
  "hybrid-methods": {
    label: "Hybrid Methods",
    description: "Optimizers combining classical and quantum approaches",
    icon: <Layers className="w-4 h-4" />,
    repos: [
      "hybrid method"
    ]
  },
};
