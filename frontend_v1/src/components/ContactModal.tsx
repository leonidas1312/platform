import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mail, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const email = "ileonidas@rastion.com"

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      toast({
        title: "Email copied!",
        description: "The email address has been copied to your clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the email address manually.",
        variant: "destructive"
      })
    }
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
                  <h2 className="text-2xl font-bold text-foreground">Contact Us</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get in touch with the Rastion team
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

              {/* Content */}
              <div className="p-6 space-y-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto bg-primary/10 rounded-full">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Contact us here
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      We'd love to hear from you! Send us an email and we'll get back to you as soon as possible.
                    </p>
                  </div>

                  <div className="bg-secondary/20 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-foreground font-mono text-sm break-all">
                        {email}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyEmail}
                        className="flex-shrink-0"
                      >
                        {copied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => window.open(`mailto:${email}`, '_blank')}
                      className="flex-1"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCopyEmail}
                      className="flex-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Email
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
