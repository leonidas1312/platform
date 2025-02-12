
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const Navigation = () => {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const links = [
    { href: "/", label: "Home" },
    { href: "/repositories", label: "Repositories" },
    { href: "/docs", label: "Documentation" },
  ];

  return (
    <nav className="border-b">
      <div className="container mx-auto">
        <div className="flex h-16 items-center">
          <Link to="/" className="flex items-center">
            <img src="/rastion1.svg" alt="Rastion Logo" className="w-auto max-w-[70px]" />
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
              <Link
                to="/profile"
                className={cn(
                  "flex items-center gap-2",
                  "text-sm font-medium transition-colors hover:text-github-gray",
                  location.pathname === "/profile"
                    ? "text-github-gray"
                    : "text-github-gray/60"
                )}
              >
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
