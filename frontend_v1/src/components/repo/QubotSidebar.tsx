"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, FileText, GitBranch, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QubotSidebarProps {
  config: any
  onEditQubotCard: () => void
}

export default function QubotSidebar({ config, onEditQubotCard }: QubotSidebarProps) {
  return (
    <div className="sticky top-24">
      <Card className="mt-4 hover:shadow-md transition-all duration-300 border-border/60">
        <CardHeader className="pb-2 bg-gradient-to-br from-background to-muted/30 border-b border-border/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              {config ? "Qubot card (config.json)" : "Qubot Setup"}
            </CardTitle>
            {config ? (
              <div className="flex items-center gap-2">
                
                <Button variant="ghost" size="sm" onClick={onEditQubotCard} className="h-8 px-2">
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {config ? (
            <div className="space-y-3 text-sm">
              {/* Entry point information */}
              {config.entry_point && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium">Entry python file</span>
                  </div>
                  <div className="bg-muted/20 rounded-md p-2 border border-border/40">
                    <p className="font-mono text-xs">{config.entry_point}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium">Main qubot Base python class</span>
                  </div>
                  <div className="bg-muted/20 rounded-md p-2 border border-border/40">
                    {config.class_name && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <p className="font-mono text-xs">{config.class_name}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Parameters */}
              {config.default_params && Object.keys(config.default_params).length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium">Default Parameters</span>
                  </div>
                  <div className="bg-muted/20 rounded-md border border-border/40 divide-y divide-border/30">
                    {Object.entries(config.default_params).map(([key, value]) => (
                      <div key={key} className="px-2 py-1.5 flex justify-between">
                        <span className="font-mono text-xs text-primary">{key}</span>
                        <span className="font-mono text-xs truncate max-w-[120px]">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-4">
                
                <h3 className="font-medium text-base mb-1">Set up your qubot</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure your repository as an optimization tool
                </p>
                <Button onClick={onEditQubotCard} className="w-full">
                  
                  Set up Qubot
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
