import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Database,
  Brain,
  Zap,
  Star,
  GitFork,
  Calendar,
  User,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { Dataset, Problem, Optimizer, NodeType } from '@/types/workflow-automation'

interface ComponentSidebarProps {
  datasets: Dataset[]
  problems: Problem[]
  optimizers: Optimizer[]
  onDragStart: (event: React.DragEvent, nodeType: NodeType, item: Dataset | Problem | Optimizer) => void
  onAddNode: (nodeType: NodeType, item: Dataset | Problem | Optimizer) => void
  isLoading: boolean
}

const ComponentSidebar: React.FC<ComponentSidebarProps> = ({
  datasets,
  problems,
  optimizers,
  onDragStart,
  onAddNode,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState('datasets')

  // Use all datasets, problems, and optimizers without filtering
  const filteredDatasets = datasets
  const filteredProblems = problems
  const filteredOptimizers = optimizers

  const renderDatasetCard = (dataset: Dataset) => (
    <Card
      key={dataset.id}
      className="cursor-pointer hover:shadow-lg transition-all duration-300 border-border bg-card hover:bg-accent/30 group relative overflow-hidden w-full"
      draggable
      onDragStart={(e) => onDragStart(e, 'dataset', dataset)}
      onClick={() => onAddNode('dataset', dataset)}
    >
      {/* Pipeline indicator */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/60 to-primary/30" />

      <CardContent className="p-3">
        <div className="flex items-start gap-2 w-full overflow-hidden">
          <div className="flex-shrink-0 p-1.5 rounded-lg bg-primary/10">
            <Database className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-xs text-foreground truncate">
                {dataset.name}
              </h4>
              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-primary/20"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddNode('dataset', dataset)
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mb-2 leading-relaxed overflow-hidden">
              <span className="line-clamp-1 break-words">
                {dataset.description || 'No description available'}
              </span>
            </p>

            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs font-medium px-1.5 py-0.5">
                {dataset.format_type?.toUpperCase() || 'DATA'}
              </Badge>
              {dataset.user?.username && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="truncate">@{dataset.user.username}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderProblemCard = (problem: Problem) => (
    <Card
      key={problem.id}
      className="cursor-pointer hover:shadow-lg transition-all duration-300 border-border bg-card hover:bg-accent/30 group relative overflow-hidden w-full"
      draggable
      onDragStart={(e) => onDragStart(e, 'problem', problem)}
      onClick={() => onAddNode('problem', problem)}
    >
      {/* Pipeline indicator */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-secondary/60 to-secondary/30" />

      <CardContent className="p-3">
        <div className="flex items-start gap-2 w-full overflow-hidden">
          <div className="flex-shrink-0 p-1.5 rounded-lg bg-secondary/10">
            <Brain className="h-4 w-4 text-secondary-foreground" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-xs text-foreground truncate">
                {problem.name}
              </h4>
              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-secondary/20"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddNode('problem', problem)
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mb-2 leading-relaxed overflow-hidden">
              <span className="line-clamp-1 break-words">
                {problem.description || 'No description available'}
              </span>
            </p>

            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs font-medium px-1.5 py-0.5">
                PROBLEM
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="truncate">@{problem.username}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderOptimizerCard = (optimizer: Optimizer) => (
    <Card
      key={optimizer.id}
      className="cursor-pointer hover:shadow-lg transition-all duration-300 border-border bg-card hover:bg-accent/30 group relative overflow-hidden w-full"
      draggable
      onDragStart={(e) => onDragStart(e, 'optimizer', optimizer)}
      onClick={() => onAddNode('optimizer', optimizer)}
    >
      {/* Pipeline indicator */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent/60 to-accent/30" />

      <CardContent className="p-3">
        <div className="flex items-start gap-2 w-full overflow-hidden">
          <div className="flex-shrink-0 p-1.5 rounded-lg bg-accent/10">
            <Zap className="h-4 w-4 text-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-xs text-foreground truncate">
                {optimizer.name}
              </h4>
              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-accent/20"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddNode('optimizer', optimizer)
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mb-2 leading-relaxed overflow-hidden">
              <span className="line-clamp-1 break-words">
                {optimizer.description || 'No description available'}
              </span>
            </p>

            <div className="flex items-center justify-between">
              <Badge variant="default" className="text-xs font-medium px-1.5 py-0.5">
                OPTIMIZER
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="truncate">@{optimizer.username}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )






  if (isLoading) {
    return (
      <div className="w-80 bg-background border-r border-border flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading components...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-background border-r border-border flex flex-col h-full max-h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <h3 className="font-semibold text-foreground">Components</h3>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-3 pb-2 flex-shrink-0">
          <div className="text-xs text-muted-foreground mb-2 text-center">
            Pipeline: Data → Problem → Optimizer
          </div>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="datasets" className="flex items-center gap-1 text-xs">
              <Database className="h-3 w-3" />
              <span>Data</span>
              <Badge variant="outline" className="text-xs ml-1">
                {filteredDatasets.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="problems" className="flex items-center gap-1 text-xs">
              <Brain className="h-3 w-3" />
              <span>Problem</span>
              <Badge variant="outline" className="text-xs ml-1">
                {filteredProblems.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="optimizers" className="flex items-center gap-1 text-xs">
              <Zap className="h-3 w-3" />
              <span>Optimizer</span>
              <Badge variant="outline" className="text-xs ml-1">
                {filteredOptimizers.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 pt-2">
            <TabsContent value="datasets" className="mt-0 space-y-4">
              {filteredDatasets.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No datasets available</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Upload datasets to get started</p>
                </div>
              ) : (
                filteredDatasets.map(renderDatasetCard)
              )}
            </TabsContent>

            <TabsContent value="problems" className="mt-0 space-y-4">
              {filteredProblems.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No problems available</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Create problems to define optimization tasks</p>
                </div>
              ) : (
                filteredProblems.map(renderProblemCard)
              )}
            </TabsContent>

            <TabsContent value="optimizers" className="mt-0 space-y-4">
              {filteredOptimizers.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No optimizers available</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Create optimizers to solve problems</p>
                </div>
              ) : (
                filteredOptimizers.map(renderOptimizerCard)
              )}
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

export default ComponentSidebar
