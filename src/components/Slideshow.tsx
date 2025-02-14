
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import CodeBlock from "@/components/CodeBlock";

interface Slide {
  title: string;
  description: string;
  code: string;
}

const slides: Slide[] = [
  {
    title: "Quantum Annealing Optimization",
    description: "Use quantum annealing to solve complex optimization problems",
    code: `from rastion_hub.auto_optimizer import AutoOptimizer
from rastion_hub.auto_problem import AutoProblem

# Load quantum annealing problem
problem = AutoProblem.from_repo(
    "Rastion/quantum-annealing-problem",
    revision="main"
)

# Configure and run quantum optimizer
optimizer = AutoOptimizer.from_repo(
    "Rastion/quantum-annealer",
    revision="main",
    override_params={
        "num_reads": 1000,
        "chain_strength": 2.0
    }
)

solution, energy = optimizer.optimize(problem)
print(f"Solution found with energy: {energy}")`,
  },
  {
    title: "QAOA Implementation",
    description: "Quantum Approximate Optimization Algorithm for combinatorial problems",
    code: `from rastion_hub.quantum import QAOA
from rastion_hub.problems import MaxCut

# Create a MaxCut problem instance
problem = MaxCut.from_repo(
    "Rastion/maxcut-qaoa",
    revision="main"
)

# Initialize QAOA optimizer
qaoa = QAOA.from_repo(
    "Rastion/qaoa-optimizer",
    revision="main",
    params={
        "p": 2,  # Number of QAOA layers
        "shots": 1000
    }
)

result = qaoa.optimize(problem)
print("Optimal cut value:", result.value)`,
  },
  {
    title: "Quantum Machine Learning",
    description: "Quantum-enhanced machine learning algorithms",
    code: `from rastion_hub.quantum.ml import QuantumKernel
from rastion_hub.classifiers import QSVMClassifier

# Load quantum kernel
kernel = QuantumKernel.from_repo(
    "Rastion/quantum-kernel",
    revision="main"
)

# Initialize quantum SVM classifier
qsvm = QSVMClassifier(
    kernel=kernel,
    optimization_level=2
)

# Train and evaluate
qsvm.fit(X_train, y_train)
accuracy = qsvm.score(X_test, y_test)
print(f"Classification accuracy: {accuracy:.2f}")`,
  }
];

export const Slideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] rounded-lg p-8 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">{slides[currentSlide].title}</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevSlide}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextSlide}
              className="text-white hover:bg-white/10"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>
        <p className="text-gray-300 mb-6">{slides[currentSlide].description}</p>
        <CodeBlock code={slides[currentSlide].code} language="python" />
        <div className="flex justify-center mt-6 gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                index === currentSlide ? "bg-white" : "bg-white/30"
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
