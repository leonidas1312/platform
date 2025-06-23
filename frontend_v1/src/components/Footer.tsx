import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin, Youtube } from "lucide-react";
import { RastionLogo } from "@/components/ui/RastionLogo";
import { DiscordIcon } from "@/components/ui/custom-icons";

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
              <RastionLogo className="h-16 w-auto" height={64} width={64} />
              <span className="font-medium text-lg tracking-tight">Rastion</span>
            </Link>
            <p className="text-sm text-foreground/70 mb-6 max-w-md">
              The open source community for optimization.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/leonidas1312/qubots"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                aria-label="GitHub"
              >
                <Github size={18} />
              </a>
              <a
                href="https://discord.gg/E2rnssmh9Y"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                aria-label="Discord"
              >
                <DiscordIcon size={18} />
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
                <Link to="/qubots" className="text-sm text-foreground/70 hover:text-primary transition-colors">Qubots</Link>
              </li>
              <li>
                <Link to="/qubots-playground" className="text-sm text-foreground/70 hover:text-primary transition-colors">Playground</Link>
              </li>
              <li>
                <Link to="/optimization-workflows" className="text-sm text-foreground/70 hover:text-primary transition-colors">Experiments</Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-sm text-foreground/70 hover:text-primary transition-colors">Leaderboard</Link>
              </li>
              <li>
                <Link to="/benchmark" className="text-sm text-foreground/70 hover:text-primary transition-colors">Benchmarks</Link>
              </li>
              <li>
                <a href="https://docs.rastion.com" target="_blank" rel="noopener noreferrer" className="text-sm text-foreground/70 hover:text-primary transition-colors">Documentation</a>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="font-semibold mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://discord.gg/E2rnssmh9Y" target="_blank" rel="noopener noreferrer" className="text-sm text-foreground/70 hover:text-primary transition-colors">Discord</a>
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
            © {new Date().getFullYear()} Rastion. All rights reserved.
          </p>

        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
