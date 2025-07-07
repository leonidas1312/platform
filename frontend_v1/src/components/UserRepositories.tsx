"use client"

import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Star,
  GitFork,
  Clock,
  Lock,
  Globe,
  Package,
  Settings,
  Loader2,
  FolderGit,
  Eye,
  EyeOff,
  Plus,
} from "lucide-react"

const API = import.meta.env.VITE_API_BASE

interface Repository {
  id: number
  name: string
  full_name: string
  description: string
  private: boolean
  owner: {
    login: string
    avatar_url: string
  }
  stars_count: number
  forks_count: number
  updated_at: string
  created_at: string
  qubot_type?: string
  config?: any
}

interface UserRepositoriesProps {
  username: string
  isOwnProfile: boolean
}

const UserRepositories: React.FC<UserRepositoriesProps> = ({ username, isOwnProfile }) => {
  const navigate = useNavigate()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"public" | "private">("public")

  useEffect(() => {
    fetchRepositories()
  }, [username])

  const fetchRepositories = async () => {
    try {
      setLoading(true)
      const endpoint = isOwnProfile 
        ? `${API}/repositories` // Current user's repos (includes private)
        : `${API}/api/users/${username}/repos` // Public repos only

      const response = await fetch(endpoint, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setRepositories(data)
      } else {
        console.error("Failed to fetch repositories")
        setRepositories([])
      }
    } catch (error) {
      console.error("Error fetching repositories:", error)
      setRepositories([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "1 day ago"
    if (diffDays < 30) return `${diffDays} days ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const getQubotTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "problem":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/30"
      case "optimizer":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800/30"
    }
  }

  const publicRepos = repositories.filter(repo => !repo.private)
  const privateRepos = repositories.filter(repo => repo.private)

  const handleRepoClick = (repo: Repository) => {
    navigate(`/${repo.owner.login}/${repo.name}`)
  }

  const RepositoryCard: React.FC<{ repo: Repository }> = ({ repo }) => (
    <Card 
      className="overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer border-border/60 group"
      onClick={() => handleRepoClick(repo)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={repo.owner.avatar_url} alt={repo.owner.login} />
              <AvatarFallback className="text-xs">
                {repo.owner.login.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                  {repo.name}
                </CardTitle>
                {repo.private ? (
                  <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{repo.owner.login}</p>
            </div>
          </div>
          {repo.qubot_type && (
            <Badge variant="outline" className={`text-xs ${getQubotTypeColor(repo.qubot_type)} flex-shrink-0`}>
              <Package className="h-3 w-3 mr-1" />
              {repo.qubot_type}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {repo.description && (
          <p className="text-sm text-muted-foreground mb-4 overflow-hidden" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.4em',
            maxHeight: '2.8em'
          }}>
            {repo.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {repo.stars_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="h-3 w-3" />
              {repo.forks_count || 0}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(repo.updated_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <span className="text-lg text-muted-foreground">Loading repositories...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Optimization repositories</h2>
        <p className="text-muted-foreground">
          {isOwnProfile 
            ? "Manage your optimization repositories" 
            : `${username}'s public optimization repositories`
          }
        </p>
      </div>

      {isOwnProfile ? (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "public" | "private")}>
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-auto grid-cols-2">
              <TabsTrigger value="public" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Public ({publicRepos.length})
              </TabsTrigger>
              <TabsTrigger value="private" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Private ({privateRepos.length})
              </TabsTrigger>
            </TabsList>
            
          </div>

          <TabsContent value="public" className="mt-0">
            {publicRepos.length === 0 ? (
              <Card className="border-dashed border-2 border-border/40">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 rounded-full bg-muted/30 mb-4">
                    <Globe className="h-8 w-8 text-muted-foreground/60" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No public repositories</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Create your first public repository to share your optimization work with the community.
                  </p>
                  <Button onClick={() => navigate('/create-repository')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Repository
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicRepos.map((repo) => (
                  <RepositoryCard key={repo.id} repo={repo} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="private" className="mt-0">
            {privateRepos.length === 0 ? (
              <Card className="border-dashed border-2 border-border/40">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 rounded-full bg-muted/30 mb-4">
                    <Lock className="h-8 w-8 text-muted-foreground/60" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No private repositories</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Private repositories are perfect for work-in-progress or proprietary optimization algorithms.
                  </p>
                  <Button onClick={() => navigate('/create-repository')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Private Repository
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {privateRepos.map((repo) => (
                  <RepositoryCard key={repo.id} repo={repo} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        // For viewing other users' profiles - only show public repos
        <div>
          {publicRepos.length === 0 ? (
            <Card className="border-dashed border-2 border-border/40">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-muted/30 mb-4">
                  <FolderGit className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No public repositories</h3>
                <p className="text-muted-foreground max-w-md">
                  {username} hasn't shared any public optimization repositories yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicRepos.map((repo) => (
                <RepositoryCard key={repo.id} repo={repo} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UserRepositories
