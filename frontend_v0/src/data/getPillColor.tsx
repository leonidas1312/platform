
export function getPillColor(key: string) {
    // Gray categories:
    if (key === "all" || key === "recently-updated") {
      return {
        selectedBg: "bg-gray-600 text-white border-gray-600",
        notSelectedBg: "bg-white text-gray-600 hover:bg-gray-100 border-gray-300",
      };
    }
  
    // Problem categories => orange
    const problemCats = [
      "combinatorial-optimization",
      "constraint-satisfaction",
      "scheduling",
      "routing",
      "graph-based",
      "continuous-functions",
      "multi-objective",
    ];
  
    // Optimizer categories => blue
    const optimizerCats = [
      "exact-solvers",
      "heuristic-approaches",
      "gradient-based",
      "quantum-algorithms",
      "hybrid-methods",
      "ml-approaches",
      "stochastic-approaches",
    ];
  
    if (problemCats.includes(key)) {
      return {
        selectedBg: "bg-gray-600 text-white border-gray-600",
        notSelectedBg: "bg-white text-gray-600 hover:bg-gray-50 border-gray-300",
      };
    }
  
    if (optimizerCats.includes(key)) {
      return {
        selectedBg: "bg-gray-600 text-white border-gray-600",
        notSelectedBg: "bg-white text-gray-600 hover:bg-gray-50 border-gray-300",
      };
    }
  
    // Fallback if a category doesn’t match any of the above
    return {
      selectedBg: "bg-gray-600 text-white border-gray-600",
      notSelectedBg: "bg-white text-gray-600 hover:bg-gray-100 border-gray-300",
    };
  }
  