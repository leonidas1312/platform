import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "How to wrap my optimization tools as qubots",
  description: "Learn how to wrap your existing optimization tools as qubots.",
}

export default function WrapOptimizationToolsDoc() {
  return (
    <Card className="border border-border/60 shadow-lg overflow-hidden bg-white dark:bg-gray-900">
      <CardContent className="p-6">
        <div className="prose prose-sm md:prose lg:prose-lg max-w-none dark:prose-invert">
          <h1>How to wrap my optimization tools as qubots</h1>
          <p>Content about wrapping optimization tools will go here.</p>
        </div>
      </CardContent>
    </Card>
  )
}
