"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, FileText, BookOpen, Cpu, ArrowRight, ChevronRight, Home, Menu, X } from "lucide-react"
import { DocToc } from "@/components/doc-toc"

// Import all documentation components

import IntroductionDoc from "@/docs/introduction"

import QuickStartDoc from "@/docs/quickstart"
import WhatAreQubotsDoc from "@/docs/what-are-qubots"
import CreateQuBotRepositoryDoc from "@/docs/create-qubot-repository"
import CreateQuBotCardDoc from "@/docs/create-qubot-card"
import WrapOptimizationToolsDoc from "@/docs/wrap-optimization-tools"
import ShareQubotsDoc from "@/docs/share-qubots"
import CreateOptimizationSolutionsDoc from "@/docs/create-optimization-solutions"
import UseOthersQubotsDoc from "@/docs/use-other-qubots"
import TspChristofidesDoc from "@/docs/tsp-christofides-tutorials"
import OrToolsTutorialsDoc from "@/docs/ortools-tutorials"
import AMPLTutorialsPage from "@/docs/ampl-tutorials"
import DrakeTutorialsDoc from "@/docs/drake-tutorials"
import PyomoTutorialsDoc from "@/docs/pyomo-tutorials"
import ScipTutorialsDoc from "@/docs/scip-tutorials"

// Documentation structure
const documentationStructure = [
  {
    title: "Getting Started",
    icon: <Home className="h-4 w-4" />,
    items: [
      { title: "Introduction", slug: "introduction" },
      { title: "Quick Start", slug: "quick-start" },
    ],
  },
  {
    title: "Core Concepts",
    icon: <Cpu className="h-4 w-4" />,
    items: [
      { title: "What are qubots?", slug: "what-are-qubots" },
      { title: "How to create a qubot repository", slug: "create-qubot-repository" },
      { title: "How to create a qubot card", slug: "create-qubot-card" },
      { title: "How to wrap my optimization tools as qubots", slug: "wrap-optimization-tools" },
      { title: "How to share my qubots with the community", slug: "share-qubots" },
      { title: "How to create optimization solutions using qubots", slug: "create-optimization-solutions" },
      { title: "How to use qubots uploaded by others", slug: "use-others-qubots" },
    ],
  },
  {
    title: "Tutorials",
    icon: <BookOpen className="h-4 w-4" />,
    items: [
      { title: "Solving TSP with Christofides algorithm", slug: "tsp-christofides" },
      { title: "Qubots with OR tools tutorials", slug: "or-tools-tutorials" },
      { title: "Qubots with Gamspy tutorials", slug: "gamspy-tutorials" },
      { title: "Qubots with Fellopy tutorials", slug: "fellopy-tutorials" },
      { title: "Qubots with CasADi tutorials", slug: "casadi-tutorials" },
      { title: "Qubots with AMPL tutorials", slug: "ampl-tutorials" },
      { title: "Qubots with Drake tutorials", slug: "drake-tutorials" },
      { title: "Qubots with Pyomo tutorials", slug: "pyomo-tutorials" },
      { title: "Qubots with SCIP tutorials", slug: "scip-tutorials" },
    ],
  },
]

// Map of slug to component
const documentationComponents = {
  introduction: IntroductionDoc,
  "quick-start": QuickStartDoc,
  "what-are-qubots": WhatAreQubotsDoc,
  "create-qubot-repository": CreateQuBotRepositoryDoc,
  "create-qubot-card": CreateQuBotCardDoc,
  "wrap-optimization-tools": WrapOptimizationToolsDoc,
  "share-qubots": ShareQubotsDoc,
  "create-optimization-solutions": CreateOptimizationSolutionsDoc,
  "use-others-qubots": UseOthersQubotsDoc,
  "tsp-christofides": TspChristofidesDoc,
  "or-tools-tutorials": OrToolsTutorialsDoc,
  "ampl-tutorials": AMPLTutorialsPage,
  "drake-tutorials": DrakeTutorialsDoc,
  "pyomo-tutorials": PyomoTutorialsDoc,
  "scip-tutorials": ScipTutorialsDoc,
}

// Map of slug to metadata
const documentationMetadata = {
  introduction: {
    title: "Introduction",
    description: "Learn about the Qubots platform and how it can help you solve optimization problems.",
  },
  "quick-start": { title: "Quick Start", description: "Get up and running with Qubots in minutes." },
  "what-are-qubots": {
    title: "What are qubots?",
    description: "Learn about the core concepts of qubots and how they work.",
  },
  "create-qubot-repository": {
    title: "How to create a qubot repository",
    description: "Learn how to create and set up a qubot repository.",
  },
  "create-qubot-card": {
    title: "How to create a qubot card",
    description: "Learn how to create qubot cards for your optimization tools.",
  },
  "wrap-optimization-tools": {
    title: "How to wrap my optimization tools as qubots",
    description: "Learn how to wrap your existing optimization tools as qubots.",
  },
  "share-qubots": {
    title: "How to share my qubots with the community",
    description: "Learn how to share your qubots with the community.",
  },
  "create-optimization-solutions": {
    title: "How to create optimization solutions using qubots",
    description: "Learn how to create optimization solutions using qubots.",
  },
  "use-others-qubots": {
    title: "How to use qubots uploaded by others",
    description: "Learn how to use qubots that have been shared by the community.",
  },
  "tsp-christofides": {
    title: "Solving TSP with Christofides algorithm",
    description: "Learn how to solve the Traveling Salesman Problem using the Christofides algorithm.",
  },
  "or-tools-tutorials": {
    title: "Qubots with OR tools tutorials",
    description: "Learn how to use OR tools with qubots for solving optimization problems.",
  },
  "gamspy-tutorials": {
    title: "Qubots with Gamspy tutorials",
    description: "Learn how to use Gamspy with qubots for solving optimization problems.",
  },
  "fellopy-tutorials": {
    title: "Qubots with Fellopy tutorials",
    description: "Learn how to use Fellopy with qubots for solving optimization problems.",
  },
  "casadi-tutorials": {
    title: "Qubots with CasADi tutorials",
    description: "Learn how to use CasADi with qubots for solving optimization problems.",
  },
  "ampl-tutorials": {
    title: "Qubots with AMPL tutorials",
    description: "Learn how to use AMPL with qubots for solving optimization problems.",
  },
  "drake-tutorials": {
    title: "Qubots with Drake tutorials",
    description: "Learn how to use Drake with qubots for solving optimization problems.",
  },
  "pyomo-tutorials": {
    title: "Qubots with Pyomo tutorials",
    description: "Learn how to use Pyomo with qubots for solving optimization problems.",
  },
  "scip-tutorials": {
    title: "Qubots with SCIP tutorials",
    description: "Learn how to use SCIP with qubots for solving optimization problems.",
  },
}

type DocumentationPageProps = {}

const DocumentationPage: React.FC<DocumentationPageProps> = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState("")
  const [currentDoc, setCurrentDoc] = useState("introduction")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<Array<{ slug: string; title: string; section: string }>>([])
  const contentRef = useRef<HTMLDivElement>(null)
  const [activeHeading, setActiveHeading] = useState<string>("")

  // Extract the slug from the URL if present
  useEffect(() => {
    const pathParts = location.pathname.split("/")
    const slug = pathParts[pathParts.length - 1]

    if (slug && documentationComponents[slug]) {
      setCurrentDoc(slug)
    } else if (location.pathname === "/docs" || location.pathname === "/docs/") {
      setCurrentDoc("introduction")
    }
  }, [location])

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const query = searchQuery.toLowerCase()
    const results: Array<{ slug: string; title: string; section: string }> = []

    // Search in all documentation metadata
    Object.entries(documentationMetadata).forEach(([slug, metadata]) => {
      if (metadata.title.toLowerCase().includes(query) || metadata.description.toLowerCase().includes(query)) {
        // Find which section this doc belongs to
        let section = ""
        for (const category of documentationStructure) {
          const item = category.items.find((item) => item.slug === slug)
          if (item) {
            section = category.title
            break
          }
        }

        results.push({
          slug,
          title: metadata.title,
          section,
        })
      }
    })

    setSearchResults(results)
  }, [searchQuery])

  // Navigate to a documentation page
  const navigateToDoc = (slug: string) => {
    setCurrentDoc(slug)
    navigate(`/docs/${slug}`)
    setMobileMenuOpen(false)
    setSearchQuery("")
    setSearchResults([])
  }

  // Navigate to a heading
  const navigateToHeading = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    })
    setActiveHeading(id)
  }

  // Get the current documentation component
  const CurrentDocComponent = documentationComponents[currentDoc] || null
  const currentDocMetadata = documentationMetadata[currentDoc] || { title: "", description: "" }

  // Find the current section and item
  let currentSection = ""
  let currentSectionTitle = ""
  for (const section of documentationStructure) {
    const item = section.items.find((item) => item.slug === currentDoc)
    if (item) {
      currentSection = section.title
      currentSectionTitle = item.title
      break
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Mobile menu button */}
          <div className="md:hidden flex justify-between items-center mb-4">
            <Button variant="outline" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-4 w-4 mr-2" /> : <Menu className="h-4 w-4 mr-2" />}
              {mobileMenuOpen ? "Close Menu" : "Documentation Menu"}
            </Button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search docs..."
                className="w-full pl-10 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg">
                  <div className="p-2">
                    {searchResults.map((result) => (
                      <button
                        key={result.slug}
                        className="w-full text-left px-3 py-2 hover:bg-muted rounded-md flex flex-col"
                        onClick={() => navigateToDoc(result.slug)}
                      >
                        <span className="font-medium">{result.title}</span>
                        <span className="text-xs text-muted-foreground">{result.section}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className={`md:w-64 flex-shrink-0 ${mobileMenuOpen ? "block" : "hidden md:block"}`}>
            <div className="sticky top-24">
              <div className="hidden md:block mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search documentation..."
                    className="w-full pl-10 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg">
                      <div className="p-2">
                        {searchResults.map((result) => (
                          <button
                            key={result.slug}
                            className="w-full text-left px-3 py-2 hover:bg-muted rounded-md flex flex-col"
                            onClick={() => navigateToDoc(result.slug)}
                          >
                            <span className="font-medium">{result.title}</span>
                            <span className="text-xs text-muted-foreground">{result.section}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Card className="bg-gray-50 dark:bg-gray-900/50 border-border/40">
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-180px)]">
                    <div className="p-4">
                      {documentationStructure.map((section) => (
                        <div key={section.title} className="mb-6">
                          <h3 className="font-medium text-sm flex items-center mb-2 text-muted-foreground">
                            {section.icon}
                            <span className="ml-2">{section.title}</span>
                          </h3>

                          <ul className="space-y-1">
                            {section.items.map((item) => (
                              <li key={item.slug}>
                                <button
                                  className={`w-full text-left px-3 py-1.5 rounded-md text-sm flex items-center ${
                                    currentDoc === item.slug
                                      ? "bg-primary/10 text-primary font-medium"
                                      : "hover:bg-muted"
                                  }`}
                                  onClick={() => navigateToDoc(item.slug)}
                                >
                                  <div className="flex items-center">
                                    {currentDoc === item.slug && (
                                      <ChevronRight className="h-3 w-3 mr-1 flex-shrink-0" />
                                    )}
                                    <span className={currentDoc === item.slug ? "ml-0" : "ml-4"}>{item.title}</span>
                                  </div>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
            {CurrentDocComponent ? (
              <motion.div
                key={currentDoc}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col lg:flex-row gap-8"
              >
                <div className="flex-1">
                  <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Button
                        variant="link"
                        className="p-0 h-auto text-muted-foreground"
                        onClick={() => navigateToDoc("introduction")}
                      >
                        Docs
                      </Button>
                      <ChevronRight className="h-3 w-3" />
                      <Button variant="link" className="p-0 h-auto text-muted-foreground">
                        {currentSection}
                      </Button>
                      <ChevronRight className="h-3 w-3" />
                      <span>{currentSectionTitle}</span>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight mb-3">{currentDocMetadata.title}</h1>
                    <p className="text-lg text-muted-foreground mb-6">{currentDocMetadata.description}</p>
                  </div>

                  {/* Document Content */}
                  <div ref={contentRef}>
                    <CurrentDocComponent />
                  </div>

                  {/* Navigation between docs */}
                  <div className="mt-12 flex flex-col sm:flex-row justify-between gap-4 border-t border-border/40 pt-8">
                    {getPreviousDoc(currentDoc) && (
                      <Button
                        variant="outline"
                        className="flex items-center"
                        onClick={() => navigateToDoc(getPreviousDoc(currentDoc))}
                      >
                        <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                        Previous: {getPreviousDocTitle(currentDoc)}
                      </Button>
                    )}

                    {getNextDoc(currentDoc) && (
                      <Button
                        variant="outline"
                        className="flex items-center ml-auto"
                        onClick={() => navigateToDoc(getNextDoc(currentDoc))}
                      >
                        Next: {getNextDocTitle(currentDoc)}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Right sidebar with table of contents */}
                <DocToc headings={[]} activeId={activeHeading} onHeadingClick={navigateToHeading} />
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-xl font-medium">Documentation not found</h3>
                  <p className="text-muted-foreground mt-2 mb-6">
                    The documentation page you're looking for doesn't exist or has been moved.
                  </p>
                  <Button onClick={() => navigateToDoc("introduction")}>Go to Introduction</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

// Helper functions to get previous and next docs
function getPreviousDoc(currentSlug: string): string | null {
  let prevSlug: string | null = null

  // Flatten the documentation structure
  const allDocs: string[] = []
  documentationStructure.forEach((section) => {
    section.items.forEach((item) => {
      allDocs.push(item.slug)
    })
  })

  // Find the previous doc
  for (let i = 0; i < allDocs.length; i++) {
    if (allDocs[i] === currentSlug) {
      if (i > 0) {
        prevSlug = allDocs[i - 1]
      }
      break
    }
  }

  return prevSlug
}

function getNextDoc(currentSlug: string): string | null {
  let nextSlug: string | null = null

  // Flatten the documentation structure
  const allDocs: string[] = []
  documentationStructure.forEach((section) => {
    section.items.forEach((item) => {
      allDocs.push(item.slug)
    })
  })

  // Find the next doc
  for (let i = 0; i < allDocs.length; i++) {
    if (allDocs[i] === currentSlug) {
      if (i < allDocs.length - 1) {
        nextSlug = allDocs[i + 1]
      }
      break
    }
  }

  return nextSlug
}

function getPreviousDocTitle(currentSlug: string): string {
  const prevSlug = getPreviousDoc(currentSlug)
  if (!prevSlug) return ""

  // Find the title for the slug
  for (const section of documentationStructure) {
    for (const item of section.items) {
      if (item.slug === prevSlug) {
        return item.title
      }
    }
  }

  return ""
}

function getNextDocTitle(currentSlug: string): string {
  const nextSlug = getNextDoc(currentSlug)
  if (!nextSlug) return ""

  // Find the title for the slug
  for (const section of documentationStructure) {
    for (const item of section.items) {
      if (item.slug === nextSlug) {
        return item.title
      }
    }
  }

  return ""
}

export default DocumentationPage
