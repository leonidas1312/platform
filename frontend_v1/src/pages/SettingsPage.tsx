"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AlertCircle, Copy, Eye, EyeOff, Key, Loader2, Plus, Shield, Trash2, CheckCircle2 } from "lucide-react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Token {
  id: number
  name: string
  token_last_eight: string
  created_at: string
  expires_at: string | null
}

const SettingsPage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("tokens")
  const [isLoading, setIsLoading] = useState(true)
  const [tokens, setTokens] = useState<Token[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTokenName, setNewTokenName] = useState("")
  const [expirationTime, setExpirationTime] = useState("never")
  const [isCreatingToken, setIsCreatingToken] = useState(false)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [showNewTokenDialog, setShowNewTokenDialog] = useState(false)
  const [isTokenVisible, setIsTokenVisible] = useState(false)
  const [isTokenCopied, setIsTokenCopied] = useState(false)
  const [isDeletingToken, setIsDeletingToken] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [tokenToDelete, setTokenToDelete] = useState<Token | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("gitea_token")
    if (!token) {
      navigate("/auth")
      return
    }

    fetchTokens()
  }, [navigate])

  const fetchTokens = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("gitea_token")
      const response = await fetch("http://localhost:4000/api/tokens", {
        headers: {
          Authorization: `token ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch tokens")
      }

      const data = await response.json()
      setTokens(data)
    } catch (error) {
      console.error("Error fetching tokens:", error)
      toast({
        title: "Error",
        description: "Failed to load API tokens. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateToken = async () => {
    if (!newTokenName.trim()) {
      toast({
        title: "Error",
        description: "Token name is required",
        variant: "destructive",
      })
      return
    }

    setIsCreatingToken(true)
    try {
      const token = localStorage.getItem("gitea_token")
      const response = await fetch("http://localhost:4000/api/create-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${token}`,
        },
        body: JSON.stringify({
          name: newTokenName,
          expiration: expirationTime === "never" ? null : expirationTime,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create token")
      }

      const data = await response.json()
      setNewToken(data.token)
      setShowCreateDialog(false)
      setShowNewTokenDialog(true)
      fetchTokens() // Refresh the token list
    } catch (error) {
      console.error("Error creating token:", error)
      toast({
        title: "Error",
        description: "Failed to create API token. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingToken(false)
    }
  }

  const handleDeleteToken = (token: Token) => {
    setTokenToDelete(token)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteToken = async () => {
    if (!tokenToDelete) return

    setIsDeletingToken(tokenToDelete.id)
    try {
      const token = localStorage.getItem("gitea_token")
      const response = await fetch(`http://localhost:4000/api/tokens/${tokenToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `token ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete token")
      }

      setTokens(tokens.filter((t) => t.id !== tokenToDelete.id))
      toast({
        title: "Success",
        description: "API token deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting token:", error)
      toast({
        title: "Error",
        description: "Failed to delete API token. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingToken(null)
      setShowDeleteConfirm(false)
      setTokenToDelete(null)
    }
  }

  const copyTokenToClipboard = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken)
      setIsTokenCopied(true)
      setTimeout(() => setIsTokenCopied(false), 2000)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never expires"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const resetTokenForm = () => {
    setNewTokenName("")
    setExpirationTime("never")
  }

  const handleCloseNewTokenDialog = () => {
    setShowNewTokenDialog(false)
    setNewToken(null)
    setIsTokenVisible(false)
    setIsTokenCopied(false)
  }

  return (
    <Layout>
      <main className="min-h-screen bg-background py-32 text-foreground">
        <div className="max-w-6xl mx-auto px-4 space-y-8">
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
                        value="tokens"
                        className="justify-start px-4 py-2 data-[state=active]:bg-muted rounded-none"
                      >
                        API Tokens
                      </TabsTrigger>
                      
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsContent value="tokens" className="mt-0">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl">Rastion API Tokens</CardTitle>
                          <CardDescription>Manage your personal access tokens for Rastion API access</CardDescription>
                        </div>
                        <Button
                          onClick={() => {
                            resetTokenForm()
                            setShowCreateDialog(true)
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          New Token
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Alert className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Important security information</AlertTitle>
                        <AlertDescription>
                          API tokens provide full access to your account. They should be treated like passwords and
                          never shared. Tokens will only be displayed once when created - make sure to copy it
                          immediately.
                        </AlertDescription>
                      </Alert>

                      {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-muted-foreground">Loading tokens...</span>
                        </div>
                      ) : tokens.length > 0 ? (
                        <div className="space-y-4">
                          {tokens.map((token) => (
                            <div
                              key={token.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Key className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="font-medium">{token.name}</p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>••••••{token.token_last_eight}</span>
                                    <span>•</span>
                                    <span>Created: {formatDate(token.created_at)}</span>
                                    {token.expires_at && (
                                      <>
                                        <span>•</span>
                                        <span>Expires: {formatDate(token.expires_at)}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteToken(token)}
                                disabled={isDeletingToken === token.id}
                              >
                                {isDeletingToken === token.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-muted/30 rounded-lg">
                          <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <h3 className="text-lg font-medium">No API tokens yet</h3>
                          <p className="text-muted-foreground mt-1 mb-4">
                            Create your first token to access the Gitea API
                          </p>
                          <Button
                            onClick={() => {
                              resetTokenForm()
                              setShowCreateDialog(true)
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Token
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="security" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">Security Settings</CardTitle>
                      <CardDescription>
                        This section is under development. Security settings will be available soon.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center py-12">
                        <Shield className="h-16 w-16 text-muted-foreground opacity-50" />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      {/* Create Token Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create new API token</DialogTitle>
            <DialogDescription>
              API tokens allow applications to authenticate with the Gitea API on your behalf.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="token-name">Token name</Label>
              <Input
                id="token-name"
                placeholder="e.g., Development Environment"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Give your token a descriptive name to remember where it's being used.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiration">Expiration</Label>
              <Select value={expirationTime} onValueChange={setExpirationTime}>
                <SelectTrigger id="expiration">
                  <SelectValue placeholder="Select expiration time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">No expiration</SelectItem>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="60d">60 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                  <SelectItem value="180d">180 days</SelectItem>
                  <SelectItem value="365d">1 year</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                For security reasons, we recommend setting an expiration date.
              </p>
            </div>

            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                The token will only be displayed once after creation. Make sure to copy it immediately. You cannot view
                it again later.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isCreatingToken}>
              Cancel
            </Button>
            <Button onClick={handleCreateToken} disabled={isCreatingToken}>
              {isCreatingToken ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create token"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Token Display Dialog */}
      <Dialog open={showNewTokenDialog} onOpenChange={handleCloseNewTokenDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Your new API token</DialogTitle>
            <DialogDescription>
              <span className="text-destructive font-semibold">
                Make sure to copy your token now. You won't be able to see it again!
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <div className="flex items-center justify-between bg-muted p-3 rounded-t-md border-b">
                <span className="font-medium">Token</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsTokenVisible(!isTokenVisible)}
                    className="h-8 w-8"
                  >
                    {isTokenVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyTokenToClipboard}
                    className="h-8 w-8"
                    disabled={isTokenCopied}
                  >
                    {isTokenCopied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="bg-muted/50 p-3 rounded-b-md font-mono text-sm break-all">
                {isTokenVisible ? newToken : "•".repeat(newToken?.length || 40)}
              </div>
            </div>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>This is your only chance to copy the token</AlertTitle>
              <AlertDescription>
                For security reasons, we cannot show this token again after you close this dialog. Please store it
                securely, like in a password manager.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={handleCloseNewTokenDialog} disabled={!isTokenCopied}>
              {isTokenCopied ? "Close" : "I've copied my token"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete API token</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this token? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {tokenToDelete && (
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="font-medium">{tokenToDelete.name}</p>
                <p className="text-sm text-muted-foreground">Last 8 characters: {tokenToDelete.token_last_eight}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeletingToken !== null}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteToken} disabled={isDeletingToken !== null}>
              {isDeletingToken !== null ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete token"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

export default SettingsPage

