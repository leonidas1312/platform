/**
 * Jupyter notebook utilities for parsing, validation, and Colab integration
 */

export interface NotebookCell {
  cell_type: 'code' | 'markdown' | 'raw'
  source: string | string[]
  metadata?: any
  outputs?: any[]
  execution_count?: number | null
}

export interface NotebookMetadata {
  kernelspec?: {
    display_name: string
    language: string
    name: string
  }
  language_info?: {
    name: string
    version?: string
    mimetype?: string
    file_extension?: string
  }
  [key: string]: any
}

export interface NotebookData {
  cells: NotebookCell[]
  metadata: NotebookMetadata
  nbformat: number
  nbformat_minor: number
}

/**
 * Parse notebook content from JSON string
 */
export const parseNotebook = (content: string): NotebookData | null => {
  try {
    const parsed = JSON.parse(content)
    
    // Validate basic structure
    if (!parsed.cells || !Array.isArray(parsed.cells)) {
      throw new Error('Invalid notebook: missing or invalid cells array')
    }
    
    if (typeof parsed.nbformat !== 'number') {
      throw new Error('Invalid notebook: missing or invalid nbformat')
    }
    
    return parsed as NotebookData
  } catch (error) {
    console.error('Failed to parse notebook:', error)
    return null
  }
}

/**
 * Validate notebook structure
 */
export const validateNotebook = (notebook: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!notebook) {
    errors.push('Notebook is null or undefined')
    return { valid: false, errors }
  }
  
  if (!notebook.cells || !Array.isArray(notebook.cells)) {
    errors.push('Missing or invalid cells array')
  }
  
  if (typeof notebook.nbformat !== 'number') {
    errors.push('Missing or invalid nbformat')
  }
  
  if (notebook.nbformat < 4) {
    errors.push('Unsupported notebook format version (< 4)')
  }
  
  // Validate cells
  if (notebook.cells) {
    notebook.cells.forEach((cell: any, index: number) => {
      if (!cell.cell_type || !['code', 'markdown', 'raw'].includes(cell.cell_type)) {
        errors.push(`Cell ${index}: invalid or missing cell_type`)
      }
      
      if (!cell.source && cell.source !== '') {
        errors.push(`Cell ${index}: missing source`)
      }
    })
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Get notebook statistics
 */
export const getNotebookStats = (notebook: NotebookData): {
  totalCells: number
  codeCells: number
  markdownCells: number
  rawCells: number
  executedCells: number
  language: string
  kernelName: string
} => {
  const totalCells = notebook.cells.length
  const codeCells = notebook.cells.filter(cell => cell.cell_type === 'code').length
  const markdownCells = notebook.cells.filter(cell => cell.cell_type === 'markdown').length
  const rawCells = notebook.cells.filter(cell => cell.cell_type === 'raw').length
  const executedCells = notebook.cells.filter(cell => 
    cell.cell_type === 'code' && cell.execution_count !== null
  ).length
  
  const language = notebook.metadata.language_info?.name || 'unknown'
  const kernelName = notebook.metadata.kernelspec?.display_name || 'unknown'
  
  return {
    totalCells,
    codeCells,
    markdownCells,
    rawCells,
    executedCells,
    language,
    kernelName
  }
}

/**
 * Extract text content from notebook for search
 */
export const extractNotebookText = (notebook: NotebookData): string => {
  return notebook.cells
    .map(cell => {
      const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source
      return source
    })
    .join('\n')
}

/**
 * Create a minimal notebook structure
 */
export const createEmptyNotebook = (): NotebookData => {
  return {
    cells: [
      {
        cell_type: 'code',
        source: '',
        metadata: {},
        outputs: [],
        execution_count: null
      }
    ],
    metadata: {
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'python3'
      },
      language_info: {
        name: 'python',
        version: '3.8.0',
        mimetype: 'text/x-python',
        file_extension: '.py'
      }
    },
    nbformat: 4,
    nbformat_minor: 4
  }
}

/**
 * Convert notebook to different formats (simplified)
 */
export const convertNotebook = (notebook: NotebookData, format: 'python' | 'markdown'): string => {
  if (format === 'python') {
    return notebook.cells
      .filter(cell => cell.cell_type === 'code')
      .map(cell => {
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source
        return source
      })
      .join('\n\n')
  }
  
  if (format === 'markdown') {
    return notebook.cells
      .map(cell => {
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source
        
        if (cell.cell_type === 'markdown') {
          return source
        } else if (cell.cell_type === 'code') {
          return `\`\`\`python\n${source}\n\`\`\``
        }
        
        return source
      })
      .join('\n\n')
  }
  
  return ''
}

/**
 * Generate Google Colab URL for notebook
 */
export const generateColabUrl = (notebookContent: string, githubUrl?: string): string => {
  if (githubUrl) {
    // If we have a GitHub URL, use it directly
    const encodedUrl = encodeURIComponent(githubUrl)
    return `https://colab.research.google.com/github/${encodedUrl}`
  }
  
  // Otherwise, create a URL with the notebook content
  const encodedContent = encodeURIComponent(notebookContent)
  return `https://colab.research.google.com/#create=true&content=${encodedContent}`
}

/**
 * Download notebook with proper formatting
 */
export const downloadNotebook = (notebook: NotebookData | string, filename: string): void => {
  const content = typeof notebook === 'string' ? notebook : JSON.stringify(notebook, null, 2)
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.ipynb') ? filename : `${filename}.ipynb`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Open notebook in Google Colab
 */
export const openInColab = async (notebookContent: string, filename: string): Promise<boolean> => {
  try {
    // First download the notebook
    downloadNotebook(notebookContent, filename)
    
    // Then open Colab
    setTimeout(() => {
      window.open('https://colab.research.google.com/', '_blank')
    }, 500)
    
    return true
  } catch (error) {
    console.error('Failed to open in Colab:', error)
    return false
  }
}

/**
 * Check if content is a valid notebook
 */
export const isValidNotebook = (content: string): boolean => {
  const notebook = parseNotebook(content)
  if (!notebook) return false
  
  const validation = validateNotebook(notebook)
  return validation.valid
}

/**
 * Get notebook preview (first few cells)
 */
export const getNotebookPreview = (notebook: NotebookData, maxCells: number = 5): NotebookCell[] => {
  return notebook.cells.slice(0, maxCells)
}

/**
 * Search within notebook content
 */
export const searchNotebook = (notebook: NotebookData, query: string): {
  cellIndex: number
  cellType: string
  matches: number
}[] => {
  const results: { cellIndex: number; cellType: string; matches: number }[] = []
  const searchTerm = query.toLowerCase()
  
  notebook.cells.forEach((cell, index) => {
    const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source
    const content = source.toLowerCase()
    const matches = (content.match(new RegExp(searchTerm, 'g')) || []).length
    
    if (matches > 0) {
      results.push({
        cellIndex: index,
        cellType: cell.cell_type,
        matches
      })
    }
  })
  
  return results
}

/**
 * Clean notebook outputs (remove execution results)
 */
export const cleanNotebook = (notebook: NotebookData): NotebookData => {
  const cleaned = { ...notebook }
  cleaned.cells = notebook.cells.map(cell => {
    if (cell.cell_type === 'code') {
      return {
        ...cell,
        outputs: [],
        execution_count: null
      }
    }
    return cell
  })
  
  return cleaned
}
