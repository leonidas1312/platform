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
} from "lucide-react"
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
                          to="/qubots"
                          className={cn(
                            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                            isActive("/qubots") && "bg-accent text-accent-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="currentColor" d="M864 144H560c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V160c0-8.8-7.2-16-16-16zm-52 268H612V212h200v200zM464 544H160c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V560c0-8.8-7.2-16-16-16zm-52 268H212V612h200v200zm52-668H160c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V160c0-8.8-7.2-16-16-16zm-52 268H212V212h200v200zm452 132H560c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V560c0-8.8-7.2-16-16-16zm-52 268H612V612h200v200z"></path> </g></svg>
                            <div className="text-sm font-medium leading-none">Tools</div>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Browse public optimization tools
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/qubots-playground"
                          className={cn(
                            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                            isActive("/qubots-playground") && "bg-accent text-accent-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="currentColor" d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656z"></path> <path fill="currentColor" d="M321.1 679.1l192-161c3.9-3.2 3.9-9.1 0-12.3l-192-160.9A7.95 7.95 0 0 0 308 351v62.7c0 2.4 1 4.6 2.9 6.1L420.7 512l-109.8 92.2a8.1 8.1 0 0 0-2.9 6.1V673c0 6.8 7.9 10.5 13.1 6.1zM516 673c0 4.4 3.4 8 7.5 8h185c4.1 0 7.5-3.6 7.5-8v-48c0-4.4-3.4-8-7.5-8h-185c-4.1 0-7.5 3.6-7.5 8v48z"></path> </g></svg>
                            <div className="text-sm font-medium leading-none">Playground</div>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Test and experiment with optimization tools
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/optimization-workflows"
                          className={cn(
                            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                            isActive("/optimization-workflows") && "bg-accent text-accent-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M916 210H376c-17.7 0-32 14.3-32 32v236H108c-17.7 0-32 14.3-32 32v272c0 17.7 14.3 32 32 32h540c17.7 0 32-14.3 32-32V546h236c17.7 0 32-14.3 32-32V242c0-17.7-14.3-32-32-32zM344 746H144V546h200v200zm268 0H412V546h200v200zm0-268H412V278h200v200zm268 0H680V278h200v200z"></path> </g></svg>
                            <div className="text-sm font-medium leading-none">Workflows</div>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Manage and share optimization workflows
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/benchmark"
                          className={cn(
                            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                            isActive("/benchmark") && "bg-accent text-accent-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M832 112H724V72c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v40H500V72c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v40H320c-17.7 0-32 14.3-32 32v120h-96c-17.7 0-32 14.3-32 32v632c0 17.7 14.3 32 32 32h512c17.7 0 32-14.3 32-32v-96h96c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zM664 888H232V336h218v174c0 22.1 17.9 40 40 40h174v338zm0-402H514V336h.2L664 485.8v.2zm128 274h-56V456L544 264H360v-80h68v32c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-32h152v32c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-32h68v576z"></path> </g></svg>
                            <div className="text-sm font-medium leading-none">Benchmarks</div>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Connect your problem repositories as benchmarks
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}

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
                        onClick={() => window.open("https://github.com/Rastion/qubots", "_blank")}
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
                          <div className="text-sm font-medium leading-none">Terms of Service</div>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Review our terms and conditions
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
                        to="/qubots-playground"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground ml-4",
                          isActive("/qubots-playground") && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="currentColor" d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656z"></path> <path fill="currentColor" d="M321.1 679.1l192-161c3.9-3.2 3.9-9.1 0-12.3l-192-160.9A7.95 7.95 0 0 0 308 351v62.7c0 2.4 1 4.6 2.9 6.1L420.7 512l-109.8 92.2a8.1 8.1 0 0 0-2.9 6.1V673c0 6.8 7.9 10.5 13.1 6.1zM516 673c0 4.4 3.4 8 7.5 8h185c4.1 0 7.5-3.6 7.5-8v-48c0-4.4-3.4-8-7.5-8h-185c-4.1 0-7.5 3.6-7.5 8v48z"></path> </g></svg>
                        <span>Playground</span>
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
                        <span>Workflows</span>
                      </Link>
                      <Link
                        to="/benchmark"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground ml-4",
                          isActive("/benchmark") && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M832 112H724V72c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v40H500V72c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v40H320c-17.7 0-32 14.3-32 32v120h-96c-17.7 0-32 14.3-32 32v632c0 17.7 14.3 32 32 32h512c17.7 0 32-14.3 32-32v-96h96c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zM664 888H232V336h218v174c0 22.1 17.9 40 40 40h174v338zm0-402H514V336h.2L664 485.8v.2zm128 274h-56V456L544 264H360v-80h68v32c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-32h152v32c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-32h68v576z"></path> </g></svg>
                        <span>Benchmarks</span>
                      </Link>
                    </>
                  )}

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
                  <DropdownMenuItem asChild>
                    <Link to="/admin/waitlist" className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg mx-2 my-1">
                      <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900">
                        <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="font-medium">Admin Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
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
    </header>
  )
}
