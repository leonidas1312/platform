import React, { useState, useEffect } from 'react'
import { Search, Upload, Grid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import Layout from '@/components/Layout'
import DatasetUploadModal from '@/components/datasets/DatasetUploadModal'
import DatasetCard from '@/components/datasets/DatasetCard'

interface Dataset {
  id: string
  name: string
  description: string
  format_type: string
  metadata?: {
    [key: string]: any
  }
  file_size: number
  original_filename: string
  is_public: boolean
  user_id: string
  created_at: string
  user?: {
    username: string
    avatar_url: string | null
    full_name: string | null
  }
}



const DatasetsPage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // State management
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [showMyDatasets, setShowMyDatasets] = useState(false)
  const [sortBy, setSortBy] = useState<string>('recent')
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Fetch datasets on component mount
  useEffect(() => {
    fetchDatasets()
  }, [])

  // Apply filters when datasets or filter criteria change
  useEffect(() => {
    applyFilters()
  }, [datasets, searchQuery, showMyDatasets, sortBy])

  const fetchDatasets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/datasets', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch datasets')
      }
      
      const data = await response.json()
      setDatasets(data.datasets || [])
      
    } catch (error) {
      console.error('Error fetching datasets:', error)
      toast({
        title: "Error",
        description: "Failed to load datasets. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }



  const applyFilters = () => {
    let filtered = [...datasets]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(dataset =>
        dataset.name.toLowerCase().includes(query) ||
        dataset.description?.toLowerCase().includes(query) ||
        dataset.format_type.toLowerCase().includes(query) ||
        dataset.original_filename.toLowerCase().includes(query)
      )
    }



    // My datasets filter
    if (showMyDatasets && user) {
      filtered = filtered.filter(dataset =>
        dataset.user_id === user.login
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'size':
          return b.file_size - a.file_size
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredDatasets(filtered)
  }

  const handleDatasetUploaded = (newDataset: Dataset) => {
    setDatasets(prev => [newDataset, ...prev])
    setShowUploadModal(false)
    toast({
      title: "Success",
      description: "Dataset uploaded successfully!"
    })
  }

  const handleDatasetDeleted = (datasetId: string) => {
    setDatasets(prev => prev.filter(d => d.id !== datasetId))
    toast({
      title: "Success",
      description: "Dataset deleted successfully!"
    })
  }



  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Datasets
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Upload and manage your datasets
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Dataset
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          


          <Button
            variant={showMyDatasets ? "default" : "outline"}
            onClick={() => setShowMyDatasets(!showMyDatasets)}
            className="flex items-center gap-2"
          >
            My Data
          </Button>
        </div>
      </div>





      {/* Datasets */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {showMyDatasets ? 'My Datasets' : 'All Datasets'}
            <span className="text-gray-500 ml-2">({filteredDatasets.length})</span>
          </h2>
          
          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">File Size</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Dataset Grid/List */}
        {filteredDatasets.length === 0 ? (
          <Card className="p-8 text-center">
            <CardContent>
              <p className="text-gray-500 mb-4">No datasets found matching your criteria.</p>
              <Button onClick={() => setShowUploadModal(true)}>
                Upload Your First Dataset
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }>
            {filteredDatasets.map(dataset => (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                compact={viewMode === 'grid'}
                listView={viewMode === 'list'}
                onDelete={handleDatasetDeleted}
                currentUser={user}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <DatasetUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onDatasetUploaded={handleDatasetUploaded}
      />


      </div>
    </Layout>
  )
}

export default DatasetsPage
