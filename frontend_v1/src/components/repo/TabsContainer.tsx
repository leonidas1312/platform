"use client"

import type { ReactNode } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, FileText } from "lucide-react"

interface TabsContainerProps {
  activeTab: string
  onTabChange: (tab: string) => void
  readmeContent: ReactNode
  filesContent: ReactNode
}

export default function TabsContainer({ activeTab, onTabChange, readmeContent, filesContent }: TabsContainerProps) {
  return (
    <Tabs defaultValue="files" className="w-full" value={activeTab} onValueChange={onTabChange}>
      <div className="border-b">
        <TabsList className="h-10 bg-transparent">
          <TabsTrigger
            value="qubot"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none transition-colors"
          >
            
            Readme
          </TabsTrigger>
          <TabsTrigger
            value="files"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none transition-colors"
          >
            
            Files
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Qubot Card Tab */}
      <TabsContent value="qubot" className="mt-6 space-y-4">
        {readmeContent}
      </TabsContent>

      {/* Files Tab */}
      <TabsContent value="files" className="mt-6 space-y-4">
        {filesContent}
      </TabsContent>
    </Tabs>
  )
}
