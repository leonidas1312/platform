import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "What are qubots?",
  description: "Learn about the core concepts of qubots and how they work.",
}

export default function WhatAreQubotsDoc() {
  return (
    <Card className="border border-border/60 shadow-lg overflow-hidden bg-white dark:bg-gray-900">
      <CardContent className="p-6">
        <div className="prose prose-sm md:prose lg:prose-lg max-w-none dark:prose-invert">
          <h1>What are qubots?</h1>
          <p>Content about qubots will go here.</p>
        </div>
      </CardContent>
    </Card>
  )
}
