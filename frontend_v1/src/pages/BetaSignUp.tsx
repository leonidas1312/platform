"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Copy, Mail, Rocket, Sparkles, Users, Zap } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function BetaSignupPage() {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("individuals")

  // Replace with your preferred contact email
  const contactEmail = "contact@rastion.com"

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail)
    setCopied(true)
    toast({
      title: "Email copied to clipboard",
      description: `${contactEmail} has been copied to your clipboard.`,
    })

    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4 px-3 py-1 text-sm bg-primary/10 border-primary/20">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Limited beta access
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Join the Rastion beta testing</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're looking for passionate early adopters to help shape the future of the Rastion platform & qubots. Access new features, discuss with the team, propose new ideas!
            </p>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">Request beta access</CardTitle>
                <CardDescription>
                  Our beta program is currently invite-only. Send us an email to be considered.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center p-6 bg-primary/5 rounded-lg">
                  <Mail className="h-12 w-12 text-primary mb-4" />
                  <p className="text-lg font-medium mb-2">Send your request to:</p>
                  <div className="flex items-center gap-2 bg-background rounded-md border px-4 py-2">
                    <code className="text-lg">{contactEmail}</code>
                    <Button variant="ghost" size="icon" onClick={handleCopyEmail} className="h-8 w-8">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Please include in your email:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Your name and organization (if applicable)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Brief description of your interest in optimization</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>How you plan to use Rastion</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Any relevant experience with optimization tools</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
              
            </Card>

            
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}

// Timeline Item Component
function TimelineItem({ title, description, active = false }) {
  return (
    <div className="relative z-10">
      <div className="flex items-center">
        <div className="flex-1 text-right pr-8 md:pr-12">
          <h3 className={`font-medium text-lg ${active ? "text-primary" : ""}`}>{title}</h3>
        </div>

        <div
          className={`w-6 h-6 rounded-full border-4 ${
            active ? "bg-primary border-primary/20" : "bg-background border-muted-foreground/30"
          } flex-shrink-0`}
        ></div>

        <div className="flex-1 pl-8 md:pl-12">
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}

// FAQ Item Component
function FaqItem({ question, answer }) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-lg">{question}</h3>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  )
}
