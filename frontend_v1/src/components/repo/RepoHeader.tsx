"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GitFork, MoreVertical, Star, Trash2, Code, Copy, Check, Share2, Edit } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import QubotEditDialog from "./QubotEditDialog"

interface RepoHeaderProps {
  owner: string
  repoName: string
  repo: {
    owner: { login: string }
    name: string
    private: boolean
    stars_count: number
  }
  config: any
  hasRepoStarred: boolean
  toggleStar: () => void
  onEditQubotCard: () => void
  onDeleteRepo: () => void
  onSaveQubotCard: (formData: any) => Promise<void>
  allRepoFiles: any[]
}

export default function RepoHeader({
  owner,
  repoName,
  repo,
  config,
  hasRepoStarred,
  toggleStar,
  onEditQubotCard,
  onDeleteRepo,
  onSaveQubotCard,
  allRepoFiles,
}: RepoHeaderProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [showCodeDialog, setShowCodeDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyCode = () => {
    const codeSnippet =
      config?.type === "optimizer"
        ? `from qubots.auto_optimizer import AutoOptimizer\noptimizer = AutoOptimizer.from_repo("${owner}/${repoName}")`
        : `from qubots.auto_problem import AutoProblem\nproblem = AutoProblem.from_repo("${owner}/${repoName}")`

    navigator.clipboard.writeText(codeSnippet)
    setCopied(true)
    toast({
      title: "Copied to clipboard",
      description: "Code snippet has been copied to your clipboard",
    })

    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col space-y-4 mb-8 bg-gradient-to-r from-background via-background/80 to-primary/5 rounded-xl p-6 border border-border/40 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/u/${repo.owner.login}`)}
            className="text-muted-foreground hover:text-primary hover:underline transition-colors"
          >
            {repo.owner.login}
          </button>
          <span className="text-muted-foreground">/</span>

          {repo.name}

          <Badge variant="outline" className="ml-2 bg-background/80 backdrop-blur-sm">
            {repo.private ? "Private" : "Public"}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Qubot metadata section */}
        <QubotMetadata config={config} />

        <div className="flex gap-2 items-center ml-auto">
          <Button
            onClick={toggleStar}
            variant="outline"
            size="sm"
            className={`h-8 transition-all ${
              hasRepoStarred
                ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30 dark:hover:bg-amber-900/50"
                : ""
            }`}
          >
            <Star className={`mr-1 h-4 w-4 ${hasRepoStarred ? "fill-current" : ""}`} />
            {hasRepoStarred ? "Unstar" : "Star"}
            <Badge variant="secondary" className="ml-1 rounded-sm px-1">
              {repo.stars_count}
            </Badge>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit qubot card
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setShowCodeDialog(true)}>
                <Share2 className="mr-2 h-4 w-4" />
                Use with qubots library
              </DropdownMenuItem>

              <DropdownMenuItem>
                <GitFork className="mr-2 h-4 w-4" />
                Clone Repository
              </DropdownMenuItem>

              <DropdownMenuItem onClick={onDeleteRepo} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Repository
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Code Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Use with qubots library
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="relative">
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code className="text-sm font-mono">
                  {config?.type === "optimizer" ? (
                    <>
                      from qubots.auto_optimizer import AutoOptimizer
                      <br />
                      optimizer = AutoOptimizer.from_repo("{owner}/{repoName}")
                    </>
                  ) : (
                    <>
                      from qubots.auto_problem import AutoProblem
                      <br />
                      problem = AutoProblem.from_repo("{owner}/{repoName}")
                    </>
                  )}
                </code>
              </pre>
              <Button size="sm" variant="ghost" className="absolute top-2 right-2 h-8 w-8 p-0" onClick={handleCopyCode}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              This code will automatically download and set up your qubot for use in your Python environment.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Qubot Dialog */}
      <QubotEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        owner={owner}
        repoName={repoName}
        config={config}
        onSaveQubotCard={onSaveQubotCard}
        allRepoFiles={allRepoFiles}
      />
    </div>
  )
}

function QubotMetadata({ config }: { config: any }) {
  if (!config) return null

  return (
    <div className="mt-2">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 items-center">
          {config.type && (
            <Badge
              variant="outline"
              className={`px-3 py-1 text-sm font-medium border-none text-white ${
                config.type === "problem"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                  : "bg-gradient-to-r from-orange-500 to-red-500"
              }`}
            >
              {config.type.charAt(0).toUpperCase() + config.type.slice(1)}
            </Badge>
          )}
          {config.keywords && config.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-2">
              {config.keywords.slice(0, 25).map((keyword: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs bg-background hover:bg-primary/25">
                  {keyword}
                </Badge>
              ))}
            </div>
          )}

          {/* ArXiv links */}
          {config.link_to_arxiv && <ArxivLinks links={config.link_to_arxiv} />}
        </div>
      </div>
    </div>
  )
}

function ArxivLinks({ links }: { links: string | string[] }) {
  if (!links) return null

  const renderLink = (link: string, index: number) => (
    <a
      key={index}
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted hover:bg-muted/80 text-primary"
      title={link}
    >
      <ExternalLink className="h-3 w-3 mr-1" />
      {link.replace(/^https?:\/\//, "").substring(0, 12)}
      {link.replace(/^https?:\/\//, "").length > 12 ? "..." : ""}
    </a>
  )

  return (
    <div className="flex flex-wrap gap-1 ml-2">
      {Array.isArray(links) ? links.map(renderLink) : renderLink(links, 0)}
    </div>
  )
}

import { ExternalLink } from "lucide-react"
