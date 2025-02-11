
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const location = useLocation();

  const links = [
    { href: "/", label: "Home" },
    { href: "/repositories", label: "Repositories" },
    { href: "/docs", label: "Documentation" },
  ];

  return (
    <nav className="border-b">
      <div className="container mx-auto">
        <div className="flex h-16 items-center">
          <Link to="/" className="text-xl font-bold text-github-gray">
            Rastion
          </Link>
          <div className="ml-auto flex gap-6">
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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
