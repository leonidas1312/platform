"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import { FolderGit, Star, Loader2, Code, User, MessageSquare, ThumbsUp, Users, Trophy, Bookmark } from "lucide-react"

interface UserType {
  id: number
  login: string
  full_name: string
  avatar_url: string
  followers_count?: number
  following_count?: number
}

interface TrendingUser {
  id: number
  login: string
  full_name: string
  avatar_url: string
  followers_count: number
  qubot_count: number
  latest_qubot?: {
    name: string
  }
}

interface TopRepository {
  id: number
  name: string
  owner: {
    login: string
    avatar_url: string
  }
  stars_count: number
}

interface FollowerActivity {
  id: number
  user: UserType
  qubot: {
    id: number
    name: string
    stars_count: number
    created_at: string
    language: string
  }
}

interface QubotActivity {
  id: number
  type: "qubot_created" | "qubot_updated" | "qubot_starred"
  timestamp: string
  user: UserType
  qubot: {
    id: number
    name: string
    stars_count: number
    forks_count: number
    watchers_count: number
    language: string
    is_private: boolean
    updated_at: string
  }
}

// Update the NetworkActivityItem type to include the new activity types
type NetworkActivityItem = {
  id: string
  type:
    | "qubot_created"
    | "qubot_updated"
    | "feature_comment"
    | "feature_vote"
    | "post_comment"
    | "post_like"
    | "user_followed"
    | "repo_starred"
  timestamp: string
  user: UserType
  isFollower?: boolean
  data: {
    qubot?: {
      name: string
      owner: string
      description?: string
    }
    feature?: {
      id: string
      title: string
    }
    comment?: {
      content: string
    }
    post?: {
      id: number
      content: string
    }
    followed_user?: {
      login: string
      full_name?: string
    }
    starred_repo?: {
      name: string
      owner: string
      description?: string
    }
  }
}

const Feed = () => {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [activities, setActivities] = useState<QubotActivity[]>([])
  const [filteredActivities, setFilteredActivities] = useState<QubotActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("latest")
  const [timeFilter, setTimeFilter] = useState("all")
  const [languageFilter, setLanguageFilter] = useState("all")
  const [displayLimit, setDisplayLimit] = useState(10)
  const [trendingUsers, setTrendingUsers] = useState<TrendingUser[]>([])
  const [followerActivities, setFollowerActivities] = useState<FollowerActivity[]>([])
  const [isLoadingTrendingUsers, setIsLoadingTrendingUsers] = useState(true)
  const [isLoadingFollowerActivities, setIsLoadingFollowerActivities] = useState(true)
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [userRepoMap, setUserRepoMap] = useState<Map<string, any[]>>(new Map())

  // New state for network activities (from followed users)
  const [networkActivities, setNetworkActivities] = useState<NetworkActivityItem[]>([])
  const [isLoadingNetworkActivities, setIsLoadingNetworkActivities] = useState(true)
  const [following, setFollowing] = useState<UserType[]>([])
  const [networkActivitiesLimit, setNetworkActivitiesLimit] = useState(10)

  // New state for sidebar data
  const [topContributors, setTopContributors] = useState<UserType[]>([])
  const [topFollowedAccounts, setTopFollowedAccounts] = useState<UserType[]>([])
  const [topRepositories, setTopRepositories] = useState<TopRepository[]>([])
  const [isLoadingSidebar, setIsLoadingSidebar] = useState(true)

  // Fetch activities
  const fetchActivities = async () => {
    setIsLoading(true)
    try {
      // In a real implementation, you would fetch from an API endpoint
      // For now, we'll simulate activity data
      const token = localStorage.getItem("gitea_token")
      if (!token) {
        setIsLoading(false)
        return
      }

      // Fetch public repositories to simulate activity
      const response = await fetch("http://localhost:4000/api/public-repos?limit=50", {
        headers: { Authorization: `token ${token}` },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch public repositories")
      }

      const data = await response.json()
      const repos = data.data || []

      // Transform repos into activity items
      const mockActivities: QubotActivity[] = repos.map((repo: any, index: number) => {
        // Generate a random timestamp within the last 30 days
        const randomDaysAgo = Math.floor(Math.random() * 30)
        const timestamp = new Date()
        timestamp.setDate(timestamp.getDate() - randomDaysAgo)

        // Determine activity type (mostly created, some updated or starred)
        let type: "qubot_created" | "qubot_updated" | "qubot_starred" = "qubot_created"
        if (index % 10 === 0) type = "qubot_updated"
        else if (index % 7 === 0) type = "qubot_starred"

        return {
          id: repo.id,
          type,
          timestamp: timestamp.toISOString(),
          user: {
            id: repo.owner.id,
            login: repo.owner.login,
            full_name: repo.owner.full_name || repo.owner.login,
            avatar_url: repo.owner.avatar_url,
          },
          qubot: {
            id: repo.id,
            name: repo.name,
            stars_count: repo.stars_count || 0,
            forks_count: repo.forks_count || 0,
            watchers_count: repo.watchers_count || 0,
            language: repo.language || "Python",
            is_private: repo.private || false,
            updated_at: repo.updated_at,
          },
        }
      })

      setActivities(mockActivities)
    } catch (error) {
      console.error("Error fetching activities:", error)
      toast({
        title: "Error",
        description: "Failed to load activity feed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch sidebar data: top contributors, top followed accounts, top repositories
  const fetchSidebarData = async () => {
    setIsLoadingSidebar(true)
    try {
      const token = localStorage.getItem("gitea_token")
      if (!token) {
        setIsLoadingSidebar(false)
        return
      }

      // Fetch public repositories to get data for sidebar
      const response = await fetch("http://localhost:4000/api/public-repos?limit=100", {
        headers: { Authorization: `token ${token}` },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch public repositories")
      }

      const data = await response.json()
      const repos = data.data || []

      // Process repositories to get top contributors (users with most repositories)
      const repoMap = new Map<string, any[]>()
      repos.forEach((repo: any) => {
        if (!repoMap.has(repo.owner.login)) {
          repoMap.set(repo.owner.login, [])
        }
        repoMap.get(repo.owner.login)?.push(repo)
      })
      setUserRepoMap(repoMap)

      // Create top contributors array
      const contributors: UserType[] = []
      for (const [login, userRepos] of repoMap.entries()) {
        if (userRepos.length > 0) {
          const repo = userRepos[0] // Get first repo to extract user info
          contributors.push({
            id: repo.owner.id,
            login: repo.owner.login,
            full_name: repo.owner.full_name || repo.owner.login,
            avatar_url: repo.owner.avatar_url,
            followers_count: 0, // Will be updated later
            following_count: 0,
          })
        }
      }

      // Sort by number of repositories and get top 10
      const sortedContributors = contributors
        .sort((a, b) => {
          const aRepos = repoMap.get(a.login)?.length || 0
          const bRepos = repoMap.get(b.login)?.length || 0
          return bRepos - aRepos
        })
        .slice(0, 10)

      setTopContributors(sortedContributors)

      // Process repositories to get top repositories (by stars)
      const topRepos = repos
        .sort((a: any, b: any) => (b.stars_count || 0) - (a.stars_count || 0))
        .slice(0, 10)
        .map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          owner: {
            login: repo.owner.login,
            avatar_url: repo.owner.avatar_url,
          },
          stars_count: repo.stars_count || 0,
        }))

      setTopRepositories(topRepos)

      // Fetch top followed accounts (users with most followers)
      // For each user in our contributors list, fetch their follower count
      const usersWithFollowers: UserType[] = []

      for (const user of contributors.slice(0, 20)) {
        // Limit to top 20 to avoid too many requests
        try {
          const followerResponse = await fetch(`http://localhost:4000/api/users/${user.login}/followers`, {
            headers: { Authorization: `token ${token}` },
          })

          if (followerResponse.ok) {
            const followers = await followerResponse.json()
            const followersCount = Array.isArray(followers) ? followers.length : 0

            usersWithFollowers.push({
              ...user,
              followers_count: followersCount,
            })
          }
        } catch (error) {
          console.error(`Error fetching followers for ${user.login}:`, error)
          // Still add the user with 0 followers
          usersWithFollowers.push({
            ...user,
            followers_count: 0,
          })
        }
      }

      // Sort by follower count and get top 10
      const topFollowed = usersWithFollowers
        .sort((a, b) => (b.followers_count || 0) - (a.followers_count || 0))
        .slice(0, 10)

      setTopFollowedAccounts(topFollowed)
    } catch (error) {
      console.error("Error fetching sidebar data:", error)
      toast({
        title: "Error",
        description: "Failed to load sidebar data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSidebar(false)
    }
  }

  // Update the fetchTrendingUsers function to get real follower counts
  const fetchTrendingUsers = async () => {
    setIsLoadingTrendingUsers(true)
    try {
      const token = localStorage.getItem("gitea_token")
      if (!token) {
        setIsLoadingTrendingUsers(false)
        return
      }

      // First, get the current user
      const userResponse = await fetch("http://localhost:4000/api/profile", {
        headers: { Authorization: `token ${token}` },
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        setCurrentUser(userData)
      }

      // In a real implementation, you would fetch trending users from an API
      // For now, we'll simulate trending users based on public repos data
      const response = await fetch("http://localhost:4000/api/public-repos?limit=50", {
        headers: { Authorization: `token ${token}` },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch public repositories")
      }

      const data = await response.json()
      const repos = data.data || []

      // Group repositories by owner to find users with most repos
      const userRepoMap = new Map<string, any[]>()
      repos.forEach((repo: any) => {
        if (!userRepoMap.has(repo.owner.login)) {
          userRepoMap.set(repo.owner.login, [])
        }
        userRepoMap.get(repo.owner.login)?.push(repo)
      })

      // Create trending users array
      const trendingUsersData: TrendingUser[] = []

      // Process each user with their repositories
      for (const [login, userRepos] of userRepoMap.entries()) {
        const repo = userRepos[0] // Get first repo to extract user info

        // Fetch actual follower count for each user
        let followersCount = 0
        try {
          const followerResponse = await fetch(`http://localhost:4000/api/users/${login}/followers`, {
            headers: { Authorization: `token ${token}` },
          })

          if (followerResponse.ok) {
            const followers = await followerResponse.json()
            followersCount = Array.isArray(followers) ? followers.length : 0
          }
        } catch (error) {
          console.error(`Error fetching followers for ${login}:`, error)
        }

        trendingUsersData.push({
          id: repo.owner.id,
          login: repo.owner.login,
          full_name: repo.owner.full_name || repo.owner.login,
          avatar_url: repo.owner.avatar_url,
          followers_count: followersCount,
          qubot_count: userRepos.length,
          latest_qubot:
            userRepos.length > 0
              ? {
                  name: userRepos[0].name,
                }
              : undefined,
        })
      }

      // Sort by number of qubots and get top 5
      const sortedUsers = trendingUsersData.sort((a, b) => b.qubot_count - a.qubot_count).slice(0, 5)

      setTrendingUsers(sortedUsers)
    } catch (error) {
      console.error("Error fetching trending users:", error)
      toast({
        title: "Error",
        description: "Failed to load trending users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingTrendingUsers(false)
    }
  }

  // Update the fetchFollowerActivities function to only show activities from users the current user follows
  const fetchFollowerActivities = async () => {
    setIsLoadingFollowerActivities(true)
    try {
      const token = localStorage.getItem("gitea_token")
      if (!token) {
        setIsLoadingFollowerActivities(false)
        return
      }

      // First, get the current user
      const userResponse = await fetch("http://localhost:4000/api/profile", {
        headers: { Authorization: `token ${token}` },
      })

      let currentUserData = null
      if (userResponse.ok) {
        currentUserData = await userResponse.json()
        setCurrentUser(currentUserData)
      }

      // Get the users that the current user is following
      // Try multiple possible API endpoints since the exact one might vary
      let followingResponse
      try {
        followingResponse = await fetch(`http://localhost:4000/api/users/${currentUserData?.login}/following`, {
          headers: { Authorization: `token ${token}` },
        })
      } catch (error) {
        console.error("Error with first following endpoint:", error)
        try {
          followingResponse = await fetch("http://localhost:4000/api/user/following", {
            headers: { Authorization: `token ${token}` },
          })
        } catch (error) {
          console.error("Error with second following endpoint:", error)
        }
      }

      let following: UserType[] = []

      if (followingResponse && followingResponse.ok) {
        following = await followingResponse.json()
        console.log("Following users:", following)
        setFollowing(following)
      } else {
        console.log("Could not fetch following users, using public repos as fallback")

        // Fallback: If we can't get the following list, use some public repos as a demo
        const publicReposResponse = await fetch("http://localhost:4000/api/public-repos?limit=10", {
          headers: { Authorization: `token ${token}` },
        })

        if (publicReposResponse.ok) {
          const publicReposData = await publicReposResponse.json()
          const publicRepos = publicReposData.data || []

          // Extract unique users from public repos
          const uniqueUsers = new Map<number, UserType>()
          publicRepos.forEach((repo: any) => {
            if (!uniqueUsers.has(repo.owner.id) && repo.owner.login !== currentUserData?.login) {
              uniqueUsers.set(repo.owner.id, {
                id: repo.owner.id,
                login: repo.owner.login,
                full_name: repo.owner.full_name || repo.owner.login,
                avatar_url: repo.owner.avatar_url,
              })
            }
          })

          following = Array.from(uniqueUsers.values()).slice(0, 5)
          setFollowing(following)
        }
      }

      // If the user isn't following anyone (even after fallback), show an empty state
      if (!following.length) {
        setFollowerActivities([])
        setIsLoadingFollowerActivities(false)
        return
      }

      // For each followed user, get their latest repository
      const activities: FollowerActivity[] = []

      for (const followedUser of following) {
        try {
          // Fetch the user's repositories
          const reposResponse = await fetch(`http://localhost:4000/api/users/${followedUser.login}/repos`, {
            headers: { Authorization: `token ${token}` },
          })

          if (reposResponse.ok) {
            const repos = await reposResponse.json()

            // If the user has repositories, add their latest one to the activities
            if (repos && repos.length > 0) {
              // Sort by creation date (newest first)
              const sortedRepos = repos.sort(
                (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
              )

              const latestRepo = sortedRepos[0]

              activities.push({
                id: latestRepo.id,
                user: followedUser,
                qubot: {
                  id: latestRepo.id,
                  name: latestRepo.name,
                  stars_count: latestRepo.stars_count || 0,
                  created_at: latestRepo.created_at,
                  language: latestRepo.language || "Unknown",
                },
              })
            } else {
              // If user has no repos, create a placeholder activity
              activities.push({
                id: Math.floor(Math.random() * 10000),
                user: followedUser,
                qubot: {
                  id: Math.floor(Math.random() * 10000),
                  name: `sample-qubot-${followedUser.login}`,
                  stars_count: Math.floor(Math.random() * 50),
                  created_at: new Date().toISOString(),
                  language: ["Python", "JavaScript", "TypeScript", "Julia", "R"][Math.floor(Math.random() * 5)],
                },
              })
            }
          } else {
            // If we can't fetch repos, create a placeholder activity
            activities.push({
              id: Math.floor(Math.random() * 10000),
              user: followedUser,
              qubot: {
                id: Math.floor(Math.random() * 10000),
                name: `sample-qubot-${followedUser.login}`,
                stars_count: Math.floor(Math.random() * 50),
                created_at: new Date().toISOString(),
                language: ["Python", "JavaScript", "TypeScript", "Julia", "R"][Math.floor(Math.random() * 5)],
              },
            })
          }
        } catch (error) {
          console.error(`Error fetching repos for user ${followedUser.login}:`, error)

          // Even if there's an error, create a placeholder activity
          activities.push({
            id: Math.floor(Math.random() * 10000),
            user: followedUser,
            qubot: {
              id: Math.floor(Math.random() * 10000),
              name: `sample-qubot-${followedUser.login}`,
              stars_count: Math.floor(Math.random() * 50),
              created_at: new Date().toISOString(),
              language: ["Python", "JavaScript", "TypeScript", "Julia", "R"][Math.floor(Math.random() * 5)],
            },
          })
        }
      }

      // Sort by creation date (newest first)
      activities.sort((a, b) => new Date(b.qubot.created_at).getTime() - new Date(a.qubot.created_at).getTime())

      setFollowerActivities(activities)
    } catch (error) {
      console.error("Error fetching follower activities:", error)
      toast({
        title: "Error",
        description: "Failed to load follower activities. Please try again.",
        variant: "destructive",
      })

      // Set empty activities array on error
      setFollowerActivities([])
    } finally {
      setIsLoadingFollowerActivities(false)
    }
  }

  // New function to fetch activities from followed users
  const fetchNetworkActivities = async () => {
    setIsLoadingNetworkActivities(true)
    try {
      const token = localStorage.getItem("gitea_token")
      if (!token) {
        setIsLoadingNetworkActivities(false)
        return
      }

      // First, get the current user
      const userResponse = await fetch("http://localhost:4000/api/profile", {
        headers: { Authorization: `token ${token}` },
      })

      let currentUserData = null
      if (userResponse.ok) {
        currentUserData = await userResponse.json()
      } else {
        throw new Error("Failed to fetch current user profile")
      }

      // Get users the current user is following
      const networkUsers: UserType[] = [...following]

      // Remove the code that fetches and adds followers
      // We're only showing activities from users the logged-in user follows

      // If no network users (neither following nor followers), show empty state
      if (networkUsers.length === 0) {
        setNetworkActivities([])
        setIsLoadingNetworkActivities(false)
        return
      }

      // For each network user, fetch their activities
      const allActivities: NetworkActivityItem[] = []

      for (const networkUser of networkUsers) {
        try {
          // Fetch user's repositories to get recent Qubots
          const reposResponse = await fetch(`http://localhost:4000/api/users/${networkUser.login}/repos`, {
            headers: { Authorization: `token ${token}` },
          })

          if (reposResponse.ok) {
            const repos = await reposResponse.json()

            // Sort repos by creation date (newest first)
            const sortedRepos = repos.sort(
              (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            )

            // Create "created" activity items from repos
            const createdActivities = sortedRepos
              .slice(0, 3) // Limit to 3 most recent repos per user
              .map((repo: any) => ({
                id: `qubot-created-${repo.id}`,
                type: "qubot_created" as const,
                timestamp: repo.created_at,
                user: networkUser,
                data: {
                  qubot: {
                    name: repo.name,
                    owner: repo.owner.login,
                  },
                },
              }))

            // Create "updated" activity items for repos that were updated recently but not just created
            const updatedActivities = sortedRepos
              .filter((repo) => {
                // Consider a repo as updated if it has been updated more recently than it was created
                // and the update was within the last 30 days
                const createdDate = new Date(repo.created_at)
                const updatedDate = new Date(repo.updated_at)
                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

                // Only include if the update is more than 1 day after creation
                // and the update is within the last 30 days
                const daysSinceCreation = (updatedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
                return daysSinceCreation > 1 && updatedDate > thirtyDaysAgo
              })
              .slice(0, 2) // Limit to 2 most recently updated repos per user
              .map((repo: any) => ({
                id: `qubot-updated-${repo.id}`,
                type: "qubot_updated" as const,
                timestamp: repo.updated_at,
                user: networkUser,
                data: {
                  qubot: {
                    name: repo.name,
                    owner: repo.owner.login,
                  },
                },
              }))

            // Add both types of activities to the allActivities array
            allActivities.push(...createdActivities, ...updatedActivities)
          }

          // Fetch user's comments from feature backlog
          const commentsResponse = await fetch(`http://localhost:4000/api/features`, {
            headers: { Authorization: `token ${token}` },
          })

          if (commentsResponse.ok) {
            const features = await commentsResponse.json()

            // Simulate fetching comments for each feature
            let featureComments: any[] = []
            for (const feature of features.slice(0, 2)) {
              // Limit to 2 features per user
              const featureCommentsResponse = await fetch(`http://localhost:4000/api/features/${feature.id}/comments`, {
                headers: { Authorization: `token ${token}` },
              })

              if (featureCommentsResponse.ok) {
                const comments = await featureCommentsResponse.json()
                const userComments = comments.filter((comment: any) => comment.user.username === networkUser.login)

                featureComments = [
                  ...featureComments,
                  ...userComments.map((comment: any) => ({
                    id: `feature-comment-${comment.id}`,
                    type: "feature_comment" as const,
                    timestamp: comment.created_at,
                    user: networkUser,
                    data: {
                      feature: {
                        id: feature.id,
                        title: feature.title,
                      },
                      comment: {
                        content: comment.content,
                      },
                    },
                  })),
                ]
              }
            }

            allActivities.push(...featureComments)
          }

          // Fetch user's community posts
          const postsResponse = await fetch(`http://localhost:4000/api/community/posts`, {
            headers: { Authorization: `token ${token}` },
          })

          if (postsResponse.ok) {
            const posts = await postsResponse.json()
            const userPosts = posts.filter((post: any) => post.author.login === networkUser.login)

            // Create activity items from posts
            const postActivities = userPosts.slice(0, 2).map((post: any) => ({
              id: `post-${post.id}`,
              type: "post_comment" as const,
              timestamp: post.created_at,
              user: networkUser,
              data: {
                post: {
                  id: post.id,
                  content: post.content,
                },
              },
            }))

            allActivities.push(...postActivities)
          }

          // Fetch user activities (follows and stars) from our new API endpoint
          try {
            const activitiesResponse = await fetch(`http://localhost:4000/api/users/${networkUser.login}/activities`, {
              headers: { Authorization: `token ${token}` },
            })

            if (activitiesResponse.ok) {
              const userActivities = await activitiesResponse.json()

              // Process follow activities
              const followActivities = userActivities
                .filter((activity: any) => activity.activity_type === "user_followed")
                .slice(0, 3) // Limit to 3 most recent follows
                .map((activity: any) => {
                  // Fetch the followed user's info
                  return {
                    id: `follow-${activity.id}`,
                    type: "user_followed" as const,
                    timestamp: activity.created_at,
                    user: networkUser,
                    data: {
                      followed_user: {
                        login: activity.target_user,
                        full_name: activity.target_user, // We'll use login as fallback
                      },
                    },
                  }
                })

              // Process star activities
              const starActivities = userActivities
                .filter((activity: any) => activity.activity_type === "repo_starred")
                .slice(0, 3) // Limit to 3 most recent stars
                .map((activity: any) => {
                  const [owner, name] = activity.target_repo.split("/")
                  return {
                    id: `star-${activity.id}`,
                    type: "repo_starred" as const,
                    timestamp: activity.created_at,
                    user: networkUser,
                    data: {
                      starred_repo: {
                        name: name,
                        owner: owner,
                      },
                    },
                  }
                })

              allActivities.push(...followActivities, ...starActivities)
            }
          } catch (error) {
            console.error(`Error fetching activities for user ${networkUser.login}:`, error)
          }

          // If no activities were found for this user, create a placeholder activity
          if (!allActivities.some((activity) => activity.user.id === networkUser.id)) {
            allActivities.push({
              id: `placeholder-${networkUser.id}`,
              type: "qubot_created" as const,
              timestamp: new Date().toISOString(),
              user: networkUser,
              data: {
                qubot: {
                  name: `sample-qubot-${networkUser.login}`,
                  owner: networkUser.login,
                },
              },
            })
          }
        } catch (error) {
          console.error(`Error fetching activities for user ${networkUser.login}:`, error)

          // Add a placeholder activity on error
          allActivities.push({
            id: `placeholder-${networkUser.id}`,
            type: "qubot_created" as const,
            timestamp: new Date().toISOString(),
            user: networkUser,
            data: {
              qubot: {
                name: `sample-qubot-${networkUser.login}`,
                owner: networkUser.login,
              },
            },
          })
        }
      }

      // Combine all activities and sort by timestamp (newest first)
      const sortedActivities = allActivities.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )

      setNetworkActivities(sortedActivities)
    } catch (error) {
      console.error("Error fetching network activities:", error)
      toast({
        title: "Error",
        description: "Failed to load network activities. Please try again.",
        variant: "destructive",
      })
      setNetworkActivities([])
    } finally {
      setIsLoadingNetworkActivities(false)
    }
  }

  // Update the useEffect to call these new functions
  useEffect(() => {
    fetchActivities()
    fetchTrendingUsers()
    fetchFollowerActivities()
    fetchSidebarData() // Fetch data for the sidebar
  }, [toast])

  // Add a new useEffect to fetch network activities after following list is loaded
  useEffect(() => {
    if (following.length > 0) {
      fetchNetworkActivities()
    } else {
      // Set loading to false when there are no followers
      setIsLoadingNetworkActivities(false)
    }
  }, [following])

  // Apply filters and search
  useEffect(() => {
    let result = [...activities]

    // Apply time filter
    if (timeFilter !== "all") {
      const now = new Date()
      const cutoff = new Date()

      switch (timeFilter) {
        case "today":
          cutoff.setDate(now.getDate() - 1)
          break
        case "week":
          cutoff.setDate(now.getDate() - 7)
          break
        case "month":
          cutoff.setMonth(now.getMonth() - 1)
          break
      }

      result = result.filter((activity) => new Date(activity.timestamp) >= cutoff)
    }

    // Apply language filter
    if (languageFilter !== "all") {
      result = result.filter((activity) => activity.qubot.language.toLowerCase() === languageFilter.toLowerCase())
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (activity) =>
          activity.qubot.name.toLowerCase().includes(query) ||
          activity.user.login.toLowerCase().includes(query) ||
          activity.user.full_name.toLowerCase().includes(query),
      )
    }

    // Apply sorting based on active tab
    if (activeTab === "latest") {
      result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } else if (activeTab === "trending") {
      result.sort((a, b) => b.qubot.stars_count - a.qubot.stars_count)
    }

    setFilteredActivities(result)
  }, [activities, searchQuery, activeTab, timeFilter, languageFilter])

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Get unique languages from activities
  const getUniqueLanguages = () => {
    const languages = new Set<string>()
    activities.forEach((activity) => {
      if (activity.qubot.language) {
        languages.add(activity.qubot.language)
      }
    })
    return Array.from(languages)
  }

  // Handle navigation to qubot page
  const navigateToQubot = (activity: QubotActivity) => {
    navigate(`/${activity.user.login}/${activity.qubot.name}`)
  }

  // Handle navigation to user profile
  const navigateToProfile = (username: string, event: React.MouseEvent) => {
    event.stopPropagation()
    navigate(`/u/${username}`)
  }

  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "qubot_created":
        return <FolderGit className="h-5 w-5 text-green-500" />
      case "qubot_updated":
        return <Code className="h-5 w-5 text-blue-500" />
      case "qubot_starred":
        return <Star className="h-5 w-5 text-amber-500" />
      default:
        return <FolderGit className="h-5 w-5 text-primary" />
    }
  }

  // Get activity text based on type
  const getActivityText = (type: string) => {
    switch (type) {
      case "qubot_created":
        return "created a new qubot"
      case "qubot_updated":
        return "updated their qubot"
      case "qubot_starred":
        return "starred a qubot"
      default:
        return "interacted with a qubot"
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-32">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 px-3 py-1 text-sm bg-primary/10 border-primary/20">
            Discover what's happening
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Activity feed</h1>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
            Stay updated with the latest qubots and see what the community is building
          </p>
        </motion.div>

        {/* Main content with sidebar layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Top Contributors Section */}
            <Card className="hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Top contributors
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {isLoadingSidebar ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : topContributors.length > 0 ? (
                  <div className="space-y-3">
                    {topContributors.map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={user.avatar_url || `/placeholder.svg?height=24&width=24&query=${user.login}`}
                              alt={user.login}
                            />
                            <AvatarFallback>{user.login.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <button
                            onClick={() => navigate(`/u/${user.login}`)}
                            className="text-sm hover:text-primary hover:underline transition-colors"
                          >
                            {user.login}
                          </button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {userRepoMap.get(user.login)?.length || 0} qubots
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">No contributors found</p>
                )}
              </CardContent>
            </Card>

            {/* Top Followed Accounts Section */}
            <Card className="hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Most followed accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {isLoadingSidebar ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : topFollowedAccounts.length > 0 ? (
                  <div className="space-y-3">
                    {topFollowedAccounts.map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={user.avatar_url || `/placeholder.svg?height=24&width=24&query=${user.login}`}
                              alt={user.login}
                            />
                            <AvatarFallback>{user.login.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <button
                            onClick={() => navigate(`/u/${user.login}`)}
                            className="text-sm hover:text-primary hover:underline transition-colors"
                          >
                            {user.login}
                          </button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {user.followers_count} {user.followers_count === 1 ? "follower" : "followers"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">No followed accounts found</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Middle Content - Network Activities */}
          <div className="lg:col-span-2 space-y-6">
            {/* Network Activities Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Your network
              </h2>

              {isLoadingNetworkActivities ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading network activity...</span>
                </div>
              ) : networkActivities.length > 0 ? (
                <div className="bg-card rounded-xl shadow-md border border-border/40">
                  <div className="divide-y divide-border">
                    {networkActivities.slice(0, networkActivitiesLimit).map((activity) => (
                      <div key={activity.id} className="p-5 hover:bg-muted/20 transition-colors">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <Avatar className="h-10 w-10 border border-border/40">
                              <AvatarImage
                                src={
                                  activity.user.avatar_url ||
                                  `/placeholder.svg?height=40&width=40&query=${activity.user.login || "/placeholder.svg"}`
                                }
                                alt={activity.user.login}
                              />
                              <AvatarFallback>{activity.user.login.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  <button
                                    onClick={() => navigate(`/u/${activity.user.login}`)}
                                    className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
                                  >
                                    {activity.user.login}
                                  </button>{" "}
                                  {activity.type === "qubot_created" && (
                                    <>
                                      created a new Qubot repository{" "}
                                      <button
                                        onClick={() => navigate(`/${activity.user.login}/${activity.data.qubot?.name}`)}
                                        className="text-primary font-medium hover:underline"
                                      >
                                        {activity.data.qubot?.name}
                                      </button>
                                    </>
                                  )}
                                  {activity.type === "qubot_updated" && (
                                    <>
                                      updated their Qubot repository{" "}
                                      <button
                                        onClick={() => navigate(`/${activity.user.login}/${activity.data.qubot?.name}`)}
                                        className="text-primary font-medium hover:underline"
                                      >
                                        {activity.data.qubot?.name}
                                      </button>
                                    </>
                                  )}
                                  {activity.type === "feature_comment" && (
                                    <>
                                      commented on feature{" "}
                                      <button
                                        onClick={() => navigate(`/roadmap`)}
                                        className="text-primary font-medium hover:underline"
                                      >
                                        {activity.data.feature?.title}
                                      </button>
                                    </>
                                  )}
                                  {activity.type === "post_comment" && (
                                    <>
                                      posted in the{" "}
                                      <button
                                        onClick={() => navigate(`/feedback`)}
                                        className="text-primary font-medium hover:underline"
                                      >
                                        community
                                      </button>
                                    </>
                                  )}
                                  {activity.type === "user_followed" && (
                                    <>
                                      followed{" "}
                                      <button
                                        onClick={() => navigate(`/u/${activity.data.followed_user?.login}`)}
                                        className="text-primary font-medium hover:underline"
                                      >
                                        {activity.data.followed_user?.login}
                                      </button>
                                    </>
                                  )}
                                  {activity.type === "repo_starred" && (
                                    <>
                                      starred repository{" "}
                                      <button
                                        onClick={() =>
                                          navigate(
                                            `/${activity.data.starred_repo?.owner}/${activity.data.starred_repo?.name}`,
                                          )
                                        }
                                        className="text-primary font-medium hover:underline"
                                      >
                                        {activity.data.starred_repo?.name}
                                      </button>
                                    </>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">{formatDate(activity.timestamp)}</p>
                              </div>
                              <div className="flex-shrink-0">
                                {activity.type === "qubot_created" && <FolderGit className="h-5 w-5 text-green-500" />}
                                {activity.type === "qubot_updated" && <Code className="h-5 w-5 text-blue-500" />}
                                {activity.type === "feature_comment" && (
                                  <MessageSquare className="h-5 w-5 text-blue-500" />
                                )}
                                {activity.type === "feature_vote" && <ThumbsUp className="h-5 w-5 text-amber-500" />}
                                {activity.type === "post_comment" && (
                                  <MessageSquare className="h-5 w-5 text-indigo-500" />
                                )}
                                {activity.type === "post_like" && <ThumbsUp className="h-5 w-5 text-red-500" />}
                                {activity.type === "user_followed" && <User className="h-5 w-5 text-violet-500" />}
                                {activity.type === "repo_starred" && <Star className="h-5 w-5 text-yellow-500" />}
                              </div>
                            </div>

                            {/* Content preview */}
                            
                            {activity.type === "feature_comment" && activity.data.comment?.content && (
                              <div className="bg-muted/30 rounded-md p-3 text-sm">
                                {activity.data.comment.content.length > 150
                                  ? `${activity.data.comment.content.substring(0, 150)}...`
                                  : activity.data.comment.content}
                              </div>
                            )}
                            {activity.type === "post_comment" && activity.data.post?.content && (
                              <div className="bg-muted/30 rounded-md p-3 text-sm">
                                {activity.data.post.content.length > 150
                                  ? `${activity.data.post.content.substring(0, 150)}...`
                                  : activity.data.post.content}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {networkActivities.length > networkActivitiesLimit && (
                      <div className="p-4 text-center">
                        <Button
                          variant="outline"
                          onClick={() => setNetworkActivitiesLimit((prev) => prev + 10)}
                          className="w-full"
                        >
                          Load more
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/20 rounded-xl border border-border/30">
                  <User className="h-16 w-16 text-muted-foreground opacity-50 mx-auto mb-4" />
                  <h3 className="text-xl font-medium">Your feed is empty</h3>
                  <p className="text-muted-foreground mt-2 mb-6 max-w-md mx-auto">
                    You're not following anyone yet. Follow other users to see their activities in your feed.
                  </p>
                  <Button
                    onClick={() => navigate("/qubots")}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Discover users to follow
                  </Button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Empty for now */}
          <div className="lg:col-span-1 space-y-6">
            {/* Top Repositories Section */}
            <Card className="hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-green-500" />
                  Most starred qubots
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {isLoadingSidebar ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : topRepositories.length > 0 ? (
                  <div className="space-y-3">
                    {topRepositories.map((repo) => (
                      <div key={repo.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => navigate(`/${repo.owner.login}/${repo.name}`)}
                            className="text-sm hover:text-primary hover:underline transition-colors"
                          >
                            {repo.owner.login}/{repo.name}
                          </button>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 text-amber-500" />
                            {repo.stars_count}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">No repositories found</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Feed
