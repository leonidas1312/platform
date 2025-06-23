import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  GitBranch,
  Copy,
  ExternalLink,
  CheckCircle
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface GitCommandModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repositoryPath: string
  repositoryName?: string
  repositoryOwner?: string
  repositoryUrl?: string
}

export function GitCommandModal({
  open,
  onOpenChange,
  repositoryPath,
  repositoryName,
  repositoryOwner,
  repositoryUrl
}: GitCommandModalProps) {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  const baseUrl = "https://hub.rastion.com"
  const fullRepoUrl = repositoryUrl || `${baseUrl}/${repositoryPath}`
  const cloneUrl = `${fullRepoUrl}.git`

  const commands = {
    pull: `git clone ${cloneUrl}`
  }

  const copyToClipboard = async (text: string, commandType: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCommand(commandType)
      setTimeout(() => setCopiedCommand(null), 2000)
      
      toast({
        title: "Copied to clipboard",
        description: `${commandType} command has been copied to your clipboard.`
      })
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      toast({
        title: "Copy failed",
        description: "Please copy the command manually.",
        variant: "destructive"
      })
    }
  }

  const CommandBlock = ({ 
    title, 
    command, 
    description, 
    commandKey 
  }: { 
    title: string
    command: string
    description: string
    commandKey: string
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{title}</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyToClipboard(command, title)}
          className="h-7"
        >
          {copiedCommand === title ? (
            <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
          ) : (
            <Copy className="h-3 w-3 mr-1" />
          )}
          {copiedCommand === title ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <div className="bg-muted p-3 rounded-lg">
        <code className="text-sm bg-background p-2 rounded block font-mono">
          {command}
        </code>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Local usage: {repositoryPath}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          
          {/* Git Pull Command */}
          <div className="space-y-4">
          
            <CommandBlock
              title=""
              command={commands.pull}
              description="Clone the leaderboard problem locally to experiment with optimizers."
              commandKey="pull"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={() => window.open(fullRepoUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Hub
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
