"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Layout from "@/components/Layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Shield, Server, FileWarning, CheckCircle2 } from "lucide-react"

export default function ExperimentalPreviewPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const handleSectionToggle = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <Badge
              variant="outline"
              className="mb-6 px-4 py-2 text-sm bg-secondary/20 text-foreground border-border/50 rounded-xl"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
            >
              Experimental Preview
            </Badge>
            <h1
              className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
            >
              Rastion Experimental Preview
            </h1>
            <p
              className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
            >
              Important information about the experimental nature of this platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 mb-12">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 rounded-2xl shadow-soft">
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <div className="p-3 rounded-xl bg-secondary">
                  <AlertTriangle className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <CardTitle
                    className="text-xl font-semibold text-foreground"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                  >
                    Experimental Status Notice
                  </CardTitle>
                  <CardDescription
                    className="text-muted-foreground"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                  >
                    Please read this important information before using Rastion
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p
                  className="text-lg font-medium mb-4 text-foreground"
                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                >
                  Rastion is currently in{" "}
                  <span className="font-bold">EXPERIMENTAL PREVIEW</span> status.
                </p>
                <p
                  className="mb-4 text-muted-foreground leading-relaxed"
                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                >
                  This platform is being provided as an early access preview to gather feedback and improve functionality.
                  It is not intended for production use, and you should expect frequent changes, potential instability,
                  and evolving features as we continue development.
                </p>
                <p
                  className="text-muted-foreground leading-relaxed"
                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                >
                  By using Rastion, you acknowledge and accept the experimental nature of this platform and the
                  limitations that come with it.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 rounded-2xl shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle
                  className="flex items-center gap-3 text-xl font-semibold text-foreground"
                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                >
                  <div className="p-2 rounded-lg bg-secondary">
                    <Shield className="h-5 w-5 text-foreground" />
                  </div>
                  Disclaimer of Liability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <p
                  className="text-foreground font-medium"
                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                >
                  The creators, developers, and operators of Rastion ("we", "us", "our") are not responsible for:
                </p>
                <ul
                  className="list-disc pl-6 space-y-3 text-muted-foreground"
                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                >
                  <li>Any damages, losses, or consequences that may arise from the use or inability to use the platform</li>
                  <li>Accuracy, reliability, availability, or completeness of any content, information, or services provided</li>
                  <li>Any misuse of the platform by users, including but not limited to violations of intellectual property rights, privacy rights, or any applicable laws and regulations</li>
                  <li>Any unauthorized access to or use of our servers and/or any personal information stored therein</li>
                  <li>Any interruption or cessation of transmission to or from the platform</li>
                  <li>Any bugs, viruses, trojan horses, or the like that may be transmitted to or through the platform</li>
                </ul>
                <p
                  className="font-medium text-foreground"
                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                >
                  The platform is provided on an "AS IS" and "AS AVAILABLE" basis without any warranties of any kind, either express or implied.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50 rounded-2xl shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle
                  className="flex items-center gap-3 text-xl font-semibold text-foreground"
                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                >
                  <div className="p-2 rounded-lg bg-secondary">
                    <Server className="h-5 w-5 text-foreground" />
                  </div>
                  Hosting Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <p
                  className="text-foreground"
                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                >
                  Rastion is hosted on Digital Ocean infrastructure. While we strive to maintain high availability and security, please be aware that:
                </p>
                <ul
                  className="list-disc pl-6 space-y-3 text-muted-foreground"
                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                >
                  <li>Service interruptions may occur for maintenance or due to technical issues</li>
                  <li>Data persistence is not guaranteed during this experimental phase</li>
                  <li>Performance may vary and is not representative of the final product</li>
                </ul>
                <p
                  className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg"
                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                >
                  We recommend not storing critical or sensitive information on the platform during this experimental phase.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-12">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 rounded-2xl shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle
                  className="flex items-center gap-3 text-xl font-semibold text-foreground"
                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                >
                  <div className="p-2 rounded-lg bg-secondary">
                    <FileWarning className="h-5 w-5 text-foreground" />
                  </div>
                  Experimental Terms of Service
                </CardTitle>
                <CardDescription
                  className="text-muted-foreground"
                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                >
                  These terms govern your use of the Rastion platform during its experimental phase
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>1. Acceptance of Terms</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      By accessing or using Rastion, you agree to be bound by these Experimental Terms of Service. If
                      you do not agree to these terms, please do not use the platform.
                    </p>
                    <p>
                      We reserve the right to modify these terms at any time without prior notice. Your continued use of
                      the platform after any such changes constitutes your acceptance of the new terms.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>2. User Responsibilities</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">As a user of Rastion, you agree to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Use the platform in compliance with all applicable laws and regulations</li>
                      <li>Not engage in any activity that interferes with or disrupts the platform</li>
                      <li>Not attempt to gain unauthorized access to any part of the platform</li>
                      <li>Not use the platform for any illegal or unauthorized purpose</li>
                      <li>Be solely responsible for your conduct and any content you submit, post, or display</li>
                      <li>Provide feedback when requested to help improve the platform</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>3. Intellectual Property</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      All content, features, and functionality of the Rastion platform, including but not limited to
                      text, graphics, logos, icons, and software, are the exclusive property of Rastion's creators and
                      are protected by copyright, trademark, and other intellectual property laws.
                    </p>
                    <p>
                      User-generated content remains the property of the user who created it, but by submitting content
                      to Rastion, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce,
                      modify, adapt, publish, translate, and distribute such content in connection with the platform.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>4. Data and Privacy</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      During this experimental phase, we may collect usage data to improve the platform. By using
                      Rastion, you consent to such data collection.
                    </p>
                    <p className="mb-2">
                      We will make reasonable efforts to protect your personal information, but we cannot guarantee
                      absolute security during this experimental phase.
                    </p>
                    <p>
                      We reserve the right to delete any data stored on the platform without notice during this
                      experimental phase.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>5. Limitation of Liability</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      To the maximum extent permitted by law, Rastion and its creators, developers, and operators shall
                      not be liable for any indirect, incidental, special, consequential, or punitive damages, including
                      but not limited to loss of profits, data, use, or goodwill, arising out of or in connection with
                      your use of the platform.
                    </p>
                    <p>
                      In no event shall our total liability to you for all claims exceed the amount you paid to use the
                      platform, if any.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger>6. Termination</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      We reserve the right to suspend or terminate your access to Rastion at any time, for any reason,
                      without notice or liability.
                    </p>
                    <p>
                      Upon termination, your right to use the platform will immediately cease, and all provisions of
                      these terms that should survive termination shall remain in effect.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger>7. Governing Law</AccordionTrigger>
                  <AccordionContent>
                    <p>
                      These terms shall be governed by and construed in accordance with the laws of the jurisdiction in
                      which Rastion's primary operators are located, without regard to its conflict of law provisions.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

          <div className="mb-12">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 rounded-2xl shadow-soft">
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <div className="p-3 rounded-xl bg-secondary">
                  <CheckCircle2 className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <CardTitle
                    className="text-xl font-semibold text-foreground"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                  >
                    Feedback and Support
                  </CardTitle>
                  <CardDescription
                    className="text-muted-foreground"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                  >
                    We value your input during this experimental phase
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p
                  className="mb-4 text-foreground leading-relaxed"
                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                >
                  Your feedback is crucial to improving Rastion. If you encounter any issues, have suggestions, or want to
                  report a bug, please use the Feedback section in the Community tab.
                </p>
                <p
                  className="text-muted-foreground leading-relaxed"
                  style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
                >
                  While we cannot guarantee immediate responses or fixes during this experimental phase, we are committed
                  to reviewing all feedback and continuously improving the platform.
                </p>
              </CardContent>
            </Card>
          </div>

          <div
            className="text-center text-sm text-muted-foreground mb-8 space-y-2"
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
          >
            <p>Last updated: May 13, 2025</p>
            <p>
              By continuing to use Rastion, you acknowledge that you have read, understood, and agree to these terms.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
