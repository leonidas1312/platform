import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Database, Download, Star, Users } from "lucide-react";

export interface DatasetData {
  id: string;
  name: string;
  description: string;
  category: string;
  downloads: number;
  stars: number;
  author: string;
  imageUrl: string;
  size: string;
  samples: number;
}

interface DatasetCardProps {
  dataset: DatasetData;
  index: number;
}

const DatasetCard = ({ dataset, index }: DatasetCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative"
    >
      <Link to={`/dataset/${dataset.id}`} className="block focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 rounded-xl">
        <div className="bg-card hover:bg-card/95 transition-colors rounded-xl overflow-hidden border border-border group-hover:border-primary/20 group-hover:shadow-lg group-hover:shadow-primary/5">
          <div className="h-40 overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/20">
              <Database size={48} className="text-secondary-foreground/40" />
            </div>
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-background/80 backdrop-blur-sm">
                {dataset.size}
              </span>
            </div>
            <div className="absolute bottom-3 left-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-background/80 backdrop-blur-sm">
                {dataset.category}
              </span>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">{dataset.name}</h3>
            <p className="text-sm text-foreground/70 mb-3 line-clamp-2">
              {dataset.description}
            </p>
            <div className="flex items-center justify-between text-xs text-foreground/60">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Download size={14} />
                  {dataset.downloads.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Star size={14} />
                  {dataset.stars.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={14} />
                <span>{dataset.author}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default DatasetCard;
