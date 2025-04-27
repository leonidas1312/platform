"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DialogTrigger, Dialog } from "@/components/ui/dialog"
import { Book, Edit, GitFork, MoreVertical, Star, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"

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
}: RepoHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col space-y-4 mb-8 bg-gradient-to-r from-background via-background/80 to-primary/5 rounded-xl p-6 border border-border/40 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Book className="h-5 w-5 text-primary" />
          <button
            onClick={() => navigate(`/u/${repo.owner.login}`)}
            className="text-muted-foreground hover:text-primary hover:underline transition-colors"
          >
            {repo.owner.login}
          </button>
          <span className="text-muted-foreground">/</span>
          <button
            onClick={() => navigate(`/${owner}/${repoName}`)}
            className="font-semibold hover:text-primary hover:underline transition-colors"
          >
            {repo.name}
          </button>
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
                <DropdownMenuItem >
                <GitFork className="mr-2 h-4 w-4" />
                Clone Repository
                </DropdownMenuItem>
                
                <DropdownMenuItem
                onClick={onDeleteRepo}
                className="text-destructive focus:text-destructive"
                >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Repository
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>

        </div>
      </div>
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
