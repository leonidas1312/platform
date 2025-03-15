import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Download, Star, Users } from "lucide-react";

export interface ModelData {
  id: string;
  name: string;
  description: string;
  category: string;
  downloads: number;
  stars: number;
  author: string;
  imageUrl: string;
}

interface ModelCardProps {
  model: ModelData;
  index: number;
}

const ModelCard = ({ model, index }: ModelCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative"
    >
      <Link to={`/qubot-optimizer/${model.id}`} className="block focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 rounded-xl">
        <div className="bg-card hover:bg-card/95 transition-colors rounded-xl overflow-hidden border border-border group-hover:border-primary/20 group-hover:shadow-lg group-hover:shadow-primary/5">
          <div className="h-40 overflow-hidden relative">
            <img 
              src={model.imageUrl} 
              alt={model.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent"></div>
            <div className="absolute bottom-3 left-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-background/80 backdrop-blur-sm">
                {model.category}
              </span>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">{model.name}</h3>
            <p className="text-sm text-foreground/70 mb-3 line-clamp-2">
              {model.description}
            </p>
            <div className="flex items-center justify-between text-xs text-foreground/60">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Download size={14} />
                  {model.downloads.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Star size={14} />
                  {model.stars.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={14} />
                <span>{model.author}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ModelCard;
