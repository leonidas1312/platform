"use client"

import { useState, useEffect, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Cpu,
  Lightbulb,
  Rocket,
  BookMarked,
  MessageSquare,
  GraduationCap,
} from "lucide-react"
import { ModeToggle } from "./ModeToggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"


const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const searchRef = useRef<HTMLDivElement>(null)

  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])


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
    navigate("/")
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    })
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
              <img src="/rastion1.svg" alt="Rastion Logo" className="h-16 w-auto" />
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
              <Cpu className="w-4 h-4 text-purple-500" />
              Qubots
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`h-9 gap-1 px-3 ${location.pathname === "/blogs" ? "bg-muted" : ""}`}
              onClick={() => navigate("/blogs")}
            >
              <BookMarked className="w-4 h-4 text-green-500" />
              Blogs
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`h-9 gap-1 px-3 ${location.pathname === "/community" ? "bg-muted" : ""}`}
              onClick={() => navigate("/community")}
            >
              <MessageSquare className="w-4 h-4 text-blue-500" />
              Community
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`h-9 gap-1 px-3 ${location.pathname === "/docs" ? "bg-muted" : ""}`}
              onClick={() => navigate("/docs")}
            >
              <GraduationCap className="w-4 h-4 text-amber-500" />
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

            <ModeToggle />

            
          </motion.div>
        </div>
      </div>

      
      
    </header>
  )
}

export default Navbar
