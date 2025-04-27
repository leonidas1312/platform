"use client"

import { AvatarFallback } from "@/components/ui/avatar"

import { AvatarImage } from "@/components/ui/avatar"

import { Avatar } from "@/components/ui/avatar"

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
  Clock,
  UserPlus,
  UserMinus,
  Users,
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
import ActivityFeed from "@/components/ActivityFeed"
import { ScrollArea } from "@/components/ui/scroll-area"

const API = import.meta.env.VITE_API_BASE;


const Profile = () => {
  // Get username from URL params
  const { username } = useParams<{ username: string }>()
  const [user, setUser] = useState<any>(null)
  const [repos, setRepos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reposLoading, setReposLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("about")

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [repoName, setRepoName] = useState("")
  const [repoDescription, setRepoDescription] = useState("")
  const [license, setLicense] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [isCreatingRepo, setIsCreatingRepo] = useState(false)

  // New state for followers functionality
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [showFollowersDialog, setShowFollowersDialog] = useState(false)
  const [showFollowingDialog, setShowFollowingDialog] = useState(false)
  const [followersLoading, setFollowersLoading] = useState(false)
  const [followingLoading, setFollowingLoading] = useState(false)
  const [currentUserData, setCurrentUserData] = useState<any>(null)

  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("gitea_token")
    if (!token) {
      navigate("/auth")
      return
    }

    // Fetch current logged-in user data
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${API}/profile`, {
          headers: { Authorization: `token ${token}` },
        })

        if (response.ok) {
          const userData = await response.json()
          setCurrentUserData(userData)
        }
      } catch (error) {
        console.error("Failed to fetch current user", error)
      }
    }

    // Fetch user profile - if username is provided, fetch that user's profile
    // otherwise fetch the current user's profile
    const fetchUserProfile = async () => {
      try {
        const endpoint = username ? `${API}/users/${username}` : `${API}/profile`

        const response = await fetch(endpoint, {
          headers: { Authorization: `token ${token}` },
        })

        if (!response.ok) {
          navigate("/auth")
          return
        }

        const data = await response.json()
        setUser(data)

        // Check if current user is following this user
        if (username && username !== currentUserData?.login) {
          checkFollowStatus(username)
        }

        // Fetch followers and following
        fetchFollowers(username || data.login)
        fetchFollowing(username || data.login)
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
          ? `${API}/users/${username}/repos`
          : `${API}/user-repos`

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

    fetchCurrentUser()
    fetchUserProfile()
    fetchUserRepos()
  }, [navigate, username, currentUserData?.login])

  // Check if current user is following the profile user
  const checkFollowStatus = async (targetUsername: string) => {
    try {
      const token = localStorage.getItem("gitea_token")
      const response = await fetch(`${API}/user/following/${targetUsername}`, {
        headers: { Authorization: `token ${token}` },
      })

      setIsFollowing(response.status === 204)
    } catch (error) {
      console.error("Failed to check follow status", error)
    }
  }

  // Fetch followers for a user
  const fetchFollowers = async (targetUsername: string) => {
    setFollowersLoading(true)
    try {
      const token = localStorage.getItem("gitea_token")
      const response = await fetch(`${API}/users/${targetUsername}/followers`, {
        headers: { Authorization: `token ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setFollowers(data)
      }
    } catch (error) {
      console.error("Failed to fetch followers", error)
    } finally {
      setFollowersLoading(false)
    }
  }

  // Fetch users that the profile user is following
  const fetchFollowing = async (targetUsername: string) => {
    setFollowingLoading(true)
    try {
      const token = localStorage.getItem("gitea_token")
      const response = await fetch(`${API}/users/${targetUsername}/following`, {
        headers: { Authorization: `token ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setFollowing(data)
      }
    } catch (error) {
      console.error("Failed to fetch following", error)
    } finally {
      setFollowingLoading(false)
    }
  }

  // Handle follow/unfollow action
  const handleFollowToggle = async () => {
    if (!username || username === currentUserData?.login) return

    setIsFollowLoading(true)
    try {
      const token = localStorage.getItem("gitea_token")
      const method = isFollowing ? "DELETE" : "PUT"

      const response = await fetch(`${API}/user/following/${username}`, {
        method,
        headers: { Authorization: `token ${token}` },
      })

      if (response.ok) {
        setIsFollowing(!isFollowing)
        // Refresh followers list
        fetchFollowers(username)

        toast({
          title: isFollowing ? "Unfollowed" : "Following",
          description: isFollowing ? `You unfollowed ${username}` : `You are now following ${username}`,
        })
      } else {
        throw new Error("Failed to update follow status")
      }
    } catch (error) {
      console.error("Failed to follow/unfollow", error)
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsFollowLoading(false)
    }
  }

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

      // Only send the PATCH request if there are profile fields to update
      if (Object.keys(updatedData).length > 0) {
        const patchResponse = await fetch(`${API}/profile`, {
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
      }

      // Always fetch the updated profile to get the latest avatar
      const getResponse = await fetch(`${API}/profile`, {
        headers: { Authorization: `token ${token}` },
      })

      if (!getResponse.ok) {
        throw new Error("Failed to fetch updated profile")
      }

      const newUser = await getResponse.json()

      // Update the user state with the new data
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

      const response = await fetch(`${API}/create-repo`, {
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
      const res = await fetch(`${API}/user-repos`, {
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

  // Check if viewing own profile
  const isOwnProfile = !username || username === currentUserData?.login

  return (
    <Layout>
      <main className="min-h-screen bg-gradient-to-b from-background to-background/95 py-32 text-foreground">
        <div className="max-w-6xl mx-auto px-4 space-y-8">
          {/* Profile Header with subtle gradient background */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column - Profile Info with enhanced styling */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-card rounded-xl shadow-md p-6 border border-border/40 backdrop-blur-sm flex flex-col items-center lg:items-start hover:shadow-lg transition-all duration-300">
                <div className="relative group">
                  <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 opacity-70 blur-sm group-hover:opacity-100 transition-opacity"></div>
                  <img
                    src={user.avatar_url || "/placeholder.svg?height=200&width=200"}
                    alt="Profile Avatar"
                    className="relative w-32 h-32 rounded-full border-4 border-background object-cover shadow-md transition-all duration-300 group-hover:border-primary/50 z-10"
                  />
                  {isOwnProfile && (
                    <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={handleOpenModal}
                      >
                        <Settings className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </div>

                <h1 className="text-2xl font-bold mt-5 text-center lg:text-left bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                  {user.full_name || user.login}
                </h1>
                <p className="text-muted-foreground text-center lg:text-left">@{user.login}</p>

                {/* Follow button - only show when viewing another user's profile */}
                {!isOwnProfile && (
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    size="sm"
                    className="mt-3 w-full"
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                  >
                    {isFollowLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : isFollowing ? (
                      <UserMinus className="h-4 w-4 mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                )}

                <Separator className="my-4 bg-border/50" />

                <div className="w-full space-y-3">
                  {user.email && (
                    <div className="flex items-center gap-2 text-sm group hover:text-primary transition-colors">
                      <Mail className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
                      <span className="text-muted-foreground group-hover:text-foreground/80 transition-colors">
                        {user.email}
                      </span>
                    </div>
                  )}

                  {user.location && (
                    <div className="flex items-center gap-2 text-sm group hover:text-primary transition-colors">
                      <MapPin className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
                      <span className="text-muted-foreground group-hover:text-foreground/80 transition-colors">
                        {user.location}
                      </span>
                    </div>
                  )}

                  {user.website && (
                    <div className="flex items-center gap-2 text-sm group">
                      <Globe className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
                      <a
                        href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 hover:underline flex items-center transition-colors"
                      >
                        {user.website}
                        <ArrowUpRight className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}

                  {user.created_at && (
                    <div className="flex items-center gap-2 text-sm group hover:text-primary transition-colors">
                      <Calendar className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
                      <span className="text-muted-foreground group-hover:text-foreground/80 transition-colors">
                        Joined {formatDate(user.created_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Card with enhanced styling */}
              <div className="bg-card rounded-xl shadow-md p-6 border border-border/40 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary/50 rounded-full mr-1"></div>
                  Stats
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="flex flex-col items-center p-3 bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg border border-border/30 hover:border-border/50 transition-colors cursor-pointer"
                    onClick={() => setShowFollowersDialog(true)}
                  >
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                      {followers.length || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">Followers</span>
                  </div>
                  <div
                    className="flex flex-col items-center p-3 bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg border border-border/30 hover:border-border/50 transition-colors cursor-pointer"
                    onClick={() => setShowFollowingDialog(true)}
                  >
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                      {following.length || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">Following</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg border border-border/30 hover:border-border/50 transition-colors">
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                      {repos.length || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">Qubots</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg border border-border/30 hover:border-border/50 transition-colors">
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                      {user.starred_repos_count || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">Starred</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Content with enhanced styling */}
            <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start mb-6 bg-card rounded-xl p-1 shadow-sm border border-border/40">
                  <TabsTrigger
                    value="about"
                    className="flex items-center gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                  >
                    <User className="w-4 h-4" />
                    About
                  </TabsTrigger>
                  <TabsTrigger
                    value="repositories"
                    className="flex items-center gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                  >
                    <FolderGit className="w-4 h-4" />
                    Qubots
                  </TabsTrigger>
                  <TabsTrigger
                    value="activity"
                    className="flex items-center gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                  >
                    <Clock className="w-4 h-4" />
                    Activity
                  </TabsTrigger>
                </TabsList>

                {/* Repositories Tab with enhanced styling */}
                <TabsContent value="repositories" className="mt-0">
                  <div className="bg-card rounded-xl shadow-md p-6 border border-border/40 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full mr-2"></div>
                        <FolderGit className="w-5 h-5 text-primary" />
                        Qubots
                      </h2>
                      
                    </div>

                    {reposLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin w-6 h-6 text-primary" />
                        <span className="ml-2 text-muted-foreground">Loading Repositories...</span>
                      </div>
                    ) : repos.length > 0 ? (
                      <div className="space-y-4">
                        {repos.map((repo) => (
                          <div
                            key={repo.id}
                            onClick={() => handleRepoClick(repo)}
                            className="cursor-pointer border border-border/40 p-5 rounded-xl hover:shadow-md transition-all hover:bg-muted/30 hover:border-primary/20 group"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold flex items-center gap-2 text-foreground text-lg group-hover:text-primary transition-colors">
                                  <FileCog2 className="w-4 h-4 text-primary" /> {repo.name}
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">
                                  {repo.description || "No description provided."}
                                </p>
                              </div>
                              <Badge
                                variant={repo.private ? "outline" : "secondary"}
                                className={
                                  repo.private
                                    ? "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/30 dark:text-amber-500"
                                    : ""
                                }
                              >
                                {repo.private ? "Private" : "Public"}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted-foreground">
                              {repo.language && (
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                                  {repo.language}
                                </div>
                              )}

                              <div className="flex items-center gap-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
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

                              {repo.updated_at && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Updated {formatDate(repo.updated_at)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl border border-border/30">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                          <FolderGit className="w-10 h-10 text-muted-foreground opacity-50" />
                        </div>
                        <h3 className="text-lg font-medium">No repositories yet</h3>
                        <p className="text-muted-foreground mt-1 mb-6 max-w-md mx-auto">
                          {isOwnProfile
                            ? "Create your first repository to get started with optimization problems and solutions"
                            : `${username} hasn't created any repositories yet`}
                        </p>
                        {isOwnProfile && (
                          <Button
                            onClick={handleCreateRepoClick}
                            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-sm"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            New Qubot Repository
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* About Tab with enhanced styling */}
                <TabsContent value="about" className="mt-0">
                  <div className="bg-card rounded-xl shadow-md p-6 border border-border/40 backdrop-blur-sm">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                      <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full mr-2"></div>
                      <User className="w-5 h-5 text-primary" />
                      About
                    </h2>

                    <div className="space-y-6">
                      {/* Bio Section with enhanced styling */}
                      <div className="bg-gradient-to-br from-muted/30 to-muted/50 rounded-lg p-6 border border-border/30">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-2 rounded-full bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="text-lg font-medium">Bio</h3>
                        </div>

                        {user.description ? (
                          <p className="text-foreground leading-relaxed">{user.description}</p>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">No bio provided</p>
                            {isOwnProfile && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-primary/20 hover:bg-primary/5 transition-colors"
                                onClick={handleOpenModal}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Add Bio
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Activity Tab with enhanced styling */}
                <TabsContent value="activity" className="mt-0">
                  <div className="bg-card rounded-xl shadow-md p-6 border border-border/40 backdrop-blur-sm">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                      <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full mr-2"></div>
                      <Clock className="w-5 h-5 text-primary" />
                      Recent Activity
                    </h2>

                    <ActivityFeed username={username || user.login} avatar_url={user.avatar_url} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <EditProfileModal isOpen={isModalOpen} onClose={handleCloseModal} user={user} onSave={handleSaveChanges} />

      {/* Enhanced Create Repository Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-primary/10">
                <FolderGit className="h-5 w-5 text-primary" />
              </div>
              Create a new Qubot repository
            </DialogTitle>
            <DialogDescription>
              A Qubot repository contains your optimization problem or solution, including all project files and
              revision history.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRepo} className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="repo-name" className="text-sm font-medium flex items-center gap-1">
                  Repository name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="repo-name"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="my-awesome-qubot"
                  required
                  className="border-border/40 focus:border-primary/30"
                />
                <p className="text-xs text-muted-foreground">
                  Great repository names are short, memorable and easy to understand.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="repo-description" className="text-sm font-medium">
                  Description <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="repo-description"
                  value={repoDescription}
                  onChange={(e) => setRepoDescription(e.target.value)}
                  placeholder="Short description of your Qubot repository"
                  className="border-border/40 focus:border-primary/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license" className="text-sm font-medium">
                  License
                </Label>
                <Select value={license} onValueChange={setLicense}>
                  <SelectTrigger id="license" className="border-border/40 focus:border-primary/30">
                    <SelectValue placeholder="Choose a license" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="mit">MIT License</SelectItem>
                    <SelectItem value="apache-2.0">Apache License 2.0</SelectItem>
                    <SelectItem value="gpl-3.0">GNU General Public License v3.0</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  A license tells others what they can and can't do with your code.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="is-private"
                  checked={isPrivate}
                  onCheckedChange={(checked) => setIsPrivate(checked === true)}
                />
                <Label htmlFor="is-private" className="text-sm font-medium cursor-pointer">
                  Make this repository private
                </Label>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={isCreatingRepo}
                className="border-border/40"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingRepo}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
              >
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

      {/* Followers Dialog */}
      <Dialog open={showFollowersDialog} onOpenChange={setShowFollowersDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Followers
            </DialogTitle>
            <DialogDescription>People following {isOwnProfile ? "you" : user.login}</DialogDescription>
          </DialogHeader>

          {followersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : followers.length > 0 ? (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {followers.map((follower) => (
                  <div
                    key={follower.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      navigate(`/u/${follower.login}`)
                      setShowFollowersDialog(false)
                    }}
                  >
                    <Avatar className="h-10 w-10 border border-border/40">
                      <AvatarImage
                        src={follower.avatar_url || `/placeholder.svg?height=40&width=40&query=${follower.login}`}
                        alt={follower.login}
                      />
                      <AvatarFallback>{follower.login.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{follower.full_name || follower.login}</p>
                      <p className="text-sm text-muted-foreground">@{follower.login}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground opacity-30 mx-auto mb-2" />
              <p className="text-muted-foreground">
                {isOwnProfile ? "You don't have any followers yet" : `${user.login} doesn't have any followers yet`}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={showFollowingDialog} onOpenChange={setShowFollowingDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Following
            </DialogTitle>
            <DialogDescription>People {isOwnProfile ? "you're" : `${user.login} is`} following</DialogDescription>
          </DialogHeader>

          {followingLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : following.length > 0 ? (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {following.map((followedUser) => (
                  <div
                    key={followedUser.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      navigate(`/u/${followedUser.login}`)
                      setShowFollowingDialog(false)
                    }}
                  >
                    <Avatar className="h-10 w-10 border border-border/40">
                      <AvatarImage
                        src={
                          followedUser.avatar_url || `/placeholder.svg?height=40&width=40&query=${followedUser.login}`
                        }
                        alt={followedUser.login}
                      />
                      <AvatarFallback>{followedUser.login.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{followedUser.full_name || followedUser.login}</p>
                      <p className="text-sm text-muted-foreground">@{followedUser.login}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground opacity-30 mx-auto mb-2" />
              <p className="text-muted-foreground">
                {isOwnProfile ? "You're not following anyone yet" : `${user.login} isn't following anyone yet`}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

export default Profile
