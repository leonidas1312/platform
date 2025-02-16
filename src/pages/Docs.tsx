import { useState } from "react";
import { BookOpen, Code2, Terminal, Layers, Flag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProblemGuidesSection from "@/components/ProblemGuidesSection";
import OptimizerGuidesSection from "@/components/OptimizerGuidesSection";
import ContinuousProblemGuides from "@/components/ContinuousProblemGuides";
import UsageExamplesSection from "@/components/UsageExamplesSection";
import CLIGuidesSection from "@/components/CLIGuidesSection";
import CodeBlock from "@/components/CodeBlock";

const Docs = () => {
  const [activeTab, setActiveTab] = useState("getting-started");
  const [showProblemGuide, setShowProblemGuide] = useState(false);
  const [showOptimizerGuide, setShowOptimizerGuide] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-12 max-w-[1200px]">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-github-gray mb-4">Documentation</h1>
          <p className="text-xl text-github-gray mb-8">Everything you need to get started with Rastion</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex justify-center gap-6 mb-8">
            <TabsTrigger value="getting-started">
              <Flag className="w-5 h-5 mr-2" /> Getting Started
            </TabsTrigger>
            <TabsTrigger value="creating-problem">
              <Code2 className="w-5 h-5 mr-2" /> Creating a Problem
            </TabsTrigger>
            <TabsTrigger value="creating-optimizer">
              <Code2 className="w-5 h-5 mr-2" /> Creating an Optimizer
            </TabsTrigger>
            <TabsTrigger value="usage-examples">
              <BookOpen className="w-5 h-5 mr-2" /> Usage Examples
            </TabsTrigger>
            <TabsTrigger value="client-commands">
              <Terminal className="w-5 h-5 mr-2" /> Client Commands
            </TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started">
            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <span className="w-6 h-6"><Flag /></span>
                Getting Started
              </h2>

              <div className="prose max-w-none mb-8">
                <h3 className="text-xl font-semibold text-github-gray mb-4">What is Rastion?</h3>
                <p className="text-gray-700 mb-6">
                  <strong>Rastion</strong> is the central hub for all qubots-related projects, serving as a unified repository where developers can discover, share, and collaborate on cutting-edge optimization methods—classical, quantum, or hybrid. Think of Rastion as an organized hub for the optimization community, enabling easy browsing, downloading, and chaining of different problem and solver modules.
                </p>

                <h3 className="text-xl font-semibold text-github-gray mb-4">What is Qubots?</h3>
                <p className="text-gray-700 mb-6">
                  <strong>Qubots</strong> is an open-source Python library that packages optimization problems and solvers (“optimizers”) into modular, shareable units called “qubots.” By using qubots, you can quickly swap between different optimizers and problem definitions, run them locally or via the Rastion hub, and even compose quantum-classical pipelines for advanced optimization workflows.
                </p>

                <h3 className="text-xl font-semibold text-github-gray mb-4">Key Features</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
                    <li>
                      <strong>Modular Design:</strong> Easily share and interchange optimization problems and solvers using a standard, minimal interface.
                    </li>
                    <li>
                      <strong>Dynamic Loading:</strong> Load any GitHub-based qubot through `AutoProblem` and `AutoOptimizer` without manual setup.
                    </li>
                    <li>
                      <strong>Hybrid Optimization:</strong> Combine quantum and classical methods through quantum-classical pipelines (e.g., QAOA + classical refinement).
                    </li>
                    <li>
                      <strong>CLI Integration:</strong> Use `rastion` command-line tools to manage, push, or update qubot repositories with minimal effort.
                    </li>
                    <li>
                      <strong>Extensive Examples:</strong> Explore classical approaches (Particle Swarm, Tabu Search, RL optimizers) and quantum solvers (QAOA, VQE) in real use cases.
                    </li>
                  </ul>

                  <h3 className="text-xl font-semibold text-github-gray mb-4">Looking Ahead: Potential Future Enhancements</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
                    <li>
                      <strong>Secure Sandboxing:</strong> Automatic creation of isolated virtual environments to safely install and run remote qubots.
                    </li>
                    <li>
                      <strong>Automated Membership & Tokens:</strong> Streamlined process to obtain Rastion membership and GitHub tokens for easier collaboration.
                    </li>
                    <li>
                      <strong>Extended Chaining & Pipeline Tools:</strong> More robust tooling for chaining multiple optimizers, mixing quantum–classical steps, and creating custom pipelines.
                    </li>
                    <li>
                      <strong>Enhanced Testing & Benchmarking:</strong> Built-in modules to benchmark different optimizers side by side with shared logging.
                    </li>
                  </ul>

                  <p className="text-gray-700 mb-6">
                    Together, Rastion and Qubots create a flexible ecosystem for developing and sharing optimization solutions. Below are the steps to get started.
                  </p>
                


                <h3 className="text-xl font-semibold text-github-gray mb-4">How It Works</h3>
                <p className="text-gray-700 mb-6">
                  To start using Rastion, you’ll need to install supporting tools, obtain the necessary tokens, 
                  and then set up the Rastion client. Follow the steps below to get everything up and running!
                </p>
              </div>

              <div className="space-y-8">

                <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                  <h3 className="text-xl font-semibold mb-4 text-white">Step 1 🚀: Install <code>qubots</code> </h3>
                  <CodeBlock code="pip install qubots" />
                  <p className="text-white mt-4">
                    Once <code>qubots</code> is installed, you're ready to start exploring optimization problems and solvers. 
                    If you want to contribute or manage repositories, continue to the next steps.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                  <h3 className="text-xl font-semibold mb-4 text-white">Step 2 🔑: Sign In with GitHub</h3>
                  <p className="text-white">
                    Click <strong>Sign in</strong> at the top right of the Rastion website and log in with your GitHub credentials. 
                    You’ll receive a GitHub token from Rastion—make sure to copy and save this token. 
                    You’ll need it to create and manage repositories within Rastion.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                  <h3 className="text-xl font-semibold mb-4 text-white">Step 3 🏗️: Request Developer Access</h3>
                  <p className="text-white">
                    Currently, Rastion is in development mode. After obtaining your GitHub token, 
                    you’ll need to become a member of the Rastion organization. 
                    Please contact <strong>gleonidas303@gmail.com</strong> if you wish to be an early user, 
                    and the owners will grant you membership.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                  <h3 className="text-xl font-semibold mb-4 text-white">Step 4 ⚙️: Install the Rastion Client Commands</h3>
                  <p className="text-white">
                    After you become a member of Rastion, you’ll receive an email containing a token to download the Rastion client commands. 
                    Use the token (different from your GitHub token) in the following command:
                  </p>
                  <CodeBlock code="pip install --index-url https://<RASTION-TOKEN>@pypi.fury.io/ileonidas/ rastion" />
                  <p className="text-white">
                    Replace <strong>&lt;RASTION-TOKEN&gt;</strong> with the token sent to you via email.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                  <h3 className="text-xl font-semibold mb-4 text-white">Step 5 🔐: Log In to Rastion</h3>
                  <p className="text-white mb-2">
                    Now you can use the Rastion client commands to log in with your GitHub token:
                  </p>
                  <CodeBlock code="rastion login --github-token MY_GITHUB_TOKEN" />
                  <p className="text-white mt-4">
                    <strong>MY_GITHUB_TOKEN</strong> refers to the token generated when you signed in to Rastion.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] p-6 rounded-lg shadow-xl">
                  <h3 className="text-xl font-semibold mb-4 text-white">Step 6 🎉: Start Using Rastion</h3>
                  <p className="text-white">
                    That’s it! You’re all set to use the Rastion client commands to create, manage, and explore 
                    optimization repositories through Rastion. For more examples and documentation, visit the  
                    <strong> Client Commands</strong> page.
                  </p>
                </div>
              </div>
            </section>
          </TabsContent>


          <TabsContent value="creating-problem">
            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <Code2 className="w-6 h-6" />
                Creating a Problem
              </h2>
            
              <div className="flex flex-col gap-4">
                <ProblemGuidesSection />
                <ContinuousProblemGuides />
              </div>
            </section>
          </TabsContent>

          <TabsContent value="creating-optimizer">
            <section>
              <h2 className="text-2xl font-semibold text-github-gray mb-6 flex items-center gap-2">
                <Code2 className="w-6 h-6" />
                Creating an Optimizer
              </h2>
              {/* Render the Optimizer Guides Section */}
              <OptimizerGuidesSection />
            </section>
          </TabsContent>

          <TabsContent value="usage-examples">
            <section>
              <UsageExamplesSection />
            </section>
          </TabsContent>

          <TabsContent value="client-commands">
            <section>
              <CLIGuidesSection />
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Docs;
