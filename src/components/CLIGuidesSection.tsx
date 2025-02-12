// src/components/CLIGuidesSection.tsx
import React, { useState, FC, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";

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

  const guides: Record<CLIGuideKey, { title: string; content: ReactNode }> = {
    create_repo: {
      title: "CLI Command: create_repo",
      content: (
        <>
          <p>
            <strong>Usage:</strong> <code>rastion create_repo &lt;repo_name&gt; [options]</code>
          </p>
          <p>
            Create a new GitHub repository under the "Rastion" organization.
          </p>
          <p>
            <strong>Options:</strong>
          </p>
          <ul className="list-disc list-inside">
            <li>
              <code>--private</code>: Create a private repository (default is public).
            </li>
            <li>
              <code>--github-token</code>: Your GitHub personal access token (or set via <code>GITHUB_TOKEN</code> env var).
            </li>
          </ul>
          <h4 className="text-lg font-semibold">Example:</h4>
          <CodeBlock code={`export GITHUB_TOKEN="your_token_here"
rastion create_repo my-new-repo --github-token $GITHUB_TOKEN`} />
        </>
      ),
    },
    update_repo: {
      title: "CLI Command: update_repo",
      content: (
        <>
          <p>
            <strong>Usage:</strong> <code>rastion update_repo &lt;repo_name&gt; [options]</code>
          </p>
          <p>
            Update an existing GitHub repository with new local changes. This command clones the repository,
            copies files from a local directory (excluding the .git folder), commits the changes, and pushes them.
          </p>
          <p>
            <strong>Options:</strong>
          </p>
          <ul className="list-disc list-inside">
            <li>
              <code>--local-dir</code>: Local directory with updated files (default: current directory).
            </li>
            <li>
              <code>--branch</code>: Branch to update (default: "main").
            </li>
            <li>
              <code>--github-token</code>: Your GitHub token.
            </li>
          </ul>
          <h4 className="text-lg font-semibold">Example:</h4>
          <CodeBlock code={`export GITHUB_TOKEN="your_token_here"
rastion update_repo my-new-repo --local-dir ./my_project --branch main --github-token $GITHUB_TOKEN`} />
        </>
      ),
    },
    delete_repo: {
      title: "CLI Command: delete_repo",
      content: (
        <>
          <p>
            <strong>Usage:</strong> <code>rastion delete_repo &lt;repo_name&gt; [options]</code>
          </p>
          <p>
            Delete a GitHub repository from the "Rastion" organization.
          </p>
          <ul className="list-disc list-inside">
            <li>
              <code>--github-token</code>: Your GitHub token.
            </li>
          </ul>
          <h4 className="text-lg font-semibold">Example:</h4>
          <CodeBlock code={`export GITHUB_TOKEN="your_token_here"
rastion delete_repo my-new-repo --github-token $GITHUB_TOKEN`} />
        </>
      ),
    },
    clone_repo: {
      title: "CLI Command: clone_repo",
      content: (
        <>
          <p>
            <strong>Usage:</strong> <code>rastion clone_repo &lt;repo_name&gt; [options]</code>
          </p>
          <p>
            Clone a repository from the "Rastion" organization.
          </p>
          <ul className="list-disc list-inside">
            <li>
              <code>--branch</code>: Branch to checkout (default: "main").
            </li>
            <li>
              <code>--dest</code>: Destination folder (default: current directory).
            </li>
          </ul>
          <h4 className="text-lg font-semibold">Example:</h4>
          <CodeBlock code={`rastion clone_repo my-new-repo --branch main --dest ./local_folder`} />
        </>
      ),
    },
    push_solver: {
      title: "CLI Command: push_solver",
      content: (
        <>
          <p>
            <strong>Usage:</strong> <code>rastion push_solver &lt;repo_name&gt; --file &lt;file&gt; --config &lt;config&gt; [options]</code>
          </p>
          <p>
            Push a local solver implementation to an existing GitHub repository. The command clones the repository, copies the solver file and solver_config.json, commits the changes, and pushes them.
          </p>
          <ul className="list-disc list-inside">
            <li>
              <code>--file</code>: Path to the local .py solver file.
            </li>
            <li>
              <code>--config</code>: Path to solver_config.json.
            </li>
            <li>
              <code>--branch</code>: Branch name (default: "main").
            </li>
            <li>
              <code>--github-token</code>: Your GitHub token.
            </li>
          </ul>
          <h4 className="text-lg font-semibold">Example:</h4>
          <CodeBlock code={`export GITHUB_TOKEN="your_token_here"
rastion push_solver my-solver-repo --file solver.py --config solver_config.json --branch main --github-token $GITHUB_TOKEN`} />
        </>
      ),
    },
    push_problem: {
      title: "CLI Command: push_problem",
      content: (
        <>
          <p>
            <strong>Usage:</strong> <code>rastion push_problem &lt;repo_name&gt; --file &lt;file&gt; --config &lt;config&gt; [options]</code>
          </p>
          <p>
            Push a local problem implementation to an existing GitHub repository. It clones the repo, copies the problem file and problem_config.json,
            commits the changes, and pushes them.
          </p>
          <ul className="list-disc list-inside">
            <li>
              <code>--file</code>: Path to the local .py problem file.
            </li>
            <li>
              <code>--config</code>: Path to problem_config.json.
            </li>
            <li>
              <code>--branch</code>: Branch name (default: "main").
            </li>
            <li>
              <code>--github-token</code>: Your GitHub token.
            </li>
          </ul>
          <h4 className="text-lg font-semibold">Example:</h4>
          <CodeBlock code={`export GITHUB_TOKEN="your_token_here"
rastion push_problem my-problem-repo --file problem.py --config problem_config.json --branch main --github-token $GITHUB_TOKEN`} />
        </>
      ),
    },
    run_solver: {
      title: "CLI Command: run_solver",
      content: (
        <>
          <p>
            <strong>Usage:</strong> <code>rastion run_solver &lt;solver_repo&gt; [options]</code>
          </p>
          <p>
            Clone or pull the solver repository, load the solver (and optionally a problem),
            and run the optimization.
          </p>
          <ul className="list-disc list-inside">
            <li>
              <code>--solver-rev</code>: Solver branch or tag (default: "main").
            </li>
            <li>
              <code>--problem-repo</code>: Repository for the problem (optional).
            </li>
            <li>
              <code>--problem-rev</code>: Problem branch or tag (default: "main").
            </li>
          </ul>
          <h4 className="text-lg font-semibold">Example:</h4>
          <CodeBlock code={`export GITHUB_TOKEN="your_token_here"
rastion run_solver Rastion/my-solver-repo --solver-rev main --problem-repo Rastion/my-problem-repo --problem-rev main`} />
        </>
      ),
    },
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-github-gray">
        CLI Commands
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button variant="outline" onClick={() => setActiveGuide("create_repo")}>
          create_repo
        </Button>
        <Button variant="outline" onClick={() => setActiveGuide("update_repo")}>
          update_repo
        </Button>
        <Button variant="outline" onClick={() => setActiveGuide("delete_repo")}>
          delete_repo
        </Button>
        <Button variant="outline" onClick={() => setActiveGuide("clone_repo")}>
          clone_repo
        </Button>
        <Button variant="outline" onClick={() => setActiveGuide("push_solver")}>
          push_solver
        </Button>
        <Button variant="outline" onClick={() => setActiveGuide("push_problem")}>
          push_problem
        </Button>
        <Button variant="outline" onClick={() => setActiveGuide("run_solver")}>
          run_solver
        </Button>
      </div>
      {activeGuide && (
        <CLIGuideModal
          title={guides[activeGuide].title}
          content={guides[activeGuide].content}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default CLIGuidesSection;
