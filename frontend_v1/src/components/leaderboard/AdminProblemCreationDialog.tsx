import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, GitBranch } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { RepositorySelector } from "@/components/common/RepositorySelector"

const API = import.meta.env.VITE_API_BASE

interface AdminProblemCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProblemCreated: () => void
}

export function AdminProblemCreationDialog({
  open,
  onOpenChange,
  onProblemCreated
}: AdminProblemCreationDialogProps) {
  const [problemName, setProblemName] = useState("")
  const [selectedRepository, setSelectedRepository] = useState("")
  const [optimizationType, setOptimizationType] = useState("minimize")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)



  const handleCreate = async () => {
    if (!problemName.trim() || !selectedRepository) {
      setError("Please provide a problem name and select a repository")
      return
    }

    setCreating(true)
    setError(null)

    try {
      const response = await fetch(`${API}/api/leaderboard/problems/from-repository`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: problemName.trim(),
          repository_path: selectedRepository,
          optimization_type: optimizationType
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create leaderboard problem')
      }

      if (data.success) {
        toast({
          title: "Problem Created",
          description: `Leaderboard problem "${problemName}" has been created successfully.`
        })
        
        // Reset form
        setProblemName("")
        setSelectedRepository("")
        setOptimizationType("minimize")

        onProblemCreated()
        onOpenChange(false)
      } else {
        throw new Error(data.message || 'Failed to create leaderboard problem')
      }
    } catch (error: any) {
      console.error('Error creating problem:', error)
      setError(error.message || 'Failed to create leaderboard problem')
    } finally {
      setCreating(false)
    }
  }



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Create Leaderboard Problem
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Problem Name */}
          <div className="space-y-2">
            <Label htmlFor="problemName">Problem Name *</Label>
            <Input
              id="problemName"
              value={problemName}
              onChange={(e) => setProblemName(e.target.value)}
              placeholder="Enter a descriptive name for the leaderboard problem"
              disabled={creating}
            />
          </div>

          {/* Repository Selection */}
          <RepositorySelector
            label="Repository *"
            value={selectedRepository}
            onValueChange={setSelectedRepository}
            placeholder="Select a repository for the leaderboard problem"
            disabled={creating}
            showTypeFilter={true}
            filterByType="problem"
            required={true}
          />

          {/* Optimization Type */}
          <div className="space-y-2">
            <Label htmlFor="optimizationType">Optimization Type *</Label>
            <Select value={optimizationType} onValueChange={setOptimizationType} disabled={creating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimize">Minimization</SelectItem>
                <SelectItem value="maximize">Maximization</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !problemName.trim() || !selectedRepository || !optimizationType}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Problem'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
