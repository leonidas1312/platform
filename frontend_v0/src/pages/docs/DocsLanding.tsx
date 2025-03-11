import React from "react";
import { Button } from "@/components/ui/button";
import { Terminal, Notebook } from "lucide-react";

const DocsLanding = () => {
  return (
    <div className="prose max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Documentation Home</h1>
      <p>
        Welcome to the Qubots documentation! Here you'll discover guides, tutorials, and examples designed to help you get started and master our collaborative optimization framework.
      </p>
      <p>
        Whether you're new to Qubots or a seasoned contributor, our docs provide step-by-step instructions on installing, configuring, and creating your own qubots.
      </p>
      <div className="mt-6">
        <Button variant="default" className="mr-4">
          <Terminal className="w-4 h-4 mr-2" />
          CLI Documentation
        </Button>
        <Button variant="secondary">
          <Notebook className="w-4 h-4 mr-2" />
          Example Notebooks
        </Button>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Explore Topics</h2>
        <ul className="list-disc ml-6">
          <li>Getting Started: Installation, Introduction, and Quickstart Guides</li>
          <li>Qubot Problems & Formulations</li>
          <li>Qubot Optimizers</li>
          <li>Client Commands</li>
          <li>Sharing Your Qubots: Best practices and templates</li>
        </ul>
      </div>
    </div>
  );
};

export default DocsLanding;
