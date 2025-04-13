"use client"

import { useEffect, useRef } from "react"
import { motion, useAnimation, useInView } from "framer-motion"
import { ChevronDown } from "lucide-react"

const pythonSnippets = [
  {
    title: "1. Install qubots",
    code: `pip install qubots`,
    description:
      "Start by installing the qubots package using pip. This gives you access to qubots uploaded by the community.",
  },
  {
    title: "2. Use qubots from Rastion locally",
    code: `from qubots.auto_problem import AutoProblem
# TSP developed from the Rastion team
problem = AutoProblem.from_repo("Rastion/traveling_salesman_problem")`,
    description:
      "Import pre-built optimization problems and optimization algorithms directly from the Rastion repository. No need to define the structure yourself.",
  },
  {
    title: "3. Connect your qubots",
    code: `from qubots.auto_problem import AutoProblem
from qubots.auto_optimizer import AutoOptimizer

# TSP developed from the Rastion team
problem = AutoProblem.from_repo("Rastion/traveling_salesman_problem")

# Optimizer that uses ortools to solve the TSP
optimizer = AutoOptimizer.from_repo("Rastion/ortools_tsp_solver")

# Run the optimization and print results.
best_solution, best_cost = optimizer.optimize(problem)
print("Best Solution:", best_solution)
print("Best Cost:", best_cost)`,
    description:
      "As a developer you can connect your problems to a specialized optimizer and run the optimization process. Get your results in just a few lines of code.",
  },
]

export default function CodeFlowHero() {
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [controls, isInView])

  return (
    <div className="w-full py-12 md:py-24" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        

        <div className="space-y-8">
          {pythonSnippets.map((snippet, index) => (
            <div key={index} className="relative">
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: index * 0.2 } },
                }}
                className="flex flex-col md:flex-row gap-6 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
              >
                {/* Code section */}
                <div className="md:w-1/2 lg:w-3/5">
                  <div className="bg-primary/10 border-b border-primary/20 px-4 py-3">
                    <h3 className="font-semibold text-primary">{snippet.title}</h3>
                  </div>
                  <div className="p-4 bg-black/90 text-white overflow-hidden h-full">
                    <pre className="text-xs md:text-sm font-mono overflow-x-auto whitespace-pre">
                      <code>{snippet.code}</code>
                    </pre>
                  </div>
                </div>

                {/* Description section */}
                <div className="md:w-1/2 lg:w-2/5 p-6 flex items-center">
                  <p className="text-sm md:text-base">{snippet.description}</p>
                </div>
              </motion.div>

              {/* Arrow pointing to next step */}
              {index < pythonSnippets.length - 1 && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 0 },
                    visible: { opacity: 1, y: 10, transition: { duration: 0.3, delay: 0.5 + index * 0.2 } },
                  }}
                  className="flex justify-center my-4"
                >
                  <div className="bg-primary/10 rounded-full p-2">
                    <ChevronDown className="h-6 w-6 text-primary" />
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
