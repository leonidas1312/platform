import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "Qubots with OR tools tutorials",
  description: "Learn how to use OR tools with qubots for solving optimization problems.",
}

export default function OrToolsTutorialsDoc() {
  return (
    <Card className="border border-border/60 shadow-lg overflow-hidden bg-white dark:bg-gray-900">
      <CardContent className="p-6">
        <div className="prose prose-sm md:prose lg:prose-lg max-w-none dark:prose-invert">
          <h1>Qubots with OR tools tutorials</h1>
          <p>Content about using OR tools with qubots will go here.</p>
        </div>
      </CardContent>
    </Card>
  )
}
