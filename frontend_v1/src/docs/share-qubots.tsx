import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "How to share my qubots with the community",
  description: "Learn how to share your qubots with the community.",
}

export default function ShareQubotsDoc() {
  return (
    <Card className="border border-border/60 shadow-lg overflow-hidden bg-white dark:bg-gray-900">
      <CardContent className="p-6">
        <div className="prose prose-sm md:prose lg:prose-lg max-w-none dark:prose-invert">
          <h1>How to share my qubots with the community</h1>
          <p>Content about sharing qubots will go here.</p>
        </div>
      </CardContent>
    </Card>
  )
}
