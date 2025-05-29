import React, { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  User,
  Settings,
  LogOut,
  Home,
  FolderGit,
  MessageSquare,
  Activity,
  GitCompare,
  BookOpen,
  Play,
} from "lucide-react"
import {
  OptimizationIcon,
  CommunityIcon,
  ResourcesIcon,
  BenchmarkIcon,
  PlaygroundIcon,
} from "@/components/ui/custom-icons"
import { RastionLogo } from "@/components/ui/RastionLogo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/simple-sidebar"
import { cn } from "@/lib/utils"

const API = import.meta.env.VITE_API_BASE

interface User {
  id: number
  login: string
  full_name?: string
  avatar_url?: string
  email?: string
}

export function SimpleVerticalNavbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user data on component mount
  useEffect(() => {
    const token = localStorage.getItem("gitea_token")
    if (token) {
      fetch(`${API}/profile`, {
        headers: { Authorization: `token ${token}` },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch user")
          }
          return res.json()
        })
        .then((data) => {
          setUser(data)
        })
        .catch(() => {
          setUser(null)
          localStorage.removeItem("gitea_token")
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/"
    }
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    localStorage.removeItem("gitea_token")
    setUser(null)
    navigate("/")
  }

  return (
    <Sidebar className="border-r shadow-lg sidebar-simple">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-center px-2 py-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative transition-all duration-300 p-1.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-border/50 shadow-sm group-hover:shadow-md">
              <RastionLogo className="h-6 w-6 text-primary transition-all duration-300 group-hover:scale-110" />
            </div>
            <div className="flex flex-col min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="font-bold text-lg leading-none bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Rastion
              </span>
              <span className="text-xs text-muted-foreground leading-none mt-0.5">
                Optimization Platform
              </span>
            </div>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/")}
                  tooltip="Home"
                  className="h-10 px-3 rounded-lg"
                >
                  <Link to="/">
                    <Home className="w-5 h-5" />
                    <span className="font-medium">Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/qubots") || isActive("/public-repos")}
                  tooltip="Repositories"
                  className="h-10 px-3 rounded-lg"
                >
                  <Link to="/qubots">
                    <FolderGit className="w-5 h-5" />
                    <span className="font-medium">Repositories</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {user && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/qubots-playground")}
                    tooltip="Playground"
                    className="h-10 px-3 rounded-lg"
                  >
                    <Link to="/qubots-playground">
                      <PlaygroundIcon className="w-5 h-5" />
                      <span className="font-medium">Playground</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {user && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/optimization-workflows")}
                    tooltip="Workflows"
                    className="h-10 px-3 rounded-lg"
                  >
                    <Link to="/optimization-workflows">
                      <GitCompare className="w-5 h-5" />
                      <span className="font-medium">Workflows</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {user && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/benchmark")}
                    tooltip="Benchmark"
                    className="h-10 px-3 rounded-lg"
                  >
                    <Link to="/benchmark">
                      <BenchmarkIcon className="w-5 h-5" />
                      <span className="font-medium">Benchmark</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {user && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/feed")}
                    tooltip="Activity Feed"
                    className="h-10 px-3 rounded-lg"
                  >
                    <Link to="/feed">
                      <Activity className="w-5 h-5" />
                      <span className="font-medium">Activity</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => window.open("https://docs.rastion.com", "_blank")}
                  tooltip="Documentation"
                  className="h-10 px-3 rounded-lg cursor-pointer"
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium">Documentation</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu className="space-y-2">
          {user ? (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    tooltip={`${user.login} - Click for menu`}
                    className="h-12 px-3 rounded-xl hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Avatar className="h-9 w-9 rounded-xl border-2 border-border/50 shadow-sm">
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.login} />
                      <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold">
                        {user.login?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-sm font-medium truncate">{user.login}</span>
                      <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  align="end"
                  forceMount
                >
                  <DropdownMenuItem asChild>
                    <Link to={`/profile/${user.login}`} className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Sign in to access all features"
                className="h-10 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link to="/auth">
                  <User className="w-5 h-5" />
                  <span className="font-medium">Sign In</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
