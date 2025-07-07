import React, { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database, Brain, Zap, Settings, Star, GitFork } from 'lucide-react'
import { NodeData } from '@/types/workflow-automation'

// Custom node props interface that matches React Flow's expectations
interface CustomNodeProps {
  data: NodeData
  selected?: boolean
  id: string
  xPos: number
  yPos: number
}

// Dataset Node Component
export const DatasetNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <Card className={`relative min-w-[220px] max-w-[260px] ${selected ? 'ring-2 ring-primary' : ''} shadow-md hover:shadow-lg transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Database className="h-4 w-4 text-foreground" />
          <Badge variant="outline" className="text-xs px-2 py-1">
            Dataset
          </Badge>
        </div>

        <h4 className="font-medium text-sm mb-2 truncate">{data.name}</h4>
        <p className="text-xs text-muted-foreground mb-2 truncate">@{data.username}</p>

        {data.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {data.description}
          </p>
        )}

        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                {tag}
              </Badge>
            ))}
            {data.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs px-2 py-1">
                +{data.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Output Handle */}
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 border-2 border-background bg-muted-foreground hover:bg-foreground transition-colors"
        />
      </CardContent>
    </Card>
  )
})

// Problem Node Component
export const ProblemNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <Card className={`relative min-w-[220px] max-w-[260px] ${selected ? 'ring-2 ring-primary' : ''} shadow-md hover:shadow-lg transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Brain className="h-4 w-4 text-foreground" />
          <Badge variant="outline" className="text-xs px-2 py-1">
            Problem
          </Badge>
        </div>

        <h4 className="font-medium text-sm mb-2 truncate">{data.name}</h4>
        <p className="text-xs text-muted-foreground mb-2 truncate">@{data.username}</p>

        {data.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {data.description}
          </p>
        )}

        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                {tag}
              </Badge>
            ))}
            {data.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs px-2 py-1">
                +{data.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 border-2 border-background bg-muted-foreground hover:bg-foreground transition-colors"
        />

        {/* Output Handle */}
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 border-2 border-background bg-muted-foreground hover:bg-foreground transition-colors"
        />
      </CardContent>
    </Card>
  )
})

// Optimizer Node Component
export const OptimizerNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <Card className={`relative min-w-[220px] max-w-[260px] ${selected ? 'ring-2 ring-primary' : ''} shadow-md hover:shadow-lg transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Zap className="h-4 w-4 text-foreground" />
          <Badge variant="outline" className="text-xs px-2 py-1">
            Optimizer
          </Badge>
        </div>

        <h4 className="font-medium text-sm mb-2 truncate">{data.name}</h4>
        <p className="text-xs text-muted-foreground mb-2 truncate">@{data.username}</p>

        {data.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {data.description}
          </p>
        )}

        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                {tag}
              </Badge>
            ))}
            {data.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs px-2 py-1">
                +{data.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 border-2 border-background bg-muted-foreground hover:bg-foreground transition-colors"
        />
      </CardContent>
    </Card>
  )
})

// Node type mapping for React Flow
export const nodeTypes = {
  dataset: DatasetNode,
  problem: ProblemNode,
  optimizer: OptimizerNode,
}

// Default edge style for React Flow
export const defaultEdgeOptions = {
  animated: true,
  style: {
    stroke: '#94a3b8',
    strokeWidth: 2,
  },
  markerEnd: {
    type: 'arrowclosed' as const,
    color: '#94a3b8',
  },
}

DatasetNode.displayName = 'DatasetNode'
ProblemNode.displayName = 'ProblemNode'
OptimizerNode.displayName = 'OptimizerNode'
