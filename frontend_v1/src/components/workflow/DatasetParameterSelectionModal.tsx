import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Loader2, Database, Brain, Info, AlertCircle } from 'lucide-react'
import { WorkflowNode } from '@/types/workflow-automation'
import { workflowAutomationApi } from '@/services/workflowAutomationApi'

interface ParameterOption {
  name: string
  type: string
  description?: string
  required?: boolean
  defaultValue?: any
}

interface DatasetParameterSelectionModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (selectedParameter: string) => void
  datasetNode: WorkflowNode | null
  problemNode: WorkflowNode | null
}

const DatasetParameterSelectionModal: React.FC<DatasetParameterSelectionModalProps> = ({
  open,
  onClose,
  onConfirm,
  datasetNode,
  problemNode
}) => {
  const [parameters, setParameters] = useState<ParameterOption[]>([])
  const [selectedParameter, setSelectedParameter] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch problem parameters when modal opens
  useEffect(() => {
    if (open && problemNode) {
      fetchProblemParameters()
    }
  }, [open, problemNode])

  const fetchProblemParameters = async () => {
    if (!problemNode) return

    setLoading(true)
    setError(null)
    setParameters([])
    setSelectedParameter('')

    try {
      // Use the same approach as ParameterPanel
      const username = problemNode.data.username
      const name = problemNode.data.name

      if (!username || !name) {
        throw new Error('Problem username or name not found')
      }

      console.log('Fetching parameters for problem:', { username, name })
      const response = await workflowAutomationApi.getRepositoryConfig(username, name)

      if (response.success && response.config) {
        const config = response.config
        const availableParams: ParameterOption[] = []

        // Helper function to check if a parameter is suitable for dataset content
        const isDatasetSuitable = (key: string, param: any) => {
          const keyLower = key.toLowerCase()
          return (
            param?.type === 'string' ||
            keyLower.includes('dataset') ||
            keyLower.includes('data') ||
            keyLower.includes('content') ||
            keyLower.includes('csv') ||
            keyLower.includes('file') ||
            keyLower.includes('input')
          )
        }

        // Extract parameters from config.parameters
        if (config.parameters) {
          Object.entries(config.parameters).forEach(([key, param]: [string, any]) => {
            if (isDatasetSuitable(key, param)) {
              availableParams.push({
                name: key,
                type: param.type || 'string',
                description: param.description || `Parameter: ${key}`,
                required: param.required || false,
                defaultValue: param.default
              })
            }
          })
        }

        // Also check default_params for additional dataset-related parameters
        if (config.default_params) {
          Object.entries(config.default_params).forEach(([key, value]: [string, any]) => {
            // Only add if not already in parameters list
            if (!availableParams.find(p => p.name === key) && isDatasetSuitable(key, { type: typeof value })) {
              availableParams.push({
                name: key,
                type: typeof value === 'string' ? 'string' : 'unknown',
                description: `Default parameter: ${key}`,
                required: false,
                defaultValue: value
              })
            }
          })
        }

        setParameters(availableParams)

        // Auto-select the most likely parameter
        if (availableParams.length > 0) {
          // Prioritize parameters with 'dataset_content' or 'csv_data' in the name
          const priorityParam = availableParams.find(p => 
            p.name === 'dataset_content' || 
            p.name === 'csv_data' ||
            p.name === 'data_content'
          )
          
          if (priorityParam) {
            setSelectedParameter(priorityParam.name)
          } else {
            // Otherwise select the first parameter
            setSelectedParameter(availableParams[0].name)
          }
        }

        console.log('Available parameters for dataset connection:', availableParams)
      } else {
        throw new Error('Failed to fetch problem configuration')
      }
    } catch (err) {
      console.error('Error fetching problem parameters:', err)
      setError(err instanceof Error ? err.message : 'Failed to load problem parameters')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (selectedParameter) {
      onConfirm(selectedParameter)
      onClose()
    }
  }

  const handleCancel = () => {
    setSelectedParameter('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-500" />
            Connect Dataset to Problem
          </DialogTitle>
          <DialogDescription>
            Select which parameter in the problem should receive the dataset content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Info */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-sm">{datasetNode?.data.name}</span>
            </div>
            <div className="text-muted-foreground">→</div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-green-500" />
              <span className="font-medium text-sm">{problemNode?.data.name}</span>
            </div>
          </div>

          {/* Parameter Selection */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading problem parameters...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : parameters.length === 0 ? (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
              <Info className="h-4 w-4" />
              <span>No suitable parameters found for dataset connection. The problem may not support dataset input.</span>
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Parameter:</Label>
              <RadioGroup value={selectedParameter} onValueChange={setSelectedParameter}>
                {parameters.map((param) => (
                  <Card key={param.name} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value={param.name} id={param.name} className="mt-1" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={param.name} className="font-medium cursor-pointer">
                              {param.name}
                            </Label>
                            <Badge variant="outline" className="text-xs">
                              {param.type}
                            </Badge>
                            {param.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          {param.description && (
                            <p className="text-sm text-muted-foreground">
                              {param.description}
                            </p>
                          )}
                          {param.defaultValue !== undefined && param.defaultValue !== null && (
                            <p className="text-xs text-muted-foreground">
                              Default: <code className="bg-muted px-1 rounded">{String(param.defaultValue)}</code>
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedParameter || loading}
          >
            Connect Dataset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DatasetParameterSelectionModal
