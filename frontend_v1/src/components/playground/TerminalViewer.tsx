import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Terminal, Download } from 'lucide-react'
import { LogEntry, ExecutionMetrics } from '@/types/playground'

interface TerminalViewerProps {
  logs: LogEntry[]
  metrics: ExecutionMetrics
  isExecuting: boolean
  onClearLogs: () => void
  onExportLogs: () => void
  className?: string
}

export function TerminalViewer({
  logs,
  metrics,
  isExecuting,
  onClearLogs,
  onExportLogs,
  className = ""
}: TerminalViewerProps) {
  // Enable auto-scroll for terminal content only
  const logsEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logsEndRef.current && scrollAreaRef.current) {
      // Scroll only within the terminal container, not the page
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [logs])

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-900 text-red-200'
      case 'warning':
        return 'bg-yellow-900 text-yellow-200'
      case 'info':
        return 'bg-blue-900 text-blue-200'
      case 'debug':
        return 'bg-gray-700 text-gray-300'
      default:
        return 'bg-gray-700 text-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'default'
      case 'paused':
        return 'secondary'
      case 'completed':
        return 'secondary'
      case 'error':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <Card className={`flex flex-col rounded-lg h-full ${className}`}>
      <CardHeader className="flex-shrink-0 pb-1 pt-2 px-3">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="h-3 w-3 flex-shrink-0" />
          <Badge variant={getStatusColor(metrics.status)} className="flex-shrink-0 text-xs h-5">
            {metrics.status}
          </Badge>
          {isExecuting && (
            <Badge variant="outline" className="animate-pulse flex-shrink-0 text-xs h-5">Live</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="bg-black text-green-400 h-full font-mono text-sm rounded-b-lg overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="h-full p-3 terminal-container">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <div>
                  <p className="mb-2">   Welcome to the Qubots Playground!</p>
                  <p className="text-sm">Here you can test workflows in a containerized cloud environment.</p>
                  <p className="text-xs mt-2 text-gray-600">
                    Configure parameters and run optimizations with real-time feedback.
                  </p>
                  
                </div>
              </div>
            ) : (
              <div className="space-y-1 w-full">
                {logs.map((log, index) => (
                  <div key={index} className="flex gap-2 items-start w-full min-w-0">
                    <span className="text-gray-500 text-xs flex-shrink-0 w-20">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <span className={`text-xs px-1 rounded flex-shrink-0 ${getLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    {log.source && (
                      <span className="text-purple-400 text-xs flex-shrink-0">
                        [{log.source}]
                      </span>
                    )}
                    <span className="flex-1 break-words min-w-0 overflow-wrap-anywhere">{log.message}</span>
                  </div>
                ))}
                {/* Auto-scroll anchor */}
                <div ref={logsEndRef} />
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
