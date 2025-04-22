"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"

interface QubotCardFormProps {
  initialData?: any
  onSave: (data: any) => void
  onCancel: () => void
}

export default function QubotCardForm({ initialData, onSave, onCancel }: QubotCardFormProps) {
  const [formData, setFormData] = useState({
    type: initialData?.type || "problem",
    problem_name: initialData?.problem_name || "",
    description: initialData?.description || "",
    link_to_arxiv: initialData?.link_to_arxiv || "",
    keywords: initialData?.keywords || ["qubot"]
  })

  const [newKeyword, setNewKeyword] = useState("")

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()],
      }))
      setNewKeyword("")
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }))
  }

  const handleSave = () => {
    onSave(formData)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Qubot Card</CardTitle>
        <CardDescription>Here you can add useful information about the qubot repository.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="problem">Problem</SelectItem>
                <SelectItem value="optimizer">Optimizer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe what optimization problem or algorithm this qubot repository contains"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link_to_arxiv">Link to arXiv</Label>
            <Input
              id="link_to_arxiv"
              value={formData.link_to_arxiv}
              onChange={(e) => handleInputChange("link_to_arxiv", e.target.value)}
              placeholder="https://arxiv.org/abs/..."
            />
          </div>

          <div className="space-y-2">
            <Label>Keywords</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.keywords.map((keyword: string) => (
                <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveKeyword(keyword)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add keyword"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddKeyword()
                  }
                }}
              />
              <Button type="button" onClick={handleAddKeyword} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button onClick={handleSave}>Save Qubot Card</Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </CardFooter>
    </Card>
  )
}

