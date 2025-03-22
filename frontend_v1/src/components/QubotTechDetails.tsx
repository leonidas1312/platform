import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Code, Database, Settings, Zap } from "lucide-react"

interface TechnicalDetailsProps {
  data: any
}

export default function TechnicalDetails({ data }: TechnicalDetailsProps) {
  // Extract technical details from the data
  const {
    entry_point,
    default_params,
    data_format,
    decision_variables,
    objective,
    solution_representation,
    formulations,
  } = data

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Code className="h-5 w-5 mr-2 text-muted-foreground" />
            <CardTitle className="text-xl">Implementation Details</CardTitle>
          </div>
          <CardDescription>Technical specifications for this Qubot</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Entry Point */}
          {entry_point && (
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Code className="h-4 w-4 text-muted-foreground" /> Entry Point
              </h3>
              <div className="bg-muted rounded-md p-3 font-mono text-sm">{entry_point}</div>
            </div>
          )}

          {/* Solution Representation */}
          {solution_representation && (
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-muted-foreground" /> Solution Representation
              </h3>
              <p className="text-sm text-muted-foreground">{solution_representation}</p>
            </div>
          )}

          <Separator />

          {/* Data Format */}
          {data_format && Object.keys(data_format).length > 0 && (
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-muted-foreground" /> Data Format
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(data_format).map(([key, value]) => (
                  <div key={key} className="bg-muted/50 rounded-md p-3">
                    <span className="text-xs font-medium block mb-1">{key}</span>
                    <span className="text-sm">{formatValue(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision Variables */}
          {decision_variables && Object.keys(decision_variables).length > 0 && (
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-muted-foreground" /> Decision Variables
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(decision_variables).map(([key, value]) => (
                  <div key={key} className="bg-muted/50 rounded-md p-3">
                    <span className="text-xs font-medium block mb-1">{key}</span>
                    <span className="text-sm">{formatValue(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Objective */}
          {objective && Object.keys(objective).length > 0 && (
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-muted-foreground" /> Objective
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(objective).map(([key, value]) => (
                  <div key={key} className="bg-muted/50 rounded-md p-3">
                    <span className="text-xs font-medium block mb-1">{key}</span>
                    <span className="text-sm">{formatValue(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Default Parameters */}
          {default_params && Object.keys(default_params).length > 0 && (
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-muted-foreground" /> Default Parameters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(default_params).map(([key, value]) => (
                  <div key={key} className="bg-muted/50 rounded-md p-3">
                    <span className="text-xs font-medium block mb-1">{key}</span>
                    <span className="text-sm">{formatValue(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulations */}
          {formulations && formulations.length > 0 && (
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Code className="h-4 w-4 text-muted-foreground" /> Formulations
              </h3>
              <div className="space-y-2">
                {formulations.map((formulation: any, index: number) => (
                  <Badge key={index} variant="outline">
                    {formulation}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to format values for display
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return "N/A"
  }

  if (typeof value === "object") {
    return JSON.stringify(value)
  }

  return String(value)
}

