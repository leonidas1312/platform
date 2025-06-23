import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'

const API = import.meta.env.VITE_API_BASE

interface Submission {
  id: string
  user_id: number
  solver_repository: string
  problem_id: number
  custom_parameters: string
  num_runs: number
  status: 'pending' | 'validating' | 'executing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  current_step?: string
  error_message?: string
  results?: any
  created_at: string
  updated_at: string
}

interface SubmissionLog {
  message: string
  log_level: 'debug' | 'info' | 'warning' | 'error'
  timestamp: string
}

interface SubmissionDetails {
  submission: Submission
  logs: string[]
}

interface SubmissionHook {
  submissions: Submission[]
  loading: boolean
  error: string | null
  fetchSubmissions: () => Promise<void>
  getSubmissionDetails: (submissionId: string) => Promise<SubmissionDetails | null>
  connectToSubmissionStream: (submissionId: string) => Promise<void>
  disconnectFromSubmissionStream: () => void
  submissionDetails: SubmissionDetails | null
  isStreamConnected: boolean
}

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token')
}

export const useSubmissions = (): SubmissionHook => {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submissionDetails, setSubmissionDetails] = useState<SubmissionDetails | null>(null)
  const [isStreamConnected, setIsStreamConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const { toast } = useToast()

  // Fetch user's submissions
  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = getAuthToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API}/api/submissions/my-submissions`, {
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch submissions')
      }

      const data = await response.json()
      setSubmissions(data.submissions || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch submissions'
      setError(errorMessage)
      console.error('Error fetching submissions:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Get detailed submission information
  const getSubmissionDetails = useCallback(async (submissionId: string): Promise<SubmissionDetails | null> => {
    try {
      const token = getAuthToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API}/api/submissions/${submissionId}/status`, {
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch submission details')
      }

      const data = await response.json()
      return {
        submission: data.submission,
        logs: data.logs || []
      }
    } catch (err) {
      console.error('Error fetching submission details:', err)
      return null
    }
  }, [])

  // Connect to real-time submission stream
  const connectToSubmissionStream = useCallback(async (submissionId: string) => {
    if (!submissionId) return

    // Disconnect existing connection
    if (wsRef.current) {
      wsRef.current.close()
    }

    const token = getAuthToken()
    if (!token) {
      console.error('No auth token available for WebSocket connection')
      return
    }

    // Get user ID from API since we use session-based auth
    let userId
    try {
      const response = await fetch(`${API}/api/profile`, {
        credentials: 'include'
      })
      if (response.ok) {
        const userData = await response.json()
        userId = userData.id
      } else {
        console.error('Failed to get user ID for WebSocket connection')
        return
      }
    } catch (error) {
      console.error('Error fetching user ID:', error)
      return
    }

    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsHost = window.location.host
      const wsUrl = `${wsProtocol}//${wsHost}/api/submissions/stream/${submissionId}?userId=${userId}&token=${token}`

      console.log('🔌 Connecting to submission stream:', wsUrl)
      const websocket = new WebSocket(wsUrl)
      wsRef.current = websocket

      websocket.onopen = () => {
        console.log('📊 Connected to submission progress stream')
        setIsStreamConnected(true)
      }

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('📨 Submission stream message:', message)

          switch (message.type) {
            case 'submission_connection_established':
              console.log('✅ Submission stream connection established')
              break

            case 'submission_status_update':
              const updatedDetails = message.data
              setSubmissionDetails(updatedDetails)

              // Update submissions list if the submission is in it
              setSubmissions(prev => prev.map(sub =>
                sub.id === submissionId
                  ? { ...sub, ...updatedDetails.submission }
                  : sub
              ))

              // Show toast for important status changes
              if (updatedDetails.submission.status === 'completed') {
                toast({
                  title: 'Submission Completed',
                  description: 'Your algorithm submission has finished successfully!',
                  variant: 'default'
                })
              } else if (updatedDetails.submission.status === 'failed') {
                toast({
                  title: 'Submission Failed',
                  description: updatedDetails.submission.error_message || 'Your submission encountered an error.',
                  variant: 'destructive'
                })
              }
              break

            default:
              console.log('Unknown submission stream message type:', message.type)
          }
        } catch (err) {
          console.error('Error parsing submission stream message:', err)
        }
      }

      websocket.onclose = () => {
        console.log('📊 Submission stream disconnected')
        setIsStreamConnected(false)
        wsRef.current = null
      }

      websocket.onerror = (error) => {
        console.error('📊 Submission stream error:', error)
        setIsStreamConnected(false)
      }

    } catch (err) {
      console.error('Error connecting to submission stream:', err)
      setIsStreamConnected(false)
    }
  }, [toast])

  // Disconnect from submission stream
  const disconnectFromSubmissionStream = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
      setIsStreamConnected(false)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromSubmissionStream()
    }
  }, [disconnectFromSubmissionStream])

  return {
    submissions,
    loading,
    error,
    fetchSubmissions,
    getSubmissionDetails,
    connectToSubmissionStream,
    disconnectFromSubmissionStream,
    submissionDetails,
    isStreamConnected
  }
}
