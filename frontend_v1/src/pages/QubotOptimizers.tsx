import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";
import Layout from "../components/Layout";
import ModelCard, { ModelData } from "../components/ModelCard";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Sample data - extended with more QubotOptimizers
const modelData: ModelData[] = [
  {
    id: "bert-base-uncased",
    name: "BERT Base Uncased",
    description: "Pre-trained model on English language using a masked language modeling objective",
    category: "Text",
    downloads: 2500000,
    stars: 12500,
    author: "Google Research",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  },
  {
    id: "gpt2",
    name: "GPT-2",
    description: "Language model trained on 8 million web pages to predict the next word",
    category: "Text",
    downloads: 1800000,
    stars: 9800,
    author: "OpenAI",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  },
  {
    id: "vit-base-patch16-224",
    name: "ViT Base",
    description: "Vision Transformer model pre-trained on ImageNet-21k at resolution 224x224",
    category: "Vision",
    downloads: 950000,
    stars: 6200,
    author: "Google Research",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  },
  {
    id: "wav2vec2-base",
    name: "Wav2Vec2 Base",
    description: "Pre-trained model for speech recognition and audio processing tasks",
    category: "Audio",
    downloads: 780000,
    stars: 5400,
    author: "Facebook AI",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  },
  {
    id: "clip-vit-base-patch32",
    name: "CLIP ViT",
    description: "Model trained to learn visual concepts from natural language supervision",
    category: "Multimodal",
    downloads: 1250000,
    stars: 8300,
    author: "OpenAI",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  },
  {
    id: "whisper-small",
    name: "Whisper Small",
    description: "Robust speech recognition model that can transcribe speech in multiple languages",
    category: "Audio",
    downloads: 920000,
    stars: 7100,
    author: "OpenAI",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  },
  {
    id: "deit-base-distilled",
    name: "DeiT Base",
    description: "Data-efficient Image Transformer model trained with knowledge distillation",
    category: "Vision",
    downloads: 450000,
    stars: 3200,
    author: "Facebook AI",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  },
  {
    id: "t5-base",
    name: "T5 Base",
    description: "Text-to-Text Transfer Transformer model for various NLP tasks",
    category: "Text",
    downloads: 1650000,
    stars: 9100,
    author: "Google Research",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  },
  {
    id: "roberta-large",
    name: "RoBERTa Large",
    description: "Robustly optimized BERT approach with larger training data and parameters",
    category: "Text",
    downloads: 1350000,
    stars: 8750,
    author: "Facebook AI",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  },
  {
    id: "stable-diffusion-v1-5",
    name: "Stable Diffusion v1.5",
    description: "Latent text-to-image diffusion model capable of generating photo-realistic images",
    category: "Multimodal",
    downloads: 3200000,
    stars: 25000,
    author: "Stability AI",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  },
  {
    id: "llama-7b",
    name: "LLaMA 7B",
    description: "Foundation language model with 7 billion parameters",
    category: "Text",
    downloads: 2100000,
    stars: 18500,
    author: "Meta AI",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  },
  {
    id: "detr-resnet-50",
    name: "DETR ResNet-50",
    description: "End-to-end object detection model using Transformers",
    category: "Vision",
    downloads: 520000,
    stars: 4300,
    author: "Facebook AI",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  }
];

const categories = ["All", "Text", "Vision", "Audio", "Multimodal"];
const sortOptions = ["Most Popular", "Newest", "Most Stars", "Most Downloads"];

const QubotOptimizers = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSort, setActiveSort] = useState("Most Popular");
  const [showFilters, setShowFilters] = useState(false);

  // Filter QubotOptimizers based on category and search query
  const filteredModels = modelData
    .filter(model => 
      (activeCategory === "All" || model.category === activeCategory) &&
      (model.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
       model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
       model.author.toLowerCase().includes(searchQuery.toLowerCase()))
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">AI Models</h1>
          <p className="text-lg max-w-3xl">
            Explore our comprehensive collection of state-of-the-art AI models across various domains. 
            Find the perfect model for your next project.
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
              <Search className="absolute left-3 top-2.5 h-5 w-5 " />
              <input
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
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

        {/* Results Count */}
        <div className="text-sm  mb-6">
          {filteredModels.length} {filteredModels.length === 1 ? 'model' : 'models'} found
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredModels.map((model, index) => (
            <ModelCard key={model.id} model={model} index={index} />
          ))}
        </div>

        {filteredModels.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl ">No models match your search criteria</p>
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

export default QubotOptimizers;
