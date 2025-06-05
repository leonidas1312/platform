import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mail, User, MessageSquare, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface WaitlistFormProps {
  isOpen: boolean
  onClose: () => void
}

export function WaitlistForm({ isOpen, onClose }: WaitlistFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    description: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.username) {
      toast({
        title: "Missing Information",
        description: "Please fill in your email and preferred username.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Send waitlist application to backend
      const apiUrl = process.env.NODE_ENV === 'production'
        ? '/api/waitlist'
        : import.meta.env.VITE_API_BASE
          ? `${import.meta.env.VITE_API_BASE}/api/waitlist`
          : 'http://localhost:4000/api/waitlist'

      console.log('Submitting waitlist application to:', apiUrl)

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          description: formData.description,
          timestamp: new Date().toISOString()
        }),
      })

      const data = await response.json()
      console.log('Waitlist response:', data)

      if (response.ok && data.success) {
        toast({
          title: "Successfully joined waitlist!",
          description: "We'll review your application and get back to you soon.",
        })
        setFormData({ email: "", username: "", description: "" })
        onClose()
      } else {
        throw new Error(data.message || 'Failed to submit')
      }
    } catch (error) {
      console.error('Waitlist submission error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to join waitlist. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Join the Waitlist</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get early access to Rastion
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full hover:bg-secondary"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Preferred Username *
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="your_username"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                {/* Description Field */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Tell us about yourself (optional)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Who are you and why do you want access to Rastion? (e.g., researcher, student, developer working on optimization problems...)"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Joining Waitlist...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Join Waitlist
                    </>
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="px-6 pb-6">
                <p className="text-xs text-muted-foreground text-center">
                  We'll review your application and send you an invitation if accepted.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
