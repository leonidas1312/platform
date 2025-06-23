import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Search, GitBranch, ExternalLink, Filter } from "lucide-react"

const API = import.meta.env.VITE_API_BASE

interface Repository {
  id: number
  name: string
  full_name: string
  description: string
  owner: {
    login: string
    avatar_url: string
  }
  html_url: string
  clone_url: string
  updated_at: string
  private: boolean
  qubot_type?: string
}

interface RepositorySelectorProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  filterByType?: 'problem' | 'optimizer' | null
  showTypeFilter?: boolean
  label?: string
  required?: boolean
  className?: string
}

export function RepositorySelector({
  value,
  onValueChange,
  placeholder = "Select a repository",
  disabled = false,
  filterByType = null,
  showTypeFilter = false,
  label,
  required = false,
  className = ""
}: RepositorySelectorProps) {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [filteredRepositories, setFilteredRepositories] = useState<Repository[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>(filterByType || "all")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRepositories()
  }, [])

  useEffect(() => {
    filterRepositories()
  }, [repositories, searchQuery, typeFilter])

  const loadRepositories = async () => {
    setLoading(true)
    setError(null)

    try {
      // Try admin endpoint first, fallback to user repositories
      let response = await fetch(`${API}/api/leaderboard/admin/repositories`, {
        credentials: 'include'
      })

      if (!response.ok) {
        // Fallback to user repositories
        response = await fetch(`${API}/api/repositories`, {
          credentials: 'include'
        })
      }

      if (!response.ok) {
        throw new Error('Failed to load repositories')
      }

      const data = await response.json()
      const repos = data.repositories || data

      setRepositories(repos)
    } catch (error: any) {
      console.error('Error loading repositories:', error)
      setError(error.message || 'Failed to load repositories')
    } finally {
      setLoading(false)
    }
  }

  const filterRepositories = () => {
    let filtered = repositories

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(repo =>
        repo.name.toLowerCase().includes(query) ||
        repo.full_name.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query) ||
        repo.owner.login.toLowerCase().includes(query)
      )
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter(repo => repo.qubot_type === typeFilter)
    }

    setFilteredRepositories(filtered)
  }

  const getRepositoryTypeColor = (type?: string) => {
    switch (type) {
      case 'problem':
        return 'bg-blue-100 text-blue-800'
      case 'optimizer':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filter Controls */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            disabled={disabled || loading}
          />
        </div>

        {showTypeFilter && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter} disabled={disabled || loading}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="problem">Problems</SelectItem>
                <SelectItem value="optimizer">Optimizers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Repository Selection */}
      {loading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Loading repositories...</span>
        </div>
      ) : (
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {filteredRepositories.length > 0 ? (
              filteredRepositories.map((repo) => (
                <SelectItem key={repo.id} value={repo.full_name}>
                  <div className="flex items-center gap-2 w-full">
                    <img 
                      src={repo.owner.avatar_url} 
                      alt={repo.owner.login}
                      className="w-4 h-4 rounded-full flex-shrink-0"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{repo.full_name}</span>
                        {repo.private && (
                          <Badge variant="outline" className="text-xs">Private</Badge>
                        )}
                        {repo.qubot_type && (
                          <Badge className={`text-xs ${getRepositoryTypeColor(repo.qubot_type)}`}>
                            {repo.qubot_type}
                          </Badge>
                        )}
                      </div>
                      {repo.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-60">
                          {repo.description}
                        </span>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery || typeFilter !== "all" 
                  ? "No repositories match your filters" 
                  : "No repositories available"}
              </div>
            )}
          </SelectContent>
        </Select>
      )}

      {/* Repository Count */}
      {!loading && (
        <div className="text-xs text-muted-foreground">
          {filteredRepositories.length} of {repositories.length} repositories
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={loadRepositories}
          disabled={disabled || loading}
          className="text-xs"
        >
          <GitBranch className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>
    </div>
  )
}
