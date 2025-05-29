"use client"

import {
  FileText,
  FileCode,
  FileJson,
  Package,
  Image,
  Video,
  Music,
  Archive,
  FileSpreadsheet,
  FileImage,
  Database,
  Settings,
  Folder,
  File,
  BookOpen,
  Cpu,
  Brain,
  Zap,
} from "lucide-react"

export interface FileTypeInfo {
  icon: React.ReactNode
  color: string
  category: 'code' | 'document' | 'media' | 'data' | 'config' | 'notebook' | 'qubots' | 'other'
}

/**
 * Comprehensive file type detection and icon mapping
 * Supports all common file types with appropriate icons and colors
 */
export const getFileTypeInfo = (fileName: string): FileTypeInfo => {
  const extension = fileName.toLowerCase().split('.').pop() || ''
  const fullName = fileName.toLowerCase()

  // Jupyter Notebooks
  if (extension === 'ipynb') {
    return {
      icon: <BookOpen className="h-4 w-4" />,
      color: 'text-orange-500',
      category: 'notebook'
    }
  }

  // Qubot Configuration
  if (fullName === 'config.json' || fullName.includes('qubot')) {
    return {
      icon: <Brain className="h-4 w-4" />,
      color: 'text-purple-500',
      category: 'qubots'
    }
  }

  // Programming Languages
  if (['py', 'pyx', 'pyi'].includes(extension)) {
    return {
      icon: <FileCode className="h-4 w-4" />,
      color: 'text-green-500',
      category: 'code'
    }
  }

  if (['js', 'jsx', 'mjs'].includes(extension)) {
    return {
      icon: <FileCode className="h-4 w-4" />,
      color: 'text-yellow-500',
      category: 'code'
    }
  }

  if (['ts', 'tsx'].includes(extension)) {
    return {
      icon: <FileCode className="h-4 w-4" />,
      color: 'text-blue-500',
      category: 'code'
    }
  }

  if (['html', 'htm'].includes(extension)) {
    return {
      icon: <FileCode className="h-4 w-4" />,
      color: 'text-orange-600',
      category: 'code'
    }
  }

  if (['css', 'scss', 'sass', 'less'].includes(extension)) {
    return {
      icon: <FileCode className="h-4 w-4" />,
      color: 'text-blue-400',
      category: 'code'
    }
  }

  if (['java', 'class', 'jar'].includes(extension)) {
    return {
      icon: <FileCode className="h-4 w-4" />,
      color: 'text-red-500',
      category: 'code'
    }
  }

  if (['cpp', 'c', 'h', 'hpp', 'cc', 'cxx'].includes(extension)) {
    return {
      icon: <FileCode className="h-4 w-4" />,
      color: 'text-blue-600',
      category: 'code'
    }
  }

  if (['rs', 'toml'].includes(extension)) {
    return {
      icon: <FileCode className="h-4 w-4" />,
      color: 'text-orange-700',
      category: 'code'
    }
  }

  if (['go', 'mod'].includes(extension)) {
    return {
      icon: <FileCode className="h-4 w-4" />,
      color: 'text-cyan-500',
      category: 'code'
    }
  }

  if (['php', 'phtml'].includes(extension)) {
    return {
      icon: <FileCode className="h-4 w-4" />,
      color: 'text-purple-600',
      category: 'code'
    }
  }

  if (['rb', 'gem', 'gemspec'].includes(extension)) {
    return {
      icon: <FileCode className="h-4 w-4" />,
      color: 'text-red-600',
      category: 'code'
    }
  }

  if (['swift', 'playground'].includes(extension)) {
    return {
      icon: <FileCode className="h-4 w-4" />,
      color: 'text-orange-500',
      category: 'code'
    }
  }

  if (['kt', 'kts'].includes(extension)) {
    return {
      icon: <FileCode className="h-4 w-4" />,
      color: 'text-purple-500',
      category: 'code'
    }
  }

  if (['r', 'rmd'].includes(extension)) {
    return {
      icon: <FileCode className="h-4 w-4" />,
      color: 'text-blue-700',
      category: 'code'
    }
  }

  if (['m', 'mm'].includes(extension)) {
    return {
      icon: <FileCode className="h-4 w-4" />,
      color: 'text-blue-500',
      category: 'code'
    }
  }

  if (['sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd'].includes(extension)) {
    return {
      icon: <FileCode className="h-4 w-4" />,
      color: 'text-green-600',
      category: 'code'
    }
  }

  // Documentation and Text
  if (['md', 'markdown', 'mdx'].includes(extension)) {
    return {
      icon: <FileText className="h-4 w-4" />,
      color: 'text-blue-500',
      category: 'document'
    }
  }

  if (['txt', 'text', 'log'].includes(extension)) {
    return {
      icon: <FileText className="h-4 w-4" />,
      color: 'text-gray-500',
      category: 'document'
    }
  }

  if (['pdf'].includes(extension)) {
    return {
      icon: <FileText className="h-4 w-4" />,
      color: 'text-red-500',
      category: 'document'
    }
  }

  if (['doc', 'docx', 'rtf'].includes(extension)) {
    return {
      icon: <FileText className="h-4 w-4" />,
      color: 'text-blue-600',
      category: 'document'
    }
  }

  // Configuration and Data
  if (['json', 'jsonc'].includes(extension)) {
    return {
      icon: <FileJson className="h-4 w-4" />,
      color: 'text-yellow-500',
      category: 'config'
    }
  }

  if (['xml', 'xhtml', 'svg'].includes(extension)) {
    return {
      icon: <FileCode className="h-4 w-4" />,
      color: 'text-orange-500',
      category: 'config'
    }
  }

  if (['yaml', 'yml'].includes(extension)) {
    return {
      icon: <Settings className="h-4 w-4" />,
      color: 'text-purple-500',
      category: 'config'
    }
  }

  if (['ini', 'cfg', 'conf', 'config'].includes(extension)) {
    return {
      icon: <Settings className="h-4 w-4" />,
      color: 'text-gray-600',
      category: 'config'
    }
  }

  if (['env', 'environment'].includes(extension) || fullName.startsWith('.env')) {
    return {
      icon: <Settings className="h-4 w-4" />,
      color: 'text-green-600',
      category: 'config'
    }
  }

  // Package Management
  if (['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'].includes(fullName)) {
    return {
      icon: <Package className="h-4 w-4" />,
      color: 'text-red-500',
      category: 'config'
    }
  }

  if (['requirements.txt', 'pipfile', 'pipfile.lock', 'poetry.lock', 'pyproject.toml'].includes(fullName)) {
    return {
      icon: <Package className="h-4 w-4" />,
      color: 'text-green-500',
      category: 'config'
    }
  }

  if (['cargo.toml', 'cargo.lock'].includes(fullName)) {
    return {
      icon: <Package className="h-4 w-4" />,
      color: 'text-orange-700',
      category: 'config'
    }
  }

  if (['go.mod', 'go.sum'].includes(fullName)) {
    return {
      icon: <Package className="h-4 w-4" />,
      color: 'text-cyan-500',
      category: 'config'
    }
  }

  if (['gemfile', 'gemfile.lock'].includes(fullName)) {
    return {
      icon: <Package className="h-4 w-4" />,
      color: 'text-red-600',
      category: 'config'
    }
  }

  // Data Files
  if (['csv', 'tsv'].includes(extension)) {
    return {
      icon: <FileSpreadsheet className="h-4 w-4" />,
      color: 'text-green-600',
      category: 'data'
    }
  }

  if (['xlsx', 'xls', 'ods'].includes(extension)) {
    return {
      icon: <FileSpreadsheet className="h-4 w-4" />,
      color: 'text-green-700',
      category: 'data'
    }
  }

  if (['sql', 'db', 'sqlite', 'sqlite3'].includes(extension)) {
    return {
      icon: <Database className="h-4 w-4" />,
      color: 'text-blue-600',
      category: 'data'
    }
  }

  // Media Files
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'ico', 'tiff', 'tif'].includes(extension)) {
    return {
      icon: <FileImage className="h-4 w-4" />,
      color: 'text-purple-500',
      category: 'media'
    }
  }

  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'].includes(extension)) {
    return {
      icon: <Video className="h-4 w-4" />,
      color: 'text-red-500',
      category: 'media'
    }
  }

  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'].includes(extension)) {
    return {
      icon: <Music className="h-4 w-4" />,
      color: 'text-pink-500',
      category: 'media'
    }
  }

  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'tar.gz', 'tar.bz2', 'tar.xz'].includes(extension)) {
    return {
      icon: <Archive className="h-4 w-4" />,
      color: 'text-yellow-600',
      category: 'other'
    }
  }

  // Default file icon
  return {
    icon: <File className="h-4 w-4" />,
    color: 'text-muted-foreground',
    category: 'other'
  }
}

/**
 * Get folder icon with consistent styling
 */
export const getFolderIcon = (isOpen: boolean = false) => {
  return {
    icon: <Folder className="h-4 w-4" />,
    color: 'text-blue-500',
    category: 'folder' as const
  }
}

/**
 * Check if a file is a Jupyter notebook
 */
export const isNotebook = (fileName: string): boolean => {
  return fileName.toLowerCase().endsWith('.ipynb')
}

/**
 * Check if a file is a qubot configuration
 */
export const isQubotConfig = (fileName: string): boolean => {
  const fullName = fileName.toLowerCase()
  return fullName === 'config.json' || fullName.includes('qubot')
}

/**
 * Check if a file is downloadable
 */
export const isDownloadable = (fileName: string): boolean => {
  const info = getFileTypeInfo(fileName)
  return ['notebook', 'data', 'media', 'other'].includes(info.category)
}

/**
 * Get file category for filtering
 */
export const getFileCategory = (fileName: string): string => {
  return getFileTypeInfo(fileName).category
}
