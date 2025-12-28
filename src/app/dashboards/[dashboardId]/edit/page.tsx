'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import AppLayout from '@/components/layout/app-layout'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { gql } from '@apollo/client'

const GET_DASHBOARD = gql`
  query GetDashboard($id: ID!) {
    dashboard(id: $id) {
      id
      name
      description
      category
      lastModified
      createdAt
    }
  }
`

const UPDATE_DASHBOARD = gql`
  mutation UpdateDashboard($id: ID!, $input: UpdateDashboardInput!) {
    updateDashboard(id: $id, input: $input) {
      id
      name
      description
      category
      lastModified
      createdAt
    }
  }
`

const categories = [
  'Sales & Performance',
  'Financial',
  'Operations', 
  'Administrative',
  'Custom',
]

export default function EditDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const dashboardId = params.dashboardId as string

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Custom'
  })

  const { data, loading } = useQuery(GET_DASHBOARD, {
    variables: { id: dashboardId }
  })

  // Update form data when dashboard data is loaded
  useEffect(() => {
    if (data?.dashboard) {
      setFormData({
        name: data.dashboard.name || '',
        description: data.dashboard.description || '',
        category: data.dashboard.category || 'Custom'
      })
    }
  }, [data])

  const [updateDashboard, { loading: saving }] = useMutation(UPDATE_DASHBOARD, {
    onCompleted: () => {
      toast.success('Dashboard updated successfully!')
      router.push(`/dashboards/${dashboardId}`)
    },
    onError: (error) => {
      console.error('Update error:', error)
      toast.error('Failed to update dashboard')
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Dashboard name is required')
      return
    }

    try {
      await updateDashboard({
        variables: {
          id: dashboardId,
          input: {
            name: formData.name.trim(),
            description: formData.description.trim(),
            category: formData.category
          }
        }
      })
    } catch (error) {
      console.error('Save error:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href={`/dashboards/${dashboardId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Edit Dashboard</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  const dashboard = data?.dashboard

  if (!dashboard) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboards">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Not Found</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">The dashboard you're looking for doesn't exist.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboards/${dashboardId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Edit Dashboard</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dashboard Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Dashboard Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter dashboard name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter dashboard description (optional)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Link href={`/dashboards/${dashboardId}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
