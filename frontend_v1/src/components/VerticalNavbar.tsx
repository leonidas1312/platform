import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  User,
  Settings,
  LogOut,
  Home,
  ChevronDown,
  Menu,
  Shield,
  Target,
  Users,
  MessageSquare,
  BookOpen,
  DollarSign,
} from "lucide-react"
import { RastionLogo } from "@/components/ui/RastionLogo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { useToast } from "@/hooks/use-toast"
import { useAdmin } from "@/hooks/use-admin"
import { ThemeToggleMenuItem } from "@/components/ThemeToggle"
import { NotificationDropdown } from "@/components/NotificationDropdown"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

const API = import.meta.env.VITE_API_BASE

interface User {
  id: number
  login: string
  full_name?: string
  avatar_url?: string
  email?: string
}

export function VerticalNavbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isAdmin } = useAdmin()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API}/api/profile`, {
          credentials: 'include', // Include cookies in request
        })

        if (!response.ok) {
          throw new Error("Failed to fetch user")
        }

        const userData = await response.json()
        setUser(userData)
      } catch (error) {
        console.error("Error fetching user:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/"
    }
    return location.pathname.startsWith(path)
  }

  const handleLogout = async () => {
    try {
      // Call logout endpoint to clear HTTP-only cookie
      await fetch(`${API}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies in request
      })

      setUser(null)
      navigate("/")
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      })
    } catch (error) {
      console.error("Error during logout:", error)
      toast({
        title: "Error",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Left side - Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative transition-all duration-300 p-1.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-border/50 shadow-sm group-hover:shadow-md">
              <RastionLogo className="h-6 w-6 text-primary transition-all duration-300 group-hover:scale-110" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-none bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Rastion
              </span>
              <span className="text-xs text-muted-foreground leading-none mt-0.5">
                Optimization Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Center - Navigation Menu */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>



            {/* Optimization Section - Only show if user is logged in */}
            {(
              <NavigationMenuItem>
                <NavigationMenuTrigger className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="currentColor" d="M859.3 569.7l.2.1c3.1-18.9 4.6-38.2 4.6-57.3 0-17.1-1.3-34.3-3.7-51.1 2.4 16.7 3.6 33.6 3.6 50.5 0 19.4-1.6 38.8-4.7 57.8zM99 398.1c-.5-.4-.9-.8-1.4-1.3.7.7 1.4 1.4 2.2 2.1l65.5 55.9v-.1L99 398.1zm536.6-216h.1l-15.5-83.8c-.2-1-.4-1.9-.7-2.8.1.5.3 1.1.4 1.6l15.7 85zm54 546.5l31.4-25.8 92.8 32.9c17-22.9 31.3-47.5 42.6-73.6l-74.7-63.9 6.6-40.1c2.5-15.1 3.8-30.6 3.8-46.1s-1.3-31-3.8-46.1l-6.5-39.9 74.7-63.9c-11.4-26-25.6-50.7-42.6-73.6l-92.8 32.9-31.4-25.8c-23.9-19.6-50.6-35-79.3-45.8l-38.1-14.3-17.9-97a377.5 377.5 0 0 0-85 0l-17.9 97.2-37.9 14.3c-28.5 10.8-55 26.2-78.7 45.7l-31.4 25.9-93.4-33.2c-17 22.9-31.3 47.5-42.6 73.6l75.5 64.5-6.5 40c-2.5 14.9-3.7 30.2-3.7 45.5 0 15.2 1.3 30.6 3.7 45.5l6.5 40-75.5 64.5c11.4 26 25.6 50.7 42.6 73.6l93.4-33.2 31.4 25.9c23.7 19.5 50.2 34.9 78.7 45.7l37.8 14.5 17.9 97.2c28.2 3.2 56.9 3.2 85 0l17.9-97 38.1-14.3c28.8-10.8 55.4-26.2 79.3-45.8zm-177.1-50.3c-30.5 0-59.2-7.8-84.3-21.5C373.3 627 336 568.9 336 502c0-97.2 78.8-176 176-176 66.9 0 125 37.3 154.8 92.2 13.7 25 21.5 53.7 21.5 84.3 0 97.1-78.7 175.8-175.8 175.8zM207.2 812.8c-5.5 1.9-11.2 2.3-16.6 1.2 5.7 1.2 11.7 1 17.5-1l81.4-29c-.1-.1-.3-.2-.4-.3l-81.9 29.1zm717.6-414.7l-65.5 56c0 .2.1.5.1.7l65.4-55.9c7.1-6.1 11.1-14.9 11.2-24-.3 8.8-4.3 17.3-11.2 23.2z"></path> </g></svg>
                  <span>Optimization</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[400px]">
                    <div className="grid gap-1">

                      



                      <NavigationMenuLink asChild>
                        <Link
                          to="/datasets"
                          className={cn(
                            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                            isActive("/datasets") && "bg-accent text-accent-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="currentColor" d="M832 64H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-260 72h96v209.9L621.5 312 572 347.4V136zm220 752H232V136h280v296.9c0 3.3 1 6.6 3 9.3a15.9 15.9 0 0 0 22.3 3.7l83.8-59.9 81.4 59.4c2.7 2 6 3.1 9.4 3.1 8.8 0 16-7.2 16-16V136h64v752z"></path> </g></svg>
                            <div className="text-sm font-medium leading-none">Datasets</div>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Upload and manage optimization datasets
                          </p>
                        </Link>
                      </NavigationMenuLink>

                      <NavigationMenuLink asChild>
                        <Link
                          to="/workflow-automation"
                          className={cn(
                            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                            isActive("/workflow-automation") && "bg-accent text-accent-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <circle cx="8" cy="6" r="2" fill="currentColor"/>
                              <circle cx="16" cy="12" r="2" fill="currentColor"/>
                              <circle cx="8" cy="18" r="2" fill="currentColor"/>
                            </svg>
                            <div className="text-sm font-medium leading-none">Decision model builder</div>
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">BETA</Badge>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Build decision models with drag-and-drop
                          </p>
                        </Link>
                      </NavigationMenuLink>

                      <NavigationMenuLink asChild>
                        <Link
                          to="/autosolve"
                          className={cn(
                            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                            isActive("/autosolve") && "bg-accent text-accent-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                              <path d="M19 15L19.5 17L21.5 17.5L19.5 18L19 20L18.5 18L16.5 17.5L18.5 17L19 15Z" fill="currentColor"/>
                              <path d="M5 6L5.5 8L7.5 8.5L5.5 9L5 11L4.5 9L2.5 8.5L4.5 8L5 6Z" fill="currentColor"/>
                            </svg>
                            <div className="text-sm font-medium leading-none">AutoSolve</div>
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">BETA</Badge>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            AI-powered optimization recommendations from your data files
                          </p>
                        </Link>
                      </NavigationMenuLink>

                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}

            {/* Community Section */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M824.2 699.9a301.55 301.55 0 0 0-86.4-60.4C783.1 602.8 812 546.8 812 484c0-110.8-92.4-201.7-203.2-200-109.1 1.7-197 90.6-197 200 0 62.8 29 118.8 74.2 155.5a300.95 300.95 0 0 0-86.4 60.4C345 754.6 314 826.8 312 903.8a8 8 0 0 0 8 8.2h56c4.3 0 7.9-3.4 8-7.7 1.9-58 25.4-112.3 66.7-153.5A226.62 226.62 0 0 1 612 684c60.9 0 118.2 23.7 161.3 66.8C814.5 792 838 846.3 839.9 904.3c.1 4.3 3.7 7.7 8 7.7h56a8 8 0 0 0 8-8.2c-2-77-33-149.2-87.7-203.9zM612 612c-34.2 0-66.4-13.3-90.5-37.5a126.86 126.86 0 0 1-37.5-90.5c0-34.2 13.3-66.4 37.5-90.5a126.86 126.86 0 0 1 90.5-37.5c34.2 0 66.4 13.3 90.5 37.5a126.86 126.86 0 0 1 37.5 90.5c0 34.2-13.3 66.4-37.5 90.5A126.86 126.86 0 0 1 612 612zM361.5 510.4c-.9-8.7-1.4-17.5-1.4-26.4 0-15.9 1.5-31.4 4.3-46.5.7-3.6-1.2-7.3-4.5-8.8-13.6-6.1-26.1-14.5-36.9-25.1a127.54 127.54 0 0 1-38.7-91.4c0-34.5 13.7-66.6 38.6-90.5a127.32 127.32 0 0 1 91.5-37.7c34.5 0 66.6 13.7 90.5 38.6 2.5 2.5 4.8 5.1 7 7.8 2.1 2.7 5.8 3.4 8.9 1.9 12.5-6.1 26.3-10.5 40.8-13.1 3.9-.7 6.3-4.6 5.7-8.6-.4-2.6-.6-5.2-.6-7.9 0-49.3-20.2-94.1-56.9-126.8C471.4 52.4 426.6 32.2 377.1 32.2s-94.3 20.2-126.8 56.9A180.277 180.277 0 0 0 193.4 216c0 49.3 20.2 94.1 56.9 126.8 1.3 1.2 2.6 2.5 4 3.7 2.4 2.2 2.7 5.2 1.6 8.1-11.8 30.7-15.6 64.8-10.8 98.6 2.3 16.9 6.4 33.3 12.4 48.8 1.6 4.2 6.6 5.6 10.5 2.8a127.91 127.91 0 0 1 91.2-35.2c.6 0 1.1 0 1.7.1 4.7.1 8.7-3.2 9.3-7.9z"></path> </g></svg>
                <span>Community</span>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid gap-3 p-6 w-[400px]">
                  <div className="grid gap-1">
                    <NavigationMenuLink asChild>
                      <Link
                        to="/qubots"
                        className={cn(
                          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                          isActive("/qubots") && "bg-accent text-accent-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="currentColor" d="M864 144H560c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V160c0-8.8-7.2-16-16-16zm-52 268H612V212h200v200zM464 544H160c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V560c0-8.8-7.2-16-16-16zm-52 268H212V612h200v200zm52-668H160c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V160c0-8.8-7.2-16-16-16zm-52 268H212V212h200v200zm452 132H560c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V560c0-8.8-7.2-16-16-16zm-52 268H612V612h200v200z"></path> </g></svg>
                          <div className="text-sm font-medium leading-none">Repositories</div>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Browse public optimization repositories
                        </p>
                      </Link>
                    </NavigationMenuLink>
                    
                    <NavigationMenuLink asChild>
                      <Link
                        to="/optimization-challenges"
                        className={cn(
                          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                          isActive("/optimization-challenges") && "bg-accent text-accent-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <div className="text-sm font-medium leading-none">Optimization challenges</div>
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">BETA</Badge>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Discover optimization challenges
                        </p>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/public-experiments"
                        className={cn(
                          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                          isActive("/public-experiments") && "bg-accent text-accent-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                          </svg>
                          <div className="text-sm font-medium leading-none">Decision models</div>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Browse community decision models
                        </p>
                      </Link>
                    </NavigationMenuLink>

                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Resources Section */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M928 444H820V330.4c0-17.7-14.3-32-32-32H473L355.7 186.2a8.15 8.15 0 0 0-5.5-2.2H96c-17.7 0-32 14.3-32 32v592c0 17.7 14.3 32 32 32h698c13 0 24.8-7.9 29.7-20l134-332c1.5-3.8 2.3-7.9 2.3-12 0-17.7-14.3-32-32-32zM136 256h188.5l119.6 114.4H748V444H238c-13 0-24.8 7.9-29.7 20L136 643.2V256zm635.3 512H159l103.3-256h612.4L771.3 768z"></path> </g></svg>
                <span>Resources</span>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid gap-3 p-6 w-[300px]">
                  <div className="grid gap-1">

                    <NavigationMenuLink asChild>
                      <button
                        onClick={() => window.open("https://docs.rastion.com", "_blank")}
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="currentColor" d="M880 298.4H521L403.7 186.2a8.15 8.15 0 0 0-5.5-2.2H144c-17.7 0-32 14.3-32 32v592c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V330.4c0-17.7-14.3-32-32-32zM840 768H184V256h188.5l119.6 114.4H840V768z"></path> </g></svg>
                          <div className="text-sm font-medium leading-none">Documentation</div>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Learn how to use the platform and qubots framework
                        </p>
                      </button>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/experimental-preview"
                        className={cn(
                          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                          isActive("/experimental-preview") && "bg-accent text-accent-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM602 137.8L790.2 326H602V137.8zM792 888H232V136h302v216a42 42 0 0 0 42 42h216v494z"></path> </g></svg>
                          <div className="text-sm font-medium leading-none">Experimental preview</div>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Review our experimental preview
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side - User Menu and Mobile Menu */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-4 py-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="relative transition-all duration-300 p-1.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-border/50 shadow-sm">
                    <RastionLogo className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-lg leading-none bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                      Rastion
                    </span>
                    <span className="text-xs text-muted-foreground leading-none mt-0.5">
                      Optimization Platform
                    </span>
                  </div>
                </div>

                <nav className="flex flex-col gap-2">

                  {(
                    <>
                      <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
                        Optimization
                      </div>

                      <Link
                        to="/autosolve"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground ml-4",
                          isActive("/autosolve") && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                          <path d="M19 15L19.5 17L21.5 17.5L19.5 18L19 20L18.5 18L16.5 17.5L18.5 17L19 15Z" fill="currentColor"/>
                          <path d="M5 6L5.5 8L7.5 8.5L5.5 9L5 11L4.5 9L2.5 8.5L4.5 8L5 6Z" fill="currentColor"/>
                        </svg>
                        <span>AutoSolve</span>
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5 ml-2">BETA</Badge>
                      </Link>



                      <Link
                        to="/datasets"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground ml-4",
                          isActive("/datasets") && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="currentColor" d="M832 64H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-260 72h96v209.9L621.5 312 572 347.4V136zm220 752H232V136h280v296.9c0 3.3 1 6.6 3 9.3a15.9 15.9 0 0 0 22.3 3.7l83.8-59.9 81.4 59.4c2.7 2 6 3.1 9.4 3.1 8.8 0 16-7.2 16-16V136h64v752z"></path> </g></svg>
                        <span>Datasets</span>
                      </Link>

                      <Link
                        to="/workflow-automation"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground ml-4",
                          isActive("/workflow-automation") && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="8" cy="6" r="2" fill="currentColor"/>
                          <circle cx="16" cy="12" r="2" fill="currentColor"/>
                          <circle cx="8" cy="18" r="2" fill="currentColor"/>
                        </svg>
                        <span>Decision model builder</span>
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5 ml-2">BETA</Badge>
                      </Link>

                    </>
                  )}

                  <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
                    Community
                  </div>
                  <Link
                    to="/qubots"
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground ml-4",
                      isActive("/qubots") && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="currentColor" d="M864 144H560c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V160c0-8.8-7.2-16-16-16zm-52 268H612V212h200v200zM464 544H160c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V560c0-8.8-7.2-16-16-16zm-52 268H212V612h200v200zm52-668H160c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V160c0-8.8-7.2-16-16-16zm-52 268H212V212h200v200zm452 132H560c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V560c0-8.8-7.2-16-16-16zm-52 268H612V612h200v200z"></path> </g></svg>
                    <span>Tools</span>
                  </Link>
                  <Link
                    to="/optimization-workflows"
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground ml-4",
                      isActive("/optimization-workflows") && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M916 210H376c-17.7 0-32 14.3-32 32v236H108c-17.7 0-32 14.3-32 32v272c0 17.7 14.3 32 32 32h540c17.7 0 32-14.3 32-32V546h236c17.7 0 32-14.3 32-32V242c0-17.7-14.3-32-32-32zM344 746H144V546h200v200zm268 0H412V546h200v200zm0-268H412V278h200v200zm268 0H680V278h200v200z"></path> </g></svg>
                    <span>Solutions</span>
                  </Link>
                  <Link
                    to="/optimization-challenges"
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground ml-4",
                      isActive("/optimization-challenges") && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Target className="h-4 w-4" />
                    <span>Optimization Challenges</span>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 ml-2">BETA</Badge>
                  </Link>

                  <Link
                    to="/public-experiments"
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground ml-4",
                      isActive("/public-experiments") && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                    </svg>
                    <span>Public Decision Models</span>
                  </Link>

                  <Link
                    to="/community/posts"
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground ml-4",
                      isActive("/community/posts") && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Community Posts</span>
                  </Link>
                  <Link
                    to="/community/blogs"
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground ml-4",
                      isActive("/community/blogs") && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Blogs</span>
                  </Link>

                  <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
                    Resources
                  </div>

                  <button
                    onClick={() => {
                      window.open("https://docs.rastion.com", "_blank")
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground ml-4 text-left"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="currentColor" d="M880 298.4H521L403.7 186.2a8.15 8.15 0 0 0-5.5-2.2H144c-17.7 0-32 14.3-32 32v592c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V330.4c0-17.7-14.3-32-32-32zM840 768H184V256h188.5l119.6 114.4H840V768z"></path> </g></svg>
                    <span>Documentation</span>
                  </button>
                  <Link
                    to="/experimental-preview"
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground ml-4",
                      isActive("/experimental-preview") && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM602 137.8L790.2 326H602V137.8zM792 888H232V136h302v216a42 42 0 0 0 42 42h216v494z"></path> </g></svg>
                    <span>Terms of Service</span>
                  </Link>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          {/* Notifications and User Menu */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            {user && <NotificationDropdown />}

            {/* User Menu */}
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="hidden md:block">
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-10 px-3 hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                >
                  <Avatar className="h-8 w-8 border-2 border-border/50">
                    <AvatarImage
                      src={user.avatar_url || "/placeholder.svg"}
                      alt={user.login}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-xs">
                      {user.login?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start text-left text-sm leading-tight">
                    <span className="font-semibold text-foreground">{user.full_name || user.login}</span>
                    <span className="text-xs text-muted-foreground">@{user.login}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64 glass rounded-xl shadow-lg border-border/50"
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
                <DropdownMenuItem asChild>
                  <Link to={`/u/${user.login}`} className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg mx-2 my-1">
                    <div className="p-1.5 rounded-lg bg-secondary">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/u/${user.login}/settings`} className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg mx-2 my-1">
                    <div className="p-1.5 rounded-lg bg-secondary">
                      <Settings className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Settings</span>
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/waitlist" className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg mx-2 my-1">
                        <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900">
                          <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="font-medium">Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/pricing" className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg mx-2 my-1">
                        <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900">
                          <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="font-medium">Pricing Configuration</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator className="bg-border/50" />
                <div className="p-2">
                  <ThemeToggleMenuItem />
                </div>
                <DropdownMenuSeparator className="bg-border/50" />
                <div className="p-2">
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-3 p-3 hover:bg-red-50 hover:text-red-700 rounded-lg cursor-pointer">
                    <div className="p-1.5 rounded-lg bg-secondary">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Log out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" className="flex items-center gap-2">
              <Link to="/auth">
                <User className="w-4 h-4" />
                <span className="hidden md:inline">Sign In</span>
              </Link>
            </Button>
          )}
          </div>
        </div>
      </div>
    </header>
  )
}
