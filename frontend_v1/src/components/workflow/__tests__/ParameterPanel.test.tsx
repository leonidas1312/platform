import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ParameterPanel from '../ParameterPanel'

// Mock the workflow node structure
const mockNode = {
  id: 'test-node-1',
  type: 'optimizer',
  data: {
    name: 'Test Optimizer',
    username: 'testuser',
    repository: 'testuser/test-optimizer',
    parameters: {}
  },
  position: { x: 0, y: 0 }
}

// Mock parameter configuration
const mockConfig = {
  metadata: {
    name: 'Test Optimizer',
    description: 'A test optimizer for unit testing'
  },
  parameters: {
    max_iterations: {
      type: 'number',
      label: 'Max Iterations',
      description: 'Maximum number of iterations',
      default: 1000,
      min: 1,
      max: 10000,
      step: 1
    },
    learning_rate: {
      type: 'number',
      label: 'Learning Rate',
      description: 'Learning rate for the optimizer',
      default: 0.01,
      min: 0.001,
      max: 1.0,
      step: 0.001
    },
    enable_logging: {
      type: 'boolean',
      label: 'Enable Logging',
      description: 'Enable detailed logging',
      default: true
    }
  }
}

// Mock fetch to return our test config
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockConfig),
  })
) as jest.Mock

describe('ParameterPanel', () => {
  const defaultProps = {
    node: mockNode,
    isOpen: true,
    onClose: jest.fn(),
    onParameterChange: jest.fn(),
    connections: [],
    allNodes: [mockNode]
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders parameter panel with node information', async () => {
    render(<ParameterPanel {...defaultProps} />)
    
    expect(screen.getByText('Node Parameters')).toBeInTheDocument()
    expect(screen.getByText('Test Optimizer')).toBeInTheDocument()
    expect(screen.getByText('@testuser/test-optimizer')).toBeInTheDocument()
  })

  it('displays number parameters with range information', async () => {
    render(<ParameterPanel {...defaultProps} />)
    
    // Wait for the config to load and parameters to render
    await screen.findByText('Max Iterations')
    
    // Check that range information is displayed
    expect(screen.getByText('Range: 1 - 10000 (step: 1)')).toBeInTheDocument()
    expect(screen.getByText('Range: 0.001 - 1 (step: 0.001)')).toBeInTheDocument()
  })

  it('allows typing in number input fields', async () => {
    render(<ParameterPanel {...defaultProps} />)
    
    // Wait for parameters to load
    const maxIterationsInput = await screen.findByDisplayValue('1000')
    
    // Clear and type new value
    fireEvent.change(maxIterationsInput, { target: { value: '2000' } })
    
    // Verify the parameter change callback was called
    expect(defaultProps.onParameterChange).toHaveBeenCalledWith(
      'test-node-1',
      expect.objectContaining({
        max_iterations: 2000
      })
    )
  })

  it('handles boolean parameters with switches', async () => {
    render(<ParameterPanel {...defaultProps} />)
    
    // Wait for parameters to load
    await screen.findByText('Enable Logging')
    
    // Find and click the switch
    const enableLoggingSwitch = screen.getByRole('switch')
    fireEvent.click(enableLoggingSwitch)
    
    // Verify the parameter change callback was called
    expect(defaultProps.onParameterChange).toHaveBeenCalledWith(
      'test-node-1',
      expect.objectContaining({
        enable_logging: expect.any(Boolean)
      })
    )
  })

  it('shows current values for parameters', async () => {
    render(<ParameterPanel {...defaultProps} />)
    
    // Wait for parameters to load
    await screen.findByText('Max Iterations')
    
    // Check that current values are displayed
    expect(screen.getByText('Current:')).toBeInTheDocument()
    expect(screen.getByText('1000')).toBeInTheDocument()
  })

  it('handles empty input values gracefully', async () => {
    render(<ParameterPanel {...defaultProps} />)
    
    // Wait for parameters to load
    const maxIterationsInput = await screen.findByDisplayValue('1000')
    
    // Clear the input
    fireEvent.change(maxIterationsInput, { target: { value: '' } })
    
    // Verify null value is passed
    expect(defaultProps.onParameterChange).toHaveBeenCalledWith(
      'test-node-1',
      expect.objectContaining({
        max_iterations: null
      })
    )
  })

  it('closes when close button is clicked', () => {
    render(<ParameterPanel {...defaultProps} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('does not render when isOpen is false', () => {
    render(<ParameterPanel {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Node Parameters')).not.toBeInTheDocument()
  })

  it('does not render when node is null', () => {
    render(<ParameterPanel {...defaultProps} node={null} />)
    
    expect(screen.queryByText('Node Parameters')).not.toBeInTheDocument()
  })
})
