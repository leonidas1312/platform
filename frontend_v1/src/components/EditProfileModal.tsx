"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, MapPin, Globe, FileText, Upload, Camera, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
  onSave: (updatedData: any) => void
}

export default function EditProfileModal({ isOpen, onClose, user, onSave }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    location: user?.location || "",
    website: user?.website || "",
    description: user?.description || "",
    visibility: user?.visibility || "public",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSave(formData)
    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Avatar image must be less than 2MB",
        variant: "destructive",
      })
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewAvatar(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload avatar
    await uploadAvatar(file)
  }

  const uploadAvatar = async (file: File) => {
    setIsUploadingAvatar(true)
    try {
      // Convert file to base64
      const base64Image = await fileToBase64(file)

      // Get token
      const token = localStorage.getItem("gitea_token")
      if (!token) {
        throw new Error("Authentication required")
      }

      // Make API call to update avatar
      const response = await fetch("http://localhost:4000/api/update-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
        body: JSON.stringify({
          image: base64Image.split(",")[1], // Remove data URL prefix
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update avatar")
      }

      toast({
        title: "Success",
        description: "Avatar updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating avatar:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update avatar",
        variant: "destructive",
      })
      // Reset preview on error
      setPreviewAvatar(null)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Avatar Preview with Upload Option */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar className="w-24 h-24 border-2 border-muted cursor-pointer" onClick={handleAvatarClick}>
                {previewAvatar ? (
                  <AvatarImage src={previewAvatar || "/placeholder.svg"} alt={user?.login} />
                ) : (
                  <AvatarImage src={user?.avatar_url || "/placeholder.svg"} alt={user?.login} />
                )}
                <AvatarFallback>{user?.login?.substring(0, 2).toUpperCase()}</AvatarFallback>

                {/* Overlay for hover effect */}
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {isUploadingAvatar ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </div>
              </Avatar>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploadingAvatar}
              />
            </div>

            <div className="text-center">
              <p className="font-medium">@{user?.login}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
              >
                <Upload className="h-3 w-3 mr-1" />
                {isUploadingAvatar ? "Uploading..." : "Change avatar"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Full Name
              </Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Location
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                Website
              </Label>
              <Input
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Bio
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell us about yourself"
                rows={4}
              />
            </div>

            
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || isUploadingAvatar}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploadingAvatar}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
