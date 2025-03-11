import { useState } from "react";
import {
  BookOpen,
  Code2,
  Terminal,
  Layers,
  Flag,
  Notebook,
  Download,
  Search,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

const Docs = () => {
  const documentationStructure = [
    {
      category: "Getting started",
      id: "getting-started",
      icon: Flag,
      items: [
        {
          title: "Introduction",
          type: "guide",
          route: "/docs/getting-started/introduction"
        },
        {
          title: "Upload qubots to Rastion",
          type: "guide",
          route: "/docs/getting-started/uploading-qubots"
        },
        {
          title: "Qubot cards",
          type: "guide",
          route: "/docs/getting-started/qubot-cards"
        },
        {
          title: "Local usage",
          type: "guide",
          route: "/docs/getting-started/local-usage"
        },
        {
          title: "Benchmark guide",
          type: "guide",
          route: "/docs/getting-started/benchmark-guide"
        }
      ]
    },
    {
      category: "Examples",
      id: "Examples",
      icon: Layers,
      items: [
        {
          subcategory: "Travelling salesman problem",
          items: [
            {
              title: "Solve TSP with ORtools optimizer",
              type: "notebook",
              badge: "ipynb",
              route:
                "https://colab.research.google.com/drive/1VDjtyfUMzvVP7V88-QPVbAjT8CwV5Bm2?usp=sharing"
            },
            {
              title: "Recreate the TSP benchmark from leaderboard",
              type: "notebook",
              badge: "ipynb",
              route:
                "https://colab.research.google.com/drive/1H5T9d83pnXJjes3irgdG1du8zMvxxcbJ?usp=sharing"
            }
          ]
        },
        {
          subcategory: "Maxcut",
          items: [
            {
              title: "Creating MAXCUT qubots",
              type: "notebook",
              badge: "ipynb",
              route:
                "https://colab.research.google.com/drive/16USkVGsCTuDrRJK_E9VlRMENbKXIIR-z?usp=sharing"
            }
          ]
        },
        {
          subcategory: "Batch scheduling",
          items: [
            {
              title: "Comparing ortools with gurobi",
              type: "notebook",
              badge: "ipynb",
              route:
                "https://colab.research.google.com/drive/1H9IkNnoTYDdo9Mj-4zaFPGRugSAy88tn?usp=sharing"
            },
            {
              title: "Building a heuristic qubot optimizer",
              type: "notebook",
              badge: "ipynb",
              route:
                "https://colab.research.google.com/drive/1feF8XIw4QjwuY-Od3cEg4elDfddfjpQI?usp=sharing"
            }
          ]
        },
        {
          subcategory: "Aircraft landing",
          items: [
            {
              title: "Solving the MILP version",
              type: "notebook",
              badge: "ipynb",
              route:
                "https://colab.research.google.com/drive/1jLK6JLLy77t7GrUA2GfRjpFky6tc1KeN?usp=sharing"
            }
          ]
        }
      ]
    }
  ];

  // 1) Keep an array of open category IDs
  //    Initialize with all category IDs to have them expanded by default
  const [openCategories, setOpenCategories] = useState(
    documentationStructure.map((section) => section.id)
  );

  const [searchQuery, setSearchQuery] = useState("");

  // 2) Toggling logic: add/remove category ID from openCategories
  const toggleCategory = (categoryId) => {
    setOpenCategories((prev) => {
      if (prev.includes(categoryId)) {
        // If already open, close it by filtering out
        return prev.filter((id) => id !== categoryId);
      } else {
        // Otherwise, open it by adding to array
        return [...prev, categoryId];
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row gap-8 max-w-[1800px] mx-auto p-6">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documentation..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <ScrollArea className="h-[calc(100vh-180px)]">
              {documentationStructure.map((section) => {
                // Check if the current section is open
                const isOpen = openCategories.includes(section.id);

                return (
                  <div key={section.id} className="mb-2">
                    {/* Toggle button */}
                    <button
                      onClick={() => toggleCategory(section.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-100 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <section.icon className="w-5 h-5 text-primary" />
                        <span className="font-medium">{section.category}</span>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {/* If isOpen, display the subsection items */}
                    {isOpen && (
                      <div className="ml-8 pl-3 border-l-2 border-gray-100">
                        {section.items.map((item, index) => {
                          // Check if the item is a subcategory group
                          if (item.subcategory) {
                            return (
                              <div key={index} className="mb-2">
                                <div className="text-sm font-bold text-gray-600 mb-1">
                                  {item.subcategory}
                                </div>
                                {item.items.map((subitem, subindex) => {
                                  if (subitem.type === "notebook") {
                                    // Notebook -> open in new tab
                                    return (
                                      <Link
                                        key={subindex}
                                        to={subitem.route}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-2 text-sm hover:bg-gray-50 rounded-lg transition-colors"
                                      >
                                        <Notebook className="w-4 h-4 text-purple-600" />
                                        <span>{subitem.title}</span>
                                        {subitem.badge && (
                                          <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full">
                                            {subitem.badge}
                                          </span>
                                        )}
                                      </Link>
                                    );
                                  } else {
                                    // Normal guide -> in-app link
                                    return (
                                      <Link
                                        key={subindex}
                                        to={subitem.route}
                                        className="flex items-center gap-3 p-2 text-sm hover:bg-gray-50 rounded-lg transition-colors"
                                      >
                                        <BookOpen className="w-4 h-4 text-blue-600" />
                                        <span>{subitem.title}</span>
                                      </Link>
                                    );
                                  }
                                })}
                              </div>
                            );
                          } else {
                            // Render items that are not part of a subcategory
                            if (item.type === "notebook") {
                              return (
                                <Link
                                  key={index}
                                  to={item.route}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-2 text-sm hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                  <Notebook className="w-4 h-4 text-purple-600" />
                                  <span>{item.title}</span>
                                  {item.badge && (
                                    <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full">
                                      {item.badge}
                                    </span>
                                  )}
                                </Link>
                              );
                            } else {
                              return (
                                <Link
                                  key={index}
                                  to={item.route}
                                  className="flex items-center gap-3 p-2 text-sm hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                  <BookOpen className="w-4 h-4 text-blue-600" />
                                  <span>{item.title}</span>
                                </Link>
                              );
                            }
                          }
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </ScrollArea>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
          <div className="prose max-w-none">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
