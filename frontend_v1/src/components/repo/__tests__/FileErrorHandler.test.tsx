import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileErrorHandler, createFileError, createEmptyDirectoryError } from '../FileErrorHandler'

describe('FileErrorHandler', () => {
  describe('Error Display', () => {
    it('should display network error correctly', () => {
      const error = {
        type: 'network' as const,
        message: 'Network connection failed',
        details: 'Connection timeout'
      }

      render(<FileErrorHandler error={error} />)

      expect(screen.getByText('Network Error')).toBeInTheDocument()
      expect(screen.getByText(/Unable to connect to the server/)).toBeInTheDocument()
      expect(screen.getByText('Connection timeout')).toBeInTheDocument()
    })

    it('should display server error correctly', () => {
      const error = {
        type: 'server' as const,
        message: 'Internal server error',
        statusCode: 500
      }

      render(<FileErrorHandler error={error} />)

      expect(screen.getByText('Server Error')).toBeInTheDocument()
      expect(screen.getByText(/server encountered an error/)).toBeInTheDocument()
      expect(screen.getByText('(Error 500)')).toBeInTheDocument()
    })

    it('should display permission error correctly', () => {
      const error = {
        type: 'permission' as const,
        message: 'Access denied',
        statusCode: 403
      }

      render(<FileErrorHandler error={error} />)

      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText(/do not have permission/)).toBeInTheDocument()
    })

    it('should display not found error correctly', () => {
      const error = {
        type: 'not_found' as const,
        message: 'Directory not found',
        statusCode: 404
      }

      render(<FileErrorHandler error={error} />)

      expect(screen.getByText('Directory Not Found')).toBeInTheDocument()
      expect(screen.getByText(/could not be found/)).toBeInTheDocument()
    })

    it('should display empty directory correctly', () => {
      const error = createEmptyDirectoryError()

      render(<FileErrorHandler error={error} />)

      expect(screen.getByText('Empty Directory')).toBeInTheDocument()
      expect(screen.getByText(/directory is empty/)).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should show retry button for retryable errors', () => {
      const error = {
        type: 'network' as const,
        message: 'Network error'
      }
      const onRetry = vi.fn()

      render(<FileErrorHandler error={error} onRetry={onRetry} />)

      const retryButton = screen.getByText('Try Again')
      expect(retryButton).toBeInTheDocument()

      fireEvent.click(retryButton)
      expect(onRetry).toHaveBeenCalledOnce()
    })

    it('should not show retry button for non-retryable errors', () => {
      const error = {
        type: 'permission' as const,
        message: 'Access denied'
      }

      render(<FileErrorHandler error={error} />)

      expect(screen.queryByText('Try Again')).not.toBeInTheDocument()
    })

    it('should show go back button when provided', () => {
      const error = {
        type: 'not_found' as const,
        message: 'Not found'
      }
      const onGoBack = vi.fn()

      render(<FileErrorHandler error={error} onGoBack={onGoBack} />)

      const goBackButton = screen.getByText('Go Back')
      expect(goBackButton).toBeInTheDocument()

      fireEvent.click(goBackButton)
      expect(onGoBack).toHaveBeenCalledOnce()
    })
  })

  describe('Suggestions', () => {
    it('should show suggestions for network errors', () => {
      const error = {
        type: 'network' as const,
        message: 'Network error'
      }

      render(<FileErrorHandler error={error} />)

      expect(screen.getByText('Suggestions:')).toBeInTheDocument()
      expect(screen.getByText(/Check your internet connection/)).toBeInTheDocument()
      expect(screen.getByText(/Try refreshing the page/)).toBeInTheDocument()
    })

    it('should not show suggestions for empty directories', () => {
      const error = createEmptyDirectoryError()

      render(<FileErrorHandler error={error} />)

      expect(screen.queryByText('Suggestions:')).not.toBeInTheDocument()
    })
  })
})

describe('createFileError', () => {
  it('should create network error from fetch error', () => {
    const fetchError = new Error('fetch failed')
    fetchError.name = 'NetworkError'

    const fileError = createFileError(fetchError)

    expect(fileError.type).toBe('network')
    expect(fileError.message).toBe('Network connection failed')
  })

  it('should create permission error from 403 status', () => {
    const httpError = {
      status: 403,
      message: 'Forbidden'
    }

    const fileError = createFileError(httpError)

    expect(fileError.type).toBe('permission')
    expect(fileError.statusCode).toBe(403)
  })

  it('should create not found error from 404 status', () => {
    const httpError = {
      status: 404,
      message: 'Not Found'
    }

    const fileError = createFileError(httpError)

    expect(fileError.type).toBe('not_found')
    expect(fileError.statusCode).toBe(404)
  })

  it('should create timeout error from 408 status', () => {
    const httpError = {
      status: 408,
      message: 'Request Timeout'
    }

    const fileError = createFileError(httpError)

    expect(fileError.type).toBe('timeout')
    expect(fileError.statusCode).toBe(408)
  })

  it('should create server error from 500 status', () => {
    const httpError = {
      status: 500,
      message: 'Internal Server Error'
    }

    const fileError = createFileError(httpError)

    expect(fileError.type).toBe('server')
    expect(fileError.statusCode).toBe(500)
  })

  it('should create timeout error from timeout message', () => {
    const timeoutError = new Error('Request timeout occurred')

    const fileError = createFileError(timeoutError)

    expect(fileError.type).toBe('timeout')
  })

  it('should create large directory error from specific message', () => {
    const largeError = new Error('Directory too large to process')

    const fileError = createFileError(largeError)

    expect(fileError.type).toBe('large_directory')
  })

  it('should create unknown error for unrecognized errors', () => {
    const unknownError = new Error('Something went wrong')

    const fileError = createFileError(unknownError)

    expect(fileError.type).toBe('unknown')
    expect(fileError.message).toBe('Something went wrong')
  })

  it('should handle null/undefined errors', () => {
    const fileError = createFileError(null)

    expect(fileError.type).toBe('unknown')
    expect(fileError.message).toBe('An unknown error occurred')
  })
})

describe('createEmptyDirectoryError', () => {
  it('should create empty directory error', () => {
    const error = createEmptyDirectoryError()

    expect(error.type).toBe('empty')
    expect(error.message).toBe('This directory is empty')
  })
})
