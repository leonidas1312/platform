import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ProblemTypeStats {
  type: string
  count: number
  icon: string
  description: string
}

interface ProblemTypeGridProps {
  problemTypes: ProblemTypeStats[]
  onTypeSelect: (type: string) => void
}

const ProblemTypeGrid: React.FC<ProblemTypeGridProps> = ({ problemTypes, onTypeSelect }) => {
  const getTypeDisplayName = (type: string) => {
    const names: { [key: string]: string } = {
      tsp: 'TSP',
      vrp: 'VRP', 
      graph: 'Graph',
      scheduling: 'Scheduling',
      unknown: 'Other'
    }
    return names[type] || type.toUpperCase()
  }

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      tsp: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      vrp: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      graph: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      scheduling: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
    return colors[type] || colors.unknown
  }

  if (problemTypes.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Problem Types</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {problemTypes.map(problemType => (
          <Card 
            key={problemType.type}
            className="hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => onTypeSelect(problemType.type)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{problemType.icon}</span>
                  <div>
                    <CardTitle className="text-lg">
                      {getTypeDisplayName(problemType.type)}
                    </CardTitle>
                    <Badge className={getTypeColor(problemType.type)}>
                      {problemType.count} dataset{problemType.count !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="mb-3">
                {problemType.description}
              </CardDescription>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              >
                View All
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default ProblemTypeGrid
