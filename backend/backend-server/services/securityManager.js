/**
 * Security Manager for Workflow Execution
 * 
 * Provides security policies, isolation, and monitoring for containerized workflow execution
 */

class SecurityManager {
  constructor() {
    this.securityPolicies = {
      container: this.getContainerSecurityContext(),
      network: this.getNetworkPolicy(),
      resource: this.getResourceLimits(),
      runtime: this.getRuntimeSecurityPolicy()
    }
    
    // Track security events
    this.securityEvents = []
    this.maxSecurityEvents = 1000
    
    console.log(`🔒 SecurityManager initialized`)
  }

  /**
   * Get comprehensive container security context
   */
  getContainerSecurityContext() {
    return {
      // Run as non-root user
      runAsNonRoot: true,
      runAsUser: 1001,
      runAsGroup: 1001,
      
      // Prevent privilege escalation
      allowPrivilegeEscalation: false,
      
      // Read-only root filesystem (with exceptions for necessary writes)
      readOnlyRootFilesystem: false, // Qubots needs cache directory access
      
      // Drop all capabilities
      capabilities: {
        drop: ['ALL']
      },
      
      // Use default seccomp profile
      seccompProfile: {
        type: 'RuntimeDefault'
      },
      
      // SELinux options (if applicable)
      seLinuxOptions: {
        level: 's0:c123,c456'
      }
    }
  }

  /**
   * Get network security policy
   */
  getNetworkPolicy() {
    return {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'NetworkPolicy',
      metadata: {
        name: 'workflow-execution-policy'
      },
      spec: {
        podSelector: {
          matchLabels: {
            'app': 'workflow-execution'
          }
        },
        policyTypes: ['Ingress', 'Egress'],
        
        // No ingress traffic allowed
        ingress: [],
        
        // Restricted egress traffic
        egress: [
          {
            // Allow DNS resolution
            ports: [
              { protocol: 'UDP', port: 53 },
              { protocol: 'TCP', port: 53 }
            ]
          },
          {
            // Allow HTTPS to Rastion platform and Git repositories
            ports: [{ protocol: 'TCP', port: 443 }],
            to: [
              {
                // Allow access to Rastion platform
                namespaceSelector: {},
                podSelector: {
                  matchLabels: {
                    'app': 'rastion-platform'
                  }
                }
              }
            ]
          },
          {
            // Allow HTTP for Git operations (if needed)
            ports: [{ protocol: 'TCP', port: 80 }],
            to: [
              {
                // Restrict to known Git hosts
                namespaceSelector: {},
                podSelector: {
                  matchLabels: {
                    'service': 'git-proxy'
                  }
                }
              }
            ]
          }
        ]
      }
    }
  }

  /**
   * Get resource limits for security
   */
  getResourceLimits() {
    return {
      // CPU limits to prevent resource exhaustion
      cpu: {
        request: '250m',
        limit: '1000m'
      },
      
      // Memory limits to prevent OOM attacks
      memory: {
        request: '512Mi',
        limit: '2Gi'
      },
      
      // Ephemeral storage limits
      ephemeralStorage: {
        request: '1Gi',
        limit: '5Gi'
      },
      
      // Process limits
      processes: {
        limit: 100
      }
    }
  }

  /**
   * Get runtime security policy
   */
  getRuntimeSecurityPolicy() {
    return {
      // Execution timeout
      activeDeadlineSeconds: 600, // 10 minutes max
      
      // Restart policy
      restartPolicy: 'Never',
      
      // Backoff limit
      backoffLimit: 0, // No retries for security
      
      // TTL for cleanup
      ttlSecondsAfterFinished: 300, // 5 minutes
      
      // Pod security standards
      podSecurityStandards: {
        enforce: 'restricted',
        audit: 'restricted',
        warn: 'restricted'
      }
    }
  }

  /**
   * Create secure job manifest
   */
  createSecureJobManifest(jobName, script, executionId, resourceSpec) {
    const securityContext = this.getContainerSecurityContext()
    const runtimePolicy = this.getRuntimeSecurityPolicy()
    
    return {
      apiVersion: 'batch/v1',
      kind: 'Job',
      metadata: {
        name: jobName,
        labels: {
          'app': 'workflow-execution',
          'execution-id': executionId,
          'security-level': 'restricted',
          'managed-by': 'rastion-platform'
        },
        annotations: {
          'security.rastion.com/policy': 'restricted',
          'security.rastion.com/scan-required': 'true'
        }
      },
      spec: {
        activeDeadlineSeconds: runtimePolicy.activeDeadlineSeconds,
        backoffLimit: runtimePolicy.backoffLimit,
        ttlSecondsAfterFinished: runtimePolicy.ttlSecondsAfterFinished,
        
        template: {
          metadata: {
            labels: {
              'app': 'workflow-execution',
              'execution-id': executionId,
              'security-level': 'restricted'
            },
            annotations: {
              'container.apparmor.security.beta.kubernetes.io/workflow-executor': 'runtime/default'
            }
          },
          spec: {
            restartPolicy: runtimePolicy.restartPolicy,
            
            // Security context for the pod
            securityContext: {
              runAsNonRoot: true,
              runAsUser: 1001,
              runAsGroup: 1001,
              fsGroup: 1001,
              seccompProfile: {
                type: 'RuntimeDefault'
              }
            },
            
            containers: [{
              name: 'workflow-executor',
              image: process.env.PLAYGROUND_IMAGE || 'registry.digitalocean.com/rastion/qubots-playground:latest',
              command: ['python3', '-u', '-c'],
              args: [script],
              
              // Container security context
              securityContext: securityContext,
              
              // Resource limits
              resources: {
                requests: {
                  cpu: resourceSpec.cpu,
                  memory: resourceSpec.memory,
                  'ephemeral-storage': '1Gi'
                },
                limits: {
                  cpu: resourceSpec.cpuLimit,
                  memory: resourceSpec.memoryLimit,
                  'ephemeral-storage': '5Gi'
                }
              },
              
              // Environment variables (minimal and secure)
              env: [
                { name: 'EXECUTION_ID', value: executionId },
                { name: 'PYTHONUNBUFFERED', value: '1' },
                { name: 'PYTHONIOENCODING', value: 'utf-8' },
                { name: 'HOME', value: '/tmp' },
                { name: 'TMPDIR', value: '/tmp' }
              ],
              
              // Volume mounts (read-only where possible)
              volumeMounts: [
                {
                  name: 'tmp-volume',
                  mountPath: '/tmp',
                  readOnly: false
                }
              ]
            }],
            
            // Volumes
            volumes: [
              {
                name: 'tmp-volume',
                emptyDir: {
                  sizeLimit: '1Gi'
                }
              }
            ],
            
            // DNS policy
            dnsPolicy: 'ClusterFirst',
            
            // Service account (minimal permissions)
            serviceAccountName: 'workflow-executor',
            automountServiceAccountToken: false
          }
        }
      }
    }
  }

  /**
   * Validate execution environment
   */
  validateExecutionEnvironment(script, executionId) {
    const validationResults = {
      isValid: true,
      warnings: [],
      errors: []
    }
    
    // Check for potentially dangerous operations
    const dangerousPatterns = [
      /import\s+os\s*;.*os\.system/,
      /subprocess\.(call|run|Popen)/,
      /eval\s*\(/,
      /exec\s*\(/,
      /__import__/,
      /open\s*\([^)]*['"]\/[^'"]*['"]/
    ]
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(script)) {
        validationResults.warnings.push(`Potentially dangerous operation detected: ${pattern}`)
      }
    }
    
    // Check script size
    if (script.length > 100000) { // 100KB limit
      validationResults.errors.push('Script size exceeds security limit (100KB)')
      validationResults.isValid = false
    }
    
    // Log security validation
    this.logSecurityEvent('script_validation', executionId, {
      scriptSize: script.length,
      warnings: validationResults.warnings.length,
      errors: validationResults.errors.length
    })
    
    return validationResults
  }

  /**
   * Log security events
   */
  logSecurityEvent(eventType, executionId, details) {
    const event = {
      timestamp: new Date().toISOString(),
      type: eventType,
      executionId,
      details
    }
    
    this.securityEvents.push(event)
    
    // Maintain event history limit
    if (this.securityEvents.length > this.maxSecurityEvents) {
      this.securityEvents.shift()
    }
    
    console.log(`🔒 Security event: ${eventType} for ${executionId}`, details)
  }

  /**
   * Get security events for monitoring
   */
  getSecurityEvents(limit = 100) {
    return this.securityEvents.slice(-limit)
  }

  /**
   * Check for security violations
   */
  checkSecurityViolations(executionId) {
    const recentEvents = this.securityEvents
      .filter(event => event.executionId === executionId)
      .filter(event => {
        const eventTime = new Date(event.timestamp)
        const now = new Date()
        return (now - eventTime) < 3600000 // Last hour
      })
    
    const violations = recentEvents.filter(event => 
      event.type === 'security_violation' || 
      event.details?.severity === 'high'
    )
    
    return violations
  }
}

module.exports = SecurityManager
