import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "How to create a qubot repository",
  description: "Learn how to create and set up a qubot repository.",
}

export default function CreateQuBotRepositoryDoc() {
  return (
    <Card className="border border-border/60 shadow-lg overflow-hidden bg-white dark:bg-gray-900">
      <CardContent className="p-6">
        <div className="prose prose-sm md:prose lg:prose-lg max-w-none dark:prose-invert">
          <h1>How to create a qubot repository</h1>
          <p>Content about creating qubot repositories will go here.</p>
        </div>
      </CardContent>
    </Card>
  )
}
