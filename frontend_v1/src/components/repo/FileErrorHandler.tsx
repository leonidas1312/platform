"use client"

import { AlertTriangle, RefreshCw, FolderX, Wifi, Server, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export interface FileError {
  type: 'network' | 'server' | 'permission' | 'not_found' | 'timeout' | 'large_directory' | 'empty' | 'unknown'
  message: string
  details?: string
  statusCode?: number
}

interface FileErrorHandlerProps {
  error: FileError
  onRetry?: () => void
  onGoBack?: () => void
  className?: string
}

export function FileErrorHandler({ error, onRetry, onGoBack, className }: FileErrorHandlerProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return <Wifi className="h-12 w-12 text-red-500" />
      case 'server':
        return <Server className="h-12 w-12 text-red-500" />
      case 'timeout':
        return <Clock className="h-12 w-12 text-yellow-500" />
      case 'not_found':
        return <FolderX className="h-12 w-12 text-gray-500" />
      case 'empty':
        return <FolderX className="h-12 w-12 text-gray-400" />
      default:
        return <AlertTriangle className="h-12 w-12 text-red-500" />
    }
  }

  const getErrorTitle = () => {
    switch (error.type) {
      case 'network':
        return 'Network Error'
      case 'server':
        return 'Server Error'
      case 'permission':
        return 'Access Denied'
      case 'not_found':
        return 'Directory Not Found'
      case 'timeout':
        return 'Request Timeout'
      case 'large_directory':
        return 'Large Directory'
      case 'empty':
        return 'Empty Directory'
      default:
        return 'Error'
    }
  }

  const getErrorDescription = () => {
    switch (error.type) {
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection.'
      case 'server':
        return 'The server encountered an error while processing your request.'
      case 'permission':
        return 'You do not have permission to access this directory.'
      case 'not_found':
        return 'The requested directory could not be found.'
      case 'timeout':
        return 'The request took too long to complete. The directory might be very large.'
      case 'large_directory':
        return 'This directory contains many files. Loading may take longer than usual.'
      case 'empty':
        return 'This directory is empty. You can add files using the upload button.'
      default:
        return error.message || 'An unexpected error occurred.'
    }
  }

  const getSuggestions = () => {
    switch (error.type) {
      case 'network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Contact support if the problem persists'
        ]
      case 'server':
        return [
          'Try again in a few moments',
          'Contact support if the error continues',
          'Check the server status page'
        ]
      case 'permission':
        return [
          'Contact the repository owner for access',
          'Check if you are logged in',
          'Verify your permissions'
        ]
      case 'not_found':
        return [
          'Check the directory path',
          'Navigate back to the parent directory',
          'Verify the repository exists'
        ]
      case 'timeout':
        return [
          'Try again with a smaller directory',
          'Use the search function to find specific files',
          'Contact support for large repositories'
        ]
      case 'large_directory':
        return [
          'Use the search function to find specific files',
          'Navigate to subdirectories',
          'Consider using pagination'
        ]
      case 'empty':
        return [
          'Upload files using the add button',
          'Create new files or folders',
          'Check if you are in the correct directory'
        ]
      default:
        return [
          'Try refreshing the page',
          'Contact support if the problem persists'
        ]
    }
  }

  const isRetryable = () => {
    return ['network', 'server', 'timeout', 'unknown'].includes(error.type)
  }

  const showSuggestions = () => {
    return !['empty'].includes(error.type)
  }

  return (
    <Card className={className}>
      <CardContent className="p-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          {getErrorIcon()}
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{getErrorTitle()}</h3>
            <p className="text-muted-foreground max-w-md">
              {getErrorDescription()}
            </p>
          </div>

          {error.details && (
            <Alert className="max-w-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {error.details}
                {error.statusCode && ` (Error ${error.statusCode})`}
              </AlertDescription>
            </Alert>
          )}

          {showSuggestions() && (
            <div className="space-y-2 max-w-md">
              <h4 className="text-sm font-medium text-muted-foreground">Suggestions:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {getSuggestions().map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {isRetryable() && onRetry && (
              <Button onClick={onRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            {onGoBack && (
              <Button variant="outline" onClick={onGoBack}>
                Go Back
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Utility function to create error objects from API responses
export function createFileError(error: any): FileError {
  if (!error) {
    return {
      type: 'unknown',
      message: 'An unknown error occurred'
    }
  }

  // Network errors
  if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
    return {
      type: 'network',
      message: 'Network connection failed',
      details: error.message
    }
  }

  // HTTP status code errors
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode
    
    switch (status) {
      case 401:
      case 403:
        return {
          type: 'permission',
          message: 'Access denied',
          details: error.message || 'You do not have permission to access this resource',
          statusCode: status
        }
      case 404:
        return {
          type: 'not_found',
          message: 'Resource not found',
          details: error.message || 'The requested directory or file was not found',
          statusCode: status
        }
      case 408:
      case 504:
        return {
          type: 'timeout',
          message: 'Request timeout',
          details: error.message || 'The request took too long to complete',
          statusCode: status
        }
      case 500:
      case 502:
      case 503:
        return {
          type: 'server',
          message: 'Server error',
          details: error.message || 'The server encountered an internal error',
          statusCode: status
        }
      default:
        return {
          type: 'unknown',
          message: error.message || 'An unexpected error occurred',
          details: `HTTP ${status}`,
          statusCode: status
        }
    }
  }

  // Timeout errors
  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    return {
      type: 'timeout',
      message: 'Request timeout',
      details: error.message
    }
  }

  // Large directory detection
  if (error.message?.includes('too many files') || error.message?.includes('directory too large')) {
    return {
      type: 'large_directory',
      message: 'Directory is too large',
      details: error.message
    }
  }

  // Default unknown error
  return {
    type: 'unknown',
    message: error.message || 'An unexpected error occurred',
    details: error.stack || error.toString()
  }
}

// Utility function to check if a directory is empty
export function createEmptyDirectoryError(): FileError {
  return {
    type: 'empty',
    message: 'This directory is empty'
  }
}
