import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-2"
          >
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="bg-primary text-primary-foreground rounded-full p-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" fill="currentColor"/>
                  <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <span className="font-medium text-lg tracking-tight">Rastion</span>
            </Link>
            <p className="text-sm text-foreground/70 mb-6 max-w-md">
              AI Platform is your gateway to cutting-edge artificial intelligence. Access, deploy, and customize state-of-the-art models for various AI tasks.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                aria-label="GitHub"
              >
                <Github size={18} />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={18} />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/models" className="text-sm text-foreground/70 hover:text-primary transition-colors">Models</Link>
              </li>
              <li>
                <Link to="/datasets" className="text-sm text-foreground/70 hover:text-primary transition-colors">Datasets</Link>
              </li>
              <li>
                <Link to="/spaces" className="text-sm text-foreground/70 hover:text-primary transition-colors">Spaces</Link>
              </li>
              <li>
                <Link to="/docs" className="text-sm text-foreground/70 hover:text-primary transition-colors">Documentation</Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-foreground/70 hover:text-primary transition-colors">Pricing</Link>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-foreground/70 hover:text-primary transition-colors">About</Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-foreground/70 hover:text-primary transition-colors">Blog</Link>
              </li>
              <li>
                <Link to="/careers" className="text-sm text-foreground/70 hover:text-primary transition-colors">Careers</Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-foreground/70 hover:text-primary transition-colors">Contact</Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-foreground/70 hover:text-primary transition-colors">Privacy</Link>
              </li>
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-sm text-foreground/60">
            © {new Date().getFullYear()} AI Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="text-sm text-foreground/60 hover:text-primary transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="text-sm text-foreground/60 hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link to="/cookies" className="text-sm text-foreground/60 hover:text-primary transition-colors">
              Cookies
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
