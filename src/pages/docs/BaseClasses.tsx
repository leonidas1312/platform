import React from "react";
import { Button } from "@/components/ui/button";
import CodeBlock from "@/components/CodeBlock";
import { Code2, Layers, GitFork, Shield, Puzzle } from "lucide-react";

const GettingStartedBaseClasses = () => {
  return (
    <div className="prose max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Base Classes & Functionality</h1>
      
      <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 mb-8">
        <p className="mb-0">
          The Qubots framework is built on a robust, modular design that ensures a consistent and extensible approach to solving optimization problems. At its core are two abstract base classes that define the interface for all problem and optimizer qubots.
        </p>
      </div>

      <div className="grid gap-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Core Base Classes</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Code2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold m-0">BaseProblem</h3>
            </div>
            <p className="text-sm">
              This abstract class defines the essential structure for optimization problems. Every problem qubot must extend this class and implement critical methods such as <code>evaluate_solution</code>—which computes the objective value—and, optionally, <code>random_solution</code> for generating initial guesses.
            </p>
            
          </div>

          <div className="border p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-primary" />
              <h3 className="font-semibold m-0">BaseOptimizer</h3>
            </div>
            <p className="text-sm">
              This class provides the standard interface for optimization solvers. Any optimizer integrated into Qubots must implement the <code>optimize</code> method, which accepts a problem (and an optional initial solution) and returns the best found solution along with its associated cost.
            </p>
            
          </div>
        </div>
        
        <div className="border p-6 rounded-xl">
          <p className="m-0">
            These base classes enforce a uniform interface across all components, which in turn promotes modularity, seamless integration, and the ability to mix and match various optimization strategies.
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Dynamic Loading with AutoProblem and AutoOptimizer</h2>
      
      <div className="grid gap-6 mb-8">
        <div className="border p-6 rounded-xl bg-gray-50">
          <div className="flex items-center gap-2 mb-4">
            <GitFork className="w-5 h-5 text-primary" />
            <h3 className="font-semibold m-0">Dynamic Loading System</h3>
          </div>
          <p>
            To further enhance flexibility, Qubots employs dynamic loaders that enable users to import optimization modules from external GitHub repositories effortlessly:
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium mb-2">AutoProblem</h4>
              <p className="text-sm">
                Automates the process of cloning or updating a repository that contains an optimization problem qubot. It reads configuration from <code>problem_config.json</code> and dynamically imports the problem class.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium mb-2">AutoOptimizer</h4>
              <p className="text-sm">
                Handles the dynamic loading of optimizer qubots. It retrieves configuration from <code>solver_config.json</code> and creates an instance of the optimizer class.
              </p>
            </div>
          </div>
          
          
        </div>
        
        <div className="border p-6 rounded-xl">
          <p className="m-0">
            These dynamic loaders create a plug-and-play ecosystem where new optimization modules can be shared and integrated with minimal friction, fostering a collaborative community of developers and researchers.
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Design Rationale and Best Practices</h2>
      
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="border p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Puzzle className="w-5 h-5 text-primary" />
            <h3 className="font-semibold m-0">Modularity</h3>
          </div>
          <p className="text-sm">
            Separating problem definitions from optimizer implementations allows independent development and testing of each component.
          </p>
        </div>
        
        <div className="border p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold m-0">Interoperability</h3>
          </div>
          <p className="text-sm">
            A unified interface ensures that any optimizer can be applied to any problem, enabling comparative analysis and hybrid solutions.
          </p>
        </div>
        
        <div className="border p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="font-semibold m-0">Extensibility</h3>
          </div>
          <p className="text-sm">
            New optimization strategies and problem formulations can be integrated by simply extending the existing base classes.
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Security and Robustness Considerations</h2>
      
      <div className="grid gap-6 mb-8">
        <div className="border p-6 rounded-xl bg-yellow-50 border-yellow-100">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold m-0">Security Recommendations</h3>
          </div>
          <p>
            Dynamic code loading introduces potential security challenges. Qubots addresses these concerns by recommending that all dynamically loaded qubots be executed within secure, isolated environments.
          </p>
          
          <div className="bg-white p-4 rounded-lg border mt-4">
            <h4 className="font-medium mb-2">Best Practices</h4>
            <ul className="space-y-2 pl-5 list-disc">
              <li>
                Verify the integrity and source of external repositories before integration.
              </li>
              <li>
                Use virtual environments or containerization to isolate dependencies and reduce the risk of conflicts.
              </li>
              <li>
                Implement thorough error handling around cloning, dependency installation, and dynamic imports to ensure system robustness.
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border p-6 rounded-xl">
          <p className="m-0">
            Following these best practices is essential to maintaining a secure and reliable optimization ecosystem.
          </p>
          <div className="mt-4 flex gap-3">
            <Button variant="default">
              <Shield className="w-4 h-4 mr-2" />
              Security Guidelines
            </Button>
            <Button variant="secondary">
              <Code2 className="w-4 h-4 mr-2" />
              Implementation Examples
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GettingStartedBaseClasses;