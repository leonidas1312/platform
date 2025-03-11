import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        variant: "destructive",
      });
    }
  };

  const links = [
    { href: "/", label: "Home" },
    { href: "/repositories", label: "Repositories" },
    { href: "/docs", label: "Documentation" },
    { href: "/leaderboard", label: "Leaderboard" },
  ];

  return (
    <nav className="border-b">
      <div className="container mx-auto">
        <div className="flex h-16 items-center">
          <Link to="/" className="flex items-center">
            <img
              src="/rastion1.svg"
              alt="Rastion Logo"
              className="w-auto max-w-[70px]"
            />
          </Link>

          <div className="ml-auto flex gap-6 items-center">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-github-gray",
                  location.pathname === link.href
                    ? "text-github-gray"
                    : "text-github-gray/60"
                )}
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0">
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="Profile"
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/create-qubot-optimizer">
                      Create qubot optimizer
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/create-qubot-problem">
                      Create qubot problem
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/signin"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-github-gray",
                  location.pathname === "/signin"
                    ? "text-github-gray"
                    : "text-github-gray/60"
                )}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
