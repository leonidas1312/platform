import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  X,
  ChevronDown,
  ChevronRight,
  Settings,
  Database,
  Brain,
  Zap,
  Info,
  Link,
  Loader2
} from 'lucide-react'
import { WorkflowNode, ParameterDefinition, ParameterGroup, WorkflowConnection } from '@/types/workflow-automation'
import { workflowAutomationApi } from '@/services/workflowAutomationApi'

interface ParameterPanelProps {
  node: WorkflowNode | null
  isOpen: boolean
  onClose: () => void
  onParameterChange: (nodeId: string, parameters: Record<string, any>) => void
  connections: WorkflowConnection[]
  allNodes: WorkflowNode[]
}

// Utility function to find connected datasets for a problem node
const getConnectedDatasets = (
  problemNodeId: string,
  connections: WorkflowConnection[],
  allNodes: WorkflowNode[]
): WorkflowNode[] => {
  const connectedDatasetIds = connections
    .filter(conn => conn.target === problemNodeId)
    .map(conn => conn.source)

  return allNodes.filter(node =>
    connectedDatasetIds.includes(node.id) && node.type === 'dataset'
  )
}

// Convert config.json parameters to ParameterGroup format
const convertConfigToParameterGroups = (config: any, nodeType: string): ParameterGroup[] => {
  const parameters: ParameterDefinition[] = []

  // Handle both 'parameters' section and 'default_params' fallback
  const parameterDefs = config.parameters || {}
  const defaultParams = config.default_params || {}



  // If we have a parameters section, use it
  if (config.parameters && Object.keys(config.parameters).length > 0) {
    Object.entries(config.parameters).forEach(([key, param]: [string, any]) => {
      // Map config.json types to our supported types
      let paramType = param.type || 'string'
      if (paramType === 'integer') paramType = 'number'

      // Check if this should be a select type
      if (param.options && Array.isArray(param.options)) {
        paramType = 'select'
      }
      if (param.enum && Array.isArray(param.enum)) {
        paramType = 'select'
      }

      const paramDef: ParameterDefinition = {
        name: key,
        type: paramType as ParameterDefinition['type'],
        label: param.label || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: param.description || '',
        defaultValue: param.default !== undefined ? param.default : defaultParams[key],
        required: param.required || false
      }

      // Add type-specific properties
      if (param.type === 'number' || param.type === 'integer') {
        paramDef.min = param.min !== undefined ? param.min : param.minimum
        paramDef.max = param.max !== undefined ? param.max : param.maximum
        paramDef.step = param.step || (param.type === 'integer' ? 1 : 0.1)
      }

      // Handle options for select type
      if (param.options && Array.isArray(param.options)) {
        paramDef.options = param.options.map((opt: any) =>
          typeof opt === 'string' ? { label: opt, value: opt } : opt
        )
      }

      // Handle enum as select
      if (param.enum && Array.isArray(param.enum)) {
        paramDef.options = param.enum.map((opt: any) =>
          typeof opt === 'string' ? { label: opt, value: opt } : opt
        )
      }

      parameters.push(paramDef)
    })
  }
  // Fallback to default_params if no parameters section
  else if (defaultParams && Object.keys(defaultParams).length > 0) {
    Object.entries(defaultParams).forEach(([key, value]: [string, any]) => {
      const paramDef: ParameterDefinition = {
        name: key,
        type: typeof value === 'number' ? 'number' :
              typeof value === 'boolean' ? 'boolean' : 'string',
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `Configure ${key.replace(/_/g, ' ')}`,
        defaultValue: value,
        required: false
      }

      // Add sensible defaults for numeric parameters
      if (typeof value === 'number') {
        if (key.includes('iteration') || key.includes('step') || key.includes('epoch')) {
          paramDef.min = 1
          paramDef.max = 10000
          paramDef.step = 1
        } else if (key.includes('rate') || key.includes('probability') || key.includes('factor')) {
          paramDef.min = 0
          paramDef.max = 1
          paramDef.step = 0.01
        } else if (key.includes('size') || key.includes('population') || key.includes('count')) {
          paramDef.min = 1
          paramDef.max = 1000
          paramDef.step = 1
        } else if (key.includes('time') || key.includes('limit') || key.includes('timeout')) {
          paramDef.min = 1
          paramDef.max = 3600
          paramDef.step = 1
        }
      }

      parameters.push(paramDef)
    })
  }

  if (parameters.length === 0) {
    return []
  }

  // Group parameters by category or use default group
  const groupName = nodeType === 'problem' ? 'problem_config' :
                   nodeType === 'optimizer' ? 'algorithm_params' : 'configuration'

  return [{
    name: groupName,
    label: config.metadata?.name || `${nodeType} Configuration`,
    description: config.metadata?.description || `Configure ${nodeType} parameters`,
    parameters
  }]
}

// Dataset preview function - show only ID and first 5 lines
const getDatasetPreview = async (node: WorkflowNode): Promise<ParameterGroup[]> => {
  const parameters: ParameterDefinition[] = [
    {
      name: 'dataset_id',
      type: 'string',
      label: 'Dataset ID',
      description: 'Unique identifier for this dataset',
      defaultValue: node.data.datasetId || node.id,
      readOnly: true
    }
  ]

  // Try to fetch and preview the first 5 lines of the dataset
  try {
    // Show template 5 lines as requested
    const previewLines = [
      'Line 1: Template data example',
      'Line 2: Template data example',
      'Line 3: Template data example',
      'Line 4: Template data example',
      'Line 5: Template data example'
    ]

    parameters.push({
      name: 'preview',
      type: 'textarea',
      label: 'Preview (First 5 lines)',
      description: 'First 5 lines of the dataset file',
      defaultValue: previewLines.join('\n'),
      readOnly: true
    })
  } catch (error) {
    parameters.push({
      name: 'preview',
      type: 'string',
      label: 'Preview',
      description: 'Dataset preview not available',
      defaultValue: 'Preview not available',
      readOnly: true
    })
  }

  return [
    {
      name: 'dataset_preview',
      label: 'Dataset Preview',
      description: 'Dataset ID and content preview',
      parameters
    }
  ]
}

// Async function to fetch real parameter schema from config.json
const fetchParameterSchema = async (
  nodeType: string,
  node: WorkflowNode,
  connectedDatasets: WorkflowNode[] = []
): Promise<ParameterGroup[]> => {
  try {
    // For datasets, return preview instead of processing options
    if (nodeType === 'dataset') {
      return await getDatasetPreview(node)
    }

    // Fetch config.json for problems and optimizers
    const response = await workflowAutomationApi.getRepositoryConfig(node.data.username, node.data.name)

    if (response.success && response.config) {
      const groups = convertConfigToParameterGroups(response.config, nodeType)

      // Add dataset connection info for problems
      if (nodeType === 'problem' && connectedDatasets.length > 0) {
        groups.unshift({
          name: 'dataset_connections',
          label: 'Connected Datasets',
          description: 'Datasets connected to this problem',
          parameters: connectedDatasets.map((dataset, index) => ({
            name: `dataset_${index}`,
            type: 'string' as const,
            label: `Dataset ${index + 1}`,
            description: `Connected dataset: ${dataset.data.name}`,
            defaultValue: dataset.data.datasetId || dataset.id,
            readOnly: true
          }))
        })
      }

      return groups
    } else {
      console.warn(`Failed to fetch config for ${nodeType} ${node.data.username}/${node.data.name}:`, response)
    }
  } catch (error) {
    console.error('Failed to fetch parameter schema:', error)
  }

  // Fallback to basic parameters if config.json is not available
  if (nodeType === 'problem') {
    return [{
      name: 'basic_config',
      label: 'Basic Configuration',
      description: 'Basic problem parameters',
      parameters: [
        {
          name: 'time_limit',
          type: 'number' as const,
          label: 'Time Limit (seconds)',
          description: 'Maximum execution time',
          defaultValue: 300,
          min: 1,
          max: 3600
        }
      ]
    }]
  } else if (nodeType === 'optimizer') {
    return [{
      name: 'basic_config',
      label: 'Basic Configuration',
      description: 'Basic optimizer parameters',
      parameters: [
        {
          name: 'max_iterations',
          type: 'number' as const,
          label: 'Max Iterations',
          description: 'Maximum number of iterations',
          defaultValue: 1000,
          min: 1,
          max: 10000
        },
        {
          name: 'population_size',
          type: 'number' as const,
          label: 'Population Size',
          description: 'Size of the population',
          defaultValue: 100,
          min: 10,
          max: 1000
        }
      ]
    }]
  }

  return []
}

const ParameterInput: React.FC<{
  parameter: ParameterDefinition
  value: any
  onChange: (value: any) => void
}> = ({ parameter, value, onChange }) => {
  const currentValue = value !== undefined ? value : parameter.defaultValue

  switch (parameter.type) {
    case 'boolean':
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={currentValue}
            onCheckedChange={onChange}
          />
          <Label className="text-sm">{parameter.label}</Label>
        </div>
      )
    
    case 'number':
      if (parameter.min !== undefined && parameter.max !== undefined && parameter.step) {
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{parameter.label}</Label>
              <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {currentValue}
              </span>
            </div>
            <Slider
              value={[currentValue]}
              onValueChange={(values) => onChange(values[0])}
              min={parameter.min}
              max={parameter.max}
              step={parameter.step}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{parameter.min}</span>
              <span>{parameter.max}</span>
            </div>
          </div>
        )
      } else {
        return (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{parameter.label}</Label>
            <Input
              type="number"
              value={currentValue}
              onChange={(e) => onChange(Number(e.target.value))}
              min={parameter.min}
              max={parameter.max}
              step={parameter.step}
              className="h-9"
            />
          </div>
        )
      }
    
    case 'string':
      return (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-2">
            {parameter.label}
            {parameter.readOnly && (
              <Badge variant="secondary" className="text-xs">
                <Link className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </Label>
          <Input
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={parameter.description}
            readOnly={parameter.readOnly}
            className={`h-9 ${parameter.readOnly ? "bg-muted" : ""}`}
            title={currentValue} // Show full value on hover
          />
        </div>
      )

    case 'textarea':
      return (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-2">
            {parameter.label}
            {parameter.readOnly && (
              <Badge variant="secondary" className="text-xs">
                <Link className="h-3 w-3 mr-1" />
                Preview
              </Badge>
            )}
          </Label>
          <Textarea
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={parameter.description}
            readOnly={parameter.readOnly}
            className={`min-h-[120px] font-mono text-xs ${parameter.readOnly ? "bg-muted" : ""}`}
            rows={6}
          />
        </div>
      )
    
    case 'select':
      return (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{parameter.label}</Label>
          <Select value={currentValue} onValueChange={onChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {parameter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    
    default:
      return null
  }
}

const ParameterPanel: React.FC<ParameterPanelProps> = ({
  node,
  isOpen,
  onClose,
  onParameterChange,
  connections,
  allNodes
}) => {
  const [parameters, setParameters] = useState<Record<string, any>>({})
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [schema, setSchema] = useState<ParameterGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Initialize parameters when node changes
  useEffect(() => {
    if (node) {
      setParameters(node.data.parameters || {})
      setIsLoading(true)

      // Get connected datasets for problems
      const connectedDatasets = node.type === 'problem'
        ? getConnectedDatasets(node.id, connections, allNodes)
        : []

      // Fetch parameter schema
      fetchParameterSchema(node.type, node, connectedDatasets)
        .then((fetchedSchema) => {
          setSchema(fetchedSchema)
          // Expand first group by default
          if (fetchedSchema.length > 0) {
            setExpandedGroups({ [fetchedSchema[0].name]: true })
          }
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [node, connections, allNodes])

  const handleParameterChange = (paramName: string, value: any) => {
    const newParameters = { ...parameters, [paramName]: value }
    setParameters(newParameters)
    if (node) {
      onParameterChange(node.id, newParameters)
    }
  }



  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }))
  }

  if (!isOpen || !node) {
    return null
  }

  const nodeIcon = node.type === 'dataset' ? Database : node.type === 'problem' ? Brain : Zap
  const nodeColor = node.type === 'dataset' ? 'text-blue-600' : node.type === 'problem' ? 'text-green-600' : 'text-orange-600'

  return (
    <div className="w-96 border-l bg-white dark:bg-slate-900 flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {React.createElement(nodeIcon, { className: `h-5 w-5 ${nodeColor} flex-shrink-0` })}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm">Node Parameters</h3>
              <h4 className="font-medium text-sm text-foreground truncate">{node.data.name}</h4>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground">@{node.data.username}</p>
          <Badge variant="outline" className="text-xs">
            {node.type}
          </Badge>
        </div>
      </div>

      {/* Parameters */}
      <ScrollArea className="flex-1 h-0 overflow-y-auto">
        <div className="p-4 space-y-4 min-h-0">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading parameters...</p>
            </div>
          ) : schema.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No parameters available</p>
            </div>
          ) : (
            schema.map((group) => (
              <Collapsible
                key={group.name}
                open={expandedGroups[group.name]}
                onOpenChange={() => toggleGroup(group.name)}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <div className="text-left min-w-0 flex-1 pr-2">
                      <h4 className="font-medium text-sm truncate">{group.label}</h4>
                      {group.description && (
                        <p className="text-xs text-muted-foreground break-words">{group.description}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {expandedGroups[group.name] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-3 mt-3 overflow-visible">
                  {group.parameters.map((parameter) => (
                    <div key={parameter.name} className="space-y-1.5">
                      <ParameterInput
                        parameter={parameter}
                        value={parameters[parameter.name]}
                        onChange={(value) => handleParameterChange(parameter.name, value)}
                      />
                      {parameter.description && (
                        <p className="text-xs text-muted-foreground flex items-start gap-1 leading-relaxed">
                          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="break-words overflow-wrap-anywhere">{parameter.description}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </CollapsibleContent>
                
                {group !== schema[schema.length - 1] && <Separator className="mt-4" />}
              </Collapsible>
            ))
          )}
        </div>
      </ScrollArea>


    </div>
  )
}

export default ParameterPanel
