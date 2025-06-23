import { useCallback, useRef } from 'react'
import { useReactFlow } from '@xyflow/react'
import { NodeType, Dataset, Problem, Optimizer } from '@/types/workflow-automation'

export function useDragAndDrop() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  const onDragStart = useCallback((event: React.DragEvent, nodeType: NodeType, item: Dataset | Problem | Optimizer) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, item }))
    event.dataTransfer.effectAllowed = 'move'
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent, onAddNode: (type: NodeType, item: Dataset | Problem | Optimizer, position: { x: number; y: number }) => void) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!reactFlowBounds) return

      const data = event.dataTransfer.getData('application/reactflow')
      if (!data) return

      try {
        const { nodeType, item } = JSON.parse(data)
        
        // Calculate position relative to the React Flow canvas
        const position = screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        })

        onAddNode(nodeType, item, position)
      } catch (error) {
        console.error('Error parsing drag data:', error)
      }
    },
    [screenToFlowPosition]
  )

  return {
    reactFlowWrapper,
    onDragStart,
    onDragOver,
    onDrop
  }
}
