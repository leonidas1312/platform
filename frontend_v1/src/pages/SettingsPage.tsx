"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AlertCircle, Copy, Eye, EyeOff, Key, Loader2, CheckCircle2, User, Lock, Shield, Code, FileText, Package, Target } from "lucide-react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import PersonalWorkflows from "@/components/settings/PersonalWorkflows"
import PersonalBenchmarks from "@/components/settings/PersonalBenchmarks"

const API = import.meta.env.VITE_API_BASE

const SettingsPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState("account")

  // Check for tab and submission parameters from URL
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['account', 'developer', 'workflows', 'benchmarks'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // API Token state
  const [apiToken, setApiToken] = useState("")
  const [showApiToken, setShowApiToken] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  // Rastion Token state
  const [rastionToken, setRastionToken] = useState("")
  const [showRastionToken, setShowRastionToken] = useState(false)
  const [copyRastionSuccess, setCopyRastionSuccess] = useState(false)
  const [hasGithubAuth, setHasGithubAuth] = useState(false)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        // Fetch Rastion API token
        const response = await fetch(`${API}/api/auth/token`, {
          credentials: 'include', // Include cookies in request
        })

        if (!response.ok) {
          navigate("/auth")
          return
        }

        const data = await response.json()
        setApiToken(data.token)

        // Fetch Rastion API token
        try {
          const rastionResponse = await fetch(`${API}/api/users/gitea-token`, {
            credentials: 'include',
          })

          if (rastionResponse.ok) {
            const rastionData = await rastionResponse.json()
            setRastionToken(rastionData.gitea_token)
            setHasGithubAuth(rastionData.has_github_auth)
          }
        } catch (rastionError) {
          console.warn("Could not fetch Rastion token:", rastionError)
        }
      } catch (error) {
        console.error("Error fetching tokens:", error)
        navigate("/auth")
      }
    }

    fetchTokens()
  }, [navigate])

  // Copy to clipboard functionality
  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(apiToken)
      setCopySuccess(true)
      toast({
        title: "Success",
        description: "API token copied to clipboard",
      })
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy token to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleCopyRastionToken = async () => {
    try {
      await navigator.clipboard.writeText(rastionToken)
      setCopyRastionSuccess(true)
      toast({
        title: "Success",
        description: "Rastion API token copied to clipboard",
      })
      setTimeout(() => setCopyRastionSuccess(false), 2000)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy Rastion token to clipboard",
        variant: "destructive",
      })
    }
  }

  // Format token for display (show only last 4 characters)
  const formatToken = (token: string, show: boolean = showApiToken) => {
    if (!token) return ""
    if (show) return token
    return "•".repeat(Math.max(0, token.length - 4)) + token.slice(-4)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset error state
    setPasswordError("")

    // Validate passwords
    if (!currentPassword) {
      setPasswordError("Current password is required")
      return
    }

    if (!newPassword) {
      setPasswordError("New password is required")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long")
      return
    }

    setIsChangingPassword(true)

    try {
      const response = await fetch(`${API}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          old_password: currentPassword,
          new_password: newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to change password")
      }

      // Clear form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      toast({
        title: "Success",
        description: "Password changed successfully",
      })
    } catch (error) {
      console.error("Error changing password:", error)
      setPasswordError(error instanceof Error ? error.message : "Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <Layout>
      <main className="min-h-screen bg-background py-8 text-foreground">
        <div className="w-full px-4 space-y-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full md:w-64 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>Manage your account settings</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
                    <TabsList className="flex flex-col h-auto items-stretch bg-transparent p-0 w-full">
                      <TabsTrigger
                        value="account"
                        className="justify-start px-4 py-2 data-[state=active]:bg-muted rounded-none"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Account Settings
                      </TabsTrigger>
                      <TabsTrigger
                        value="developer"
                        className="justify-start px-4 py-2 data-[state=active]:bg-muted rounded-none"
                      >
                        <Code className="h-4 w-4 mr-2" />
                        Developer
                      </TabsTrigger>

                      <TabsTrigger
                        value="workflows"
                        className="justify-start px-4 py-2 data-[state=active]:bg-muted rounded-none"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Personal Workflows
                      </TabsTrigger>
                      <TabsTrigger
                        value="benchmarks"
                        className="justify-start px-4 py-2 data-[state=active]:bg-muted rounded-none"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Personal Benchmarks
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsContent value="account" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">Account Settings</CardTitle>
                      <CardDescription>Update your account password and security settings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Password Change Section */}
                      <form onSubmit={handleChangePassword} className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Shield className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="text-lg font-medium">Change Password</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Update your account password to keep your account secure
                          </p>

                          {passwordError && (
                            <Alert variant="destructive" className="mb-4">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Error</AlertTitle>
                              <AlertDescription>{passwordError}</AlertDescription>
                            </Alert>
                          )}

                          <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <div className="relative">
                              <Input
                                id="current-password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                              />
                              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <div className="relative">
                              <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                              />
                              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <div className="relative">
                              <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                              />
                              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </div>

                        <Button type="submit" disabled={isChangingPassword}>
                          {isChangingPassword ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            "Update Password"
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="developer" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">Developer Settings</CardTitle>
                      <CardDescription>Manage your API tokens and developer tools</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* API Token Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Key className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="text-lg font-medium">Rastion API Token</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Your personal access token for authenticating with the Rastion API
                        </p>

                        <div className="space-y-3">
                          <Label htmlFor="api-token">API Token</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                id="api-token"
                                type="text"
                                value={formatToken(apiToken)}
                                readOnly
                                className="pr-20 font-mono text-sm"
                                placeholder="No token available"
                              />
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => setShowApiToken(!showApiToken)}
                                  className="h-6 w-6"
                                >
                                  {showApiToken ? (
                                    <EyeOff className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={handleCopyToken}
                                  disabled={!apiToken}
                                  className="h-6 w-6"
                                >
                                  {copySuccess ? (
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Keep your token secure and never share it publicly. This token provides access to your account.
                          </p>
                        </div>
                      </div>

                      {/* Rastion API Token Section */}
                      {rastionToken && (
                        <div className="space-y-4 mt-8 pt-8 border-t">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-green-500/10">
                              <Key className="h-5 w-5 text-green-600" />
                            </div>
                            <h3 className="text-lg font-medium">Rastion API Token</h3>
                            {hasGithubAuth && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                GitHub Connected
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Your personal access token for the Rastion platform. This token is automatically generated when you sign up and provides access to repositories and Git operations.
                          </p>

                          <div className="space-y-3">
                            <Label htmlFor="rastion-token">Rastion API Token</Label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  id="rastion-token"
                                  type="text"
                                  value={formatToken(rastionToken, showRastionToken)}
                                  readOnly
                                  className="pr-20 font-mono text-sm"
                                  placeholder="No token available"
                                />
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => setShowRastionToken(!showRastionToken)}
                                    className="h-6 w-6"
                                  >
                                    {showRastionToken ? (
                                      <EyeOff className="h-3 w-3" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={handleCopyRastionToken}
                                    disabled={!rastionToken}
                                    className="h-6 w-6"
                                  >
                                    {copyRastionSuccess ? (
                                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Use this token to access your repositories and perform Git operations through the Rastion platform.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>



                <TabsContent value="workflows" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">Personal Workflows</CardTitle>
                      <CardDescription>Manage your private optimization workflows and configurations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PersonalWorkflows />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="benchmarks" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">Personal Benchmarks</CardTitle>
                      <CardDescription>Create and manage your private benchmark suites for optimization testing</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PersonalBenchmarks />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  )
}

export default SettingsPage
