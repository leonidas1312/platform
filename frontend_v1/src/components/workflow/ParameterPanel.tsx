import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Save,
  RotateCcw,
  Link
} from 'lucide-react'
import { WorkflowNode, ParameterDefinition, ParameterGroup, WorkflowConnection } from '@/types/workflow-automation'

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

// Mock parameter schemas for different node types
const getParameterSchema = (
  nodeType: string,
  nodeName: string,
  connectedDatasets: WorkflowNode[] = []
): ParameterGroup[] => {
  switch (nodeType) {
    case 'dataset':
      return [
        {
          name: 'data_processing',
          label: 'Data Processing',
          description: 'Configure how the dataset should be processed',
          parameters: [
            {
              name: 'normalize',
              type: 'boolean',
              label: 'Normalize Data',
              description: 'Apply normalization to the dataset',
              defaultValue: false
            },
            {
              name: 'sample_size',
              type: 'number',
              label: 'Sample Size',
              description: 'Number of samples to use (0 = all)',
              defaultValue: 0,
              min: 0,
              max: 10000
            },
            {
              name: 'random_seed',
              type: 'number',
              label: 'Random Seed',
              description: 'Seed for random sampling',
              defaultValue: 42
            }
          ]
        }
      ]
    
    case 'problem':
      const problemParams: ParameterGroup[] = [
        {
          name: 'problem_config',
          label: 'Problem Configuration',
          description: 'Configure problem-specific parameters',
          parameters: [
            {
              name: 'objective',
              type: 'select',
              label: 'Objective',
              description: 'Optimization objective',
              defaultValue: 'minimize',
              options: [
                { label: 'Minimize', value: 'minimize' },
                { label: 'Maximize', value: 'maximize' }
              ]
            },
            {
              name: 'constraints',
              type: 'string',
              label: 'Constraints',
              description: 'Additional constraints (JSON format)',
              defaultValue: '{}'
            },
            {
              name: 'time_limit',
              type: 'number',
              label: 'Time Limit (seconds)',
              description: 'Maximum execution time',
              defaultValue: 300,
              min: 1,
              max: 3600
            }
          ]
        }
      ]

      // Add dataset connection information if datasets are connected
      if (connectedDatasets.length > 0) {
        problemParams.unshift({
          name: 'dataset_connections',
          label: 'Connected Datasets',
          description: 'Datasets connected to this problem',
          parameters: connectedDatasets.map((dataset, index) => ({
            name: `dataset_${index}`,
            type: 'string' as const,
            label: `Dataset ${index + 1}`,
            description: `Connected dataset: ${dataset.data.name}`,
            defaultValue: dataset.id,
            readOnly: true
          }))
        })
      }

      return problemParams
    
    case 'optimizer':
      return [
        {
          name: 'algorithm_params',
          label: 'Algorithm Parameters',
          description: 'Configure optimizer-specific parameters',
          parameters: [
            {
              name: 'population_size',
              type: 'number',
              label: 'Population Size',
              description: 'Size of the population (for evolutionary algorithms)',
              defaultValue: 100,
              min: 10,
              max: 1000
            },
            {
              name: 'max_iterations',
              type: 'number',
              label: 'Max Iterations',
              description: 'Maximum number of iterations',
              defaultValue: 1000,
              min: 1,
              max: 10000
            },
            {
              name: 'mutation_rate',
              type: 'number',
              label: 'Mutation Rate',
              description: 'Mutation rate (0.0 - 1.0)',
              defaultValue: 0.1,
              min: 0,
              max: 1,
              step: 0.01
            },
            {
              name: 'crossover_rate',
              type: 'number',
              label: 'Crossover Rate',
              description: 'Crossover rate (0.0 - 1.0)',
              defaultValue: 0.8,
              min: 0,
              max: 1,
              step: 0.01
            }
          ]
        },
        {
          name: 'termination',
          label: 'Termination Criteria',
          description: 'Configure when to stop the optimization',
          parameters: [
            {
              name: 'target_fitness',
              type: 'number',
              label: 'Target Fitness',
              description: 'Stop when this fitness is reached',
              defaultValue: 0
            },
            {
              name: 'stagnation_limit',
              type: 'number',
              label: 'Stagnation Limit',
              description: 'Stop after this many iterations without improvement',
              defaultValue: 100,
              min: 1,
              max: 1000
            }
          ]
        }
      ]
    
    default:
      return []
  }
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
              <Label className="text-sm">{parameter.label}</Label>
              <span className="text-sm text-muted-foreground">{currentValue}</span>
            </div>
            <Slider
              value={[currentValue]}
              onValueChange={(values) => onChange(values[0])}
              min={parameter.min}
              max={parameter.max}
              step={parameter.step}
              className="w-full"
            />
          </div>
        )
      } else {
        return (
          <div className="space-y-2">
            <Label className="text-sm">{parameter.label}</Label>
            <Input
              type="number"
              value={currentValue}
              onChange={(e) => onChange(Number(e.target.value))}
              min={parameter.min}
              max={parameter.max}
              step={parameter.step}
            />
          </div>
        )
      }
    
    case 'string':
      return (
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
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
            className={parameter.readOnly ? "bg-muted" : ""}
          />
        </div>
      )
    
    case 'select':
      return (
        <div className="space-y-2">
          <Label className="text-sm">{parameter.label}</Label>
          <Select value={currentValue} onValueChange={onChange}>
            <SelectTrigger>
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

  // Initialize parameters when node changes
  useEffect(() => {
    if (node) {
      setParameters(node.data.parameters || {})
      // Get connected datasets for problems
      const connectedDatasets = node.type === 'problem'
        ? getConnectedDatasets(node.id, connections, allNodes)
        : []

      // Expand first group by default
      const schema = getParameterSchema(node.type, node.data.name, connectedDatasets)
      if (schema.length > 0) {
        setExpandedGroups({ [schema[0].name]: true })
      }
    }
  }, [node, connections, allNodes])

  const handleParameterChange = (paramName: string, value: any) => {
    const newParameters = { ...parameters, [paramName]: value }
    setParameters(newParameters)
    if (node) {
      onParameterChange(node.id, newParameters)
    }
  }

  const handleReset = () => {
    if (node) {
      const connectedDatasets = node.type === 'problem'
        ? getConnectedDatasets(node.id, connections, allNodes)
        : []
      const schema = getParameterSchema(node.type, node.data.name, connectedDatasets)
      const defaultParams: Record<string, any> = {}
      schema.forEach(group => {
        group.parameters.forEach(param => {
          if (!param.readOnly) {
            defaultParams[param.name] = param.defaultValue
          }
        })
      })
      setParameters(defaultParams)
      onParameterChange(node.id, defaultParams)
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

  const connectedDatasets = node.type === 'problem'
    ? getConnectedDatasets(node.id, connections, allNodes)
    : []
  const schema = getParameterSchema(node.type, node.data.name, connectedDatasets)
  const nodeIcon = node.type === 'dataset' ? Database : node.type === 'problem' ? Brain : Zap
  const nodeColor = node.type === 'dataset' ? 'text-blue-600' : node.type === 'problem' ? 'text-green-600' : 'text-orange-600'

  return (
    <div className="w-80 border-l bg-white dark:bg-slate-900 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {React.createElement(nodeIcon, { className: `h-4 w-4 ${nodeColor}` })}
            <h3 className="font-semibold">Node Parameters</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm">{node.data.name}</h4>
          <p className="text-xs text-muted-foreground">@{node.data.username}</p>
          <Badge variant="outline" className="text-xs">
            {node.type}
          </Badge>
        </div>
      </div>

      {/* Parameters */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {schema.length === 0 ? (
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
                    <div className="text-left">
                      <h4 className="font-medium text-sm">{group.label}</h4>
                      {group.description && (
                        <p className="text-xs text-muted-foreground">{group.description}</p>
                      )}
                    </div>
                    {expandedGroups[group.name] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-4 mt-3">
                  {group.parameters.map((parameter) => (
                    <div key={parameter.name} className="space-y-2">
                      <ParameterInput
                        parameter={parameter}
                        value={parameters[parameter.name]}
                        onChange={(value) => handleParameterChange(parameter.name, value)}
                      />
                      {parameter.description && (
                        <p className="text-xs text-muted-foreground flex items-start gap-1">
                          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {parameter.description}
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

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button size="sm" className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Apply
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ParameterPanel
