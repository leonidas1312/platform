import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "Qubots with Drake tutorials",
  description: "Learn how to use Drake with qubots for solving optimization problems.",
}

export default function DrakeTutorialsDoc() {
  return (
    <Card className="border border-border/60 shadow-lg overflow-hidden bg-white dark:bg-gray-900">
      <CardContent className="p-6">
        <div className="prose prose-sm md:prose lg:prose-lg max-w-none dark:prose-invert">
          <h1>Qubots with Drake tutorials</h1>
          <p>Content about using Drake with qubots will go here.</p>
        </div>
      </CardContent>
    </Card>
  )
}
