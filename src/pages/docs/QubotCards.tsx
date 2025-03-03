import React from "react";
import CodeBlock from "@/components/CodeBlock";
import { Terminal, Notebook } from "lucide-react";

const QubotCards = () => {
  return (
    <div className="prose max-w-none space-y-8">
      {/* Intro */}
      <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Qubot cards overview</h1>
        <p>
          Qubot cards are the “face” of each qubot (problem or optimizer) in Rastion. They hold
          essential metadata that allows Rastion to properly identify, initialize,
          and run your qubots. This page will guide you through creating qubot cards
          for both <strong>problems</strong> and <strong>optimizers</strong>.
        </p>
      </div>

      {/* Step 1: Generic Problem Configuration Guide */}
      <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Terminal className="w-5 h-5 mr-2" />
          Step 1: Creating a problem qubot card
        </h2>

        <p>
          Below is an example structure of a problem qubot card. This file is often
          named <code>problem_config.json</code> and placed in the repository that holds your
          problem’s source code.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2">Metadata structure</h3>
        <CodeBlock
          code={`{
  "entry_point": "module:ProblemClass",
  "default_params": {},
  "creator": "",
  "type": "problem",
  "problem_name": "",
  "description": "",
  "decision_variables": {},
  "objective": {},
  "solution_representation": ""
}`}
        />

        <p className="mt-6">
          Each field serves a purpose in how Rastion discovers and uses your problem. 
          See the table below for a quick reference:
        </p>
        <div className="overflow-x-auto">
          <table className="border-collapse w-full">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Field</th>
                <th className="py-2 text-left">Purpose</th>
                <th className="py-2 text-left">Value logic</th>
                <th className="py-2 text-left">Example</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">entry_point</td>
                <td>Class loader</td>
                <td>ModulePath:ClassName</td>
                <td>"tsp_problem:TravelingSalesman"</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">default_params</td>
                <td>Test instance</td>
                <td>Problem-specific parameters</td>
                <td>{"{\"distance_matrix\": [[0,10],[10,0]]}"}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">decision_variables</td>
                <td>Solution structure</td>
                <td>Define variables needed for evaluation</td>
                <td>{"{\"tour\": {\"type\": \"list[int]\"}}"}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">objective</td>
                <td>Optimization goal</td>
                <td>Direction + metric explanation</td>
                <td>{"{\"type\": \"minimization\"}"}</td>
              </tr>
              <tr>
                <td className="py-2">solution_representation</td>
                <td>Data format</td>
                <td>How solutions are encoded</td>
                <td>"Permutation of city indices"</td>
              </tr>
            </tbody>
          </table>
        </div>
        
      </div>

      {/* Step 2: Generic Solver Configuration Guide */}
      <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Notebook className="w-5 h-5 mr-2" />
          Step 2: Creating an optimizer qubot card
        </h2>

        <p>
          Next, let’s look at how to create a qubot card for optimizers.
          Like problems, these live in a <code>solver_config.json</code> file 
          within the solver’s source code repository.
        </p>

        <h3 className="text-lg font-semibold mt-6 mb-2">Metadata framework</h3>
        <CodeBlock
          code={`{
  "entry_point": "module:SolverClass",
  "default_params": {},
  "creator": "",
  "type": "optimizer",
  "optimizer_name": "",
  "description": "",
  "compatible_problems": [],
  "parameters": {},
  "requirements": []
}`}
        />

        <p className="mt-6">
          The table below summarizes the most critical fields for an optimizer’s qubot card:
        </p>
        <div className="overflow-x-auto">
          <table className="border-collapse w-full">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Field</th>
                <th className="py-2 text-left">Strategic purpose</th>
                <th className="py-2 text-left">Configuration logic</th>
                <th className="py-2 text-left">Example value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">compatible_problems</td>
                <td>Solution space alignment</td>
                <td>Match problem entry_points</td>
                <td>["tsp_problem:TravelingSalesman"]</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">parameters</td>
                <td>Algorithm tuning</td>
                <td>Expose key hyperparameters</td>
                <td>{"{\"population_size\": {\"type\": \"int\"}}"}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">requirements</td>
                <td>Dependency management</td>
                <td>List non-standard packages</td>
                <td>["deap", "pymoo"]</td>
              </tr>
              <tr>
                <td className="py-2">optimizer_name</td>
                <td>Algorithm identification</td>
                <td>Specific technique name</td>
                <td>"GeneticAlgorithmWithElitism"</td>
              </tr>
            </tbody>
          </table>
        </div>
        
      </div>

      {/* Final Note */}
      <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Terminal className="w-5 h-5 mr-2" />
          Final thoughts
        </h2>
        <p>
          Once you have created your qubot cards for problems and optimizers, you can
          push them to Rastion just as you would any repository. Rastion will detect
          the configuration file and automatically register your qubot for
          easy discovery. By following the guidelines above, you ensure that your qubots 
          are properly documented, making them straightforward to use by others 
          (and even your future self!).
        </p>
        <p className="mt-4">
          These qubot cards are the essential “front matter” that makes your code
          interoperable with the Rastion ecosystem. Keep them clear, complete, and
          consistent with your source code for the best results.
        </p>
      </div>
    </div>
  );
};

export default QubotCards;
