import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "How to use qubots uploaded by others",
  description: "Learn how to use qubots that have been shared by the community.",
}

export default function UseOthersQubotsDoc() {
  return (
    <Card className="border border-border/60 shadow-lg overflow-hidden bg-white dark:bg-gray-900">
      <CardContent className="p-6">
        <div className="prose prose-sm md:prose lg:prose-lg max-w-none dark:prose-invert">
          <h1>How to use qubots uploaded by others</h1>
          <p>Content about using other people's qubots will go here.</p>
        </div>
      </CardContent>
    </Card>
  )
}
