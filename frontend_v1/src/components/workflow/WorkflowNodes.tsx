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
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-blue-600" />
          <Badge variant="outline" className="text-xs">
            Dataset
          </Badge>
        </div>
        
        <h4 className="font-medium text-sm mb-1">{data.name}</h4>
        <p className="text-xs text-muted-foreground mb-2">@{data.username}</p>
        
        {data.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {data.description}
          </p>
        )}
        
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {data.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                {tag}
              </Badge>
            ))}
            {data.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                +{data.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
        
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-blue-600 border-2 border-white"
        />
      </CardContent>
    </Card>
  )
})

// Problem Node Component
export const ProblemNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-4 w-4 text-green-600" />
          <Badge variant="outline" className="text-xs">
            Problem
          </Badge>
        </div>
        
        <h4 className="font-medium text-sm mb-1">{data.name}</h4>
        <p className="text-xs text-muted-foreground mb-2">@{data.username}</p>
        
        {data.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {data.description}
          </p>
        )}
        
        {data.repository && (
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            <Star className="h-3 w-3" />
            <span>12</span>
            <GitFork className="h-3 w-3" />
            <span>3</span>
          </div>
        )}
        
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {data.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                {tag}
              </Badge>
            ))}
            {data.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                +{data.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-green-600 border-2 border-white"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-green-600 border-2 border-white"
        />
      </CardContent>
    </Card>
  )
})

// Optimizer Node Component
export const OptimizerNode = memo(({ data, selected }: CustomNodeProps) => {
  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-orange-600" />
          <Badge variant="outline" className="text-xs">
            Optimizer
          </Badge>
        </div>
        
        <h4 className="font-medium text-sm mb-1">{data.name}</h4>
        <p className="text-xs text-muted-foreground mb-2">@{data.username}</p>
        
        {data.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {data.description}
          </p>
        )}
        
        {data.repository && (
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            <Star className="h-3 w-3" />
            <span>25</span>
            <GitFork className="h-3 w-3" />
            <span>8</span>
          </div>
        )}
        
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {data.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                {tag}
              </Badge>
            ))}
            {data.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                +{data.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-orange-600 border-2 border-white"
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
