"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Layout from "@/components/Layout"
import {
  Search,
  FileText,
  Code,
  BookOpen,
  Cpu,
  Zap,
  GitBranch,
  Lightbulb,
  ExternalLink,
  ArrowRight,
  Download,
} from "lucide-react"

const Documentation = () => {
  const [searchQuery, setSearchQuery] = useState("")

  // Real documentation content focused on optimization and qubots
  const docs = [
    {
      id: 1,
      title: "Getting Started with Qubots",
      category: "guides",
      description: "Learn how to create and use Qubots for your optimization problems",
      icon: <Cpu className="h-5 w-5 text-primary" />,
      popular: true,
      path: "/docs/getting-started",
    },
    {
      id: 2,
      title: "Qubots API Reference",
      category: "api",
      description: "Complete API documentation for the Qubots library",
      icon: <Code className="h-5 w-5 text-primary" />,
      popular: false,
      path: "/docs/api-reference",
    },
    {
      id: 3,
      title: "Converting QUBO Problems",
      category: "tutorials",
      description: "Step-by-step guide to convert Quadratic Unconstrained Binary Optimization problems",
      icon: <GitBranch className="h-5 w-5 text-primary" />,
      popular: true,
      path: "/docs/qubo-conversion",
    },
    {
      id: 4,
      title: "Preparing Optimization Data",
      category: "guides",
      description: "How to prepare and format your optimization problem data",
      icon: <FileText className="h-5 w-5 text-primary" />,
      popular: false,
      path: "/docs/data-preparation",
    },
    {
      id: 5,
      title: "Deploying Optimization Models",
      category: "guides",
      description: "Deploy your optimization models to production environments",
      icon: <Zap className="h-5 w-5 text-primary" />,
      popular: true,
      path: "/docs/deployment",
    },
    {
      id: 6,
      title: "Python SDK Documentation",
      category: "api",
      description: "Complete documentation for the Qubots Python SDK",
      icon: <Code className="h-5 w-5 text-primary" />,
      popular: false,
      path: "/docs/python-sdk",
    },
    {
      id: 7,
      title: "Optimization Algorithm Integration",
      category: "api",
      description: "How to integrate your custom optimization algorithms",
      icon: <Lightbulb className="h-5 w-5 text-primary" />,
      popular: false,
      path: "/docs/algorithm-integration",
    },
    {
      id: 8,
      title: "Solving the Traveling Salesman Problem",
      category: "tutorials",
      description: "Learn how to solve TSP using quantum-inspired optimization",
      icon: <GitBranch className="h-5 w-5 text-primary" />,
      popular: true,
      path: "/docs/tsp-tutorial",
    },
  ]

  // Example notebooks that users can run
  const exampleNotebooks = [
    {
      id: 1,
      title: "Traveling Salesman Problem",
      description: "Solve the classic TSP using Qubots",
      path: "/notebooks/tsp_example.ipynb",
    },
    {
      id: 2,
      title: "Portfolio Optimization",
      description: "Optimize investment portfolios with risk constraints",
      path: "/notebooks/portfolio_optimization.ipynb",
    },
    {
      id: 3,
      title: "Job Shop Scheduling",
      description: "Optimize manufacturing schedules",
      path: "/notebooks/job_shop_scheduling.ipynb",
    },
    {
      id: 4,
      title: "Vehicle Routing Problem",
      description: "Optimize delivery routes with multiple constraints",
      path: "/notebooks/vrp_example.ipynb",
    },
  ]

  const filteredDocs = docs.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Documentation</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Learn how to make your optimization algorithms and problems qubot friendly!
            </p>
          </div>

          <div className="relative mb-10">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documentation..."
              className="w-full pl-10 py-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          

          

          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-6">Example Notebooks</h2>
            <p className="text-muted-foreground mb-6">
              Explore these interactive Jupyter notebooks to see Qubots in action with real-world optimization problems.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exampleNotebooks.map((notebook) => (
                <motion.div
                  key={notebook.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5 }}
                  className="cursor-pointer"
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{notebook.title}</CardTitle>
                      <CardDescription>{notebook.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-2 flex justify-between">
                      <Button variant="outline" size="sm" asChild>
                        <a href={notebook.path}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Notebook
                        </a>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`${notebook.path}?download=true`}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <Tabs defaultValue="all" className="mb-12">
            <TabsList className="mb-6 w-full grid grid-cols-4 mx-auto max-w-md">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="guides">Guides</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
              <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -5 }}
                    className="cursor-pointer"
                  >
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          {doc.icon}
                          <CardTitle className="text-lg">{doc.title}</CardTitle>
                        </div>
                        {doc.popular && (
                          <Badge variant="secondary" className="ml-auto">
                            Popular
                          </Badge>
                        )}
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{doc.description}</CardDescription>
                      </CardContent>
                      <CardFooter>
                        <Button variant="ghost" size="sm" className="ml-auto" asChild>
                          <a href={doc.path}>
                            Read More
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="guides">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs
                  .filter((doc) => doc.category === "guides")
                  .map((doc) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ y: -5 }}
                      className="cursor-pointer"
                    >
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            {doc.icon}
                            <CardTitle className="text-lg">{doc.title}</CardTitle>
                          </div>
                          {doc.popular && (
                            <Badge variant="secondary" className="ml-auto">
                              Popular
                            </Badge>
                          )}
                        </CardHeader>
                        <CardContent>
                          <CardDescription>{doc.description}</CardDescription>
                        </CardContent>
                        <CardFooter>
                          <Button variant="ghost" size="sm" className="ml-auto" asChild>
                            <a href={doc.path}>
                              Read More
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </a>
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            </TabsContent>
            <TabsContent value="api">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs
                  .filter((doc) => doc.category === "api")
                  .map((doc) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ y: -5 }}
                      className="cursor-pointer"
                    >
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            {doc.icon}
                            <CardTitle className="text-lg">{doc.title}</CardTitle>
                          </div>
                          {doc.popular && (
                            <Badge variant="secondary" className="ml-auto">
                              Popular
                            </Badge>
                          )}
                        </CardHeader>
                        <CardContent>
                          <CardDescription>{doc.description}</CardDescription>
                        </CardContent>
                        <CardFooter>
                          <Button variant="ghost" size="sm" className="ml-auto" asChild>
                            <a href={doc.path}>
                              Read More
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </a>
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            </TabsContent>
            <TabsContent value="tutorials">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs
                  .filter((doc) => doc.category === "tutorials")
                  .map((doc) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ y: -5 }}
                      className="cursor-pointer"
                    >
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            {doc.icon}
                            <CardTitle className="text-lg">{doc.title}</CardTitle>
                          </div>
                          {doc.popular && (
                            <Badge variant="secondary" className="ml-auto">
                              Popular
                            </Badge>
                          )}
                        </CardHeader>
                        <CardContent>
                          <CardDescription>{doc.description}</CardDescription>
                        </CardContent>
                        <CardFooter>
                          <Button variant="ghost" size="sm" className="ml-auto" asChild>
                            <a href={doc.path}>
                              Read More
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </a>
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>

          

          
        </motion.div>
      </div>
    </Layout>
  )
}

export default Documentation

