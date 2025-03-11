export interface BenchmarkResult {
    problem: {
      name: string;
      description: string;
      problemType: string;
      datasetSize: number;
      optimalCost?: number;
      codeSnippet: string;
    };
    optimizers: OptimizerResult[];
    testEnvironment: {
      cpu: string;
      ram: string;
      os: string;
      timestamp: string;
    };
  }
  
  export interface OptimizerResult {
    name: string;
    repo: string;
    type: 'classical' | 'quantum' | 'hybrid';
    cost: number;
    runtime: number;
    iterations?: number;
    qubitsUsed?: number;
    convergenceGraph?: string;
    parameters: {
      timeLimit?: number;
      maxIters?: number;
      populationSize?: number;
      // Add other relevant parameters
    };
  }