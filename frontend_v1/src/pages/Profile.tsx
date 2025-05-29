"use client"

import { AvatarFallback } from "@/components/ui/avatar"

import { AvatarImage } from "@/components/ui/avatar"

import { Avatar } from "@/components/ui/avatar"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import {
  Settings,
  Loader2,
  User,
  UserPlus,
  UserMinus,
  Users,
  Activity,
  Mail,
  MapPin,
  Globe,
  Calendar,
  ArrowUpRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import EditProfileModal from "@/components/EditProfileModal"

import Layout from "../components/Layout"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import ActivityFeed from "@/components/ActivityFeed"
import { ScrollArea } from "@/components/ui/scroll-area"

const API = import.meta.env.VITE_API_BASE

const Profile = () => {
  // Get username from URL params
  const { username } = useParams<{ username: string }>()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const [isOwnProfile, setIsOwnProfile] = useState(false)

  // Add a new state variable to track if the user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Update the useEffect that fetches user data to check for login status
  useEffect(() => {
    const token = localStorage.getItem("gitea_token")
    setIsLoggedIn(!!token)

    // Only proceed with fetching data if the user is logged in
    if (token) {
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
        } finally {
          setLoading(false)
        }
      }

      fetchCurrentUser()
      fetchUserProfile()
    } else {
      // If not logged in, set loading to false
      setLoading(false)
    }
  }, [navigate, username, currentUserData?.login])





  useEffect(() => {
    setIsOwnProfile(!username || username === currentUserData?.login)
  }, [username, currentUserData?.login])

  // Check if current user is following the profile user
  const checkFollowStatus = async (targetUsername: string) => {
    try {
      const token = localStorage.getItem("gitea_token")
      const response = await fetch(`${API}/user/following/${targetUsername}`, {
        headers: { Authorization: `token ${token}` },
      })

      // Only set following status if the API call was successful
      if (response.ok) {
        setIsFollowing(response.status === 204)
      } else {
        console.warn(`Follow status check failed for ${targetUsername}: ${response.status}`)
        setIsFollowing(false)
      }
    } catch (error) {
      console.error("Failed to check follow status", error)
      setIsFollowing(false)
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

  // Replace the loading check in the render function with this combined check
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

  // Add this check after the loading check and before the "if (!user) return null" check
  if (!isLoggedIn) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full p-8 bg-card rounded-xl shadow-lg border border-border/40 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary/70" />
            </div>
            <h2 className="text-2xl font-bold">Authentication Required</h2>
            <p className="text-muted-foreground">
              You need to be logged in to view Rastion profiles and user information.
            </p>
            <div className="pt-4">
              <Button
                onClick={() => navigate("/auth")}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
              >
                Log in to continue
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!user) return null

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



  return (
    <Layout>
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/5">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border/40">
          <div className="w-full max-w-7xl mx-auto px-6 py-16">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Profile Avatar and Basic Info */}
              <div className="flex flex-col items-center lg:items-start">
                <div className="relative group">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/30 to-primary/60 opacity-70 blur-md group-hover:opacity-100 transition-all duration-300"></div>
                  <Avatar className="relative w-40 h-40 border-4 border-background shadow-2xl group-hover:scale-105 transition-all duration-300">
                    <AvatarImage
                      src={user.avatar_url || `/placeholder.svg?height=160&width=160&query=${user.login}`}
                      alt={user.login}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-5xl font-bold bg-gradient-to-br from-primary/20 to-primary/40">
                      {user.login.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full w-12 h-12 p-0 bg-background border-2 border-primary/20 hover:border-primary/40 shadow-xl hover:shadow-2xl transition-all duration-300"
                      onClick={handleOpenModal}
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Profile Information */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {user.full_name || user.login}
                </h1>
                <p className="text-xl text-muted-foreground mb-6">@{user.login}</p>

                {user.description && (
                  <p className="text-lg text-foreground/80 mb-8 max-w-2xl leading-relaxed">
                    {user.description}
                  </p>
                )}

                {/* User Details */}
                <div className="flex flex-wrap gap-6 justify-center lg:justify-start mb-8">
                  {user.location && (
                    <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                      <MapPin className="w-5 h-5" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  {user.email && (
                    <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                      <Mail className="w-5 h-5" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user.website && (
                    <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Globe className="w-5 h-5" />
                      <a
                        href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-1"
                      >
                        {user.website}
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-5 h-5" />
                    <span>Joined {new Date(user.created).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Follow button and Stats */}
                <div className="flex items-center gap-6">
                  {!isOwnProfile && (
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      size="lg"
                      className="px-8"
                      onClick={handleFollowToggle}
                      disabled={isFollowLoading}
                    >
                      {isFollowLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : isFollowing ? (
                        <UserMinus className="h-5 w-5 mr-2" />
                      ) : (
                        <UserPlus className="h-5 w-5 mr-2" />
                      )}
                      {isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-8">
                    <div
                      className="text-center cursor-pointer hover:text-primary transition-colors"
                      onClick={() => setShowFollowersDialog(true)}
                    >
                      <div className="text-2xl font-bold">{followers.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </div>
                    <div
                      className="text-center cursor-pointer hover:text-primary transition-colors"
                      onClick={() => setShowFollowingDialog(true)}
                    >
                      <div className="text-2xl font-bold">{following.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Following</div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Activity Feed */}
        <div className="w-full max-w-7xl mx-auto px-6 py-12">
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                Recent Activity
              </CardTitle>
              <CardDescription>
                {isOwnProfile ? "Your recent activities and contributions on Rastion" : `${user.login}'s recent activities and contributions on Rastion`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed username={username || user.login} avatar_url={user.avatar_url} />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <EditProfileModal isOpen={isModalOpen} onClose={handleCloseModal} user={user} onSave={handleSaveChanges} />



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
