import { useQuery } from "@tanstack/react-query";
import { Trophy, Code2, Cpu, Info } from "lucide-react";
import { benchmarks } from "@/data/benchmarks";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import CodeBlock from "@/components/CodeBlock";
import { fetchInstanceFiles } from "@/utils/repository";
import { toast } from "@/components/ui/use-toast";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import results from "@/data/tsp_benchmark.json";

export default function Leaderboard() {
  const currentBenchmark = benchmarks[0];
  // State to select which dataset benchmark (JSON) to display
  const [selectedDataset, setSelectedDataset] = useState("small");

  // Retrieve benchmark results for the selected dataset from results.json
  const currentResults = results[selectedDataset];

  // Sort optimizers by avg_gap ascending (lower gap is better)
  const sortedOptimizers = currentResults
    ? Object.entries(currentResults.optimizers).sort(
        ([, a], [, b]) => a.avg_gap - b.avg_gap
      )
    : [];

  // Helper to convert number to ordinal (e.g., 1 => "1st", 2 => "2nd", etc.)
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row gap-8 max-w-[1800px] mx-auto p-6">
        {/* Sidebar with benchmarks */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="font-medium mb-4">Benchmark Problems</h3>
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
              <span className="text-sm">
                All tests run locally on i7-12700K/32GB DDR5
              </span>
            </div>
            {/* Benchmark list would go here */}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  Traveling Salesman Problem
                </h1>
                <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Environment and Instance Selection Section */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <Badge variant="outline" className="flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                {currentBenchmark.testEnvironment.cpu}
              </Badge>
              <Badge variant="outline">{currentBenchmark.testEnvironment.ram}</Badge>
              <Badge variant="outline">{currentBenchmark.testEnvironment.os}</Badge>
              <Badge variant="outline">
                {currentBenchmark.testEnvironment.timestamp}
              </Badge>
            </div>

            {/* Dataset Benchmark Selection & Info */}
            <div className="mb-4">
              <div className="mt-2 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-700">
                  Below we present 3 TSP benchmarks. The <strong>small</strong> dataset contains 10 TSP problems ranging from 14 to 48 cities. The <strong>medium</strong> dataset contains 5 TSP problems ranging from 52 to 99 cities. The <strong>large</strong> dataset contains 9 TSP problems ranging from 127 to 493 cities.
                  Each optimizer solved each problem in the dataset 10 times and we present the average runtime and average gap between the best known solution (all problems in the datasets are from <strong>TSPlib</strong>).
                  In this benchmark we have included a QUBO optimizer which solves the TSP QUBO formulation.
                </p>
              </div>
            </div>

            {/* Optimizer Leaderboard Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-center">Position</th>
                    <th className="px-6 py-3 text-left">
                      <div className="flex items-center gap-1">
                        Optimizer
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Name of the optimization algorithm
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        Average Gap
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Gap percentage between known optimal solution
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        Average Runtime
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Defines the time in seconds that we allowed the optimizer to run
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedOptimizers.map(([optimizer, stats], index) => (
                    <tr key={optimizer} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-center">
                        {index === 0 ? (
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-400 text-white font-bold">
                            🥇
                          </span>
                        ) : index === 1 ? (
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-400 text-white font-bold">
                            🥈
                          </span>
                        ) : index === 2 ? (
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-500 text-white font-bold">
                            🥉
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-200 text-blue-800 font-bold">
                            {getOrdinal(index + 1)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-800">
                        <a
                          href={stats.qubot_repo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {optimizer}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {stats.avg_gap}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {stats.avg_runtime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
