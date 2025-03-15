import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown, Database, FileSpreadsheet, Table } from "lucide-react";
import Layout from "../components/Layout";
import DatasetCard, { DatasetData } from "../components/DatasetCard";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Sample data for datasets
const datasetData: DatasetData[] = [
  {
    id: "imagenet",
    name: "ImageNet",
    description: "A large-scale hierarchical image database with millions of labeled images across thousands of categories",
    category: "Vision",
    downloads: 1450000,
    stars: 8900,
    author: "Stanford Vision Lab",
    imageUrl: "",
    size: "150 GB",
    samples: 14000000
  },
  {
    id: "coco",
    name: "COCO Dataset",
    description: "Common Objects in Context - a large-scale object detection, segmentation, and captioning dataset",
    category: "Vision",
    downloads: 980000,
    stars: 7500,
    author: "Microsoft COCO",
    imageUrl: "",
    size: "25 GB",
    samples: 330000
  },
  {
    id: "squad",
    name: "SQuAD",
    description: "Stanford Question Answering Dataset - a reading comprehension dataset with questions and answers",
    category: "Text",
    downloads: 850000,
    stars: 5600,
    author: "Stanford NLP",
    imageUrl: "",
    size: "35 MB",
    samples: 150000
  },
  {
    id: "glue",
    name: "GLUE Benchmark",
    description: "General Language Understanding Evaluation - a collection of resources for evaluating NLU systems",
    category: "Text",
    downloads: 720000,
    stars: 4900,
    author: "NYU & UW",
    imageUrl: "",
    size: "200 MB",
    samples: 280000
  },
  {
    id: "librispeech",
    name: "LibriSpeech",
    description: "Large-scale corpus of read English speech derived from audiobooks of the LibriVox project",
    category: "Audio",
    downloads: 680000,
    stars: 4200,
    author: "Vassil Panayotov",
    imageUrl: "",
    size: "60 GB",
    samples: 1000
  },
  {
    id: "voxceleb",
    name: "VoxCeleb",
    description: "A large-scale speaker identification dataset collected from videos in YouTube",
    category: "Audio",
    downloads: 450000,
    stars: 3100,
    author: "University of Oxford",
    imageUrl: "",
    size: "40 GB",
    samples: 100000
  },
  {
    id: "flickr30k",
    name: "Flickr30k",
    description: "Dataset of 30,000 images collected from Flickr with 5 captions per image",
    category: "Multimodal",
    downloads: 380000,
    stars: 2800,
    author: "UIUC",
    imageUrl: "",
    size: "5 GB",
    samples: 30000
  },
  {
    id: "mnist",
    name: "MNIST",
    description: "Database of handwritten digits with 60,000 training examples and 10,000 test examples",
    category: "Vision",
    downloads: 1250000,
    stars: 6800,
    author: "Yann LeCun",
    imageUrl: "",
    size: "11 MB",
    samples: 70000
  },
  {
    id: "kinetics-400",
    name: "Kinetics-400",
    description: "Large-scale dataset of video clips covering 400 human action classes",
    category: "Video",
    downloads: 420000,
    stars: 3500,
    author: "DeepMind",
    imageUrl: "",
    size: "450 GB",
    samples: 306000
  },
  {
    id: "wikitext",
    name: "WikiText",
    description: "Long-term dependency language modeling dataset derived from verified articles on Wikipedia",
    category: "Text",
    downloads: 520000,
    stars: 3800,
    author: "Salesforce Research",
    imageUrl: "",
    size: "250 MB",
    samples: 103000000
  },
  {
    id: "celeba",
    name: "CelebA",
    description: "Large-scale face attributes dataset with more than 200K celebrity images",
    category: "Vision",
    downloads: 780000,
    stars: 5200,
    author: "MMLAB",
    imageUrl: "",
    size: "1.8 GB",
    samples: 202599
  },
  {
    id: "audioset",
    name: "AudioSet",
    description: "Large-scale dataset of manually annotated audio events from YouTube videos",
    category: "Audio",
    downloads: 390000,
    stars: 2900,
    author: "Google Research",
    imageUrl: "",
    size: "2.3 TB",
    samples: 2084320
  }
];

const categories = ["All", "Text", "Vision", "Audio", "Video", "Multimodal"];
const sortOptions = ["Most Popular", "Newest", "Most Stars", "Most Downloads", "Largest Size"];

const QubotProblems = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSort, setActiveSort] = useState("Most Popular");
  const [showFilters, setShowFilters] = useState(false);

  // Filter datasets based on category and search query
  const filteredDatasets = datasetData
    .filter(dataset => 
      (activeCategory === "All" || dataset.category === activeCategory) &&
      (dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
       dataset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
       dataset.author.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      switch (activeSort) {
        case "Most Stars":
          return b.stars - a.stars;
        case "Most Downloads":
          return b.downloads - a.downloads;
        case "Newest":
          // For demo, we'll just reverse the array
          return -1;
        case "Largest Size":
          // This is a simplistic approach - in real app you'd parse the size strings
          return b.samples - a.samples;
        default:
          // Most Popular - combination of stars and downloads
          return (b.stars + b.downloads/100) - (a.stars + a.downloads/100);
      }
    });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">Datasets</h1>
          </div>
          <p className="text-lg text-foreground/70 max-w-3xl">
            Browse our curated collection of high-quality datasets for training and evaluating AI models.
            From text and vision to audio and multimodal data, find the perfect dataset for your research or application.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-foreground/50" />
              <input
                type="text"
                placeholder="Search datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters <ChevronDown size={16} />
                </Button>
                {showFilters && (
                  <Card className="absolute right-0 mt-2 z-10 w-72 p-4 shadow-lg">
                    <CardContent className="p-0">
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Sort by</p>
                        <div className="flex flex-wrap gap-2">
                          {sortOptions.map((option) => (
                            <Badge
                              key={option}
                              variant={activeSort === option ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => setActiveSort(option)}
                            >
                              {option}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </motion.div>

        <Separator className="my-8" />

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <Database className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm text-foreground/70">Total Datasets</p>
                <p className="text-2xl font-bold">{datasetData.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <FileSpreadsheet className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm text-foreground/70">Categories</p>
                <p className="text-2xl font-bold">{categories.length - 1}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <Table className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm text-foreground/70">Total Samples</p>
                <p className="text-2xl font-bold">120M+</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Count */}
        <div className="text-sm text-foreground/70 mb-6">
          {filteredDatasets.length} {filteredDatasets.length === 1 ? 'dataset' : 'datasets'} found
        </div>

        {/* Datasets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDatasets.map((dataset, index) => (
            <DatasetCard key={dataset.id} dataset={dataset} index={index} />
          ))}
        </div>

        {filteredDatasets.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-foreground/70">No datasets match your search criteria</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("All");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QubotProblems;
