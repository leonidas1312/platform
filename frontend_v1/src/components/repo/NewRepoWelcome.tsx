"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Book, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface NewRepoWelcomeProps {
  owner: string
  repoName: string
  repo: {
    owner: { login: string }
    name: string
    private: boolean
  }
  onCreateQubotCard: () => void
}

export default function NewRepoWelcome({ owner, repoName, repo, onCreateQubotCard }: NewRepoWelcomeProps) {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto px-4 py-8 mt-32 bg-background text-foreground">
      <div className="flex flex-col space-y-4 mb-8 bg-gradient-to-r from-background via-background/80 to-primary/5 rounded-xl p-6 border border-border/40 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" />
            <button
              onClick={() => navigate(`/u/${repo.owner.login}`)}
              className="text-muted-foreground hover:text-primary hover:underline transition-colors"
            >
              {repo.owner.login}
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold">{repo.name}</span>
            <Badge variant="outline" className="ml-2 bg-background/80 backdrop-blur-sm">
              {repo.private ? "Private" : "Public"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Welcome to your new repository!</h1>
          <p className="text-lg text-muted-foreground mb-10">
            Get started by creating a Qubot card for your repository. This will help others understand and use your
            qubot.
          </p>

          <Button
            onClick={onCreateQubotCard}
            size="lg"
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary px-8 py-6 text-lg h-auto"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Qubot Card
          </Button>
        </div>
      </div>
    </div>
  )
}
