import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "Introduction",
  description: "Learn about the Qubots platform and how it can help you solve optimization problems.",
}

export default function IntroductionDoc() {
  return (
    <Card className="border border-border/60 shadow-lg overflow-hidden bg-white dark:bg-gray-900">
      <CardContent className="p-6">
        <div className="prose prose-sm md:prose lg:prose-lg max-w-none dark:prose-invert">
          <h1>Introduction</h1>
          <p>Introduction content will go here.</p>
        </div>
      </CardContent>
    </Card>
  )
}
