import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target, 
  BarChart3, 
  Settings, 
  Info,
  TrendingUp,
  Activity
} from 'lucide-react'
import { QubotResult } from '@/types/playground'

interface OptimizationResultDisplayProps {
  result: QubotResult
  selectedProblem?: { name: string; username: string } | null
  selectedOptimizer?: { name: string; username: string } | null
  problemParams?: Record<string, any>
  optimizerParams?: Record<string, any>
}

export function OptimizationResultDisplay({
  result,
  selectedProblem,
  selectedOptimizer,
  problemParams = {},
  optimizerParams = {}
}: OptimizationResultDisplayProps) {
  
  // Helper function to format numbers
  const formatNumber = (value: any, decimals: number = 4): string => {
    if (value === undefined || value === null) return 'N/A'
    if (typeof value === 'number') {
      return value.toFixed(decimals)
    }
    return String(value)
  }

  // Helper function to format duration
  const formatDuration = (seconds: number): string => {
    if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`
    if (seconds < 60) return `${seconds.toFixed(2)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`
  }

  // Helper function to render metric cards
  const renderMetricCard = (
    icon: React.ReactNode,
    title: string,
    value: any,
    subtitle?: string,
    formatter?: (val: any) => string
  ) => {
    const displayValue = formatter ? formatter(value) : formatNumber(value)
    
    return (
      <div className="text-center p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-center mb-2">
          {icon}
        </div>
        <div className="text-lg font-bold">
          {displayValue}
        </div>
        <div className="text-xs text-muted-foreground">{title}</div>
        {subtitle && (
          <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status and Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            Optimization Summary
            {result.message === 'Optimization completed with streaming logs' && (
              <Badge variant="outline" className="text-xs">
                Real-time execution
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Status */}
            {renderMetricCard(
              result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              ),
              'Status',
              result.success ? 'Success' : 'Failed',
              result.is_feasible !== undefined ? 
                (result.is_feasible ? 'Feasible' : 'Infeasible') : undefined,
              (val) => val
            )}

            {/* Best Value */}
            {result.best_value !== undefined && result.best_value !== null && 
              renderMetricCard(
                <Target className="h-5 w-5 text-blue-600" />,
                'Best Value',
                result.best_value
              )
            }

            {/* Execution Time */}
            {(result.execution_time || result.runtime_seconds) &&
              renderMetricCard(
                <Clock className="h-5 w-5 text-purple-600" />,
                'Execution Time',
                result.runtime_seconds || result.execution_time,
                undefined,
                formatDuration
              )
            }

            {/* Iterations */}
            {result.iterations !== undefined && result.iterations !== null &&
              renderMetricCard(
                <Activity className="h-5 w-5 text-orange-600" />,
                'Iterations',
                result.iterations,
                undefined,
                (val) => val.toLocaleString()
              )
            }
          </div>

          {/* Additional Metrics Row */}
          {(result.evaluations || result.convergence_achieved !== undefined || result.termination_reason) && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {result.evaluations !== undefined && result.evaluations !== null &&
                renderMetricCard(
                  <BarChart3 className="h-5 w-5 text-green-600" />,
                  'Evaluations',
                  result.evaluations,
                  undefined,
                  (val) => val.toLocaleString()
                )
              }

              {result.convergence_achieved !== undefined &&
                renderMetricCard(
                  <TrendingUp className="h-5 w-5 text-indigo-600" />,
                  'Convergence',
                  result.convergence_achieved ? 'Achieved' : 'Not Achieved',
                  undefined,
                  (val) => val
                )
              }

              {result.termination_reason &&
                renderMetricCard(
                  <Info className="h-5 w-5 text-gray-600" />,
                  'Termination',
                  result.termination_reason,
                  undefined,
                  (val) => val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                )
              }
            </div>
          )}

          {/* Show additional info if results were extracted from logs */}
          {result.message === 'Optimization completed with streaming logs' && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Results were extracted from optimization logs. Some detailed metrics may not be available.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      {result.additional_metrics && Object.keys(result.additional_metrics).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Additional Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(result.additional_metrics).map(([key, value]) =>
                renderMetricCard(
                  <BarChart3 className="h-4 w-4 text-blue-600" />,
                  key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  value
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Problem</h4>
              <div className="text-sm space-y-1">
                <div><strong>Name:</strong> {selectedProblem?.name || result.problem_name}</div>
                <div><strong>Owner:</strong> {selectedProblem?.username || result.problem_username}</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Optimizer</h4>
              <div className="text-sm space-y-1">
                <div><strong>Name:</strong> {selectedOptimizer?.name || result.optimizer_name}</div>
                <div><strong>Owner:</strong> {selectedOptimizer?.username || result.optimizer_username}</div>
              </div>
            </div>
          </div>

          {/* Parameters */}
          {((result.parameter_values && Object.keys(result.parameter_values).length > 0) ||
            Object.keys(problemParams).length > 0 || 
            Object.keys(optimizerParams).length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {(Object.keys(problemParams).length > 0 || 
                (result.problem_metadata && Object.keys(result.problem_metadata).length > 0)) && (
                <div>
                  <h4 className="font-medium mb-2">Problem Parameters</h4>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(problemParams, null, 2)}
                  </pre>
                </div>
              )}
              
              {(Object.keys(optimizerParams).length > 0 || 
                (result.parameter_values && Object.keys(result.parameter_values).length > 0)) && (
                <div>
                  <h4 className="font-medium mb-2">Optimizer Parameters</h4>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(result.parameter_values || optimizerParams, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimization History */}
      {(result.optimization_history && result.optimization_history.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Optimization History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Showing last {Math.min(10, result.optimization_history.length)} iterations
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">Iteration</th>
                      <th className="text-left p-1">Best Value</th>
                      <th className="text-left p-1">Additional Info</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.optimization_history.slice(-10).map((entry, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-1">{entry.iteration || index + 1}</td>
                        <td className="p-1">{formatNumber(entry.best_value)}</td>
                        <td className="p-1">
                          {Object.entries(entry)
                            .filter(([key]) => key !== 'iteration' && key !== 'best_value')
                            .map(([key, value]) => `${key}: ${formatNumber(value, 2)}`)
                            .join(', ')
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Details (if failed) */}
      {!result.success && result.error_message && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Error Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Error:</strong> {result.error_message}</div>
              {result.error_type && (
                <div><strong>Type:</strong> {result.error_type}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Results Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Raw Results</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
