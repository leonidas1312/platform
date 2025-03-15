import React, { useState } from "react";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Users, BookOpen, Star, ThumbsUp, MessageCircle, Share2, Heart } from "lucide-react";

const Community = () => {
  const [activeTab, setActiveTab] = useState("discussions");

  return (
    <Layout>
      <div className="container mx-auto px-4 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">AI Community</h1>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
            Connect with AI enthusiasts, share your projects, and discover collaborative opportunities in our global community.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-3/4">
              <Tabs 
                defaultValue="discussions" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 mb-8">
                  <TabsTrigger value="discussions" className="flex items-center gap-1.5">
                    <MessageSquare size={16} />
                    <span>Discussions</span>
                  </TabsTrigger>
                  <TabsTrigger value="projects" className="flex items-center gap-1.5">
                    <BookOpen size={16} />
                    <span>Projects</span>
                  </TabsTrigger>
                  <TabsTrigger value="groups" className="flex items-center gap-1.5">
                    <Users size={16} />
                    <span>Groups</span>
                  </TabsTrigger>
                </TabsList>

                {/* Discussions Tab */}
                <TabsContent value="discussions" className="space-y-6">
                  {discussions.map((discussion) => (
                    <DiscussionCard key={discussion.id} discussion={discussion} />
                  ))}
                </TabsContent>

                {/* Projects Tab */}
                <TabsContent value="projects" className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                </TabsContent>

                {/* Groups Tab */}
                <TabsContent value="groups" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {groups.map((group) => (
                      <GroupCard key={group.id} group={group} />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="w-full md:w-1/4 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="font-medium">Top Contributors</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topContributors.map((contributor) => (
                    <div key={contributor.id} className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={contributor.avatar} alt={contributor.name} />
                        <AvatarFallback>{contributor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{contributor.name}</p>
                        <p className="text-xs text-foreground/60">{contributor.contributions} contributions</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="w-full">View All</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <h3 className="font-medium">Events</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="space-y-1">
                      <p className="text-sm font-medium">{event.name}</p>
                      <p className="text-xs text-foreground/60">{event.date}</p>
                      <p className="text-xs">{event.description}</p>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="w-full">View Calendar</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

// Discussion Card Component
const DiscussionCard = ({ discussion }) => (
  <Card className="transition-all hover:border-primary/50">
    <CardHeader className="pb-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={discussion.author.avatar} alt={discussion.author.name} />
            <AvatarFallback>{discussion.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-base">{discussion.title}</h3>
            <div className="flex items-center gap-2 text-xs text-foreground/60">
              <span>{discussion.author.name}</span>
              <span>•</span>
              <span>{discussion.date}</span>
            </div>
          </div>
        </div>
        <Badge variant="outline">{discussion.category}</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-foreground/80 line-clamp-3">{discussion.content}</p>
    </CardContent>
    <CardFooter className="flex justify-between border-t pt-3">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 h-8">
          <ThumbsUp size={14} />
          <span>{discussion.likes}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 h-8">
          <MessageCircle size={14} />
          <span>{discussion.comments}</span>
        </Button>
      </div>
      <Button variant="ghost" size="sm" className="h-8">
        <Share2 size={14} />
      </Button>
    </CardFooter>
  </Card>
);

// Project Card Component
const ProjectCard = ({ project }) => (
  <Card className="transition-all hover:border-primary/50">
    <CardHeader className="pb-3">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-base">{project.title}</h3>
        <Badge variant={project.status === "Active" ? "default" : "secondary"}>{project.status}</Badge>
      </div>
      <div className="flex items-center gap-2 text-xs text-foreground/60">
        <span>{project.author.name}</span>
        <span>•</span>
        <span>Updated {project.lastUpdated}</span>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-foreground/80 mb-3 line-clamp-2">{project.description}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {project.technologies.map((tech, i) => (
          <Badge key={i} variant="outline" className="bg-secondary/50">{tech}</Badge>
        ))}
      </div>
    </CardContent>
    <CardFooter className="flex justify-between border-t pt-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-xs">
          <Star size={14} className="text-foreground/60" />
          <span>{project.stars}</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <MessageSquare size={14} className="text-foreground/60" />
          <span>{project.discussions}</span>
        </div>
      </div>
      <div className="flex -space-x-2">
        {project.contributors.slice(0, 3).map((contributor, i) => (
          <Avatar key={i} className="border-2 border-background w-6 h-6">
            <AvatarImage src={contributor.avatar} alt={contributor.name} />
            <AvatarFallback>{contributor.name.charAt(0)}</AvatarFallback>
          </Avatar>
        ))}
        {project.contributors.length > 3 && (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-xs border-2 border-background">
            +{project.contributors.length - 3}
          </div>
        )}
      </div>
    </CardFooter>
  </Card>
);

// Group Card Component
const GroupCard = ({ group }) => (
  <Card className="transition-all hover:border-primary/50">
    <CardHeader className="pb-3">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-base">{group.name}</h3>
        <Badge variant="outline">{group.members} members</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-foreground/80 mb-4 line-clamp-2">{group.description}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {group.tags.map((tag, i) => (
          <Badge key={i} variant="outline" className="bg-secondary/50">{tag}</Badge>
        ))}
      </div>
    </CardContent>
    <CardFooter className="flex justify-between border-t pt-3">
      <Button size="sm" variant="default">Join Group</Button>
      <Button size="sm" variant="ghost">
        <Share2 size={14} />
      </Button>
    </CardFooter>
  </Card>
);

// Sample data
const discussions = [
  {
    id: 1,
    title: "How do you fine-tune BERT for sentiment analysis?",
    content: "I'm working on a project that requires sentiment analysis on product reviews. I'd like to fine-tune BERT for this task, but I'm running into issues with overfitting. Has anyone successfully implemented this and can share some tips or best practices?",
    author: {
      name: "Sarah Johnson",
      avatar: "https://randomuser.me/api/portraits/women/1.jpg"
    },
    category: "BERT",
    date: "2 hours ago",
    likes: 24,
    comments: 8
  },
  {
    id: 2,
    title: "Comparing transformer architectures for text summarization",
    content: "I've been experimenting with different transformer architectures for text summarization and would love to discuss the pros and cons of T5, BART, and Pegasus for this specific task. In my experiments, I've found that...",
    author: {
      name: "Michael Chen",
      avatar: "https://randomuser.me/api/portraits/men/2.jpg"
    },
    category: "Transformers",
    date: "Yesterday",
    likes: 56,
    comments: 23
  },
  {
    id: 3,
    title: "Deploying large LLMs in production environments",
    content: "With the growing size of language models, I'm facing challenges in deploying them efficiently in production. Has anyone had success with quantization or distillation techniques to reduce model size while maintaining acceptable performance?",
    author: {
      name: "Alex Williams",
      avatar: "https://randomuser.me/api/portraits/men/3.jpg"
    },
    category: "Deployment",
    date: "3 days ago",
    likes: 82,
    comments: 34
  },
  {
    id: 4,
    title: "Ethics in generative AI: Preventing harmful outputs",
    content: "I'm concerned about the potential for generative AI models to produce harmful or biased content. What are the best approaches for ensuring that these models are used responsibly and ethically?",
    author: {
      name: "Priya Patel",
      avatar: "https://randomuser.me/api/portraits/women/4.jpg"
    },
    category: "Ethics",
    date: "1 week ago",
    likes: 97,
    comments: 42
  }
];

const projects = [
  {
    id: 1,
    title: "MediScan: Medical Image Analysis with Vision Transformers",
    description: "An open-source platform for medical image analysis using Vision Transformers, specifically designed for early detection of lung abnormalities.",
    author: {
      name: "Dr. Emma Roberts",
      avatar: "https://randomuser.me/api/portraits/women/5.jpg"
    },
    status: "Active",
    lastUpdated: "2 days ago",
    technologies: ["PyTorch", "Vision Transformer", "Medical AI"],
    stars: 342,
    discussions: 28,
    contributors: [
      { name: "Emma Roberts", avatar: "https://randomuser.me/api/portraits/women/5.jpg" },
      { name: "James Wilson", avatar: "https://randomuser.me/api/portraits/men/6.jpg" },
      { name: "Liu Wei", avatar: "https://randomuser.me/api/portraits/men/7.jpg" },
      { name: "Sofia Garcia", avatar: "https://randomuser.me/api/portraits/women/6.jpg" }
    ]
  },
  {
    id: 2,
    title: "EcoLLM: Energy-Efficient Large Language Models",
    description: "Research project focused on developing energy-efficient methods for training and deploying large language models without compromising performance.",
    author: {
      name: "Daniel Kim",
      avatar: "https://randomuser.me/api/portraits/men/8.jpg"
    },
    status: "Active",
    lastUpdated: "1 week ago",
    technologies: ["TensorFlow", "LLM", "Green AI"],
    stars: 256,
    discussions: 15,
    contributors: [
      { name: "Daniel Kim", avatar: "https://randomuser.me/api/portraits/men/8.jpg" },
      { name: "Olivia Brown", avatar: "https://randomuser.me/api/portraits/women/7.jpg" },
      { name: "Thomas Martin", avatar: "https://randomuser.me/api/portraits/men/9.jpg" }
    ]
  },
  {
    id: 3,
    title: "VoiceGPT: Multilingual Speech Recognition and Generation",
    description: "An end-to-end system for multilingual speech recognition and generation using transformer-based architectures.",
    author: {
      name: "Sophia Martinez",
      avatar: "https://randomuser.me/api/portraits/women/8.jpg"
    },
    status: "Completed",
    lastUpdated: "1 month ago",
    technologies: ["Wav2Vec", "GPT", "Speech AI"],
    stars: 189,
    discussions: 12,
    contributors: [
      { name: "Sophia Martinez", avatar: "https://randomuser.me/api/portraits/women/8.jpg" },
      { name: "Robert Johnson", avatar: "https://randomuser.me/api/portraits/men/10.jpg" },
      { name: "Aisha Khan", avatar: "https://randomuser.me/api/portraits/women/9.jpg" },
      { name: "John Smith", avatar: "https://randomuser.me/api/portraits/men/11.jpg" }
    ]
  },
  {
    id: 4,
    title: "NeuroSim: Neural Network Simulation for Education",
    description: "Educational platform for visualizing and understanding how neural networks work, designed for students and educators.",
    author: {
      name: "Marcus Lee",
      avatar: "https://randomuser.me/api/portraits/men/12.jpg"
    },
    status: "Active",
    lastUpdated: "3 days ago",
    technologies: ["React", "D3.js", "Educational AI"],
    stars: 215,
    discussions: 19,
    contributors: [
      { name: "Marcus Lee", avatar: "https://randomuser.me/api/portraits/men/12.jpg" },
      { name: "Emily Davis", avatar: "https://randomuser.me/api/portraits/women/10.jpg" }
    ]
  }
];

const groups = [
  {
    id: 1,
    name: "Computer Vision Researchers",
    description: "A community of researchers exploring cutting-edge techniques in computer vision, object detection, and image segmentation.",
    members: 3245,
    tags: ["Computer Vision", "Object Detection", "CNN", "Vision Transformer"]
  },
  {
    id: 2,
    name: "NLP Enthusiasts",
    description: "Discuss the latest advancements in Natural Language Processing, from transformer architectures to multilingual models.",
    members: 4567,
    tags: ["NLP", "BERT", "GPT", "Transformers"]
  },
  {
    id: 3,
    name: "AI Ethics & Governance",
    description: "Focused on the ethical implications of AI and developing frameworks for responsible AI deployment.",
    members: 1823,
    tags: ["Ethics", "Governance", "Responsible AI", "Bias"]
  },
  {
    id: 4,
    name: "MLOps Practitioners",
    description: "Share best practices for deploying and maintaining machine learning models in production environments.",
    members: 2956,
    tags: ["MLOps", "DevOps", "Deployment", "Monitoring"]
  },
  {
    id: 5,
    name: "Reinforcement Learning",
    description: "Explore reinforcement learning algorithms, from classic approaches to cutting-edge techniques.",
    members: 2134,
    tags: ["RL", "Deep RL", "Q-Learning", "Policy Gradients"]
  },
  {
    id: 6,
    name: "AI for Healthcare",
    description: "Collaboration between healthcare professionals and AI researchers to develop solutions for medical challenges.",
    members: 1756,
    tags: ["Healthcare", "Medical AI", "Diagnosis", "Biomedical"]
  }
];

const topContributors = [
  {
    id: 1,
    name: "Maya Patel",
    avatar: "https://randomuser.me/api/portraits/women/11.jpg",
    contributions: 248
  },
  {
    id: 2,
    name: "David Wilson",
    avatar: "https://randomuser.me/api/portraits/men/13.jpg",
    contributions: 186
  },
  {
    id: 3,
    name: "Sophia Chen",
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
    contributions: 154
  },
  {
    id: 4,
    name: "Omar Hassan",
    avatar: "https://randomuser.me/api/portraits/men/14.jpg",
    contributions: 132
  }
];

const events = [
  {
    id: 1,
    name: "AI Summer Conference 2023",
    date: "August 15-18, 2023",
    description: "Annual conference featuring the latest research in artificial intelligence."
  },
  {
    id: 2,
    name: "NLP Workshop Series",
    date: "Every Tuesday, 7PM ET",
    description: "Weekly workshop exploring natural language processing techniques."
  },
  {
    id: 3,
    name: "Ethical AI Roundtable",
    date: "September 5, 2023",
    description: "Discussion on developing and implementing ethical guidelines for AI."
  }
];

export default Community;
