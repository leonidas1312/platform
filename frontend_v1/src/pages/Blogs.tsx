import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  tags: string[];
  imageUrl?: string;
}

const sampleBlogs: BlogPost[] = [
  {
    id: "1",
    title: "Getting Started with AI Models",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl vel ultricies lacinia, nisl nisl aliquam nisl, eu aliquam nisl nisl eu nisl.",
    author: "Jane Doe",
    date: "2023-05-12",
    tags: ["AI", "Beginner", "Tutorial"],
    imageUrl: "https://images.unsplash.com/photo-1677442135132-894cc7af958f?q=80&w=1932&auto=format&fit=crop"
  },
  {
    id: "2",
    title: "Advanced ML Techniques",
    content: "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
    author: "John Smith",
    date: "2023-06-18",
    tags: ["Machine Learning", "Advanced"],
    imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1965&auto=format&fit=crop"
  },
  {
    id: "3",
    title: "Ethical Considerations in AI",
    content: "Mauris ultrices eros in cursus turpis massa tincidunt dui ut ornare lectus sit amet est placerat in egestas erat.",
    author: "Alex Johnson",
    date: "2023-07-24",
    tags: ["Ethics", "AI", "Philosophy"],
    imageUrl: "https://images.unsplash.com/photo-1655720035710-5487d45416ee?q=80&w=1932&auto=format&fit=crop"
  }
];

const Blogs = () => {
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<BlogPost[]>(sampleBlogs);
  const [newBlog, setNewBlog] = useState<Omit<BlogPost, "id" | "date">>({
    title: "",
    content: "",
    author: "",
    tags: [],
    imageUrl: ""
  });
  const [tagInput, setTagInput] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewBlog(prev => ({ ...prev, [name]: value }));
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const addTag = () => {
    if (tagInput.trim() && !newBlog.tags.includes(tagInput.trim())) {
      setNewBlog(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewBlog(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBlog.title || !newBlog.content || !newBlog.author) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const now = new Date();
    const newBlogPost: BlogPost = {
      id: Date.now().toString(),
      ...newBlog,
      date: now.toISOString().split('T')[0]
    };

    setBlogs(prev => [newBlogPost, ...prev]);
    setNewBlog({
      title: "",
      content: "",
      author: "",
      tags: [],
      imageUrl: ""
    });

    toast({
      title: "Blog post created!",
      description: "Your blog post has been published successfully."
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-24 px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight mb-3">AI Community Blogs</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Share your insights, experiences, and knowledge with the AI community. Learn from others and contribute to the collective wisdom.
          </p>
        </motion.div>

        <Tabs defaultValue="blogs" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="blogs">View Blogs</TabsTrigger>
            <TabsTrigger value="create">Create Blog</TabsTrigger>
          </TabsList>
          
          <TabsContent value="blogs">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {blogs.map(blog => (
                <motion.div key={blog.id} variants={itemVariants}>
                  <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                    {blog.imageUrl && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img 
                          src={blog.imageUrl} 
                          alt={blog.title} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{blog.title}</CardTitle>
                      <CardDescription>
                        By {blog.author} • {new Date(blog.date).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {blog.content}
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-2 pt-2 border-t">
                      {blog.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
          
          <TabsContent value="create">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Create New Blog Post</CardTitle>
                <CardDescription>
                  Share your knowledge and experience with the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={newBlog.title}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="Enter a descriptive title"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="author" className="block text-sm font-medium mb-1">
                      Author <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="author"
                      name="author"
                      type="text"
                      value={newBlog.author}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium mb-1">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="content"
                      name="content"
                      value={newBlog.content}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="Write your blog content here..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium mb-1">
                      Image URL
                    </label>
                    <input
                      id="imageUrl"
                      name="imageUrl"
                      type="url"
                      value={newBlog.imageUrl}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Tags</label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={handleTagInputChange}
                        className="flex-grow rounded-l-md border border-input bg-background px-3 py-2"
                        placeholder="Add a tag and press Enter"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={addTag}
                        className="rounded-l-none"
                      >
                        Add
                      </Button>
                    </div>
                    
                    {newBlog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newBlog.tags.map(tag => (
                          <div 
                            key={tag} 
                            className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground flex items-center gap-1"
                          >
                            <span className="text-xs">{tag}</span>
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="text-xs hover:text-destructive"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4">
                    <Button type="submit" className="w-full">
                      Publish Blog Post
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Blogs;
