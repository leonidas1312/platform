// src/components/ProblemGuidesSection.tsx

import React, { useState, FC, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import CodeBlock from "@/components/CodeBlock";

// Modal for displaying each guide's content
interface GuideModalProps {
  title: string;
  content: ReactNode;
  onClose: () => void;
}

const GuideModal: FC<GuideModalProps> = ({ title, content, onClose }) => {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
        className="bg-gray-900 p-6 rounded-lg max-h-full overflow-auto w-11/12 md:w-3/4 lg:w-1/2"
      >
        <h3 className="text-xl font-bold mb-4 text-white">{title}</h3>
        <div className="text-white space-y-4">{content}</div>
        <div className="mt-6 text-right">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// Identify each guide
type GuideKey = "minVertexCover" | "setCover";

const ProblemGuidesSection: FC = () => {
  // activeGuide controls which modal is open (null = none)
  const [activeGuide, setActiveGuide] = useState<GuideKey | null>(null);

  const closeModal = () => setActiveGuide(null);

  // Detailed instructions for each example problem
  const guides: Record<GuideKey, { title: string; content: ReactNode }> = {
    minVertexCover: {
      title: "Guide: Creating a Rastion Problem – Minimum Vertex Cover",
      content: (
        <>
          <p>
            In this guide, we build a QUBO-based <em>Minimum Vertex Cover</em> problem.
            You must choose a subset of vertices in an undirected graph such that
            every edge is covered—while minimizing the number of vertices selected.
          </p>

          <h4 className="text-lg font-semibold">Step 1: Create the Python Module</h4>
          <p>
            Create a file named <code>min_vertex_cover.py</code>. Below is an example
            of how to implement <code>MinVertexCoverProblem</code> by extending the
            <code>BaseProblem</code> class and providing QUBO matrices.
          </p>
          <CodeBlock
            code={`import numpy as np
from qubots.base_problem import BaseProblem

class MinVertexCoverProblem(BaseProblem):
    """
    Minimum Vertex Cover Problem:
    Given an undirected graph, select a subset of vertices so every edge is covered.
    QUBO formulation: cost A=1 per vertex + penalty B=10 for each uncovered edge.
    """
    def __init__(self, num_vertices=6, edge_probability=0.5, A=1, B=10, seed=123):
        self.num_vertices = num_vertices
        self.A = A
        self.B = B
        np.random.seed(seed)
        self.edges = []
        for i in range(num_vertices):
            for j in range(i+1, num_vertices):
                if np.random.rand() < edge_probability:
                    self.edges.append((i, j))
        self.Q, self.qubo_constant = self._build_qubo()
        
    def _build_qubo(self):
        n = self.num_vertices
        Q = np.zeros((n, n))
        constant = 0
        # Cost for each selected vertex
        for i in range(n):
            Q[i, i] += self.A
        # Penalty for uncovered edges
        for (i, j) in self.edges:
            Q[i, i] += -self.B
            Q[j, j] += -self.B
            Q[i, j] += self.B
            Q[j, i] += self.B
            constant += self.B
        return Q, constant

    def evaluate_solution(self, solution) -> float:
        x = np.array(solution)
        return float(x.T @ self.Q @ x + self.qubo_constant)

    def random_solution(self):
        return np.random.randint(0, 2, self.num_vertices).tolist()

    def get_qubo(self):
        return self.Q, self.qubo_constant`}
          />

          <h4 className="text-lg font-semibold">Step 2: Create the Configuration</h4>
          <p>
            In <code>problem_config.json</code>, specify where your problem class is
            located (<code>entry_point</code>) and any default parameters. For example:
          </p>
          <CodeBlock
            code={`{
  "entry_point": "min_vertex_cover:MinVertexCoverProblem",
  "default_params": {
    "num_vertices": 6,
    "edge_probability": 0.5,
    "A": 1,
    "B": 10
  }
}`}
          />

          <h4 className="text-lg font-semibold">Step 3: Pushing to Rastion Hub</h4>
          <p>
            With your files ready (<code>min_vertex_cover.py</code> and{" "}
            <code>problem_config.json</code>), create a new repository and push:
          </p>
          <CodeBlock
            code={`# Create repository
rastion create_repo min-vertex-cover-problem

# Push your problem implementation
rastion push_problem min-vertex-cover-problem --source PATH_TO_MY_LOCAL_FOLDER`}
          />

          <h4 className="text-lg font-semibold">Step 4: Testing the Problem</h4>
          <p>
            Finally, confirm it works by loading via <code>AutoProblem</code>:
          </p>
          <CodeBlock
            code={`from qubots.auto_problem import AutoProblem

problem = AutoProblem.from_repo("Rastion/min-vertex-cover-problem")
sol = problem.random_solution()
print("Random solution:", sol)
print("Solution cost:", problem.evaluate_solution(sol))`}
          />
        </>
      ),
    },
    setCover: {
      title: "Guide: Creating a Rastion Problem – Set Cover",
      content: (
        <>
          <p>
            This guide covers a <em>Set Cover</em> formulation in QUBO form, where you
            select certain sets from a collection to cover all elements at minimal cost.
          </p>

          <h4 className="text-lg font-semibold">Step 1: Create the Python Module</h4>
          <p>
            Create <code>set_cover.py</code> containing your implementation of
            <code>SetCoverProblem</code>:
          </p>
          <CodeBlock
            code={`import numpy as np
from qubots.base_problem import BaseProblem

class SetCoverProblem(BaseProblem):
    """
    Set Cover Problem:
    Select a subset of sets (with costs) so that every element in the universe is covered.
    We use a penalty to ensure coverage in the QUBO formulation.
    """
    def __init__(self, num_elements=5, num_sets=8, p_coverage=0.5, penalty=50, seed=123):
        self.num_elements = num_elements
        self.num_sets = num_sets
        self.penalty = penalty
        np.random.seed(seed)
        # c = cost array for each set
        self.c = np.random.randint(1, 11, size=num_sets)
        # M = coverage matrix: rows=elements, cols=sets
        self.M = (np.random.rand(num_elements, num_sets) < p_coverage).astype(int)
        self.Q, self.qubo_constant = self._build_qubo()
        
    def _build_qubo(self):
        m = self.num_sets
        n = self.num_elements
        P = self.penalty
        Q = np.zeros((m, m))
        constant = P * n

        # Diagonal terms: cost minus coverage penalty
        for i in range(m):
            Q[i, i] = self.c[i] - P * np.sum(self.M[:, i])

        # Off-diagonal terms: reward overlap
        for i in range(m):
            for j in range(i+1, m):
                overlap = P * np.sum(self.M[:, i] * self.M[:, j])
                Q[i, j] = overlap
                Q[j, i] = overlap

        return Q, constant

    def evaluate_solution(self, solution) -> float:
        x = np.array(solution)
        return float(x.T @ self.Q @ x + self.qubo_constant)

    def random_solution(self):
        return np.random.randint(0, 2, self.num_sets).tolist()

    def get_qubo(self):
        return self.Q, self.qubo_constant`}
          />

          <h4 className="text-lg font-semibold">Step 2: Configuration</h4>
          <CodeBlock
            code={`{
  "entry_point": "set_cover:SetCoverProblem",
  "default_params": {
    "num_elements": 5,
    "num_sets": 8,
    "p_coverage": 0.5,
    "penalty": 50
  }
}`}
          />

          <h4 className="text-lg font-semibold">Step 3: Push to Rastion</h4>
          <CodeBlock
            code={`# Create repo
rastion create_repo set-cover-problem

# Push implementation
rastion push_problem set-cover-problem --source PATH_TO_MY_LOCAL_FOLDER`}
          />

          <h4 className="text-lg font-semibold">Step 4: Testing</h4>
          <CodeBlock
            code={`from qubots.auto_problem import AutoProblem

problem = AutoProblem.from_repo("Rastion/set-cover-problem")
sol = problem.random_solution()
print("Random solution:", sol)
print("Solution cost:", problem.evaluate_solution(sol))`}
          />
        </>
      ),
    },
    
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-github-gray">
        Problem Creation Guides
      </h2>

      <div className="mb-6 space-y-3">
        <p>
          Below, you’ll find sample implementations of various optimization
          problems—both <em>QUBO</em> (binary) and <em>continuous</em>. Each
          guide details:
        </p>
        <ul className="list-disc list-inside ml-4">
          <li>The Python module you’ll create, extending <code>BaseProblem</code>.</li>
          <li>A <code>problem_config.json</code> file specifying how Rastion loads it.</li>
          <li>Commands to push the problem to Rastion Hub.</li>
          <li>A quick test snippet to verify everything is working.</li>
        </ul>
        <p>
          Click any button below to see the step-by-step guide for that specific
          problem.
        </p>
      </div>

      {/* Buttons to open each guide modal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button variant="outline" onClick={() => setActiveGuide("minVertexCover")}>
          Minimum Vertex Cover
        </Button>
        <Button variant="outline" onClick={() => setActiveGuide("setCover")}>
          Set Cover
        </Button>
        
      </div>

      {/* Modal content conditional */}
      {activeGuide && (
        <GuideModal
          title={guides[activeGuide].title}
          content={guides[activeGuide].content}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default ProblemGuidesSection;
