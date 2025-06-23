import React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Clock, Cpu, HardDrive, MemoryStick, Info } from "lucide-react"

interface EnvironmentSpec {
  value?: number | string
  unit?: string
  description: string
  cores?: number
  requests?: string
}

interface EnvironmentSpecsData {
  runtime_limit: EnvironmentSpec
  cpu: EnvironmentSpec
  memory: EnvironmentSpec
  storage: EnvironmentSpec
  python_version: string
  qubots_support: boolean
  container_isolation: boolean
  ports?: {
    qubots_api: number
    jupyter: number
    vscode: number
  }
}

interface EnvironmentSpecsProps {
  specs: EnvironmentSpecsData | null
  variant?: "badge" | "card" | "inline" | "compact"
  className?: string
}

const EnvironmentSpecs: React.FC<EnvironmentSpecsProps> = ({
  specs,
  variant = "badge",
  className = ""
}) => {
  if (!specs) return null

  const formatSpec = (spec: EnvironmentSpec, icon: React.ReactNode, label: string) => {
    const value = spec.cores ? `${spec.cores} cores` : `${spec.value}${spec.unit ? ` ${spec.unit}` : ''}`

    return (
      <div className="flex items-center gap-2 text-sm">
        {icon}
        <span className="font-medium">{label}:</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
    )
  }

  const specsContent = (
    <div className="space-y-2">
      {formatSpec(specs.runtime_limit, <Clock className="h-3 w-3" />, "Runtime")}
      {formatSpec(specs.cpu, <Cpu className="h-3 w-3" />, "CPU")}
      {formatSpec(specs.memory, <MemoryStick className="h-3 w-3" />, "Memory")}
      {formatSpec(specs.storage, <HardDrive className="h-3 w-3" />, "Storage")}
      <div className="flex items-center gap-2 text-sm">
        <Info className="h-3 w-3" />
        <span className="font-medium">Python:</span>
        <span className="text-muted-foreground">{specs.python_version}</span>
      </div>
    </div>
  )

  if (variant === "card") {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Environment Specifications</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {specsContent}
        </CardContent>
      </Card>
    )
  }

  if (variant === "inline") {
    return (
      <div className={`p-3 bg-muted/50 rounded-lg ${className}`}>
        <div className="text-xs font-medium text-muted-foreground mb-2">Environment Specs</div>
        {specsContent}
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div className={`flex gap-1 ${className}`}>
        <Badge variant="outline" className="text-xs h-6">
          {specs.cpu.cores} CPU
        </Badge>
        <Badge variant="outline" className="text-xs h-6">
          {specs.memory.value}{specs.memory.unit} RAM
        </Badge>
        <Badge variant="outline" className="text-xs h-6">
          {specs.runtime_limit.value}{specs.runtime_limit.unit}
        </Badge>
      </div>
    )
  }

  // Simple badges without tooltip
  return (
    <div className={`flex gap-2 ${className}`}>
      <Badge variant="outline" className="text-xs h-6">
        CPU: 1 core (0.25 guaranteed)
      </Badge>
      <Badge variant="outline" className="text-xs h-6">
        Memory: 2GB (512MB guaranteed)
      </Badge>
      <Badge variant="outline" className="text-xs h-6">
        5 minutes maximum runtime
      </Badge>
    </div>
  )
}

export default EnvironmentSpecs
