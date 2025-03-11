import React from "react";
import CodeBlock from "@/components/CodeBlock"; // your existing code-block component
import { FilePlus, ListChecks } from "lucide-react";

const BenchmarkGuide: React.FC = () => {
  return (
    <div className="prose max-w-none mx-auto px-4 py-8">
      <p>
        Our <strong>Leaderboard</strong> lets you compare various optimizers on
        benchmark sets. If you have your own problem instances or
        results, you can add them by providing a specially formatted JSON file
        (similar to the one shown below).
      </p>

      <div className="flex items-center gap-3 my-6">
        <FilePlus className="w-8 h-8 text-primary" />
        <p className="text-lg font-semibold">Benchmark Upload Steps</p>
      </div>

      <ol className="list-decimal list-inside mb-6">
        <li>
          Prepare a JSON file capturing your benchmark results (optimizers,
          average metrics, links to repos).
        </li>
        <li>
          Add any descriptive metadata (e.g., time horizon, problem size,
          environment specs).
        </li>
        <li>
          Provide a short <em>dataset name</em> (like “small,” “medium,”
          “large,” or custom).
        </li>
        <li>
          Submit/push your JSON file to the qubots GitHub repo.
        </li>
      </ol>

      <div className="flex items-center gap-3 my-6">
        <ListChecks className="w-8 h-8 text-primary" />
        <p className="text-lg font-semibold">Example JSON structure</p>
      </div>

      <p>
        Here’s a snippet from our <strong>TSP benchmark file</strong>:
      </p>

      <CodeBlock
        code={`{
    "small": {
        "optimizers": {
            "Google/OR-tools": {
                "avg_gap": 0.82,
                "avg_runtime": 1.00,
                "qubot_repo": "https://github.com/Rastion/ortools_tsp_solver"
            },
            "Rastion/Christofides": {
                "avg_gap": 2.19,
                "avg_runtime": 1.01,
                "qubot_repo": "https://github.com/Rastion/christofides_tsp_solver"
            },
            "Rastion/Guided-Local-Search": {
                "avg_gap": 11.54,
                "avg_runtime": 1.00,
                "qubot_repo": "https://github.com/Rastion/gls_tsp_solver"
            },
            
            "Rastion/QUBO_RL_optimizer": {
                "avg_gap": 43.19,
                "avg_runtime": 11.18,
                "qubot_repo": "https://github.com/Rastion/rl-qubo-optimizer"
            }
        },
        "files_included": {
            "bays29.tsp": 2020,
            "burma14.tsp": 3323,
            "dantzig42.tsp": 699,
            "fri26.tsp": 937,
            "gr17.tsp": 2085,
            "gr21.tsp": 2707,
            "gr24.tsp": 1272,
            "gr48.tsp": 5046,
            "hk48.tsp": 11461,
            "ulysses16.tsp": 6859 
        },
        "avg_num_qubo_variables": 964.7
    },
    "medium": {
        "optimizers": {
            "Google/OR-tools": {
                "avg_gap": 3.30,
                "avg_runtime": 1.00,
                "qubot_repo": "https://github.com/Rastion/ortools_tsp_solver"
            },
            "Rastion/Christofides": {
                "avg_gap": 4.02,
                "avg_runtime": 1.08,
                "qubot_repo": "https://github.com/Rastion/christofides_tsp_solver"
            },
            "Rastion/Guided-Local-Search": {
                "avg_gap": 14.65,
                "avg_runtime": 1.00,
                "qubot_repo": "https://github.com/Rastion/gls_tsp_solver"
            }
        },
        "files_included": {
            "berlin52.tsp": 7542,
            "gr96.tsp": 55209,
            "pr76.tsp": 108159,
            "rat99.tsp": 1211,
            "st70.tsp": 675
        }
    },
    "large": {
        "optimizers": {
            "Google/OR-tools": {
                "avg_gap": 3.67,
                "avg_runtime": 5.00,
                "qubot_repo": "https://github.com/Rastion/ortools_tsp_solver"
            },
            "Rastion/Christofides": {
                "avg_gap": 22.56,
                "avg_runtime": 8.09,
                "qubot_repo": "https://github.com/Rastion/christofides_tsp_solver"
            },
            "Rastion/Guided-Local-Search": {
                "avg_gap": 10.09,
                "avg_runtime": 5.00,
                "qubot_repo": "https://github.com/Rastion/gls_tsp_solver"
            }
        },
        "files_included": {
            "bier127.tsp": 118282,
            "brg180.tsp": 1950,
            "ch130.tsp": 6110,
            "ch150.tsp": 6528,
            "d198.tsp": 15780,
            "d493.tsp": 35002,
            "gr202.tsp": 40160,
            "gr229.tsp": 134602,
            "gr431.tsp": 171414
        }
    }
}
`}
      />

      <p>
        In the example above, we define three <em>dataset keys</em>:
        <code>small</code>, <code>medium</code>, and <code>large</code>. Each
        contains:
      </p>

      <ul className="list-disc list-inside mb-4">
        <li>
          <code>optimizers</code>: a dictionary of optimizers that participated,
          along with metrics (<code>avg_gap</code>, <code>avg_runtime</code>)
          and a link (<code>qubot_repo</code>).
        </li>
        <li>
          <code>files_included</code>: any problem instances or references
          relevant to that dataset. Data here are from the instances folder within the qubot problem repo.
        </li>
        <li>
          Optionally more metadata like <code>avg_num_qubo_variables</code> or
          time-limits used, etc.
        </li>
      </ul>

      

      
    </div>
  );
};

export default BenchmarkGuide;
