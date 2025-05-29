import React, { useState, useEffect, useRef, useCallback } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  User,
  Settings,
  LogOut,
  Rocket,
  FolderGit,
  MessageSquare,
  Activity,
  AlertTriangle,
  GitCompare,
  BookOpen,
  ExternalLink,
  Play,
  GitFork,
  Home,
  ChevronDown,
  Plus,
  Loader2,
} from "lucide-react"
import {
  OptimizationIcon,
  CommunityIcon,
  ResourcesIcon,
  AlgorithmIcon,
  BenchmarkIcon,
  PlaygroundIcon,
} from "@/components/ui/custom-icons"
import { RastionLogo } from "@/components/ui/RastionLogo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { ThemeToggle, ThemeToggleMenuItem } from "@/components/ThemeToggle"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const API = import.meta.env.VITE_API_BASE

interface User {
  id: number
  login: string
  full_name?: string
  avatar_url?: string
  email?: string
}

// Helper component for collapsible menu items that work in both expanded and collapsed states
function CollapsibleMenuGroup({
  icon,
  label,
  tooltip,
  children,
  defaultOpen = false,
  isActive = false
}: {
  icon: React.ReactNode
  label: string
  tooltip: string
  children: React.ReactNode
  defaultOpen?: boolean
  isActive?: boolean
}) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  if (isCollapsed) {
    // When collapsed, use Popover for dropdown behavior
    return (
      <SidebarMenuItem>
        <Popover>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              tooltip={tooltip}
              isActive={isActive}
              className="h-10 px-3 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
            >
              {icon}
              <span className="font-medium">{label}</span>
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            className="w-56 p-1"
            sideOffset={8}
          >
            <div className="space-y-1">
              {React.Children.map(children, (child) => {
                if (React.isValidElement(child) && child.type === SidebarMenuSubItem) {
                  const subButton = child.props.children
                  if (React.isValidElement(subButton)) {
                    const buttonProps = subButton.props as any

                    if (buttonProps.asChild) {
                      const linkElement = buttonProps.children
                      if (React.isValidElement(linkElement)) {
                        return (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="w-full justify-start h-9 px-3 rounded-md hover:bg-sidebar-accent/50"
                          >
                            {linkElement}
                          </Button>
                        )
                      }
                    } else {
                      // Handle non-asChild buttons (like Documentation)
                      return (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={buttonProps.onClick}
                          className="w-full justify-start h-9 px-3 rounded-md hover:bg-sidebar-accent/50"
                        >
                          {buttonProps.children}
                        </Button>
                      )
                    }
                  }
                }
                return child
              })}
            </div>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    )
  }

  // When expanded, use normal Collapsible behavior
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={tooltip}
            isActive={isActive}
            className="h-10 px-3 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
          >
            {icon}
            <span className="font-medium">{label}</span>
            <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="transition-all duration-200 ease-in-out">
          <SidebarMenuSub className="ml-4 mt-1 space-y-1">
            {children}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function VerticalNavbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { state, open, setOpen, isMobile } = useSidebar()

  // Force sidebar to be collapsed by default and handle hover expansion
  useEffect(() => {
    if (!isMobile) {
      setOpen(false)
    }
  }, [isMobile, setOpen])

  // Handle hover expansion properly with improved debouncing
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isHoveringRef = useRef(false)

  const handleMouseEnter = useCallback(() => {
    if (!isMobile) {
      isHoveringRef.current = true
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
      // Small delay to prevent accidental triggers
      hoverTimeoutRef.current = setTimeout(() => {
        if (isHoveringRef.current && state === "collapsed") {
          setOpen(true)
        }
      }, 100)
    }
  }, [isMobile, state, setOpen])

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) {
      isHoveringRef.current = false
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
      // Longer delay to allow moving between sidebar elements
      hoverTimeoutRef.current = setTimeout(() => {
        if (!isHoveringRef.current && state === "expanded") {
          setOpen(false)
        }
      }, 300)
    }
  }, [isMobile, state, setOpen])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])
  const [showCreateRepoDialog, setShowCreateRepoDialog] = useState(false)
  const [repoName, setRepoName] = useState("")
  const [repoDescription, setRepoDescription] = useState("")
  const [license, setLicense] = useState("none")
  const [isCreatingRepo, setIsCreatingRepo] = useState(false)

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

  const handleLogout = () => {
    localStorage.removeItem("gitea_token")
    setUser(null)
    navigate("/")
  }

  const licenses = [
    { key: "mit", name: "MIT License" },
    { key: "apache-2.0", name: "Apache License 2.0" },
    { key: "gpl-3.0", name: "GNU General Public License v3.0" },
    { key: "bsd-2-clause", name: "BSD 2-Clause \"Simplified\" License" },
    { key: "bsd-3-clause", name: "BSD 3-Clause \"New\" or \"Revised\" License" },
    { key: "unlicense", name: "The Unlicense" },
  ]

  const handleCreateRepo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoName.trim()) return

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
          license: license === "none" ? "" : license,
        }),
      })

      if (response.ok) {
        const newRepo = await response.json()
        toast({
          title: "Repository created",
          description: `Successfully created ${repoName}`,
        })
        setShowCreateRepoDialog(false)
        setRepoName("")
        setRepoDescription("")
        setLicense("none")
        navigate(`/${user?.login}/${repoName}`)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to create repository",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating repository:", error)
      toast({
        title: "Error",
        description: "Failed to create repository",
        variant: "destructive",
      })
    } finally {
      setIsCreatingRepo(false)
    }
  }

  const isActive = (path: string) => location.pathname === path
  const isActiveGroup = (paths: string[]) => paths.some(path => location.pathname.includes(path))

  return (
    <>
      <Sidebar
        variant="inset"
        collapsible="icon"
        className="border-r shadow-soft transition-all duration-300 ease-in-out hover:shadow-medium"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between px-2 py-3">
          <Link to="/" className="flex items-center gap-3 group min-w-0 group-data-[collapsible=icon]:justify-center">
            <div className="relative transition-all duration-300 p-1.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-border/50 shadow-soft group-hover:shadow-medium group-data-[collapsible=icon]:p-2">
              <RastionLogo
                className="h-8 w-auto group-hover:scale-110 transition-all duration-300 group-data-[collapsible=icon]:h-6"
                height={32}
                width={32}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
            </div>
            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="font-bold text-lg text-foreground truncate">Rastion</span>
              <span className="text-xs text-muted-foreground">Optimization Platform</span>
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
                  className="h-10 px-3 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
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
                  className="h-10 px-3 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                >
                  <Link to="/qubots">
                    <FolderGit className="w-5 h-5" />
                    <span className="font-medium">Repositories</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Optimization Tools Group - only visible to logged in users */}
              {user && (
                <CollapsibleMenuGroup
                  icon={<OptimizationIcon className="w-5 h-5" />}
                  label="Optimization"
                  tooltip="Optimization Tools"
                  defaultOpen={isActiveGroup(["/qubots", "/benchmark", "/optimization-playground", "/qubots-playground", "/optimization-workflows"])}
                  isActive={isActiveGroup(["/qubots", "/benchmark", "/optimization-playground", "/qubots-playground", "/optimization-workflows"])}
                >
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isActive("/qubots-playground")}
                      className="h-9 px-3 rounded-md hover:bg-sidebar-accent/50 transition-all duration-200"
                    >
                      <Link to="/qubots-playground">
                        <PlaygroundIcon className="w-4 h-4" />
                        <span className="font-medium">Playground</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isActive("/optimization-workflows")}
                      className="h-9 px-3 rounded-md hover:bg-sidebar-accent/50 transition-all duration-200"
                    >
                      <Link to="/optimization-workflows">
                        <GitCompare className="w-4 h-4" />
                        <span className="font-medium">Workflows</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isActive("/benchmark")}
                      className="h-9 px-3 rounded-md hover:bg-sidebar-accent/50 transition-all duration-200"
                    >
                      <Link to="/benchmark">
                        <BenchmarkIcon className="w-4 h-4" />
                        <span className="font-medium">Benchmark</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </CollapsibleMenuGroup>
              )}

              {/* Community Group - only visible to logged in users */}
              {user && (
                <CollapsibleMenuGroup
                  icon={<CommunityIcon className="w-5 h-5" />}
                  label="Community"
                  tooltip="Community"
                  defaultOpen={isActiveGroup(["/feedback", "/roadmap", "/feed"])}
                  isActive={isActiveGroup(["/feedback", "/roadmap", "/feed"])}
                >
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isActive("/feed")}
                      className="h-9 px-3 rounded-md hover:bg-sidebar-accent/50 transition-all duration-200"
                    >
                      <Link to="/feed">
                        <Activity className="w-4 h-4" />
                        <span className="font-medium">Activity Feed</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isActive("/feedback")}
                      className="h-9 px-3 rounded-md hover:bg-sidebar-accent/50 transition-all duration-200"
                    >
                      <Link to="/feedback">
                        <MessageSquare className="w-4 h-4" />
                        <span className="font-medium">Feedback</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isActive("/roadmap")}
                      className="h-9 px-3 rounded-md hover:bg-sidebar-accent/50 transition-all duration-200"
                    >
                      <Link to="/roadmap">
                        <Rocket className="w-4 h-4" />
                        <span className="font-medium">Roadmap</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </CollapsibleMenuGroup>
              )}

              {/* Resources Group */}
              <CollapsibleMenuGroup
                icon={<ResourcesIcon className="w-5 h-5" />}
                label="Resources"
                tooltip="Resources"
                defaultOpen={isActiveGroup(["/experimental-preview", "/docs"])}
                isActive={isActiveGroup(["/experimental-preview", "/docs"])}
              >
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    asChild
                    onClick={() => window.open("https://docs.rastion.com", "_blank")}
                    className="h-9 px-3 rounded-md hover:bg-sidebar-accent/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 cursor-pointer">
                      <BookOpen className="w-4 h-4" />
                      <span className="font-medium">Documentation</span>
                      <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
                    </div>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isActive("/experimental-preview")}
                    className="h-9 px-3 rounded-md hover:bg-sidebar-accent/50 transition-all duration-200"
                  >
                    <Link to="/experimental-preview">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">Experimental</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </CollapsibleMenuGroup>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu className="space-y-2">
          {/* User Menu */}
          {user ? (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    tooltip={`${user.login} - Click for menu`}
                    className="h-12 px-3 rounded-xl hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground shadow-soft hover:shadow-medium"
                  >
                    <Avatar className="h-9 w-9 rounded-xl border-2 border-border/50 shadow-soft">
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.login} />
                      <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-sm">
                        {user.login?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight min-w-0 group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-semibold text-foreground">{user.full_name || user.login}</span>
                      <span className="truncate text-xs text-muted-foreground">@{user.login}</span>
                    </div>
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]:rotate-180" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 glass rounded-xl shadow-strong border-border/50"
                  align="end"
                >
                  <div className="flex items-center justify-start gap-3 p-4">
                    <Avatar className="h-10 w-10 border-2 border-border/50">
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.login} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                        {user.login?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{user.full_name || user.login}</span>
                      <span className="text-xs text-muted-foreground">@{user.login}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border/50" />

                  <DropdownMenuGroup className="p-2">
                    <DropdownMenuItem
                      onClick={() => navigate(`/u/${user.login}`)}
                      className="rounded-lg p-3 hover:bg-secondary/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-secondary">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="font-medium">Profile</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowCreateRepoDialog(true)}
                      className="rounded-lg p-3 hover:bg-secondary/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-secondary">
                          <Plus className="h-4 w-4" />
                        </div>
                        <span className="font-medium">New repository</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate(`/u/${user.login}/settings`)}
                      className="rounded-lg p-3 hover:bg-secondary/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-secondary">
                          <Settings className="h-4 w-4" />
                        </div>
                        <span className="font-medium">Settings</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg p-0 hover:bg-secondary/50 transition-colors">
                      <ThemeToggleMenuItem />
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <div className="p-2">
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="rounded-lg p-3 hover:bg-secondary/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-secondary">
                          <LogOut className="h-4 w-4" />
                        </div>
                        <span className="font-medium">Log out</span>
                      </div>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Sign In"
                className="h-12 px-3 rounded-xl hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 shadow-soft hover:shadow-medium"
              >
                <Link to="/auth" className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-border/50 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="font-medium group-data-[collapsible=icon]:hidden">Sign In</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>

      {/* Sidebar Rail for hover expand */}
      <SidebarRail
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    </Sidebar>

    {/* Create Repository Dialog */}
    <Dialog open={showCreateRepoDialog} onOpenChange={setShowCreateRepoDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-primary/10">
              <FolderGit className="h-5 w-5 text-primary" />
            </div>
            Create a new Qubot repository
          </DialogTitle>

          <DialogDescription>
            A Qubot repository contains your python files for an optimization problem or algorithm.
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
              placeholder="myTSPqubot"
              required
            />
            <p className="text-xs text-muted-foreground">
              Great repository names are short, memorable and easy to understand.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="repo-description" className="text-sm font-medium">
              Description
            </Label>
            <Input
              id="repo-description"
              value={repoDescription}
              onChange={(e) => setRepoDescription(e.target.value)}
              placeholder="Short description of your qubot"
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
                {licenses.map((licenseOption) => (
                  <SelectItem key={licenseOption.key} value={licenseOption.key}>
                    {licenseOption.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              A license governs what others can and can't do with your code.
              <a
                href="https://choosealicense.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-1"
              >
                Not sure which one is right for your project?
              </a>
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateRepoDialog(false)}
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
    </>
  )
}
