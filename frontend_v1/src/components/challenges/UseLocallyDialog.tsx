import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, Code, Database, Target } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface UseLocallyDialogProps {
  isOpen: boolean
  onClose: () => void
  challenge: any
}

export const UseLocallyDialog: React.FC<UseLocallyDialogProps> = ({
  isOpen,
  onClose,
  challenge
}) => {
  const [copied, setCopied] = useState(false)

  if (!challenge) return null

  const generateCode = () => {
    const datasetName = challenge.dataset_info?.name || 'dataset'
    const problemRepo = challenge.problem_config?.repository || 'username/problem-repo'
    
    return `# Optimization Challenge: ${challenge.name}
# ${challenge.description || 'No description provided'}

from qubots import AutoProblem, load_dataset_from_platform

# Set your Rastion API token
RASTION_TOKEN = "your_rastion_token_here"

# Load the dataset from Rastion platform
dataset = load_dataset_from_platform(
    token=RASTION_TOKEN,
    dataset_id="${challenge.id}"  # Challenge dataset ID
)

# Load the problem repository
problem = AutoProblem.from_repo("${problemRepo}")

# Load the problem with the dataset
problem_instance = problem.load(dataset)

# Now you can use your own optimizer
# from qubots import AutoOptimizer
# optimizer = AutoOptimizer.from_repo("your_username/your_optimizer")
# result = optimizer.optimize(problem_instance)

print(f"Challenge: ${challenge.name}")
print(f"Problem Type: ${challenge.problem_type}")
print(f"Dataset: ${datasetName}")
print(f"Problem Repository: ${problemRepo}")
print("Ready for optimization!")
`
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generateCode())
      setCopied(true)
      toast({
        title: "Code copied!",
        description: "The code has been copied to your clipboard."
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
      toast({
        title: "Copy failed",
        description: "Failed to copy code to clipboard.",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            Use Locally: {challenge.name}
          </DialogTitle>
          <DialogDescription>
            Copy this code to work with this optimization challenge locally using the Qubots framework.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Challenge Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="font-medium">Challenge Details</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Problem Type:</span>
                <Badge variant="secondary" className="ml-2">{challenge.problem_type}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Difficulty:</span>
                <Badge variant="outline" className="ml-2">{challenge.difficulty_level}</Badge>
              </div>
            </div>
            
            {challenge.dataset_info?.name && (
              <div className="flex items-center gap-2 text-sm">
                <Database className="h-3 w-3" />
                <span className="text-muted-foreground">Dataset:</span>
                <span>{challenge.dataset_info.name}</span>
              </div>
            )}
            
            {challenge.problem_config?.repository && (
              <div className="flex items-center gap-2 text-sm">
                <Code className="h-3 w-3" />
                <span className="text-muted-foreground">Problem Repository:</span>
                <span className="font-mono">{challenge.problem_config.repository}</span>
              </div>
            )}
          </div>

          {/* Code Block */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Python Code</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
            
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                <code>{generateCode()}</code>
              </pre>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <span className="font-medium">Instructions</span>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>1. Install the Qubots framework: <code className="bg-muted px-1 rounded">pip install qubots</code></p>
              <p>2. Get your Rastion API token from your account settings</p>
              <p>3. Replace <code className="bg-muted px-1 rounded">"your_rastion_token_here"</code> with your actual token</p>
              <p>4. Create your own optimizer repository and replace the optimizer loading section</p>
              <p>5. Run the code to start working with this challenge locally</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
