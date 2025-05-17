import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "Solving TSP with Christofides algorithm",
  description: "Learn how to solve the Traveling Salesman Problem using the Christofides algorithm.",
}

export default function TspChristofidesDoc() {
  return (
    <Card className="border border-border/60 shadow-lg overflow-hidden bg-white dark:bg-gray-900">
      <CardContent className="p-6">
        <div className="prose prose-sm md:prose lg:prose-lg max-w-none dark:prose-invert">
          <h1>Solving TSP with Christofides algorithm</h1>
          <p>Content about solving TSP with Christofides algorithm will go here.</p>
        </div>
      </CardContent>
    </Card>
  )
}
