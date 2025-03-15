import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Star, Users, ExternalLink, Share2, BookOpen, Code, MessageSquare } from "lucide-react";
import Layout from "../components/Layout";
import Loading from "../components/Loading";
import { ModelData } from "../components/ModelCard";

// Sample model data
const modelData: ModelData[] = [
  {
    id: "bert-base-uncased",
    name: "BERT Base Uncased",
    description: "Pre-trained model on English language using a masked language modeling objective. This is an uncased model: it does not make a difference between english and English.",
    category: "Text",
    downloads: 2500000,
    stars: 12500,
    author: "Google Research",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  },
  {
    id: "gpt2",
    name: "GPT-2",
    description: "GPT-2 is a transformers model pre-trained on a very large corpus of English data in a self-supervised fashion. It was trained to predict the next word in sentence given all the previous words.",
    category: "Text",
    downloads: 1800000,
    stars: 9800,
    author: "OpenAI",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  },
  {
    id: "vit-base-patch16-224",
    name: "ViT Base",
    description: "Vision Transformer (ViT) model pre-trained on ImageNet-21k at resolution 224x224, and fine-tuned on ImageNet 2012. It was introduced in the paper 'An Image is Worth 16x16 Words'.",
    category: "Vision",
    downloads: 950000,
    stars: 6200,
    author: "Google Research",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  },
  {
    id: "wav2vec2-base",
    name: "Wav2Vec2 Base",
    description: "Wav2Vec2 is a speech model that is trained using contrastive self-supervised learning, then fine-tuned for speech recognition with connectionist temporal classification.",
    category: "Audio",
    downloads: 780000,
    stars: 5400,
    author: "Facebook AI",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  },
  {
    id: "clip-vit-base-patch32",
    name: "CLIP ViT",
    description: "CLIP (Contrastive Language-Image Pre-Training) is a model trained to learn visual concepts from natural language supervision, connecting images and text.",
    category: "Multimodal",
    downloads: 1250000,
    stars: 8300,
    author: "OpenAI",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  },
  {
    id: "whisper-small",
    name: "Whisper Small",
    description: "Whisper is a robust speech recognition model that can transcribe speech in multiple languages and even translate it to English.",
    category: "Audio",
    downloads: 920000,
    stars: 7100,
    author: "OpenAI",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  },
  {
    id: "deit-base-distilled",
    name: "DeiT Base",
    description: "Data-efficient Image Transformer (DeiT) is a vision transformer model trained with knowledge distillation using a teacher-student setup.",
    category: "Vision",
    downloads: 450000,
    stars: 3200,
    author: "Facebook AI",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  },
  {
    id: "t5-base",
    name: "T5 Base",
    description: "T5 (Text-to-Text Transfer Transformer) treats every NLP problem as a text-to-text problem, converting all inputs to text and training it to produce the desired output.",
    category: "Text",
    downloads: 1650000,
    stars: 9100,
    author: "Google Research",
    imageUrl: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
  }
];

const tabs = [
  { id: "overview", label: "Overview", icon: <BookOpen size={16} /> },
  { id: "code", label: "Code", icon: <Code size={16} /> },
  { id: "community", label: "Community", icon: <MessageSquare size={16} /> }
];

const QubotOptDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [model, setModel] = useState<ModelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const foundModel = modelData.find(m => m.id === id) || null;
      setModel(foundModel);
      setLoading(false);
    }, 1000);
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (!model) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Model not found</h2>
          <p className="mb-6 text-foreground/70">
            The model you're looking for doesn't exist or has been removed.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft size={16} />
            Return Home
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back to models
          </Link>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-2/3">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {model.category}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{model.name}</h1>
              <p className="text-lg text-foreground/70 mb-6">
                {model.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 mb-8 text-sm">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-foreground/60" />
                  <span>{model.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download size={18} className="text-foreground/60" />
                  <span>{model.downloads.toLocaleString()} downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-foreground/60" />
                  <span>{model.stars.toLocaleString()} stars</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 flex items-center gap-2">
                  <Download size={16} />
                  Download Model
                </button>
                <button className="px-5 py-2.5 rounded-full border border-border bg-card hover:bg-secondary transition-colors flex items-center gap-2">
                  <ExternalLink size={16} />
                  Try in Browser
                </button>
                <button className="p-2.5 rounded-full border border-border bg-card hover:bg-secondary transition-colors">
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            <div className="w-full md:w-1/3 bg-card rounded-xl overflow-hidden border border-border">
              <img 
                src={model.imageUrl} 
                alt={model.name}
                className="w-full aspect-video object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold mb-2">Model Card</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground/70">ID</span>
                    <span className="font-mono">{model.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/70">Type</span>
                    <span>{model.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/70">License</span>
                    <span>Apache 2.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/70">Last updated</span>
                    <span>2 months ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="border-b border-border mb-8">
            <div className="flex overflow-x-auto hide-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    activeTab === tab.id 
                      ? "border-primary text-primary" 
                      : "border-transparent text-foreground/60 hover:text-foreground/80 hover:border-border"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[400px]">
            {activeTab === "overview" && (
              <div className="prose prose-slate max-w-full">
                <h2>Model Description</h2>
                <p>
                  {model.name} is a transformer-based model designed for {model.category.toLowerCase()} processing tasks. 
                  It was developed by {model.author} and has been used extensively across various applications.
                </p>
                
                <h3>Architecture</h3>
                <p>
                  The model is based on the transformer architecture, which uses self-attention mechanisms to process input data. 
                  This allows it to capture contextual relationships effectively.
                </p>

                <h3>Training Data</h3>
                <p>
                  The model was pre-trained on a large corpus of data, including books, articles, websites, and other text sources. 
                  This comprehensive training enables it to understand and generate human-like text across a wide range of topics.
                </p>

                <h3>Use Cases</h3>
                <ul>
                  <li>Natural language understanding</li>
                  <li>Text classification</li>
                  <li>Question answering</li>
                  <li>Text generation</li>
                  <li>Sentiment analysis</li>
                </ul>

                <h3>Limitations</h3>
                <p>
                  While powerful, the model has certain limitations. It may sometimes generate incorrect or biased content, and its knowledge is limited to its training data.
                  Users should review and verify any outputs for critical applications.
                </p>
              </div>
            )}

            {activeTab === "code" && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="font-mono text-sm p-4 bg-muted rounded-md overflow-x-auto">
                  <pre>
{`from transformers import AutoModel, AutoTokenizer

# Load model and tokenizer
tokenizer = AutoTokenizer.from_pretrained("${model.id}")
model = AutoModel.from_pretrained("${model.id}")

# Example input
text = "Hello, I'm a language model!"
inputs = tokenizer(text, return_tensors="pt")

# Forward pass
outputs = model(**inputs)

# Get the output embeddings
last_hidden_state = outputs.last_hidden_state`}
                  </pre>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Installation</h3>
                  <div className="font-mono text-sm p-4 bg-muted rounded-md">
                    <pre>pip install transformers</pre>
                  </div>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Inference API</h3>
                  <p className="text-foreground/70 mb-4">Try the model directly in your browser with the Inference API</p>
                  <button className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-medium transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20">
                    Open Inference API
                  </button>
                </div>
              </div>
            )}

            {activeTab === "community" && (
              <div>
                <div className="bg-card border border-border rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-medium mb-4">Discussion (24)</h3>
                  <div className="flex flex-col gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border-b border-border pb-6 last:border-0 last:pb-0">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-secondary"></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">User{i}</h4>
                              <span className="text-xs text-foreground/60">{i} days ago</span>
                            </div>
                            <p className="text-sm text-foreground/80 mb-2">
                              {i === 1
                                ? "This model works great! I've been using it for sentiment analysis with excellent results."
                                : i === 2
                                ? "How much VRAM does this require? I'm having trouble running it on my RTX 3060."
                                : "Is there a quantized version available for edge devices?"}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-foreground/60">
                              <button className="hover:text-primary transition-colors">Reply</button>
                              <button className="hover:text-primary transition-colors">Like (3)</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Leave a comment</h3>
                  <textarea 
                    className="w-full px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background mb-4"
                    rows={4}
                    placeholder="Share your thoughts or ask a question..."
                  ></textarea>
                  <button className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-medium transition-all hover:bg-primary/90">
                    Post Comment
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default QubotOptDetail;
