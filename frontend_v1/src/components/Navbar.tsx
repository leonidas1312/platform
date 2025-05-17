"use client"

import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { User, Settings, LogOut, Rocket, FolderGit, MessageSquare, Activity, AlertTriangle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Boxes, Shell, BookOpenText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API = import.meta.env.VITE_API_BASE

const licenses = [
  { key: "mit", name: "MIT License" },
  { key: "apache-2.0", name: "Apache 2.0 License" },
  { key: "gpl-3.0", name: "GPL 3.0 License" },
  { key: "bsd-3-clause", name: "BSD 3-Clause License" },
]

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const searchRef = useRef<HTMLDivElement>(null)

  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])

  // Add this state variable in the Navbar component after the other state variables
  const [showCreateRepoDialog, setShowCreateRepoDialog] = useState(false)
  const [repoName, setRepoName] = useState("")
  const [repoDescription, setRepoDescription] = useState("")
  const [license, setLicense] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [isCreatingRepo, setIsCreatingRepo] = useState(false)

  // Add the licenses state and fetch function after the other state variables in the Navbar component
  // Add this after the line with `const [isCreatingRepo, setIsCreatingRepo] = useState(false)`

  const [licenses, setLicenses] = useState<Array<{ key: string; name: string; url: string }>>([])

  // Add this useEffect to fetch licenses when the dialog is opened
  useEffect(() => {
    if (showCreateRepoDialog) {
      fetchLicenses()
    }
  }, [showCreateRepoDialog])

  // Add this function to fetch licenses from the API
  const fetchLicenses = async () => {
    try {
      const response = await fetch(`${API}/licenses`)
      if (response.ok) {
        const licensesData = await response.json()
        setLicenses(licensesData)
      } else {
        console.error("Failed to fetch licenses")
        // Fallback to some common licenses if the API fails
        setLicenses([
          { key: "mit", name: "MIT License", url: "" },
          { key: "apache-2.0", name: "Apache License 2.0", url: "" },
          { key: "gpl-3.0", name: "GNU General Public License v3.0", url: "" },
          { key: "bsd-2-clause", name: "BSD 2-Clause License", url: "" },
          { key: "bsd-3-clause", name: "BSD 3-Clause License", url: "" },
        ])
      }
    } catch (error) {
      console.error("Error fetching licenses:", error)
      // Fallback to some common licenses if the API fails
      setLicenses([
        { key: "mit", name: "MIT License", url: "" },
        { key: "apache-2.0", name: "Apache License 2.0", url: "" },
        { key: "gpl-3.0", name: "GNU General Public License v3.0", url: "" },
        { key: "bsd-2-clause", name: "BSD 2-Clause License", url: "" },
        { key: "bsd-3-clause", name: "BSD 3-Clause License", url: "" },
      ])
    }
  }

  // User state – if null, not logged in.
  const [user, setUser] = useState<any>(null)

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
    navigate("/")
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    })
  }

  // Add this function before the return statement
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

      setShowCreateRepoDialog(false)

      // Reset form fields
      setRepoName("")
      setRepoDescription("")
      setLicense("")
      setIsPrivate(false)

      // Navigate to the new repository
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
              <img src="/rastion1.svg" alt="Rastion Logo" className="h-32 w-auto" />
            </Link>
          </motion.div>

          {/* Desktop navigation */}
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden md:flex items-center gap-2"
          >
            <Button
              variant="ghost"
              size="sm"
              className={`h-9 gap-1 px-3 ${location.pathname === "/qubots" ? "bg-muted" : ""}`}
              onClick={() => navigate("/qubots")}
            >
              <Boxes className="w-4 h-4 text-purple-500" />
              Qubots
            </Button>
            {/*
            <Button
              variant="ghost"
              size="sm"
              className={`h-9 gap-1 px-3 ${location.pathname === "/blogs" ? "bg-muted" : ""}`}
              onClick={() => navigate("/blogs")}
            >
              <BookMarked className="w-4 h-4 text-green-500" />
              Blogs
            </Button>

            
            */}

            {/* Community tab - only visible to logged in users */}
            {user && (
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger
                      className={cn(
                        "h-9 gap-1 px-3 text-sm",
                        location.pathname.includes("/feedback") || location.pathname.includes("/roadmap")
                          ? "bg-muted"
                          : "",
                      )}
                    >
                      <Shell className="w-4 h-4 text-blue-500" />
                      Community
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid gap-3 p-4 w-[200px]">
                        <li className="row-span-3">
                          <NavigationMenuLink asChild>
                            <Button
                              variant="ghost"
                              className={`w-full justify-start ${location.pathname === "/feed" ? "bg-muted" : ""}`}
                              onClick={() => navigate("/feed")}
                            >
                              <Activity className="mr-2 h-4 w-4 text-indigo-500" />
                              News
                            </Button>
                          </NavigationMenuLink>

                          <NavigationMenuLink asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => navigate("/feedback")}
                            >
                              <MessageSquare className="mr-2 h-4 w-4 text-orange-500" />
                              <span>Feedback</span>
                            </Button>
                          </NavigationMenuLink>

                          <NavigationMenuLink asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => navigate("/roadmap")}
                            >
                              <Rocket className="mr-2 h-4 w-4 text-red-500" />
                              <span>Roadmap</span>
                            </Button>
                          </NavigationMenuLink>
                        </li>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}

            <Button
              variant="ghost"
              size="sm"
              className={`h-9 gap-1 px-3 ${location.pathname === "/docs" ? "bg-muted" : ""}`}
              onClick={() => navigate("/docs")}
            >
              <BookOpenText className="w-4 h-4 text-amber-500" />
              Docs
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`h-9 gap-1 px-3 ${location.pathname === "/experimental-preview" ? "bg-muted" : ""}`}
              onClick={() => navigate("/experimental-preview")}
            >
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Experimental preview
            </Button>

            {/*}
             <Button
              variant="ghost"
              size="sm"
              className={`h-9 gap-1 px-3 ${location.pathname === "/leaderboard" ? "bg-muted" : ""}`}
              onClick={() => navigate("/leaderboard")}
            >
              <ChartLine className="w-4 h-4 text-green-500" />
              Leaderboard
            </Button>

             */}
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
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.login} />
                      <AvatarFallback>{user.login?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.login} />
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
                      <User className="mr-2 h-4 w-4 text-indigo-500" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    {/* In the DropdownMenuGroup section, add this after the Profile item: */}
                    <DropdownMenuItem onClick={() => setShowCreateRepoDialog(true)}>
                      <Plus className="mr-2 h-4 w-4 text-green-500" />
                      <span>New repository</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/u/${user.login}/settings`)}>
                      <Settings className="mr-2 h-4 w-4 text-gray-500" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4 text-red-500" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="sm" className="hidden md:flex h-9 px-4" onClick={() => navigate("/auth")}>
                Log in
              </Button>
            )}
          </motion.div>
        </div>
      </div>

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
    </header>
  )
}

export default Navbar
