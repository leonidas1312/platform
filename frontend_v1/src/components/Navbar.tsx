"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Plus,
  Bell,
  Github,
  BookOpen,
  Users,
  FileCode,
  ChevronDown,
  Star,
  Bookmark,
  FolderGit,
  Loader2,
} from "lucide-react"
import { ModeToggle } from "./ModeToggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

const licenseOptions = [
  { value: "", label: "None" },
  { value: "mit", label: "MIT License" },
  { value: "apache-2.0", label: "Apache License 2.0" },
  { value: "gpl-3.0", label: "GNU General Public License v3.0" },
  { value: "bsd-2-clause", label: "BSD 2-Clause License" },
  { value: "bsd-3-clause", label: "BSD 3-Clause License" },
  { value: "mpl-2.0", label: "Mozilla Public License 2.0" },
  { value: "lgpl-3.0", label: "GNU Lesser General Public License v3.0" },
  { value: "agpl-3.0", label: "GNU Affero General Public License v3.0" },
  { value: "unlicense", label: "The Unlicense" },
]

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const searchRef = useRef<HTMLDivElement>(null)

  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [notifications, setNotifications] = useState<any[]>([])
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true)

  // User state – if null, not logged in.
  const [user, setUser] = useState<any>(null)

  // "Create Repo" modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [repoName, setRepoName] = useState("")
  const [repoDescription, setRepoDescription] = useState("")
  const [license, setLicense] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [isCreatingRepo, setIsCreatingRepo] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchExpanded(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fetch user info if token exists.
  useEffect(() => {
    const token = localStorage.getItem("gitea_token")
    if (token) {
      fetch("http://localhost:4000/api/profile", {
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
          // Fetch mock notifications (in a real app, this would be a separate API call)
          setNotifications([
            { id: 1, title: "New follower", message: "User123 started following you", read: false },
            { id: 2, title: "Repository star", message: "Your repo was starred", read: true },
            { id: 3, title: "Pull request", message: "New PR in your repository", read: false },
          ])
        })
        .catch(() => {
          setUser(null)
        })
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("gitea_token")
    setUser(null)
    navigate("/auth")
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
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
        variant: "destructive",
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
          description: repoDescription, // This will be ignored by the API but we'll keep it for future use
          license: license, // Changed from license_template to license
          isPrivate: isPrivate, // Changed from private to isPrivate to match API
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
      navigate(`/${user.login}/${repoName}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create repository",
        variant: "destructive",
      })
    } finally {
      setIsCreatingRepo(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setIsSearchExpanded(false)
    }
  }

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
    setHasUnreadNotifications(false)
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/80 backdrop-blur-md border-b shadow-sm py-2" : "bg-background/0 py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center"
          >
            <Link to="/" className="flex items-center gap-2">
              <img src="/rastion1.svg" alt="Rastion Logo" className="h-10 w-auto" />
            </Link>
          </motion.div>

          {/* Desktop navigation */}
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden md:flex items-center gap-1"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 gap-1 px-3">
                  <FileCode className="w-4 h-4" />
                  Qubots
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => navigate("/qubot-optimizers")}>
                  <Star className="w-4 h-4 mr-2" />
                  Qubot optimizers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/qubot-problems")}>
                  <Bookmark className="w-4 h-4 mr-2" />
                  Qubot problems
                </DropdownMenuItem>
                
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              className={`h-9 gap-1 px-3 ${location.pathname === "/blogs" ? "bg-muted" : ""}`}
              onClick={() => navigate("/blogs")}
            >
              <BookOpen className="w-4 h-4" />
              Blogs
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`h-9 gap-1 px-3 ${location.pathname === "/community" ? "bg-muted" : ""}`}
              onClick={() => navigate("/community")}
            >
              <Users className="w-4 h-4" />
              Community
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`h-9 gap-1 px-3 ${location.pathname === "/docs" ? "bg-muted" : ""}`}
              onClick={() => navigate("/docs")}
            >
              <Github className="w-4 h-4" />
              Documentation
            </Button>
          </motion.nav>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-1 md:gap-2"
          >
            

            

            

            {/* User menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full overflow-hidden">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar_url} alt={user.login} />
                      <AvatarFallback>{user.login?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} alt={user.login} />
                      <AvatarFallback>{user.login?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.full_name || user.login}</span>
                      <span className="text-xs text-muted-foreground">@{user.login}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => navigate(`/u/${user.login}`)}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                      <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/u/${user.login}/settings`)}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                      <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="sm" className="hidden md:flex h-9 px-4" onClick={() => navigate("/auth")}>
                Log in
              </Button>
            )}

            <ModeToggle />

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-background border-t"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              <div className="flex flex-col space-y-1">
                <Button
                  variant="ghost"
                  className="justify-start h-10"
                  onClick={() => {
                    navigate("/qubot-optimizers")
                    setIsMobileMenuOpen(false)
                  }}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Qubot optimizers
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start h-10"
                  onClick={() => {
                    navigate("/qubot-problems")
                    setIsMobileMenuOpen(false)
                  }}
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  Qubot problems
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start h-10"
                  onClick={() => {
                    navigate("/blogs")
                    setIsMobileMenuOpen(false)
                  }}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Blogs
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start h-10"
                  onClick={() => {
                    navigate("/community")
                    setIsMobileMenuOpen(false)
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Community
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start h-10"
                  onClick={() => {
                    navigate("/docs")
                    setIsMobileMenuOpen(false)
                  }}
                >
                  <Github className="mr-2 h-4 w-4" />
                  Documentation
                </Button>
              </div>

              <Separator />

              {!user && (
                <Button
                  className="w-full"
                  onClick={() => {
                    navigate("/auth")
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Log in
                </Button>
              )}

              {user && (
                <div className="flex items-center gap-3 py-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url} alt={user.login} />
                    <AvatarFallback>{user.login?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.full_name || user.login}</p>
                    <p className="text-sm text-muted-foreground">@{user.login}</p>
                  </div>
                </div>
              )}
              {user && (
                <Button
                  variant="ghost"
                  className="justify-start h-10"
                  onClick={() => {
                    navigate(`/u/${user.login}`)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Repository Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create a new Qubot repository</DialogTitle>
            <DialogDescription>
              A Qubot repository contains your optimization problem or solution, including all project files and
              revision history.
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
                placeholder="Short description of your repository"
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
                  {licenseOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                A license tells others what they can and can't do with your code.
              </p>
            </div>

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
    </header>
  )
}

export default Navbar

