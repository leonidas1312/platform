import { describe, it, expect } from 'vitest'
import {
  buildFileTree,
  flattenTree,
  findNodeByPath,
  toggleNodeExpansion,
  expandToPath,
  filterTree,
  getTreeStats,
  formatFileSize,
  formatRelativeTime,
  type FileItem,
  type TreeNode
} from '../FileTreeUtils'

describe('FileTreeUtils', () => {
  const mockFiles: FileItem[] = [
    {
      name: 'README.md',
      type: 'file',
      size: 1024,
      path: 'README.md',
      sha: 'abc123'
    },
    {
      name: 'src',
      type: 'dir',
      path: 'src',
      sha: 'def456'
    },
    {
      name: 'main.py',
      type: 'file',
      size: 2048,
      path: 'src/main.py',
      sha: 'ghi789'
    },
    {
      name: 'utils',
      type: 'dir',
      path: 'src/utils',
      sha: 'jkl012'
    },
    {
      name: 'helper.py',
      type: 'file',
      size: 512,
      path: 'src/utils/helper.py',
      sha: 'mno345'
    }
  ]

  describe('buildFileTree', () => {
    it('should build a hierarchical tree from flat file list', () => {
      const tree = buildFileTree(mockFiles)
      
      expect(tree).toHaveLength(2) // README.md and src
      expect(tree[0].name).toBe('src') // directories first
      expect(tree[1].name).toBe('README.md')
      
      const srcNode = tree[0]
      expect(srcNode.type).toBe('dir')
      expect(srcNode.children).toHaveLength(2) // main.py and utils
    })

    it('should handle empty file list', () => {
      const tree = buildFileTree([])
      expect(tree).toHaveLength(0)
    })

    it('should set correct depth for nested files', () => {
      const tree = buildFileTree(mockFiles)
      const srcNode = tree[0]
      const utilsNode = srcNode.children![1]
      const helperNode = utilsNode.children![0]
      
      expect(srcNode.depth).toBe(0)
      expect(utilsNode.depth).toBe(1)
      expect(helperNode.depth).toBe(2)
    })
  })

  describe('flattenTree', () => {
    it('should flatten tree to display list', () => {
      const tree = buildFileTree(mockFiles)
      const flattened = flattenTree(tree)
      
      expect(flattened).toHaveLength(2) // Only root level items when not expanded
      expect(flattened[0].name).toBe('src')
      expect(flattened[1].name).toBe('README.md')
    })

    it('should include expanded children', () => {
      const tree = buildFileTree(mockFiles)
      tree[0].isExpanded = true // Expand src directory
      
      const flattened = flattenTree(tree)
      expect(flattened).toHaveLength(4) // src, main.py, utils, README.md
    })

    it('should filter hidden files when showHidden is false', () => {
      const filesWithHidden: FileItem[] = [
        ...mockFiles,
        {
          name: '.gitignore',
          type: 'file',
          size: 100,
          path: '.gitignore',
          sha: 'hidden123'
        }
      ]
      
      const tree = buildFileTree(filesWithHidden)
      const flattened = flattenTree(tree, false)
      
      expect(flattened.find(node => node.name === '.gitignore')).toBeUndefined()
    })
  })

  describe('findNodeByPath', () => {
    it('should find node by exact path', () => {
      const tree = buildFileTree(mockFiles)
      const node = findNodeByPath(tree, 'src/utils/helper.py')
      
      expect(node).toBeDefined()
      expect(node!.name).toBe('helper.py')
      expect(node!.type).toBe('file')
    })

    it('should return null for non-existent path', () => {
      const tree = buildFileTree(mockFiles)
      const node = findNodeByPath(tree, 'non/existent/path')
      
      expect(node).toBeNull()
    })
  })

  describe('toggleNodeExpansion', () => {
    it('should toggle expansion state of directory', () => {
      const tree = buildFileTree(mockFiles)
      expect(tree[0].isExpanded).toBe(false)
      
      const updatedTree = toggleNodeExpansion(tree, 'src')
      expect(updatedTree[0].isExpanded).toBe(true)
      
      const toggledAgain = toggleNodeExpansion(updatedTree, 'src')
      expect(toggledAgain[0].isExpanded).toBe(false)
    })

    it('should not affect non-directory nodes', () => {
      const tree = buildFileTree(mockFiles)
      const originalTree = JSON.parse(JSON.stringify(tree))
      
      const updatedTree = toggleNodeExpansion(tree, 'README.md')
      expect(updatedTree).toEqual(originalTree)
    })
  })

  describe('expandToPath', () => {
    it('should expand all parent directories to reach target path', () => {
      const tree = buildFileTree(mockFiles)
      const expandedTree = expandToPath(tree, 'src/utils/helper.py')
      
      const srcNode = expandedTree[0]
      const utilsNode = srcNode.children![1]
      
      expect(srcNode.isExpanded).toBe(true)
      expect(utilsNode.isExpanded).toBe(true)
    })
  })

  describe('filterTree', () => {
    it('should filter nodes by search term', () => {
      const tree = buildFileTree(mockFiles)
      const filtered = filterTree(tree, 'py')
      
      expect(filtered).toHaveLength(1) // Only src directory contains .py files
      expect(filtered[0].name).toBe('src')
      expect(filtered[0].isExpanded).toBe(true) // Auto-expanded because contains matches
    })

    it('should return original tree for empty search term', () => {
      const tree = buildFileTree(mockFiles)
      const filtered = filterTree(tree, '')
      
      expect(filtered).toEqual(tree)
    })
  })

  describe('getTreeStats', () => {
    it('should calculate correct statistics', () => {
      const tree = buildFileTree(mockFiles)
      const stats = getTreeStats(tree)
      
      expect(stats.totalFiles).toBe(3) // README.md, main.py, helper.py
      expect(stats.totalDirectories).toBe(2) // src, utils
      expect(stats.totalSize).toBe(3584) // 1024 + 2048 + 512
    })

    it('should handle empty tree', () => {
      const stats = getTreeStats([])
      
      expect(stats.totalFiles).toBe(0)
      expect(stats.totalDirectories).toBe(0)
      expect(stats.totalSize).toBe(0)
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(512)).toBe('512 B')
      expect(formatFileSize(1024)).toBe('1.0 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(1048576)).toBe('1.0 MB')
      expect(formatFileSize(1073741824)).toBe('1.0 GB')
    })

    it('should handle undefined input', () => {
      expect(formatFileSize(undefined)).toBe('0 B')
    })
  })

  describe('formatRelativeTime', () => {
    it('should format recent times correctly', () => {
      const now = new Date()
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      expect(formatRelativeTime(oneMinuteAgo.toISOString())).toBe('1m ago')
      expect(formatRelativeTime(oneHourAgo.toISOString())).toBe('1h ago')
      expect(formatRelativeTime(oneDayAgo.toISOString())).toBe('1d ago')
    })

    it('should handle invalid dates', () => {
      expect(formatRelativeTime('invalid-date')).toBe('Unknown')
      expect(formatRelativeTime(null)).toBe('Unknown')
      expect(formatRelativeTime(undefined)).toBe('Unknown')
    })

    it('should handle very recent times', () => {
      const now = new Date()
      const justNow = new Date(now.getTime() - 30 * 1000) // 30 seconds ago
      
      expect(formatRelativeTime(justNow.toISOString())).toBe('just now')
    })
  })
})
