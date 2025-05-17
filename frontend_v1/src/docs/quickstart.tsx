import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "Quick Start",
  description: "Get up and running with Qubots in minutes.",
}

export default function QuickStartDoc() {
  return (
    <Card className="border border-border/60 shadow-lg overflow-hidden bg-white dark:bg-gray-900">
      <CardContent className="p-6">
        <div className="prose prose-sm md:prose lg:prose-lg max-w-none dark:prose-invert">
          <h1>Quick Start</h1>
          <p>Quick start content will go here.</p>
        </div>
      </CardContent>
    </Card>
  )
}
