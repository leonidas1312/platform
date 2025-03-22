import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const rect = containerRef.current!.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const moveX = (x - centerX) / 50;
      const moveY = (y - centerY) / 50;

      document.documentElement.style.setProperty("--move-x", `${moveX}px`);
      document.documentElement.style.setProperty("--move-y", `${moveY}px`);
    };

    containerRef.current.addEventListener("mousemove", handleMouseMove);

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, []);

  const staggerChildren = {
    animate: {
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1,
      },
    },
  };

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  // Your Python code snippet
  const codeSnippet = `from qubots.auto_problem import AutoProblem
from qubots.auto_optimizer import AutoOptimizer

# Load an optimization problem from the Rastion hub
problem = AutoProblem.from_repo("Rastion/traveling_salesman_problem")

# Load an optimizer for the problem
optimizer = AutoOptimizer.from_repo("Rastion/ortools_tsp_solver")

# Run the optimization process
solution, cost = optimizer.optimize(problem)
print("Best solution:", solution)
print("Cost:", cost)`;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden bg-white dark:bg-black pt-28 pb-16 md:pt-36 md:pb-24"
    >
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={staggerChildren}
          initial="initial"
          animate="animate"
        >
          <motion.div
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium tracking-wide"
          >
            Making optimization accessible to everyone
          </motion.div>

          <motion.h1
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
          >
            The{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 dark:from-blue-400 to-violet-500 dark:to-violet-400">
              open source
            </span>{" "}
            community for optimization
          </motion.h1>

          <motion.p
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="text-lg md:text-xl text-foreground/70 mb-8 max-w-2xl mx-auto"
          >
            Access, share, and customize optimization algorithms and problems.
          </motion.p>

          <motion.div
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#models"
              className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 w-full sm:w-auto"
            >
              Explore optimizers
            </a>
            <a
              href="#how-it-works"
              className="px-6 py-3 rounded-full border border-border bg-card hover:bg-secondary transition-colors flex items-center justify-center gap-2 font-medium w-full sm:w-auto"
            >
              How it works
              <ChevronRight size={16} />
            </a>
          </motion.div>
        </motion.div>

        {/* Code Window / Monitor Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-16 md:mt-24 max-w-5xl mx-auto relative"
        >
          <div className="relative w-full aspect-[25/9] rounded-lg overflow-hidden shadow-2xl shadow-primary/10">
            {/* Top bar with circles */}
            <div className="absolute inset-0 bg-secondary/30 flex flex-col">
              <div className="w-full h-10 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
            </div>
            {/* Code snippet window */}
            <div className="absolute inset-0 p-4 mt-10 overflow-auto">
              <pre className="rounded-md bg-gray-900 p-4 overflow-auto font-mono text-sm text-white">
                <code>{codeSnippet}</code>
              </pre>
            </div>
          </div>
          
          
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
