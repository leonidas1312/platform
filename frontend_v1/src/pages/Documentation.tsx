import React, { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { Search, FileText, Code, Video, BookOpen, Star } from "lucide-react";

const Documentation = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const docs = [
    {
      id: 1,
      title: "Getting Started with Models",
      category: "guides",
      description: "Learn how to use AI models in your applications",
      icon: <FileText className="h-5 w-5 text-primary" />,
      popular: true,
    },
    {
      id: 2,
      title: "API Reference",
      category: "api",
      description: "Complete API documentation for developers",
      icon: <Code className="h-5 w-5 text-primary" />,
      popular: false,
    },
    {
      id: 3,
      title: "Model Training Tutorial",
      category: "tutorials",
      description: "Step-by-step guide to train your own models",
      icon: <Video className="h-5 w-5 text-primary" />,
      popular: true,
    },
    {
      id: 4,
      title: "Dataset Preparation",
      category: "guides",
      description: "How to prepare and clean datasets for training",
      icon: <FileText className="h-5 w-5 text-primary" />,
      popular: false,
    },
    {
      id: 5,
      title: "Model Deployment",
      category: "guides",
      description: "Deploy models to production environments",
      icon: <FileText className="h-5 w-5 text-primary" />,
      popular: true,
    },
    {
      id: 6,
      title: "Python SDK Documentation",
      category: "api",
      description: "Complete documentation for the Python SDK",
      icon: <Code className="h-5 w-5 text-primary" />,
      popular: false,
    },
    {
      id: 7,
      title: "JavaScript SDK Documentation",
      category: "api",
      description: "Complete documentation for the JavaScript SDK",
      icon: <Code className="h-5 w-5 text-primary" />,
      popular: false,
    },
    {
      id: 8,
      title: "Fine-tuning Transformer Models",
      category: "tutorials",
      description: "Learn how to fine-tune transformer models",
      icon: <Video className="h-5 w-5 text-primary" />,
      popular: true,
    },
  ];

  const filteredDocs = docs.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Documentation</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about using our AI platform and models
            </p>
          </div>

          <div className="relative mb-10">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documentation..."
              className="w-full pl-10 py-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Popular Documentation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {docs.filter(doc => doc.popular).map(doc => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5 }}
                  className="cursor-pointer"
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        {doc.icon}
                        <CardTitle className="text-lg">{doc.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{doc.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <Tabs defaultValue="all" className="mb-12">
            <TabsList className="mb-6 w-full grid grid-cols-4 mx-auto max-w-md">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="guides">Guides</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
              <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs.map(doc => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -5 }}
                    className="cursor-pointer"
                  >
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          {doc.icon}
                          <CardTitle className="text-lg">{doc.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{doc.description}</CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="guides">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs.filter(doc => doc.category === 'guides').map(doc => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -5 }}
                    className="cursor-pointer"
                  >
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          {doc.icon}
                          <CardTitle className="text-lg">{doc.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{doc.description}</CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="api">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs.filter(doc => doc.category === 'api').map(doc => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -5 }}
                    className="cursor-pointer"
                  >
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          {doc.icon}
                          <CardTitle className="text-lg">{doc.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{doc.description}</CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="tutorials">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs.filter(doc => doc.category === 'tutorials').map(doc => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -5 }}
                    className="cursor-pointer"
                  >
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          {doc.icon}
                          <CardTitle className="text-lg">{doc.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{doc.description}</CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="bg-secondary/30 rounded-lg p-6 mb-10">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Need more help?</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Can't find what you're looking for in our documentation? Check out these additional resources.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#" className="inline-flex items-center gap-2 text-primary hover:underline">
                <Video size={16} />
                Video Tutorials
              </a>
              <a href="#" className="inline-flex items-center gap-2 text-primary hover:underline">
                <Code size={16} />
                Code Examples
              </a>
              <a href="#" className="inline-flex items-center gap-2 text-primary hover:underline">
                <FileText size={16} />
                Request Documentation
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Documentation;
