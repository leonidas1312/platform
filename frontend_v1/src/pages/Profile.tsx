"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import {
  Settings,
  Loader2,
  FolderGit,
  FileCog2,
  User,
  Mail,
  MapPin,
  Globe,
  Eye,
  Star,
  GitFork,
  Calendar,
  ArrowUpRight,
  Plus,
  FileText,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import EditProfileModal from "@/components/EditProfileModal"

import Layout from "../components/Layout"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

const Profile = () => {
  // Get username from URL params
  const { username } = useParams<{ username: string }>()
  const [user, setUser] = useState<any>(null)
  const [repos, setRepos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reposLoading, setReposLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("repositories")

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [repoName, setRepoName] = useState("")
  const [repoDescription, setRepoDescription] = useState("")
  const [license, setLicense] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [isCreatingRepo, setIsCreatingRepo] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("gitea_token")
    if (!token) {
      navigate("/auth")
      return
    }

    // Fetch user profile - if username is provided, fetch that user's profile
    // otherwise fetch the current user's profile
    const fetchUserProfile = async () => {
      try {
        const endpoint = username 
          ? `http://localhost:4000/api/users/${username}` 
          : "http://localhost:4000/api/profile"
        
        const response = await fetch(endpoint, {
          headers: { Authorization: `token ${token}` },
        })
        
        if (!response.ok) {
          navigate("/auth")
          return
        }
        
        const data = await response.json()
        setUser(data)
      } catch (error) {
        console.error("Failed to fetch user", error)
        navigate("/auth")
      } finally {
        setLoading(false)
      }
    }

    // Fetch user repositories - if username is provided, fetch that user's repos
    // otherwise fetch the current user's repos
    const fetchUserRepos = async () => {
      try {
        const endpoint = username
          ? `http://localhost:4000/api/users/${username}/repos`
          : "http://localhost:4000/api/user-repos"
        
        const res = await fetch(endpoint, {
          headers: { Authorization: `token ${token}` },
        })
        
        if (res.ok) {
          const data = await res.json()
          setRepos(data)
        }
      } catch (error) {
        console.error("Failed to fetch repos", error)
      } finally {
        setReposLoading(false)
      }
    }

    fetchUserProfile()
    fetchUserRepos()
  }, [navigate, username])

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin w-10 h-10 text-primary" />
            <span className="text-muted-foreground">Loading Profile...</span>
          </div>
        </div>
      </Layout>
    )
  }

  if (!user) return null

  // Function to handle repo card clicks and redirect to the repo page
  const handleRepoClick = (repo: any) => {
    const [ownerName] = repo.full_name.split("/")
    const repoName = repo.name
    navigate(`/${ownerName}/${repoName}`)
  }

  const handleOpenModal = () => setIsModalOpen(true)
  const handleCloseModal = () => setIsModalOpen(false)

  const handleSaveChanges = async (updatedData: any) => {
    try {
      const token = localStorage.getItem("gitea_token")
      if (!token) {
        toast({ title: "Error", description: "No token found. Please re-authenticate." })
        return
      }

      const patchResponse = await fetch("http://localhost:4000/api/profile", {
        method: "PATCH",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      })

      if (!patchResponse.ok) {
        const errData = await patchResponse.json()
        throw new Error(errData.message || "Failed to update profile")
      }

      const getResponse = await fetch("http://localhost:4000/api/profile", {
        headers: { Authorization: `token ${token}` },
      })
      if (!getResponse.ok) {
        throw new Error("Failed to fetch updated profile")
      }
      const newUser = await getResponse.json()

      setUser(newUser)
      toast({ title: "Success", description: "Profile updated successfully!" })
      setIsModalOpen(false)
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({ title: "Error", description: error.message })
    }
  }

  // Format date to readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleCreateRepoClick = () => {
    setRepoName("")
    setRepoDescription("")
    setLicense("")
    setIsPrivate(false)
    setShowCreateModal(true)
  }

  const handleCreateRepo = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!repoName.trim()) {
      toast({
        title: "Error",
        description: "Repository name is required",
      })
      return
    }

    setIsCreatingRepo(true)

    try {
      const token = localStorage.getItem("gitea_token")
      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch("http://localhost:4000/api/create-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
        body: JSON.stringify({
          name: repoName,
          description: repoDescription,
          license: license,
          isPrivate: isPrivate,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create repository")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: "Qubot repository created successfully!",
      })

      setShowCreateModal(false)
      // Refresh the repositories list
      const res = await fetch("http://localhost:4000/api/user-repos", {
        headers: { Authorization: `token ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setRepos(data)
      }
      
      // Navigate to the new repository with the updated URL format
      navigate(`/${user.login}/${repoName}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create repository",
      })
    } finally {
      setIsCreatingRepo(false)
    }
  }

  return (
    <Layout>
      <main className="min-h-screen bg-background py-32 text-foreground">
        <div className="max-w-6xl mx-auto px-4 space-y-8">
          {/* Profile Header */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column - Profile Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-card rounded-xl shadow-sm p-6 flex flex-col items-center lg:items-start">
                <div className="relative group">
                  <img
                    src={user.avatar_url || "/placeholder.svg?height=200&width=200"}
                    alt="Profile Avatar"
                    className="w-32 h-32 rounded-full border-4 border-background object-cover shadow-md transition-all duration-300 group-hover:border-primary"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="ghost" size="icon" className="text-white" onClick={handleOpenModal}>
                      <Settings className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <h1 className="text-2xl font-bold mt-4 text-center lg:text-left">{user.full_name || user.login}</h1>
                <p className="text-muted-foreground text-center lg:text-left">@{user.login}</p>

                <Separator className="my-4" />

                <div className="w-full space-y-3">
                  {user.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{user.email}</span>
                    </div>
                  )}

                  {user.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{user.location}</span>
                    </div>
                  )}

                  {user.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center"
                      >
                        {user.website}
                        <ArrowUpRight className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}

                  {user.created_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Joined {formatDate(user.created_at)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 w-full">
                  <Button onClick={handleOpenModal} className="w-full">
                    Edit Profile
                  </Button>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-card rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Stats</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-2xl font-bold">{user.followers_count || 0}</span>
                    <span className="text-xs text-muted-foreground">Followers</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-2xl font-bold">{user.following_count || 0}</span>
                    <span className="text-xs text-muted-foreground">Following</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-2xl font-bold">{repos.length || 0}</span>
                    <span className="text-xs text-muted-foreground">Repositories</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-2xl font-bold">{user.starred_repos_count || 0}</span>
                    <span className="text-xs text-muted-foreground">Starred</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start mb-6 bg-card rounded-xl p-1">
                  <TabsTrigger value="repositories" className="flex items-center gap-1">
                    <FolderGit className="w-4 h-4" />
                    Repositories
                  </TabsTrigger>
                  <TabsTrigger value="about" className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    About
                  </TabsTrigger>
                </TabsList>

                {/* Repositories Tab */}
                <TabsContent value="repositories" className="mt-0">
                  <div className="bg-card rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <FolderGit className="w-5 h-5" />
                        Repositories
                      </h2>
                      <Button size="sm" onClick={handleCreateRepoClick}>
                        <Plus className="w-4 h-4 mr-1" />
                        New
                      </Button>
                    </div>

                    {reposLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Loading Repositories...</span>
                      </div>
                    ) : repos.length > 0 ? (
                      <div className="space-y-4">
                        {repos.map((repo) => (
                          <div
                            key={repo.id}
                            onClick={() => handleRepoClick(repo)}
                            className="cursor-pointer border border-border p-5 rounded-xl hover:shadow-md transition-all hover:bg-muted/30"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold flex items-center gap-2 text-foreground text-lg">
                                  <FileCog2 className="w-4 h-4 text-primary" /> {repo.name}
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                  {repo.description || "No description provided."}
                                </p>
                              </div>
                              <Badge variant={repo.private ? "outline" : "secondary"}>
                                {repo.private ? "Private" : "Public"}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                              {repo.language && (
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                                  {repo.language}
                                </div>
                              )}

                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {repo.stars_count || 0}
                              </div>

                              <div className="flex items-center gap-1">
                                <GitFork className="w-3 h-3" />
                                {repo.forks_count || 0}
                              </div>

                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {repo.watchers_count || 0}
                              </div>

                              {repo.updated_at && <div>Updated {formatDate(repo.updated_at)}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-muted/30 rounded-xl">
                        <FolderGit className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">No repositories yet</h3>
                        <p className="text-muted-foreground mt-1 mb-4">Create your first repository to get started</p>
                        <Button onClick={handleCreateRepoClick}>
                          <Plus className="w-4 h-4 mr-1" />
                          New Qubot Repository
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* About Tab */}
                <TabsContent value="about" className="mt-0">
                  <div className="bg-card rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                      <User className="w-5 h-5" />
                      About
                    </h2>

                    <div className="space-y-6">
                      {/* Bio Section */}
                      <div className="bg-muted/30 rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-medium">Bio</h3>
                        </div>
                        
                        {user.description ? (
                          <p className="text-foreground leading-relaxed">{user.description}</p>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-muted-foreground">No bio provided</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={handleOpenModal}
                            >
                              Add Bio
                            </Button>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm text-muted-foreground mb-2">Full Name</h3>
                          <p className="text-foreground">{user.full_name || "Not provided"}</p>
                        </div>

                        <div>
                          <h3 className="text-sm text-muted-foreground mb-2">Username</h3>
                          <p className="text-foreground">{user.login}</p>
                        </div>

                        <div>
                          <h3 className="text-sm text-muted-foreground mb-2">Email</h3>
                          <p className="text-foreground">{user.email || "Not provided"}</p>
                        </div>

                        <div>
                          <h3 className="text-sm text-muted-foreground mb-2">Location</h3>
                          <p className="text-foreground">{user.location || "Not provided"}</p>
                        </div>

                        <div>
                          <h3 className="text-sm text-muted-foreground mb-2">Website</h3>
                          {user.website ? (
                            <a
                              href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center"
                            >
                              {user.website}
                              <ArrowUpRight className="w-3 h-3 ml-1" />
                            </a>
                          ) : (
                            <p className="text-foreground">Not provided</p>
                          )}
                        </div>

                        <div>
                          <h3 className="text-sm text-muted-foreground mb-2">Visibility</h3>
                          <p className="text-foreground">{user.visibility || "Not provided"}</p>
                        </div>

                        <div>
                          <h3 className="text-sm text-muted-foreground mb-2">Member Since</h3>
                          <p className="text-foreground">{formatDate(user.created_at)}</p>
                        </div>

                        <div>
                          <h3 className="text-sm text-muted-foreground mb-2">Last Active</h3>
                          <p className="text-foreground">{formatDate(user.last_login)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <EditProfileModal isOpen={isModalOpen} onClose={handleCloseModal} user={user} onSave={handleSaveChanges} />

      {/* Create Repository Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create a new Qubot repository</DialogTitle>
            <DialogDescription>
              A Qubot repository contains your optimization problem or solution, including all project files and revision history.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRepo} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="repo-name" className="text-sm font-medium">
                Repository name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="repo-name"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="my-awesome-qubot"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="repo-description" className="text-sm font-medium">
                Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="repo-description"
                value={repoDescription}
                onChange={(e) => setRepoDescription(e.target.value)}
                placeholder="Short description of your Qubot repository"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license" className="text-sm font-medium">
                License
              </Label>
              <Select value={license} onValueChange={setLicense}>
                <SelectTrigger id="license">
                  <SelectValue placeholder="Choose a license" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="mit">MIT License</SelectItem>
                  <SelectItem value="apache-2.0">Apache License 2.0</SelectItem>
                  <SelectItem value="gpl-3.0">GNU General Public License v3.0</SelectItem>
                  <SelectItem value="bsd-2-clause">BSD 2-Clause License</SelectItem>
                  <SelectItem value="bsd-3-clause">BSD 3-Clause License</SelectItem>
                  <SelectItem value="mpl-2.0">Mozilla Public License 2.0</SelectItem>
                  <SelectItem value="lgpl-3.0">GNU Lesser General Public License v3.0</SelectItem>
                  <SelectItem value="agpl-3.0">GNU Affero General Public License v3.0</SelectItem>
                  <SelectItem value="unlicense">The Unlicense</SelectItem>
                </SelectContent>
              </Select>
                <p className="text-xs text-muted-foreground">
                  A license tells others what they can and can't do with your code.
                </p>
              </div >

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="private-repo"
                  checked={isPrivate}
                  onCheckedChange={(checked) => setIsPrivate(checked === true)}
                />
                <Label htmlFor="private-repo" className="text-sm font-medium">
                  Make this repository private
                </Label>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreatingRepo}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingRepo}>
                  {isCreatingRepo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create repository"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
    </Layout>
  )
}

export default Profile

