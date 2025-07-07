import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Loader2,
  AlertCircle,
  AlertTriangle
} from 'lucide-react'
import { WorkflowNode, ParameterDefinition, ParameterGroup, WorkflowConnection } from '@/types/workflow-automation'
import { workflowAutomationApi } from '@/services/workflowAutomationApi'

// Simple cache for parameter schemas to avoid repeated API calls
const schemaCache = new Map<string, { schema: ParameterGroup[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Parameter validation types
interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Parameter validation functions
const validateParameter = (value: any, parameter: ParameterDefinition): ValidationResult => {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

  // Check required parameters
  if (parameter.required && (value === undefined || value === null || value === '')) {
    result.isValid = false
    result.errors.push(`${parameter.label} is required`)
    return result
  }

  // Skip validation for empty optional parameters
  if (!parameter.required && (value === undefined || value === null || value === '')) {
    return result
  }

  // Type-specific validation
  switch (parameter.type) {
    case 'number':
      const num = Number(value)
      if (isNaN(num)) {
        result.isValid = false
        result.errors.push(`${parameter.label} must be a valid number`)
      } else {
        if (parameter.min !== undefined && num < parameter.min) {
          result.isValid = false
          result.errors.push(`${parameter.label} must be at least ${parameter.min}`)
        }
        if (parameter.max !== undefined && num > parameter.max) {
          result.isValid = false
          result.errors.push(`${parameter.label} must be at most ${parameter.max}`)
        }
      }
      break

    case 'string':
      if (typeof value !== 'string') {
        result.isValid = false
        result.errors.push(`${parameter.label} must be a string`)
      } else {
        if (parameter.min !== undefined && value.length < parameter.min) {
          result.isValid = false
          result.errors.push(`${parameter.label} must be at least ${parameter.min} characters`)
        }
        if (parameter.max !== undefined && value.length > parameter.max) {
          result.isValid = false
          result.errors.push(`${parameter.label} must be at most ${parameter.max} characters`)
        }
      }
      break

    case 'array':
      if (!Array.isArray(value)) {
        result.isValid = false
        result.errors.push(`${parameter.label} must be an array`)
      } else {
        if (parameter.min !== undefined && value.length < parameter.min) {
          result.isValid = false
          result.errors.push(`${parameter.label} must have at least ${parameter.min} items`)
        }
        if (parameter.max !== undefined && value.length > parameter.max) {
          result.isValid = false
          result.errors.push(`${parameter.label} must have at most ${parameter.max} items`)
        }
      }
      break

    case 'select':
      if (parameter.options && !parameter.options.some(opt => opt.value === value)) {
        result.isValid = false
        result.errors.push(`${parameter.label} must be one of the available options`)
      }
      break
  }

  return result
}

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

// Type validation helpers
const validateParameterType = (type: string): ParameterDefinition['type'] => {
  const validTypes = ['string', 'number', 'boolean', 'select', 'array', 'file']
  const normalizedType = type === 'integer' || type === 'float' ? 'number' : type
  return validTypes.includes(normalizedType) ? normalizedType as ParameterDefinition['type'] : 'string'
}

const validateParameterValue = (value: any, type: ParameterDefinition['type'], constraints?: any): any => {
  switch (type) {
    case 'number':
      const num = Number(value)
      if (isNaN(num)) return constraints?.default || 0
      if (constraints?.min !== undefined && num < constraints.min) return constraints.min
      if (constraints?.max !== undefined && num > constraints.max) return constraints.max
      return num
    case 'boolean':
      return Boolean(value)
    case 'string':
      return String(value || '')
    default:
      return value
  }
}

// Convert config.json parameters to ParameterGroup format
const convertConfigToParameterGroups = (config: any, nodeType: string): ParameterGroup[] => {
  if (!config || typeof config !== 'object') {
    console.warn('Invalid config object provided')
    return []
  }

  const parameters: ParameterDefinition[] = []

  // Handle both 'parameters' section and 'default_params' fallback
  const parameterDefs = config.parameters || {}
  const defaultParams = config.default_params || {}

  console.log(`Converting config for ${nodeType}:`, { parameterDefs, defaultParams })

  // If we have a parameters section, use it
  if (config.parameters && Object.keys(config.parameters).length > 0) {
    console.log(`Processing parameters section:`, config.parameters)
    Object.entries(config.parameters).forEach(([key, param]: [string, any]) => {
      try {
        // Validate parameter definition
        if (!param || typeof param !== 'object') {
          console.warn(`Invalid parameter definition for ${key}:`, param)
          return
        }

        // Validate and normalize parameter type
        let paramType = validateParameterType(param.type || 'string')

        // Check if this should be a select type
        if (param.options && Array.isArray(param.options)) {
          paramType = 'select'
        }
        if (param.enum && Array.isArray(param.enum)) {
          paramType = 'select'
        }

        // Validate default value
        const defaultValue = param.default !== undefined ? param.default : defaultParams[key]
        const validatedDefault = validateParameterValue(defaultValue, paramType, {
          min: param.min || param.minimum,
          max: param.max || param.maximum,
          default: paramType === 'number' ? 0 : paramType === 'boolean' ? false : ''
        })

        const paramDef: ParameterDefinition = {
          name: key,
          type: paramType,
          label: param.label || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: param.description || `Configure ${key.replace(/_/g, ' ')}`,
          defaultValue: validatedDefault,
          required: Boolean(param.required)
        }

        // Add type-specific properties with validation
        if (paramType === 'number') {
          paramDef.min = typeof param.min === 'number' ? param.min : param.minimum
          paramDef.max = typeof param.max === 'number' ? param.max : param.maximum
          paramDef.step = typeof param.step === 'number' ? param.step :
                         (param.type === 'integer' ? 1 : 0.1)

          // Validate min/max constraints
          if (paramDef.min !== undefined && paramDef.max !== undefined && paramDef.min >= paramDef.max) {
            console.warn(`Invalid min/max range for parameter ${key}: min=${paramDef.min}, max=${paramDef.max}`)
            delete paramDef.min
            delete paramDef.max
          }
        }

        // Handle options for select type with validation
        if (param.options && Array.isArray(param.options)) {
          paramDef.options = param.options
            .filter(opt => opt !== null && opt !== undefined)
            .map((opt: any) => typeof opt === 'string' ? { label: opt, value: opt } : opt)
            .filter(opt => opt.label && opt.value !== undefined)
        }

        // Handle enum as select with validation
        if (param.enum && Array.isArray(param.enum)) {
          paramDef.options = param.enum
            .filter(opt => opt !== null && opt !== undefined)
            .map((opt: any) => typeof opt === 'string' ? { label: opt, value: opt } : opt)
            .filter(opt => opt.label && opt.value !== undefined)
        }

        console.log(`Created parameter definition for ${key}:`, paramDef)
        parameters.push(paramDef)
      } catch (error) {
        console.error(`Error processing parameter ${key}:`, error)
        // Continue processing other parameters
      }
    })
  }
  // Fallback to default_params if no parameters section
  else if (defaultParams && Object.keys(defaultParams).length > 0) {
    console.log(`Processing default_params section:`, defaultParams)
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

      console.log(`Created parameter definition from default_params for ${key}:`, paramDef)
      parameters.push(paramDef)
    })
  } else {
    console.log(`No parameters or default_params found in config`)
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
    const datasetId = node.data.datasetId || node.id

    // Fetch real dataset preview from API
    const response = await fetch(`/api/datasets/${datasetId}/preview`, {
      credentials: 'include'
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        parameters.push({
          name: 'preview',
          type: 'textarea',
          label: `Preview (First 5 lines of ${data.total_lines} total)`,
          description: `First 5 lines of the ${data.format_type?.toUpperCase() || 'dataset'} file`,
          defaultValue: data.preview || 'No content available',
          readOnly: true
        })
      } else {
        throw new Error(data.error || 'Failed to fetch preview')
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    console.warn('Failed to fetch dataset preview:', error)
    parameters.push({
      name: 'preview',
      type: 'textarea',
      label: 'Preview',
      description: 'Dataset preview not available',
      defaultValue: `Preview not available: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

    // Create cache key
    const cacheKey = `${nodeType}:${node.data.username}/${node.data.name}`
    const cached = schemaCache.get(cacheKey)

    // Check if we have a valid cached result
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log(`Using cached config for ${nodeType}: ${node.data.username}/${node.data.name}`)
      return cached.schema
    }

    console.log(`Fetching config for ${nodeType}: ${node.data.username}/${node.data.name}`)

    // Fetch config.json for problems and optimizers
    const response = await workflowAutomationApi.getRepositoryConfig(node.data.username, node.data.name)

    console.log(`Config response for ${node.data.username}/${node.data.name}:`, response)

    if (response.success && response.config) {
      console.log(`Config data:`, response.config)
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

      console.log(`Generated parameter groups:`, groups)

      // Cache the successful result
      schemaCache.set(cacheKey, { schema: groups, timestamp: Date.now() })

      return groups
    } else {
      console.warn(`Failed to fetch config for ${nodeType} ${node.data.username}/${node.data.name}:`, response)
      throw new Error(`Failed to load configuration: ${response.message || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('Failed to fetch parameter schema:', error)
    console.error('Error details:', error)
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
  validation?: ValidationResult
}> = ({ parameter, value, onChange, validation }) => {
  const currentValue = value !== undefined ? value : parameter.defaultValue
  const hasErrors = validation && !validation.isValid
  const hasWarnings = validation && validation.warnings.length > 0

  switch (parameter.type) {
    case 'boolean':
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{parameter.label}</Label>
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
              currentValue
                ? 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800'
                : 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950 dark:border-gray-800'
            }`}>
              {currentValue ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Switch
              checked={currentValue}
              onCheckedChange={onChange}
              className="data-[state=checked]:bg-primary"
            />
            <span className="text-sm text-muted-foreground">
              {currentValue ? 'Turn off' : 'Turn on'}
            </span>
          </div>
        </div>
      )
    
    case 'number':
      const hasRange = parameter.min !== undefined && parameter.max !== undefined
      const rangeText = hasRange ? `${parameter.min} - ${parameter.max}` : ''
      const stepText = parameter.step ? ` (step: ${parameter.step})` : ''
      const constraintsText = rangeText + stepText

      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{parameter.label}</Label>
            {currentValue !== undefined && currentValue !== null && (
              <span className="text-xs text-muted-foreground">
                Current: <span className="font-mono text-foreground">{currentValue}</span>
              </span>
            )}
          </div>
          {constraintsText && (
            <div className="text-xs text-muted-foreground">
              Range: {constraintsText}
            </div>
          )}
          <Input
            type="number"
            value={currentValue || ''}
            onChange={(e) => {
              const value = e.target.value
              if (value === '') {
                onChange(null)
              } else {
                let numValue = parameter.step && parameter.step < 1 ? parseFloat(value) : Number(value)

                // Don't auto-clamp during typing, let validation handle it
                if (!isNaN(numValue)) {
                  onChange(numValue)
                }
              }
            }}
            placeholder={parameter.description}
            className={`h-8 text-sm ${hasErrors ? "border-red-500 focus:border-red-500" : ""}`}
            step={parameter.step || 'any'}
            min={parameter.min}
            max={parameter.max}
          />
          {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
            <div className="space-y-1">
              {validation.errors.map((error, index) => (
                <p key={`error-${index}`} className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </p>
              ))}
              {validation.warnings.map((warning, index) => (
                <p key={`warning-${index}`} className="text-xs text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {warning}
                </p>
              ))}
            </div>
          )}
        </div>
      )
    
    case 'select':
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{parameter.label}</Label>
            <span className="text-xs text-muted-foreground">
              Current: <span className="font-mono text-foreground">{currentValue}</span>
            </span>
          </div>
          <Select value={currentValue} onValueChange={onChange}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder={parameter.description} />
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

    case 'string':
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              {parameter.label}
              {parameter.required && (
                <Badge variant="destructive" className="text-xs">Required</Badge>
              )}
              {parameter.readOnly && (
                <Badge variant="secondary" className="text-xs">
                  <Link className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </Label>
            {currentValue && !parameter.readOnly && (
              <span className="text-xs text-muted-foreground">
                Length: <span className="font-mono text-foreground">{currentValue.length}</span>
              </span>
            )}
          </div>
          <Input
            value={currentValue || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={parameter.description}
            readOnly={parameter.readOnly}
            className={`h-8 text-sm ${parameter.readOnly ? "bg-muted" : ""} ${hasErrors ? "border-red-500 focus:border-red-500" : ""}`}
            title={currentValue} // Show full value on hover
          />
          {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
            <div className="space-y-1">
              {validation.errors.map((error, index) => (
                <p key={`error-${index}`} className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </p>
              ))}
              {validation.warnings.map((warning, index) => (
                <p key={`warning-${index}`} className="text-xs text-yellow-600 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {warning}
                </p>
              ))}
            </div>
          )}
        </div>
      )

    case 'textarea':
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              {parameter.label}
              {parameter.readOnly && (
                <Badge variant="secondary" className="text-xs">
                  <Link className="h-3 w-3 mr-1" />
                  Preview
                </Badge>
              )}
            </Label>
            {currentValue && !parameter.readOnly && (
              <span className="text-xs text-muted-foreground">
                {currentValue.split('\n').length} lines, {currentValue.length} chars
              </span>
            )}
          </div>
          <Textarea
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={parameter.description}
            readOnly={parameter.readOnly}
            className={`min-h-[80px] font-mono text-xs ${parameter.readOnly ? "bg-muted" : ""}`}
            rows={4}
          />
        </div>
      )

    case 'array':
      const arrayValue = Array.isArray(currentValue) ? currentValue : []
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{parameter.label}</Label>
            <span className="text-xs text-muted-foreground">
              Items: <span className="font-mono text-foreground">{arrayValue.length}</span>
            </span>
          </div>
          <Textarea
            value={arrayValue.join('\n')}
            onChange={(e) => {
              const lines = e.target.value.split('\n').filter(line => line.trim() !== '')
              onChange(lines)
            }}
            placeholder="Enter one item per line"
            className="min-h-[80px] text-sm"
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Enter one item per line. Empty lines will be ignored.
          </p>
        </div>
      )

    case 'file':
      return (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{parameter.label}</Label>
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                onChange(file.name)
              }
            }}
            className="h-8 text-sm"
          />
          {currentValue && (
            <p className="text-xs text-muted-foreground">
              Selected: <span className="font-mono">{currentValue}</span>
            </p>
          )}
        </div>
      )

    default:
      return (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-muted-foreground">
            {parameter.label} (Unsupported type: {parameter.type})
          </Label>
          <Input
            value={String(currentValue || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Unsupported parameter type"
            className="h-8 text-sm bg-muted"
            readOnly
          />
        </div>
      )
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
  const [error, setError] = useState<string | null>(null)
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({})

  // Initialize parameters when node changes
  useEffect(() => {
    if (node) {
      setParameters(node.data.parameters || {})
      setIsLoading(true)
      setError(null)

      // Get connected datasets for problems
      const connectedDatasets = node.type === 'problem'
        ? getConnectedDatasets(node.id, connections, allNodes)
        : []

      // Fetch parameter schema
      fetchParameterSchema(node.type, node, connectedDatasets)
        .then((fetchedSchema) => {
          setSchema(fetchedSchema)

          // Initialize parameters with default values if not already set
          const currentParams = node.data.parameters || {}
          const defaultParams: Record<string, any> = {}

          fetchedSchema.forEach(group => {
            group.parameters.forEach(param => {
              if (currentParams[param.name] === undefined && param.defaultValue !== undefined) {
                defaultParams[param.name] = param.defaultValue
              }
            })
          })

          // Merge current parameters with defaults
          const mergedParams = { ...defaultParams, ...currentParams }
          setParameters(mergedParams)

          // Update the node with merged parameters
          if (Object.keys(defaultParams).length > 0) {
            onParameterChange(node.id, mergedParams)
          }

          // Expand first group by default
          if (fetchedSchema.length > 0) {
            setExpandedGroups({ [fetchedSchema[0].name]: true })
          }
          setError(null)
        })
        .catch((err) => {
          console.error('Error fetching parameter schema:', err)
          setError(`Failed to load parameters: ${err.message}`)
          setSchema([])
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [node, connections, allNodes])

  const handleParameterChange = useCallback((paramName: string, value: any) => {
    setParameters(prev => {
      const newParameters = { ...prev, [paramName]: value }

      // Validate the parameter
      const parameterDef = schema.flatMap(group => group.parameters).find(p => p.name === paramName)
      if (parameterDef) {
        const validation = validateParameter(value, parameterDef)
        setValidationResults(prevValidation => ({
          ...prevValidation,
          [paramName]: validation
        }))
      }

      if (node) {
        onParameterChange(node.id, newParameters)
      }
      return newParameters
    })
  }, [node, onParameterChange, schema])

  const toggleGroup = useCallback((groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }))
  }, [])

  if (!isOpen || !node) {
    return null
  }

  const nodeIcon = node.type === 'dataset' ? Database : node.type === 'problem' ? Brain : Zap
  const nodeColor = node.type === 'dataset' ? 'text-blue-600' : node.type === 'problem' ? 'text-green-600' : 'text-orange-600'

  return (
    <div className="parameter-panel-container bg-background flex flex-col h-full max-h-full overflow-hidden border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
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
          <p className="text-xs text-muted-foreground">
            <span
              className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
              onClick={() => window.open(`https://rastion.com/${node.data.username}/${node.data.name}`, '_blank')}
              title="Open repository"
            >
              @{node.data.username}/{node.data.name}
            </span>
          </p>
          <Badge variant="outline" className="text-xs">
            {node.type}
          </Badge>
        </div>
      </div>

      {/* Description Section */}
      {node.data.description && (
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex-shrink-0">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              {React.createElement(nodeIcon, { className: `h-4 w-4 ${nodeColor}` })}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-medium text-foreground mb-1">Description</h5>
              <p className="text-xs text-muted-foreground leading-relaxed break-words">
                {node.data.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Parameters */}
      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <div className="p-4 space-y-4 w-full min-w-0">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading parameters...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <Settings className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600 mb-2">Error loading parameters</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          ) : schema.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No parameters available</p>
              <p className="text-xs text-muted-foreground">This component may not have configurable parameters</p>
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
                
                <CollapsibleContent className="space-y-4 mt-3 overflow-hidden">
                  {group.parameters.map((parameter) => (
                    <div key={parameter.name} className="space-y-2 w-full max-w-full min-w-0">
                      <div className="parameter-input-container">
                        <ParameterInput
                          parameter={parameter}
                          value={parameters[parameter.name]}
                          onChange={(value) => handleParameterChange(parameter.name, value)}
                          validation={validationResults[parameter.name]}
                        />
                      </div>
                      {parameter.description && (
                        <p className="text-xs text-muted-foreground flex items-start gap-1 leading-relaxed pl-1">
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
