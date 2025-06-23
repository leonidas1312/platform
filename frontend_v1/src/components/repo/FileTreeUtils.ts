/**
 * Utilities for building and managing file tree structures
 */

export interface FileItem {
  name: string
  type: 'file' | 'dir'
  size?: number
  path: string
  sha?: string
  commit?: {
    message: string
    date: string
    author?: string
    sha?: string
  }
}

export interface TreeNode {
  name: string
  type: 'file' | 'dir'
  path: string
  size?: number
  sha?: string
  commit?: {
    message: string
    date: string
    author?: string
    sha?: string
  }
  children?: TreeNode[]
  isExpanded?: boolean
  depth: number
  parent?: TreeNode
}

/**
 * Build a hierarchical tree structure from a flat list of files
 */
export function buildFileTree(files: FileItem[], currentPath: string = ''): TreeNode[] {
  const tree: TreeNode[] = []
  const nodeMap = new Map<string, TreeNode>()

  // Sort files to ensure directories come first, then alphabetically
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'dir' ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })

  for (const file of sortedFiles) {
    const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name
    const pathParts = fullPath.split('/')
    let currentLevel = tree
    let currentPathBuilder = ''
    let parentNode: TreeNode | undefined

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]
      currentPathBuilder = currentPathBuilder ? `${currentPathBuilder}/${part}` : part
      
      let existingNode = nodeMap.get(currentPathBuilder)
      
      if (!existingNode) {
        const isLastPart = i === pathParts.length - 1
        const nodeType = isLastPart ? file.type : 'dir'
        
        existingNode = {
          name: part,
          type: nodeType,
          path: currentPathBuilder,
          depth: i,
          parent: parentNode,
          isExpanded: false,
          ...(isLastPart && file.type === 'file' ? {
            size: file.size,
            sha: file.sha,
            commit: file.commit
          } : {}),
          ...(nodeType === 'dir' ? { children: [] } : {})
        }
        
        nodeMap.set(currentPathBuilder, existingNode)
        currentLevel.push(existingNode)
      }
      
      if (existingNode.type === 'dir' && existingNode.children) {
        currentLevel = existingNode.children
        parentNode = existingNode
      }
    }
  }

  return tree
}

/**
 * Flatten a tree structure for display purposes
 */
export function flattenTree(tree: TreeNode[], showHidden: boolean = false): TreeNode[] {
  const result: TreeNode[] = []
  
  function traverse(nodes: TreeNode[]) {
    for (const node of nodes) {
      // Skip hidden files unless explicitly requested
      if (!showHidden && node.name.startsWith('.')) {
        continue
      }
      
      result.push(node)
      
      if (node.type === 'dir' && node.isExpanded && node.children) {
        traverse(node.children)
      }
    }
  }
  
  traverse(tree)
  return result
}

/**
 * Find a node in the tree by path
 */
export function findNodeByPath(tree: TreeNode[], path: string): TreeNode | null {
  function search(nodes: TreeNode[]): TreeNode | null {
    for (const node of nodes) {
      if (node.path === path) {
        return node
      }
      if (node.children) {
        const found = search(node.children)
        if (found) return found
      }
    }
    return null
  }
  
  return search(tree)
}

/**
 * Toggle expansion state of a directory node
 */
export function toggleNodeExpansion(tree: TreeNode[], path: string): TreeNode[] {
  function updateNode(nodes: TreeNode[]): TreeNode[] {
    return nodes.map(node => {
      if (node.path === path && node.type === 'dir') {
        return { ...node, isExpanded: !node.isExpanded }
      }
      if (node.children) {
        return { ...node, children: updateNode(node.children) }
      }
      return node
    })
  }
  
  return updateNode(tree)
}

/**
 * Expand all parent nodes leading to a specific path
 */
export function expandToPath(tree: TreeNode[], targetPath: string): TreeNode[] {
  const pathParts = targetPath.split('/')
  
  function updateNode(nodes: TreeNode[], currentDepth: number = 0): TreeNode[] {
    return nodes.map(node => {
      const shouldExpand = currentDepth < pathParts.length && 
                          pathParts.slice(0, currentDepth + 1).join('/') === node.path
      
      if (shouldExpand && node.type === 'dir') {
        return {
          ...node,
          isExpanded: true,
          children: node.children ? updateNode(node.children, currentDepth + 1) : []
        }
      }
      
      if (node.children) {
        return { ...node, children: updateNode(node.children, currentDepth + 1) }
      }
      
      return node
    })
  }
  
  return updateNode(tree)
}

/**
 * Get all expanded paths in the tree
 */
export function getExpandedPaths(tree: TreeNode[]): string[] {
  const expandedPaths: string[] = []
  
  function traverse(nodes: TreeNode[]) {
    for (const node of nodes) {
      if (node.type === 'dir' && node.isExpanded) {
        expandedPaths.push(node.path)
        if (node.children) {
          traverse(node.children)
        }
      }
    }
  }
  
  traverse(tree)
  return expandedPaths
}

/**
 * Restore expansion state from a list of paths
 */
export function restoreExpansionState(tree: TreeNode[], expandedPaths: string[]): TreeNode[] {
  function updateNode(nodes: TreeNode[]): TreeNode[] {
    return nodes.map(node => {
      if (node.type === 'dir') {
        const isExpanded = expandedPaths.includes(node.path)
        return {
          ...node,
          isExpanded,
          children: node.children ? updateNode(node.children) : []
        }
      }
      return node
    })
  }
  
  return updateNode(tree)
}

/**
 * Filter tree nodes based on search term
 */
export function filterTree(tree: TreeNode[], searchTerm: string): TreeNode[] {
  if (!searchTerm.trim()) return tree
  
  const lowerSearchTerm = searchTerm.toLowerCase()
  
  function filterNode(node: TreeNode): TreeNode | null {
    const matchesSearch = node.name.toLowerCase().includes(lowerSearchTerm)
    
    if (node.type === 'file') {
      return matchesSearch ? node : null
    }
    
    // For directories, check if any children match
    const filteredChildren = node.children
      ? node.children.map(filterNode).filter(Boolean) as TreeNode[]
      : []
    
    if (matchesSearch || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
        isExpanded: filteredChildren.length > 0 // Auto-expand if has matching children
      }
    }
    
    return null
  }
  
  return tree.map(filterNode).filter(Boolean) as TreeNode[]
}

/**
 * Get file statistics for a tree
 */
export function getTreeStats(tree: TreeNode[]): {
  totalFiles: number
  totalDirectories: number
  totalSize: number
} {
  let totalFiles = 0
  let totalDirectories = 0
  let totalSize = 0

  function traverse(nodes: TreeNode[]) {
    for (const node of nodes) {
      if (node.type === 'file') {
        totalFiles++
        totalSize += node.size || 0
      } else {
        totalDirectories++
        if (node.children) {
          traverse(node.children)
        }
      }
    }
  }

  traverse(tree)

  return { totalFiles, totalDirectories, totalSize }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number | undefined): string {
  if (!bytes || bytes === 0) return '0 B'

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))

  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
}

/**
 * Format relative time for display
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown'

  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`

    return `${Math.floor(diffInSeconds / 31536000)}y ago`
  } catch {
    return 'Unknown'
  }
}
