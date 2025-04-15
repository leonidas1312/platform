"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import Layout from "@/components/Layout"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Trophy,
  Clock,
  GitFork,
  ExternalLink,
  Info,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Route,
  Boxes,
  LayoutGrid,
  FileText,
  Copy,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

// Update the leaderboardData variable with the provided JSON
const leaderboardData = {
  small: {
    optimizers: {
      "Google/OR-tools": {
        avg_gap: 0.82,
        avg_runtime: 1.0,
        qubot_repo: "https://github.com/Rastion/ortools_tsp_solver",
      },
      "Rastion/Christofides": {
        avg_gap: 2.19,
        avg_runtime: 1.01,
        qubot_repo: "https://github.com/Rastion/christofides_tsp_solver",
      },
      "Rastion/Guided-Local-Search": {
        avg_gap: 11.54,
        avg_runtime: 1.0,
        qubot_repo: "https://github.com/Rastion/gls_tsp_solver",
      },
      "Rastion/QUBO_RL_optimizer": {
        avg_gap: 43.19,
        avg_runtime: 11.18,
        qubot_repo: "https://github.com/Rastion/rl-qubo-optimizer",
      },
    },
    files_included: {
      "bays29.tsp": 2020,
      "burma14.tsp": 3323,
      "dantzig42.tsp": 699,
      "fri26.tsp": 937,
      "gr17.tsp": 2085,
      "gr21.tsp": 2707,
      "gr24.tsp": 1272,
      "gr48.tsp": 5046,
      "hk48.tsp": 11461,
      "ulysses16.tsp": 6859,
    },
    avg_num_qubo_variables: 964.7,
  },
  medium: {
    optimizers: {
      "Google/OR-tools": {
        avg_gap: 3.3,
        avg_runtime: 1.0,
        qubot_repo: "https://github.com/Rastion/ortools_tsp_solver",
      },
      "Rastion/Christofides": {
        avg_gap: 4.02,
        avg_runtime: 1.08,
        qubot_repo: "https://github.com/Rastion/christofides_tsp_solver",
      },
      "Rastion/Guided-Local-Search": {
        avg_gap: 14.65,
        avg_runtime: 1.0,
        qubot_repo: "https://github.com/Rastion/gls_tsp_solver",
      },
    },
    files_included: {
      "berlin52.tsp": 7542,
      "gr96.tsp": 55209,
      "pr76.tsp": 108159,
      "rat99.tsp": 1211,
      "st70.tsp": 675,
    },
  },
  large: {
    optimizers: {
      "Google/OR-tools": {
        avg_gap: 3.67,
        avg_runtime: 5.0,
        qubot_repo: "https://github.com/Rastion/ortools_tsp_solver",
      },
      "Rastion/Christofides": {
        avg_gap: 22.56,
        avg_runtime: 8.09,
        qubot_repo: "https://github.com/Rastion/christofides_tsp_solver",
      },
      "Rastion/Guided-Local-Search": {
        avg_gap: 10.09,
        avg_runtime: 5.0,
        qubot_repo: "https://github.com/Rastion/gls_tsp_solver",
      },
    },
    files_included: {
      "bier127.tsp": 118282,
      "brg180.tsp": 1950,
      "ch130.tsp": 6110,
      "ch150.tsp": 6528,
      "d198.tsp": 15780,
      "d493.tsp": 35002,
      "gr202.tsp": 40160,
      "gr229.tsp": 134602,
      "gr431.tsp": 171414,
    },
  },
}

// Update the problems list to include more optimization challenges
const problems = [
  {
    id: "tsp",
    name: "Traveling Salesman Problem",
    repo: "Rastion/myTSP1",
    icon: <Route className="h-4 w-4" />,
    description: "Find the shortest possible route that visits each city exactly once and returns to the origin city.",
    category: "Routing",
    difficulty: "Medium",
    active: true,
  },
  {
    id: "batch-scheduling",
    name: "Batch Scheduling",
    repo: "Rastion/BatchScheduling",
    icon: <Clock className="h-4 w-4" />,
    description:
      "Optimize the scheduling of jobs in batches to minimize completion time and maximize resource utilization.",
    category: "Scheduling",
    difficulty: "Medium",
    active: false,
  },
  {
    id: "bin-packing",
    name: "Bin Packing Problem",
    repo: "Rastion/BinPacking",
    icon: <Boxes className="h-4 w-4" />,
    description:
      "Pack objects of different volumes into a finite number of bins in a way that minimizes the number of bins used.",
    category: "Packing",
    difficulty: "Hard",
    active: false,
  },
  {
    id: "assembly-line",
    name: "Assembly Line Balancing",
    repo: "Rastion/AssemblyLine",
    icon: <LayoutGrid className="h-4 w-4" />,
    description:
      "Assign tasks to workstations along an assembly line to minimize the number of workstations and cycle time.",
    category: "Manufacturing",
    difficulty: "Hard",
    active: false,
  },
]

// Update the email address for submissions
const SUBMISSION_EMAIL = "leaderboards@rastion.com"

const LeaderboardPage = () => {
  const { toast } = useToast()
  const [activeSize, setActiveSize] = useState<"small" | "medium" | "large">("small")
  const [sortField, setSortField] = useState<"avg_gap" | "avg_runtime">("avg_gap")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [activeProblem, setActiveProblem] = useState<string>(problems[0].id)

  const currentProblem = problems.find((problem) => problem.id === activeProblem) || problems[0]

  // Submission dialog state
  const [submissionStep, setSubmissionStep] = useState(1)
  const [submissionData, setSubmissionData] = useState({
    algorithmName: "",
    repoUrl: "",
    problemSize: "small",
    qubots: "",
    results: "",
    email: "",
    name: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false)

  const handleSort = (field: "avg_gap" | "avg_runtime") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortedOptimizers = () => {
    const optimizers = leaderboardData[activeSize].optimizers

    return Object.entries(optimizers)
      .sort(([, a], [, b]) => {
        const valueA = a[sortField]
        const valueB = b[sortField]

        return sortDirection === "asc" ? valueA - valueB : valueB - valueA
      })
      .map(([name, data], index) => ({
        name,
        rank: index + 1,
        ...data,
      }))
  }

  const sortedOptimizers = getSortedOptimizers()

  // Get the best performer for highlighting
  const bestPerformer = Object.entries(leaderboardData[activeSize].optimizers).sort(
    ([, a], [, b]) => a.avg_gap - b.avg_gap,
  )[0][0]

  // Format a number to 2 decimal places
  const formatNumber = (num: number) => {
    return num.toFixed(2)
  }

  // Handle submission form changes
  const handleSubmissionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setSubmissionData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle radio button changes
  const handleRadioChange = (value: string) => {
    setSubmissionData((prev) => ({ ...prev, problemSize: value }))
  }

  // Handle submission process
  const handleSubmissionNext = () => {
    // Validate current step
    if (submissionStep === 1) {
      if (!submissionData.algorithmName || !submissionData.repoUrl) {
        toast({
          title: "Missing information",
          description: "Please provide both algorithm name and repository URL",
          variant: "destructive",
        })
        return
      }
    } else if (submissionStep === 2) {
      if (!submissionData.qubots) {
        toast({
          title: "Missing information",
          description: "Please list the qubots used in your implementation",
          variant: "destructive",
        })
        return
      }
    } else if (submissionStep === 3) {
      try {
        // Validate JSON format
        JSON.parse(submissionData.results)
      } catch (e) {
        toast({
          title: "Invalid JSON format",
          description: "Please provide valid JSON results data",
          variant: "destructive",
        })
        return
      }
    }

    if (submissionStep < 4) {
      setSubmissionStep(submissionStep + 1)
    }
  }

  const handleSubmissionBack = () => {
    if (submissionStep > 1) {
      setSubmissionStep(submissionStep - 1)
    }
  }

  const handleSubmissionSubmit = () => {
    if (!submissionData.email || !submissionData.name) {
      toast({
        title: "Missing information",
        description: "Please provide your name and email",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false)
      setShowSubmissionDialog(false)
      setSubmissionStep(1)

      toast({
        title: "Submission received!",
        description: "Thank you for your submission. We'll review it and update the leaderboard soon.",
      })

      // Reset form
      setSubmissionData({
        algorithmName: "",
        repoUrl: "",
        problemSize: "small",
        qubots: "",
        results: "",
        email: "",
        name: "",
      })
    }, 1500)
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Community leaderboard</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Compare performance of different qubot optimizers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <Card className="sticky top-24">
                <CardHeader className="pb-3">
                  <CardTitle>Optimization challenges</CardTitle>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="space-y-1 py-1">
                    {problems.map((problem) => (
                      <div key={problem.id} className="mb-2">
                        <Button
                          variant={problem.id === activeProblem ? "secondary" : "ghost"}
                          className={`w-full justify-start text-left ${
                            !problem.active && problem.id !== activeProblem ? "opacity-70" : ""
                          }`}
                          onClick={() => problem.active && setActiveProblem(problem.id)}
                          disabled={!problem.active && problem.id !== activeProblem}
                        >
                          <div className="flex items-center">
                            <span className="mr-2">{problem.icon}</span>
                            <span className="truncate">{problem.name}</span>
                          </div>
                          {problem.active && (
                            <Badge variant="outline" className="ml-auto">
                              Active
                            </Badge>
                          )}
                        </Button>
                        <div className="ml-8 mt-1 mb-3">
                          <a
                            href={`https://github.com/${problem.repo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center"
                          >
                            <GitFork className="h-3 w-3 mr-1.5" />
                            {problem.repo}
                            <ExternalLink className="h-2.5 w-2.5 ml-1" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <Separator className="my-2" />

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Submit Your Results</h3>
                    <p className="text-xs text-muted-foreground">
                      Create your own solution using community qubots and submit your results to be featured on the
                      leaderboard.
                    </p>
                    <Alert variant="default" className="bg-primary/5 border-primary/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-xs font-medium">Email Submission Required</AlertTitle>
                      <AlertDescription className="text-xs">
                        To ensure validity of results, please email your submission to {SUBMISSION_EMAIL} with your
                        code, results, and methodology.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3">
              <Alert variant="default" className="bg-primary/5 border-primary/20 mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Community challenge</AlertTitle>
                <AlertDescription className="text-sm">
                  <p>
                    This leaderboard showcases algorithms built using community qubots. Create your own solution by
                    combining existing qubot problems and optimizers, then submit your results to be featured here!
                  </p>
                </AlertDescription>
              </Alert>

              <Tabs
                defaultValue="small"
                value={activeSize}
                onValueChange={(value) => setActiveSize(value as "small" | "medium" | "large")}
              >
                <div className="flex justify-between items-center mb-4">
                  <TabsList>
                    <TabsTrigger value="small">Small Problems</TabsTrigger>
                    <TabsTrigger value="medium">Medium Problems</TabsTrigger>
                    <TabsTrigger value="large">Large Problems</TabsTrigger>
                  </TabsList>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                          <Info className="h-4 w-4 mr-2" />
                          Info
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-medium mb-1">Metrics Explanation:</p>
                        <p className="text-sm mb-1">
                          <strong>Avg Gap:</strong> Average percentage gap from the optimal solution (lower is better)
                        </p>
                        <p className="text-sm">
                          <strong>Avg Runtime:</strong> Average runtime in seconds, normalized to the fastest algorithm
                          (lower is better)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {["small", "medium", "large"].map((size) => (
                  <TabsContent key={size} value={size} className="space-y-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-amber-500" />
                            {size.charAt(0).toUpperCase() + size.slice(1)} Problem Leaderboard
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12 text-center">Rank</TableHead>
                                <TableHead>Algorithm</TableHead>
                                <TableHead
                                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => handleSort("avg_gap")}
                                >
                                  <div className="flex items-center">
                                    Avg Gap (%)
                                    {sortField === "avg_gap" ? (
                                      sortDirection === "asc" ? (
                                        <ChevronUp className="ml-1 h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="ml-1 h-4 w-4" />
                                      )
                                    ) : (
                                      <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                                    )}
                                  </div>
                                </TableHead>
                                <TableHead
                                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => handleSort("avg_runtime")}
                                >
                                  <div className="flex items-center">
                                    Avg Runtime
                                    {sortField === "avg_runtime" ? (
                                      sortDirection === "asc" ? (
                                        <ChevronUp className="ml-1 h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="ml-1 h-4 w-4" />
                                      )
                                    ) : (
                                      <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                                    )}
                                  </div>
                                </TableHead>
                                <TableHead>Repository</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sortedOptimizers.map((optimizer) => (
                                <TableRow
                                  key={optimizer.name}
                                  className={optimizer.name === bestPerformer ? "bg-primary/5" : ""}
                                >
                                  <TableCell className="text-center font-medium">
                                    {optimizer.rank === 1 ? (
                                      <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 rounded-full dark:bg-amber-900/30 dark:text-amber-500">
                                        1
                                      </span>
                                    ) : optimizer.rank === 2 ? (
                                      <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 text-slate-700 rounded-full dark:bg-slate-800 dark:text-slate-400">
                                        2
                                      </span>
                                    ) : optimizer.rank === 3 ? (
                                      <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-50 text-amber-800 rounded-full dark:bg-amber-950/30 dark:text-amber-600">
                                        3
                                      </span>
                                    ) : (
                                      optimizer.rank
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium flex items-center">
                                      {optimizer.name}
                                      {optimizer.name === bestPerformer && (
                                        <Badge
                                          variant="outline"
                                          className="ml-2 bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-500 dark:border-amber-800/30"
                                        >
                                          Best
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <span
                                        className={
                                          optimizer.avg_gap < 5
                                            ? "text-green-600 dark:text-green-500"
                                            : optimizer.avg_gap < 15
                                              ? "text-amber-600 dark:text-amber-500"
                                              : "text-red-600 dark:text-red-500"
                                        }
                                      >
                                        {formatNumber(optimizer.avg_gap)}%
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span>{formatNumber(optimizer.avg_runtime)}s</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <a
                                      href={optimizer.qubot_repo}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-primary hover:underline"
                                    >
                                      <GitFork className="h-4 w-4 mr-1" />
                                      View Code
                                      <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-amber-500" />
                            {size.charAt(0).toUpperCase() + size.slice(1)} Problem Instances
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                          {/* Test Instances Card */}
                          <Card className="border border-muted">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Test Instances</CardTitle>
                              <CardDescription>Problem instances used for benchmarking</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="bg-muted/50 p-3 rounded-md">
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-sm font-medium">Usage Example</h4>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 -mt-1"
                                      onClick={() => {
                                        const snippet = `from qubots.auto_problem import AutoProblem
# Load the problem instance
tsp_problem = AutoProblem.from_repo(
    "Rastion/traveling_salesman_problem",
    override_params={"instance_file": "${Object.keys(leaderboardData[size as keyof typeof leaderboardData].files_included)[0]}"}
)`
                                        navigator.clipboard.writeText(snippet)
                                        toast({
                                          title: "Code copied to clipboard",
                                          description: "You can now paste the code in your Python environment",
                                        })
                                      }}
                                    >
                                      <Copy className="h-3.5 w-3.5 mr-1" />
                                      Copy
                                    </Button>
                                  </div>
                                  <div className="relative rounded-md overflow-hidden bg-zinc-950 text-zinc-100 dark:bg-zinc-900">
                                    <pre className="p-4 overflow-x-auto text-xs font-mono">
                                      <code>
                                        <span className="text-white">from qubots.auto_problem import AutoProblem</span>
                                        {"\n"}
                                        <span className="text-slate-400"># Load the problem instance</span>
                                        {"\n"}
                                        <span className="text-blue-400">tsp_problem</span>
                                        <span className="text-white"> = </span>
                                        <span className="text-green-400">AutoProblem</span>
                                        <span className="text-white">.</span>
                                        <span className="text-yellow-400">from_repo</span>
                                        <span className="text-white">(</span>
                                        {"\n"}
                                        <span className="text-white"> </span>
                                        <span className="text-orange-400">"Rastion/traveling_salesman_problem"</span>
                                        <span className="text-white">,</span>
                                        {"\n"}
                                        <span className="text-white"> </span>
                                        <span className="text-yellow-400">override_params</span>
                                        <span className="text-white">={"{"}</span>
                                        <span className="text-orange-400">"instance_file"</span>
                                        <span className="text-white">: </span>
                                        <span className="text-orange-400">
                                          "
                                          {
                                            Object.keys(
                                              leaderboardData[size as keyof typeof leaderboardData].files_included,
                                            )[0]
                                          }
                                          "
                                        </span>
                                        <span className="text-white">{"}"}</span>
                                        {"\n"}
                                        <span className="text-white">)</span>
                                      </code>
                                    </pre>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <h4 className="text-sm font-medium mb-2">Available Instances:</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {Object.keys(
                                      leaderboardData[size as keyof typeof leaderboardData].files_included,
                                    ).map((file) => (
                                      <div key={file} className="flex items-center gap-2 group">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{file}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                                          onClick={() => {
                                            const snippet = `from qubots.auto_problem import AutoProblem
# Load the problem instance
tsp_problem = AutoProblem.from_repo(
    "Rastion/traveling_salesman_problem",
    override_params={"instance_file": "${file}"}
)`
                                            navigator.clipboard.writeText(snippet)
                                            toast({
                                              title: `Code for ${file} copied`,
                                              description: "You can now paste the code in your Python environment",
                                            })
                                          }}
                                        >
                                          <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}

export default LeaderboardPage
