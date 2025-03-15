import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Menu, X, Settings } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // We'll store user data (if logged in). If null => not logged in.
  const [user, setUser] = useState<any>(null);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const avatarDropdownRef = useRef<HTMLDivElement>(null);

  // Create Repo modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [license, setLicense] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Example: check localStorage for token and fetch user info.
  useEffect(() => {
    const token = localStorage.getItem("gitea_token");
    if (token) {
      // Attempt to fetch user
      fetch("http://localhost:4000/api/profile", {
        headers: {
          Authorization: `token ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch user");
          }
          return res.json();
        })
        .then((data) => {
          setUser(data);
        })
        .catch(() => {
          setUser(null);
        });
    }
  }, []);

  // Close avatar dropdown if user clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        avatarDropdownRef.current &&
        !avatarDropdownRef.current.contains(event.target as Node)
      ) {
        setAvatarDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAvatarClick = () => {
    setAvatarDropdownOpen((prev) => !prev);
  };

  const handleLogout = () => {
    // Remove token, user is logged out
    localStorage.removeItem("gitea_token");
    setUser(null);
    setAvatarDropdownOpen(false);
    navigate("/auth");
  };

  // 1) "Create Qubot Repo" button click
  const handleCreateRepoClick = () => {
    setAvatarDropdownOpen(false);
    setRepoName("");
    setLicense("");
    setIsPrivate(false);
    setShowCreateModal(true);
  };

  // 2) Submit form to create new repo
  const handleCreateRepoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("gitea_token");
      if (!token) {
        throw new Error("No token found.");
      }
      const res = await fetch("http://localhost:4000/api/create-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
        body: JSON.stringify({
          name: repoName,
          license,
          isPrivate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to create repository");
      } else {
        alert("Repository created successfully!");
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error("Create repo error:", error);
      alert("Error creating repository");
    }
  };

  // List of possible licenses (from Gitea or a manual list)
  const licenseOptions = [
    { value: "", label: "None" },
    { value: "mit", label: "MIT" },
    { value: "apache-2.0", label: "Apache 2.0" },
    { value: "gpl-3.0", label: "GPL 3.0" },
    // add as many as you want
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "glass py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/rastion1.svg"
                alt="Rastion Logo"
                className="h-24 w-auto mb-8"
              />
            </Link>
          </motion.div>

          {/* Desktop navigation */}
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden md:flex items-center gap-8"
          >
            <Link
              to="/qubot-optimizers"
              className={`text-sm font-medium transition-colors ${
                location.pathname === "/qubot-optimizers" ? "text-primary" : "hover:text-primary"
              }`}
            >
              Qubot optimizers
            </Link>
            <Link
              to="/qubot-problems"
              className={`text-sm font-medium transition-colors ${
                location.pathname === "/qubot-problems" ? "text-primary" : "hover:text-primary"
              }`}
            >
              Optimization problems
            </Link>
            <Link
              to="/blogs"
              className={`text-sm font-medium transition-colors ${
                location.pathname === "/blogs" ? "text-primary" : "hover:text-primary"
              }`}
            >
              Blogs
            </Link>
            <Link
              to="/community"
              className={`text-sm font-medium transition-colors ${
                location.pathname === "/community" ? "text-primary" : "hover:text-primary"
              }`}
            >
              Community
            </Link>
            <Link
              to="/docs"
              className={`text-sm font-medium transition-colors ${
                location.pathname === "/docs" ? "text-primary" : "hover:text-primary"
              }`}
            >
              Documentation
            </Link>
          </motion.nav>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-4"
          >
            {user ? (
              <div className="relative" ref={avatarDropdownRef}>
                <img
                  src={user.avatar_url || '/placeholder-avatar.png'}
                  alt="avatar"
                  className="w-9 h-9 rounded-full cursor-pointer object-cover"
                  onClick={() => setAvatarDropdownOpen((prev) => !prev)}
                />
                {avatarDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white shadow-lg rounded-lg py-2 z-10">
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                      onClick={() => {
                        setAvatarDropdownOpen(false);
                        navigate('/profile');
                      }}
                    >
                      Profile
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                      onClick={() => {
                        setAvatarDropdownOpen(false);
                        navigate('/settings'); // or another path
                      }}
                    >
                      Settings
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                      onClick={handleCreateRepoClick}
                    >
                      Create Qubot Repo
                    </button>
                    <div className="border-t my-1"></div>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                      onClick={handleLogout}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="hidden md:block px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium transition-all hover:bg-primary/90"
              >
                Log in
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Mobile menu -- omitted for brevity, same as your code */}
      {/*
        if (isMobileMenuOpen) {
          ...
        }
      */}

      {/* Modal for creating new Qubot Repo */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-[90%] max-w-md p-6 rounded shadow-lg relative">
            <h2 className="text-xl font-semibold mb-4">Create Qubot Repository</h2>
            <form onSubmit={handleCreateRepoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Repository Name</label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">License</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                >
                  {licenseOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="privateRepo"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                <label htmlFor="privateRepo">Make this repository private</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
