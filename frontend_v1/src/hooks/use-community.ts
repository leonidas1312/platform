import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

const API = import.meta.env.VITE_API_BASE

export interface CommunityPost {
  id: string
  content: string
  author_username: string
  type: string
  created_at: string
  updated_at: string
}

export interface PostComment {
  id: string
  post_id: string
  content: string
  username: string
  created_at: string
}

export interface CreatePostData {
  content: string
  category?: string
}

export interface CreateCommentData {
  content: string
}

export interface Blog {
  id: string
  title: string
  summary: string
  content: string
  author_username: string
  category: string
  tags: string
  image_url?: string
  optimizer_name?: string
  optimizer_url?: string
  problem_name?: string
  problem_description?: string
  read_time: number
  views_count: number
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
}

export interface BlogsResponse {
  blogs: Blog[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface BlogStats {
  totalBlogs: number
  totalAuthors: number
  avgReadTime: number
}

export interface CreateBlogData {
  title: string
  summary: string
  content: string
  category: string
  tags?: string[]
  image_url?: string
  optimizer_name?: string
  optimizer_url?: string
  problem_name?: string
  problem_description?: string
  read_time?: number
}

// Helper function to get auth token
function getAuthToken(): string | null {
  return localStorage.getItem('token')
}

// API functions
async function fetchPosts(): Promise<CommunityPost[]> {
  const response = await fetch(`${API}/api/community/posts`, {
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch community posts')
  }
  
  return response.json()
}

async function fetchPost(id: string): Promise<CommunityPost> {
  const response = await fetch(`${API}/api/community/posts/${id}`, {
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch post')
  }
  
  return response.json()
}

async function createPost(data: CreatePostData): Promise<CommunityPost> {
  const token = getAuthToken()
  const response = await fetch(`${API}/api/community/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    credentials: 'include',
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error('Failed to create post')
  }
  
  return response.json()
}

async function updatePost(id: string, data: Partial<CreatePostData>): Promise<CommunityPost> {
  const token = getAuthToken()
  const response = await fetch(`${API}/api/community/posts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    credentials: 'include',
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error('Failed to update post')
  }
  
  return response.json()
}

async function deletePost(id: string): Promise<void> {
  const token = getAuthToken()
  const response = await fetch(`${API}/api/community/posts/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete post')
  }
}

async function fetchComments(postId: string): Promise<PostComment[]> {
  const response = await fetch(`${API}/api/community/posts/${postId}/comments`, {
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch comments')
  }
  
  return response.json()
}

async function createComment(postId: string, data: CreateCommentData): Promise<PostComment> {
  const token = getAuthToken()
  const response = await fetch(`${API}/api/community/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    credentials: 'include',
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error('Failed to create comment')
  }
  
  return response.json()
}

async function toggleLike(postId: string): Promise<{ liked: boolean }> {
  const token = getAuthToken()
  const response = await fetch(`${API}/api/community/posts/${postId}/like`, {
    method: 'POST',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error('Failed to toggle like')
  }
  
  return response.json()
}

async function fetchLikeCount(postId: string): Promise<{ count: number }> {
  const response = await fetch(`${API}/api/community/posts/${postId}/likes`, {
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch like count')
  }
  
  return response.json()
}

async function checkLikeStatus(postId: string): Promise<{ liked: boolean }> {
  const token = getAuthToken()
  const response = await fetch(`${API}/api/community/posts/${postId}/liked`, {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Failed to check like status')
  }

  return response.json()
}

// Blog API functions
async function fetchBlogs(
  page: number = 1,
  limit: number = 10,
  category?: string,
  search?: string,
  sort?: string
): Promise<BlogsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  if (category && category !== 'all') {
    params.append('category', category)
  }
  if (search) {
    params.append('search', search)
  }
  if (sort) {
    params.append('sort', sort)
  }

  const response = await fetch(`${API}/api/community/blogs?${params}`, {
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Failed to fetch blogs')
  }

  return response.json()
}

async function fetchBlogStats(): Promise<BlogStats> {
  const response = await fetch(`${API}/api/community/blogs/stats`, {
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Failed to fetch blog stats')
  }

  return response.json()
}

async function fetchBlog(id: string): Promise<Blog> {
  const response = await fetch(`${API}/api/community/blogs/${id}`, {
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Failed to fetch blog')
  }

  return response.json()
}

async function createBlog(data: CreateBlogData): Promise<Blog> {
  const token = getAuthToken()
  const response = await fetch(`${API}/api/community/blogs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    credentials: 'include',
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    throw new Error('Failed to create blog')
  }

  return response.json()
}

async function updateBlog(id: string, data: Partial<CreateBlogData>): Promise<Blog> {
  const token = getAuthToken()
  const response = await fetch(`${API}/api/community/blogs/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    credentials: 'include',
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    throw new Error('Failed to update blog')
  }

  return response.json()
}

async function deleteBlog(id: string): Promise<void> {
  const token = getAuthToken()
  const response = await fetch(`${API}/api/community/blogs/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Failed to delete blog')
  }
}

async function toggleBlogLike(blogId: string): Promise<{ liked: boolean }> {
  const token = getAuthToken()
  const response = await fetch(`${API}/api/community/blogs/${blogId}/like`, {
    method: 'POST',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Failed to toggle blog like')
  }

  return response.json()
}

async function fetchBlogLikeCount(blogId: string): Promise<{ count: number }> {
  const response = await fetch(`${API}/api/community/blogs/${blogId}/likes`, {
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Failed to fetch blog like count')
  }

  return response.json()
}

async function checkBlogLikeStatus(blogId: string): Promise<{ liked: boolean }> {
  const token = getAuthToken()
  const response = await fetch(`${API}/api/community/blogs/${blogId}/liked`, {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Failed to check blog like status')
  }

  return response.json()
}

async function incrementBlogViewCount(blogId: string): Promise<void> {
  const response = await fetch(`${API}/api/community/blogs/${blogId}/view`, {
    method: 'POST',
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Failed to increment blog view count')
  }
}

// React Query hooks

/**
 * Hook to fetch all community posts
 */
export function useCommunityPosts() {
  return useQuery({
    queryKey: ['community', 'posts'],
    queryFn: fetchPosts,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch a specific post
 */
export function useCommunityPost(id: string) {
  return useQuery({
    queryKey: ['community', 'posts', id],
    queryFn: () => fetchPost(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to create a new post
 */
export function useCreatePost() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] })
      toast({
        title: "Success",
        description: "Post created successfully!",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook to update a post
 */
export function useUpdatePost() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePostData> }) => updatePost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] })
      toast({
        title: "Success",
        description: "Post updated successfully!",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook to delete a post
 */
export function useDeletePost() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] })
      toast({
        title: "Success",
        description: "Post deleted successfully!",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook to fetch comments for a post
 */
export function usePostComments(postId: string) {
  return useQuery({
    queryKey: ['community', 'posts', postId, 'comments'],
    queryFn: () => fetchComments(postId),
    enabled: !!postId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  })
}

/**
 * Hook to create a comment
 */
export function useCreateComment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: CreateCommentData }) => createComment(postId, data),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts', postId, 'comments'] })
      toast({
        title: "Success",
        description: "Comment added successfully!",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook to toggle like on a post
 */
export function useToggleLike() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: toggleLike,
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts', postId, 'likes'] })
      queryClient.invalidateQueries({ queryKey: ['community', 'posts', postId, 'liked'] })
    },
  })
}

/**
 * Hook to fetch like count for a post
 */
export function useLikeCount(postId: string) {
  return useQuery({
    queryKey: ['community', 'posts', postId, 'likes'],
    queryFn: () => fetchLikeCount(postId),
    enabled: !!postId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to check if user liked a post
 */
export function useLikeStatus(postId: string) {
  return useQuery({
    queryKey: ['community', 'posts', postId, 'liked'],
    queryFn: () => checkLikeStatus(postId),
    enabled: !!postId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

// ===== BLOG HOOKS =====

/**
 * Hook to fetch blogs with filtering and pagination
 */
export function useBlogs(
  page: number = 1,
  limit: number = 10,
  category?: string,
  search?: string,
  sort?: string
) {
  return useQuery({
    queryKey: ['community', 'blogs', { page, limit, category, search, sort }],
    queryFn: () => fetchBlogs(page, limit, category, search, sort),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch blog statistics
 */
export function useBlogStats() {
  return useQuery({
    queryKey: ['community', 'blogs', 'stats'],
    queryFn: fetchBlogStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch a specific blog
 */
export function useBlog(id: string) {
  return useQuery({
    queryKey: ['community', 'blogs', id],
    queryFn: () => fetchBlog(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to create a new blog
 */
export function useCreateBlog() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createBlog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'blogs'] })
      toast({
        title: "Success",
        description: "Blog created successfully!",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook to update a blog
 */
export function useUpdateBlog() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBlogData> }) => updateBlog(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'blogs'] })
      toast({
        title: "Success",
        description: "Blog updated successfully!",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook to delete a blog
 */
export function useDeleteBlog() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteBlog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'blogs'] })
      toast({
        title: "Success",
        description: "Blog deleted successfully!",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook to toggle like on a blog
 */
export function useToggleBlogLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleBlogLike,
    onSuccess: (_, blogId) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'blogs', blogId, 'likes'] })
      queryClient.invalidateQueries({ queryKey: ['community', 'blogs', blogId, 'liked'] })
      queryClient.invalidateQueries({ queryKey: ['community', 'blogs'] })
    },
  })
}

/**
 * Hook to fetch like count for a blog
 */
export function useBlogLikeCount(blogId: string) {
  return useQuery({
    queryKey: ['community', 'blogs', blogId, 'likes'],
    queryFn: () => fetchBlogLikeCount(blogId),
    enabled: !!blogId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to check if user liked a blog
 */
export function useBlogLikeStatus(blogId: string) {
  return useQuery({
    queryKey: ['community', 'blogs', blogId, 'liked'],
    queryFn: () => checkBlogLikeStatus(blogId),
    enabled: !!blogId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to increment blog view count
 */
export function useIncrementBlogView() {
  return useMutation({
    mutationFn: incrementBlogViewCount,
    // Don't show toast for view increments
  })
}
