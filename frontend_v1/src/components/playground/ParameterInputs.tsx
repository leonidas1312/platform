import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const API = import.meta.env.VITE_API_BASE

interface ParameterSchema {
  model_type: 'problem' | 'optimizer'
  model_name: string
  parameters: {
    [key: string]: {
      required?: boolean
      type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'file'
      description: string
      min?: number
      max?: number
      minimum?: number
      maximum?: number
      step?: number
      default?: any
    }
  }
}

interface ParameterInputsProps {
  modelName: string
  username?: string
  modelType: 'problem' | 'optimizer'
  onParametersChange: (parameters: Record<string, any>) => void
  initialParameters?: Record<string, any>
  disabled?: boolean
}

export function ParameterInputs({
  modelName,
  username,
  modelType,
  onParametersChange,
  initialParameters = {},
  disabled = false
}: ParameterInputsProps) {
  const [schema, setSchema] = useState<ParameterSchema | null>(null)
  const [parameters, setParameters] = useState<Record<string, any>>(initialParameters)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (modelName) {
      fetchParameterSchema()
    } else {
      // Clear parameters when no model is selected
      setParameters({})
      setSchema(null)
    }
  }, [modelName, username])

  useEffect(() => {
    onParametersChange(parameters)
  }, [parameters, onParametersChange])

  const fetchParameterSchema = async () => {
    setLoading(true)
    setError(null)

    try {
      // Use the efficient parameter schema endpoint that reads config.json directly
      const url = `${API}/api/playground/qubots/schema/${modelName}${username ? `?username=${username}` : ''}`

      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()

        if (data.success && data.schema) {
          const schema = data.schema

          if (schema.parameters && Object.keys(schema.parameters).length > 0) {
            setSchema({
              model_type: schema.model_type || modelType,
              model_name: modelName,
              parameters: schema.parameters
            })

            // Initialize parameters with defaults, but only use initialParameters if they match the current schema
            const defaultParams: Record<string, any> = {}
            Object.entries(schema.parameters).forEach(([key, param]: [string, any]) => {
              if (param.default !== undefined) {
                defaultParams[key] = param.default
              }
            })

            // Only preserve initialParameters that are valid for the current schema
            const validInitialParams: Record<string, any> = {}
            Object.keys(initialParameters).forEach(key => {
              if (schema.parameters[key]) {
                validInitialParams[key] = initialParameters[key]
              }
            })

            setParameters({ ...defaultParams, ...validInitialParams })
          } else {
            // No parameters found in config.json
            setSchema({
              model_type: schema.model_type || modelType,
              model_name: modelName,
              parameters: {}
            })
          }
        } else {
          throw new Error(data.error || 'Failed to load parameter schema')
        }
      } else {
        throw new Error(`Failed to fetch parameter schema: ${response.status} ${response.statusText}`)
      }
    } catch (error: any) {
      console.error('Error fetching parameter schema:', error)
      setError(error.message || 'Failed to load parameter configuration')
      toast({
        title: "Failed to load parameters",
        description: error.message || 'Could not load parameter configuration',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateParameter = (key: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const renderParameterInput = (key: string, param: ParameterSchema['parameters'][string]) => {
    const value = parameters[key] ?? param.default
    const minValue = param.min ?? param.minimum
    const maxValue = param.max ?? param.maximum

    switch (param.type) {
      case 'boolean':
        return (
          <div className="space-y-1">
            <Label htmlFor={key} className="text-xs font-medium">{key}</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id={key}
                checked={value || false}
                onCheckedChange={(checked) => updateParameter(key, checked)}
                disabled={disabled}
              />
              <span className="text-xs text-muted-foreground">{value ? 'Enabled' : 'Disabled'}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-tight">{param.description}</p>
          </div>
        )

      case 'integer':
        return (
          <div className="space-y-1">
            <Label htmlFor={key} className="text-xs font-medium">
              {key}
              {minValue !== undefined && maxValue !== undefined && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({minValue}-{maxValue})
                </span>
              )}
            </Label>
            <Input
              id={key}
              type="number"
              value={value || ''}
              onChange={(e) => updateParameter(key, parseInt(e.target.value) || 0)}
              min={minValue}
              max={maxValue}
              step="1"
              placeholder={param.default?.toString() || '0'}
              className="h-7 text-xs"
              disabled={disabled}
              readOnly={disabled}
            />
            <p className="text-xs text-muted-foreground leading-tight">{param.description}</p>
          </div>
        )

      case 'number':
        return (
          <div className="space-y-1">
            <Label htmlFor={key} className="text-xs font-medium">
              {key}
              {minValue !== undefined && maxValue !== undefined && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({minValue}-{maxValue})
                </span>
              )}
            </Label>
            <Input
              id={key}
              type="number"
              value={value || ''}
              onChange={(e) => updateParameter(key, parseFloat(e.target.value) || 0)}
              min={minValue}
              max={maxValue}
              step={param.step || 'any'}
              placeholder={param.default?.toString() || '0'}
              className="h-7 text-xs"
              disabled={disabled}
              readOnly={disabled}
            />
            <p className="text-xs text-muted-foreground leading-tight">{param.description}</p>
          </div>
        )

      case 'file':
        return (
          <div className="space-y-1">
            <Label htmlFor={key} className="text-xs font-medium">{key}</Label>
            <Input
              id={key}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  updateParameter(key, file)
                }
              }}
              className="cursor-pointer h-7 text-xs"
              disabled={disabled}
            />
            {value && (
              <p className="text-xs text-muted-foreground">
                Selected: {value.name || value}
              </p>
            )}
            <p className="text-xs text-muted-foreground leading-tight">{param.description}</p>
          </div>
        )

      case 'array':
        return (
          <div className="space-y-1">
            <Label htmlFor={key} className="text-xs font-medium">{key}</Label>
            <Textarea
              id={key}
              value={Array.isArray(value) ? JSON.stringify(value, null, 2) : '[]'}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  updateParameter(key, parsed)
                } catch {
                  // Invalid JSON, don't update - could show validation error
                }
              }}
              placeholder='["item1", "item2"] or [1, 2, 3]'
              rows={2}
              className="text-xs font-mono"
              disabled={disabled}
              readOnly={disabled}
            />
            <p className="text-xs text-muted-foreground leading-tight">
              {param.description} (Enter as JSON array)
            </p>
          </div>
        )

      default: // string
        return (
          <div className="space-y-1">
            <Label htmlFor={key} className="text-xs font-medium">{key}</Label>
            <Input
              id={key}
              type="text"
              value={value || ''}
              onChange={(e) => updateParameter(key, e.target.value)}
              placeholder={param.default?.toString() || ''}
              className="h-7 text-xs"
              disabled={disabled}
              readOnly={disabled}
            />
            <p className="text-xs text-muted-foreground leading-tight">{param.description}</p>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm">Loading parameters...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-4 text-center">
        <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
        <div>
          <p className="text-sm text-red-600 font-medium">Failed to load parameters</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!schema || Object.keys(schema.parameters).length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">No configurable parameters</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {Object.entries(schema.parameters).map(([key, param]) => (
        <div key={key} className="space-y-1">
          <div className="flex items-center gap-1">
            {param.required && (
              <Badge variant="destructive" className="text-xs h-3 px-1">Required</Badge>
            )}
          </div>
          {renderParameterInput(key, param)}
        </div>
      ))}
    </div>
  )
}
