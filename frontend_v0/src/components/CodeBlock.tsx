import { useState, useEffect } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/themes/prism-tomorrow.css";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock = ({ code, language = "python" }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Re-run Prism syntax highlighting whenever `code` changes
    Prism.highlightAll();
  }, [code]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);

    // Reset "copied" status after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mb-6 overflow-hidden rounded-lg border border-gray-200 bg-[#282c34] shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8 hover:bg-white/10"
        onClick={copyToClipboard}
      >
        {copied ? (
          <Check className="h-4 w-4 text-white" />
        ) : (
          <Copy className="h-4 w-4 text-white" />
        )}
      </Button>
      <pre className="m-0 p-4 overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
