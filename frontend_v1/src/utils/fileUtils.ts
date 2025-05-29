/**
 * File handling utilities for the repository interface
 */

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * Check if file is binary based on extension
 */
export const isBinaryFile = (filename: string): boolean => {
  const binaryExtensions = [
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'ico', 'tiff', 'tif',
    'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v',
    'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a',
    'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'exe', 'dll', 'so', 'dylib', 'bin'
  ]
  
  const extension = getFileExtension(filename)
  return binaryExtensions.includes(extension)
}

/**
 * Check if file is viewable in browser
 */
export const isViewableFile = (filename: string): boolean => {
  const viewableExtensions = [
    'txt', 'md', 'markdown', 'json', 'xml', 'html', 'htm', 'css',
    'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp',
    'rs', 'go', 'php', 'rb', 'swift', 'kt', 'r', 'sql', 'sh', 'bash',
    'yml', 'yaml', 'toml', 'ini', 'cfg', 'conf', 'env', 'log',
    'csv', 'tsv', 'ipynb'
  ]
  
  const extension = getFileExtension(filename)
  return viewableExtensions.includes(extension)
}

/**
 * Download file with proper filename
 */
export const downloadFile = (content: string | Blob, filename: string, mimeType?: string): void => {
  const blob = content instanceof Blob 
    ? content 
    : new Blob([content], { type: mimeType || 'text/plain' })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Generate filename with timestamp
 */
export const generateTimestampedFilename = (originalFilename: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const extension = getFileExtension(originalFilename)
  const nameWithoutExt = originalFilename.replace(`.${extension}`, '')
  
  return `${nameWithoutExt}_${timestamp}.${extension}`
}

/**
 * Validate filename for upload
 */
export const validateFilename = (filename: string): { valid: boolean; error?: string } => {
  // Check for empty filename
  if (!filename.trim()) {
    return { valid: false, error: 'Filename cannot be empty' }
  }
  
  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/
  if (invalidChars.test(filename)) {
    return { valid: false, error: 'Filename contains invalid characters' }
  }
  
  // Check for reserved names (Windows)
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
  const nameWithoutExt = filename.split('.')[0].toUpperCase()
  if (reservedNames.includes(nameWithoutExt)) {
    return { valid: false, error: 'Filename is reserved and cannot be used' }
  }
  
  // Check length
  if (filename.length > 255) {
    return { valid: false, error: 'Filename is too long (max 255 characters)' }
  }
  
  return { valid: true }
}

/**
 * Get MIME type from file extension
 */
export const getMimeType = (filename: string): string => {
  const extension = getFileExtension(filename)
  
  const mimeTypes: Record<string, string> = {
    // Text
    'txt': 'text/plain',
    'md': 'text/markdown',
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'csv': 'text/csv',
    
    // Code
    'py': 'text/x-python',
    'java': 'text/x-java-source',
    'c': 'text/x-c',
    'cpp': 'text/x-c++',
    'h': 'text/x-c',
    'hpp': 'text/x-c++',
    'rs': 'text/x-rust',
    'go': 'text/x-go',
    'php': 'text/x-php',
    'rb': 'text/x-ruby',
    'swift': 'text/x-swift',
    'kt': 'text/x-kotlin',
    'r': 'text/x-r',
    'sql': 'text/x-sql',
    'sh': 'text/x-shellscript',
    'bash': 'text/x-shellscript',
    
    // Config
    'yml': 'text/yaml',
    'yaml': 'text/yaml',
    'toml': 'text/x-toml',
    'ini': 'text/plain',
    'cfg': 'text/plain',
    'conf': 'text/plain',
    'env': 'text/plain',
    
    // Notebooks
    'ipynb': 'application/json',
    
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    
    // Archives
    'zip': 'application/zip',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
    '7z': 'application/x-7z-compressed',
    'rar': 'application/vnd.rar'
  }
  
  return mimeTypes[extension] || 'application/octet-stream'
}

/**
 * Parse file path into components
 */
export const parseFilePath = (path: string): {
  directory: string
  filename: string
  extension: string
  nameWithoutExtension: string
} => {
  const normalizedPath = path.replace(/\\/g, '/')
  const lastSlashIndex = normalizedPath.lastIndexOf('/')
  
  const directory = lastSlashIndex >= 0 ? normalizedPath.substring(0, lastSlashIndex) : ''
  const filename = lastSlashIndex >= 0 ? normalizedPath.substring(lastSlashIndex + 1) : normalizedPath
  
  const lastDotIndex = filename.lastIndexOf('.')
  const extension = lastDotIndex >= 0 ? filename.substring(lastDotIndex + 1) : ''
  const nameWithoutExtension = lastDotIndex >= 0 ? filename.substring(0, lastDotIndex) : filename
  
  return {
    directory,
    filename,
    extension,
    nameWithoutExtension
  }
}

/**
 * Build file path from components
 */
export const buildFilePath = (directory: string, filename: string): string => {
  if (!directory) return filename
  return `${directory.replace(/\/$/, '')}/${filename}`
}

/**
 * Check if path is safe (no directory traversal)
 */
export const isSafePath = (path: string): boolean => {
  const normalizedPath = path.replace(/\\/g, '/')
  
  // Check for directory traversal attempts
  if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
    return false
  }
  
  // Check for absolute paths
  if (normalizedPath.startsWith('/') || /^[a-zA-Z]:/.test(normalizedPath)) {
    return false
  }
  
  return true
}

/**
 * Sanitize filename for safe usage
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
    .substring(0, 255)
}
