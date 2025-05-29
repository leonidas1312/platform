import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ActivityFeed from '../ActivityFeed'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Mock the API
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn()
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
})
window.IntersectionObserver = mockIntersectionObserver

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('ActivityFeed', () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockReturnValue('mock-token')
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    render(
      <TestWrapper>
        <ActivityFeed username="testuser" />
      </TestWrapper>
    )

    expect(screen.getByText('Loading activity...')).toBeInTheDocument()
  })

  it('renders empty state when no activities', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    render(
      <TestWrapper>
        <ActivityFeed username="testuser" />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('No activity yet')).toBeInTheDocument()
    })
  })

  it('renders activity items when data is available', async () => {
    const mockActivities = [
      {
        id: '1',
        type: 'qubot_created',
        timestamp: new Date().toISOString(),
        user: {
          login: 'testuser',
          full_name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg',
        },
        data: {
          qubot: {
            id: '1',
            name: 'test-repo',
            owner: 'testuser',
            description: 'A test repository',
          },
        },
      },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockActivities),
    })

    render(
      <TestWrapper>
        <ActivityFeed username="testuser" />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('created a new Qubot')).toBeInTheDocument()
      expect(screen.getByText('test-repo')).toBeInTheDocument()
    })
  })

  it('handles error states gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'))

    render(
      <TestWrapper>
        <ActivityFeed username="testuser" />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Error loading activity feed')).toBeInTheDocument()
    })
  })

  it('supports refresh functionality', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    render(
      <TestWrapper>
        <ActivityFeed username="testuser" />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
    })

    const refreshButton = screen.getByText('Refresh')
    fireEvent.click(refreshButton)

    // Should trigger another API call
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('displays real-time indicator when enabled', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    render(
      <TestWrapper>
        <ActivityFeed username="testuser" enableRealTime={true} />
      </TestWrapper>
    )

    expect(screen.getByText('Live updates enabled')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    const { container } = render(
      <TestWrapper>
        <ActivityFeed username="testuser" className="custom-class" />
      </TestWrapper>
    )

    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('handles activity grouping', async () => {
    const mockGroupedActivities = [
      {
        id: 'grouped-1',
        type: 'post_like',
        timestamp: new Date().toISOString(),
        user: {
          login: 'testuser',
          full_name: 'Test User',
        },
        data: {},
        is_grouped: true,
        grouped_count: 3,
      },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGroupedActivities),
    })

    render(
      <TestWrapper>
        <ActivityFeed username="testuser" enableGrouping={true} />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('+2 more')).toBeInTheDocument()
      expect(screen.getByText('similar activities')).toBeInTheDocument()
    })
  })

  it('handles different activity types correctly', async () => {
    const mockActivities = [
      {
        id: '1',
        type: 'user_followed',
        timestamp: new Date().toISOString(),
        user: { login: 'testuser' },
        data: {
          user: { login: 'followeduser', full_name: 'Followed User' },
        },
      },
      {
        id: '2',
        type: 'repo_starred',
        timestamp: new Date().toISOString(),
        user: { login: 'testuser' },
        data: {
          qubot: { name: 'starred-repo', owner: 'owner' },
        },
      },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockActivities),
    })

    render(
      <TestWrapper>
        <ActivityFeed username="testuser" />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/followed/)).toBeInTheDocument()
      expect(screen.getByText(/starred/)).toBeInTheDocument()
    })
  })

  it('expands and collapses content preview', async () => {
    const longContent = 'A'.repeat(200) // Long content that should be truncated
    
    const mockActivities = [
      {
        id: '1',
        type: 'feature_comment',
        timestamp: new Date().toISOString(),
        user: { login: 'testuser' },
        data: {
          comment: { content: longContent },
          feature: { id: '1', title: 'Test Feature' },
        },
      },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockActivities),
    })

    render(
      <TestWrapper>
        <ActivityFeed username="testuser" />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Show more')).toBeInTheDocument()
    })

    const showMoreButton = screen.getByText('Show more')
    fireEvent.click(showMoreButton)

    expect(screen.getByText('Show less')).toBeInTheDocument()
  })

  it('handles navigation clicks', async () => {
    const mockActivities = [
      {
        id: '1',
        type: 'qubot_created',
        timestamp: new Date().toISOString(),
        user: { login: 'testuser' },
        data: {
          qubot: { name: 'test-repo', owner: 'testuser' },
        },
      },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockActivities),
    })

    render(
      <TestWrapper>
        <ActivityFeed username="testuser" />
      </TestWrapper>
    )

    await waitFor(() => {
      const repoLink = screen.getByText('test-repo')
      expect(repoLink).toBeInTheDocument()
      
      // Click should not throw error
      fireEvent.click(repoLink)
    })
  })
})
