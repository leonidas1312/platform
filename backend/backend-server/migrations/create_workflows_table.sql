-- Migration: Create workflows table for workflow automation feature
-- This table stores saved workflows with their metadata and configuration

CREATE TABLE IF NOT EXISTS workflows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id VARCHAR(255) NOT NULL,
    version VARCHAR(50) DEFAULT '1.0.0',
    
    -- Workflow configuration stored as JSON
    nodes JSONB NOT NULL DEFAULT '[]',
    connections JSONB NOT NULL DEFAULT '[]',
    parameters JSONB DEFAULT '{}',
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    
    -- Execution statistics
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT workflows_user_name_unique UNIQUE(user_id, name),
    CONSTRAINT workflows_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 255),
    CONSTRAINT workflows_nodes_valid CHECK (jsonb_typeof(nodes) = 'array'),
    CONSTRAINT workflows_connections_valid CHECK (jsonb_typeof(connections) = 'array')
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_updated_at ON workflows(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_public ON workflows(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_workflows_tags ON workflows USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_workflows_nodes ON workflows USING GIN(nodes);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_workflows_updated_at ON workflows;
CREATE TRIGGER trigger_update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_workflows_updated_at();

-- Create workflow executions table for tracking execution history
CREATE TABLE IF NOT EXISTS workflow_executions (
    id SERIAL PRIMARY KEY,
    execution_id VARCHAR(255) UNIQUE NOT NULL,
    workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    
    -- Execution details
    status VARCHAR(50) DEFAULT 'running',
    progress INTEGER DEFAULT 0,
    
    -- Configuration at execution time
    nodes JSONB NOT NULL,
    connections JSONB NOT NULL,
    parameters JSONB DEFAULT '{}',
    
    -- Results and logs
    results JSONB DEFAULT '{}',
    logs JSONB DEFAULT '[]',
    metrics JSONB DEFAULT '{}',
    error_message TEXT,
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT workflow_executions_status_valid CHECK (
        status IN ('running', 'completed', 'failed', 'cancelled', 'paused')
    ),
    CONSTRAINT workflow_executions_progress_valid CHECK (
        progress >= 0 AND progress <= 100
    )
);

-- Indexes for workflow executions
CREATE INDEX IF NOT EXISTS idx_workflow_executions_execution_id ON workflow_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_user_id ON workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at DESC);

-- Create workflow templates table for predefined workflow templates
CREATE TABLE IF NOT EXISTS workflow_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    
    -- Template configuration
    nodes JSONB NOT NULL DEFAULT '[]',
    connections JSONB NOT NULL DEFAULT '[]',
    default_parameters JSONB DEFAULT '{}',
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    difficulty_level VARCHAR(50) DEFAULT 'beginner', -- beginner, intermediate, advanced
    estimated_time_minutes INTEGER,
    
    -- Usage statistics
    usage_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT workflow_templates_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 255),
    CONSTRAINT workflow_templates_difficulty_valid CHECK (
        difficulty_level IN ('beginner', 'intermediate', 'advanced')
    )
);

-- Indexes for workflow templates
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_difficulty ON workflow_templates(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_tags ON workflow_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_usage_count ON workflow_templates(usage_count DESC);

-- Trigger for workflow templates updated_at
CREATE TRIGGER trigger_update_workflow_templates_updated_at
    BEFORE UPDATE ON workflow_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_workflows_updated_at();

-- Insert some default workflow templates
INSERT INTO workflow_templates (name, description, category, nodes, connections, tags, difficulty_level, estimated_time_minutes) VALUES
(
    'Basic TSP Workflow',
    'A simple workflow for solving Traveling Salesman Problems using genetic algorithm',
    'optimization',
    '[
        {
            "id": "dataset-template",
            "type": "dataset",
            "position": {"x": 100, "y": 100},
            "data": {
                "name": "TSP Dataset",
                "description": "Upload your TSP dataset here",
                "parameters": {}
            }
        },
        {
            "id": "problem-template",
            "type": "problem",
            "position": {"x": 400, "y": 100},
            "data": {
                "name": "TSP Problem",
                "description": "TSP problem formulation",
                "parameters": {"objective": "minimize"}
            }
        },
        {
            "id": "optimizer-template",
            "type": "optimizer",
            "position": {"x": 700, "y": 100},
            "data": {
                "name": "Genetic Algorithm",
                "description": "GA optimizer for TSP",
                "parameters": {"population_size": 100, "max_iterations": 1000}
            }
        }
    ]',
    '[
        {
            "id": "dataset-to-problem",
            "source": "dataset-template",
            "target": "problem-template"
        },
        {
            "id": "problem-to-optimizer",
            "source": "problem-template",
            "target": "optimizer-template"
        }
    ]',
    ARRAY['tsp', 'genetic-algorithm', 'beginner'],
    'beginner',
    15
),
(
    'Multi-Objective Optimization',
    'Advanced workflow for multi-objective optimization problems',
    'optimization',
    '[
        {
            "id": "dataset-template",
            "type": "dataset",
            "position": {"x": 100, "y": 100},
            "data": {
                "name": "Multi-Objective Dataset",
                "description": "Dataset for multi-objective optimization",
                "parameters": {}
            }
        },
        {
            "id": "problem-template",
            "type": "problem",
            "position": {"x": 400, "y": 100},
            "data": {
                "name": "Multi-Objective Problem",
                "description": "Multi-objective problem formulation",
                "parameters": {"objectives": ["minimize", "maximize"]}
            }
        },
        {
            "id": "optimizer1-template",
            "type": "optimizer",
            "position": {"x": 700, "y": 50},
            "data": {
                "name": "NSGA-II",
                "description": "Non-dominated Sorting Genetic Algorithm",
                "parameters": {"population_size": 200, "max_iterations": 500}
            }
        },
        {
            "id": "optimizer2-template",
            "type": "optimizer",
            "position": {"x": 700, "y": 150},
            "data": {
                "name": "SPEA2",
                "description": "Strength Pareto Evolutionary Algorithm",
                "parameters": {"population_size": 200, "max_iterations": 500}
            }
        }
    ]',
    '[
        {
            "id": "dataset-to-problem",
            "source": "dataset-template",
            "target": "problem-template"
        },
        {
            "id": "problem-to-optimizer1",
            "source": "problem-template",
            "target": "optimizer1-template"
        },
        {
            "id": "problem-to-optimizer2",
            "source": "problem-template",
            "target": "optimizer2-template"
        }
    ]',
    ARRAY['multi-objective', 'nsga-ii', 'spea2', 'advanced'],
    'advanced',
    45
)
ON CONFLICT (name) DO NOTHING;
