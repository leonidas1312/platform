import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/ThemeContext"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 px-0 hover:bg-secondary/80 transition-colors"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass border-border/50">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`cursor-pointer ${
            theme === "light" ? "bg-secondary/50" : ""
          }`}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`cursor-pointer ${
            theme === "dark" ? "bg-secondary/50" : ""
          }`}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`cursor-pointer ${
            theme === "system" ? "bg-secondary/50" : ""
          }`}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      className="h-9 w-9 px-0 hover:bg-secondary/80 transition-colors"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export function ThemeToggleMenuItem() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center justify-between p-3 w-full rounded-lg hover:bg-secondary/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-secondary">
          <Monitor className="h-4 w-4" />
        </div>
        <span className="font-medium">Theme</span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation()
            setTheme("system")
          }}
          className={`h-7 w-7 rounded-md transition-colors ${
            theme === "system"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary"
          }`}
        >
          <Monitor className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation()
            setTheme("light")
          }}
          className={`h-7 w-7 rounded-md transition-colors ${
            theme === "light"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary"
          }`}
        >
          <Sun className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation()
            setTheme("dark")
          }}
          className={`h-7 w-7 rounded-md transition-colors ${
            theme === "dark"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary"
          }`}
        >
          <Moon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
