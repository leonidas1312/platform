import React, { useState, FC, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import CodeBlock from "@/components/CodeBlock";

interface CLIGuideModalProps {
  title: string;
  content: ReactNode;
  onClose: () => void;
}

const CLIGuideModal: FC<CLIGuideModalProps> = ({ title, content, onClose }) => {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
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

type CLIGuideKey =
  | "create_repo"
  | "update_repo"
  | "delete_repo"
  | "clone_repo"
  | "push_solver"
  | "push_problem"
  | "run_solver";

const CLIGuidesSection: FC = () => {
  const [activeGuide, setActiveGuide] = useState<CLIGuideKey | null>(null);
  const closeModal = () => setActiveGuide(null);

  // Introductory text that references `--help` usage and explains how
  // to adapt user code to BaseProblem/BaseOptimizer, plus a full upload pipeline example.
  const introduction = (
    <div className="mb-6 space-y-4">
      <p>
        Once the Rastion client is installed, you can type{" "}
        <code>rastion --help</code> or <code>rastion [command] --help</code> to
        see all available commands and their parameters. This is a great way to
        explore the CLI without memorizing every detail.
      </p>
      <p>
        If you have an existing problem or optimizer that <strong>doesn’t</strong> extend{" "}
        <code>BaseProblem</code> or <code>BaseOptimizer</code>, here’s the basic
        idea to transform your code into a <em>qubot</em>:
      </p>
      <ul className="list-disc list-inside ml-4">
        <li>
          Create a class for your problem that implements{" "}
          <code>evaluate_solution(solution) -&gt; float</code> and optionally{" "}
          <code>random_solution()</code>. Then extend{" "}
          <code>BaseProblem</code>.
        </li>
        <li>
          Create a class for your solver that implements{" "}
          <code>optimize(problem, initial_solution=None)</code>, returning a
          tuple <code>(best_solution, best_cost)</code>. Then extend{" "}
          <code>BaseOptimizer</code>.
        </li>
        <li>
          Prepare a <code>problem_config.json</code> or{" "}
          <code>solver_config.json</code> with an <code>entry_point</code> field
          pointing to <code>"module_name:ClassName"</code> and any default
          parameters.
        </li>
      </ul>
      <p>
        Below is an example pipeline showing how to create a new repository,
        push your problem or solver code, and make it accessible on Rastion:
      </p>
      <CodeBlock
        code={`# 1. Login using your generated github token
rastion login --github-token MY_GITHUB_TOKEN

# 2. Create a new repo for your problem
rastion create_repo my-new-problem-repo 

# 3. Push your local problem file + problem_config.json to that repo
rastion push_problem my-new-problem-repo --source path_to_problem_folder

# 4. Create a new repo for your solver
rastion create_repo my-new-solver-repo 

# 5. Push your local solver file + solver_config.json
rastion push_solver my-new-solver-repo --source path_to_optimizer_folder

# Once both repos are set up, you (or anyone) can run them together:
rastion run_solver Rastion/my-new-solver-repo --problem-repo Rastion/my-new-problem-repo`}
      />
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-github-gray">CLI Commands</h2>

      {/* Intro Section */}
      {introduction}

    </div>
  );
};

export default CLIGuidesSection;
