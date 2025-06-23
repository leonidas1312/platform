import React, { useState } from 'react'
import { Play, Code, Download, Copy, CheckCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface UsageInstructionsModalProps {
  open: boolean
  onClose: () => void
}

const UsageInstructionsModal: React.FC<UsageInstructionsModalProps> = ({ open, onClose }) => {
  const { toast } = useToast()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const codeExamples = {
    platform: `from qubots import AutoProblem

# Using platform dataset
problem = AutoProblem.from_repo("examples/modernized_tsp_problem", override_params={
    "dataset_source": "platform",
    "dataset_id": "your-dataset-uuid",
    "auth_token": "your-rastion-token"
})

# Solve the problem
solution = problem.get_random_solution()
result = problem.evaluate_solution(solution)
print(f"Solution quality: {result}")`,

    local: `from qubots import AutoProblem

# Using downloaded dataset file
problem = AutoProblem.from_repo("examples/modernized_tsp_problem", override_params={
    "dataset_source": "local",
    "instance_file": "path/to/downloaded/dataset.tsp"
})

# Solve the problem
solution = problem.get_random_solution()
result = problem.evaluate_solution(solution)
print(f"Solution quality: {result}")`,

    url: `from qubots import AutoProblem

# Using external URL
problem = AutoProblem.from_repo("examples/modernized_tsp_problem", override_params={
    "dataset_source": "url",
    "dataset_url": "https://example.com/dataset.tsp"
})

# Solve the problem
solution = problem.get_random_solution()
result = problem.evaluate_solution(solution)
print(f"Solution quality: {result}")`
  }

  const copyToClipboard = (code: string, type: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(type)
    setTimeout(() => setCopiedCode(null), 2000)
    toast({
      title: "Copied!",
      description: "Code snippet copied to clipboard"
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How to Use Datasets</DialogTitle>
          <DialogDescription>
            Learn how to use datasets in the Rastion platform and locally with qubots
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="playground" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="playground">🎮 In Playground</TabsTrigger>
            <TabsTrigger value="local">💻 Local Development</TabsTrigger>
            <TabsTrigger value="download">📥 Download & Use</TabsTrigger>
          </TabsList>

          <TabsContent value="playground" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-blue-600" />
                  Using Datasets in Playground
                </CardTitle>
                <CardDescription>
                  Run optimization experiments directly in the browser with uploaded datasets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">1</Badge>
                    <div>
                      <p className="font-medium">Find a Dataset</p>
                      <p className="text-sm text-gray-600">Browse datasets by problem type or search for specific ones</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">2</Badge>
                    <div>
                      <p className="font-medium">Click "Use in Playground"</p>
                      <p className="text-sm text-gray-600">This will open the playground with compatible problems</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">3</Badge>
                    <div>
                      <p className="font-medium">Select a Problem & Optimizer</p>
                      <p className="text-sm text-gray-600">Choose from compatible problem types and optimization algorithms</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">4</Badge>
                    <div>
                      <p className="font-medium">Run Optimization</p>
                      <p className="text-sm text-gray-600">Execute the optimization and view results in real-time</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>💡 Tip:</strong> The playground automatically configures the problem with your dataset parameters, 
                    so you can focus on experimenting with different optimization algorithms.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="local" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-green-600" />
                  Local Development with Qubots
                </CardTitle>
                <CardDescription>
                  Use datasets in your local Python environment with the qubots framework
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Option 1: Platform Dataset (Recommended)</h4>
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg relative">
                    <pre className="text-sm overflow-x-auto">
                      <code>{codeExamples.platform}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(codeExamples.platform, 'platform')}
                    >
                      {copiedCode === 'platform' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Get your API token from Settings → API Keys
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Option 2: Downloaded File</h4>
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg relative">
                    <pre className="text-sm overflow-x-auto">
                      <code>{codeExamples.local}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(codeExamples.local, 'local')}
                    >
                      {copiedCode === 'local' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Option 3: External URL</h4>
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg relative">
                    <pre className="text-sm overflow-x-auto">
                      <code>{codeExamples.url}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(codeExamples.url, 'url')}
                    >
                      {copiedCode === 'url' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>🚀 Getting Started:</strong> Install qubots with <code className="bg-white dark:bg-gray-800 px-1 rounded">pip install qubots</code> 
                    and check out the documentation at <a href="https://docs.rastion.com" className="text-blue-600 underline">docs.rastion.com</a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="download" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-purple-600" />
                  Download & Offline Use
                </CardTitle>
                <CardDescription>
                  Download datasets for offline use or integration with other tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">1</Badge>
                    <div>
                      <p className="font-medium">Click "Download" on any dataset</p>
                      <p className="text-sm text-gray-600">Downloads the raw dataset file in its original format</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">2</Badge>
                    <div>
                      <p className="font-medium">Use with any optimization tool</p>
                      <p className="text-sm text-gray-600">TSPLIB, VRP, JSON, and CSV formats work with most optimization software</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">3</Badge>
                    <div>
                      <p className="font-medium">Reference the metadata</p>
                      <p className="text-sm text-gray-600">Check dataset details for problem size, format, and optimization hints</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Compatible Tools</h5>
                    <ul className="text-sm space-y-1">
                      <li>• OR-Tools (Google)</li>
                      <li>• Gurobi</li>
                      <li>• CPLEX</li>
                      <li>• LKH Solver</li>
                      <li>• Custom algorithms</li>
                    </ul>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Supported Formats</h5>
                    <ul className="text-sm space-y-1">
                      <li>• TSPLIB (.tsp)</li>
                      <li>• VRP (.vrp)</li>
                      <li>• JSON (.json)</li>
                      <li>• CSV (.csv)</li>
                      <li>• Text (.txt, .dat)</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>📋 Note:</strong> Downloaded files maintain their original format and structure. 
                    Check the dataset details for format-specific information and usage guidelines.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default UsageInstructionsModal
