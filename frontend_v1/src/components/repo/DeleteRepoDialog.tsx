"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

interface DeleteRepoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  owner: string
  repoName: string
  onDelete: () => Promise<void>
  isDeleting: boolean
}

export default function DeleteRepoDialog({
  open,
  onOpenChange,
  owner,
  repoName,
  onDelete,
  isDeleting,
}: DeleteRepoDialogProps) {
  const [confirmation, setConfirmation] = useState("")
  const isConfirmed = confirmation === `${owner}/${repoName}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Repository</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the repository, wiki, issues, comments, packages,
            secrets, workflow runs, and remove all collaborator associations.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="rounded-md bg-destructive/10 p-4 mb-4 border border-destructive/30">
            <p className="text-sm text-destructive font-medium">
              Please type{" "}
              <span className="font-bold">
                {owner}/{repoName}
              </span>{" "}
              to confirm.
            </p>
          </div>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={`${owner}/${repoName}`}
            className="w-full"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={!isConfirmed || isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Repository"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
