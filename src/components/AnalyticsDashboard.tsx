'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { Activity, FileText, Users, TrendingUp, Calendar, Tag, Eye, Download } from 'lucide-react'

interface AnalyticsData {
  documentsPerDay: Array<{ date: string; count: number }>
  documentsByCategory: Array<{ category: string; count: number; color: string }>
  processingTime: Array<{ date: string; avgTime: number }>
  userActivity: Array<{ user: string; actions: number; documents: number }>
  tagUsage: Array<{ tag: string; count: number }>
  weeklyStats: {
    totalDocuments: number
    totalProcessed: number
    avgProcessingTime: number
    activeUsers: number
  }
}

interface AnalyticsDashboardProps {
  data: AnalyticsData
  loading?: boolean
  isRealData?: boolean
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

export function AnalyticsDashboard({ data, loading = false, isRealData = false }: AnalyticsDashboardProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Data Source Indicator */}
      {!isRealData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Demo Mode</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Currently showing sample data for demonstration. Upload documents and use the app to see real analytics!
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.weeklyStats.totalDocuments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.weeklyStats.totalProcessed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((data.weeklyStats.totalProcessed / data.weeklyStats.totalDocuments) * 100).toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.weeklyStats.avgProcessingTime.toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">
              -2.5s from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.weeklyStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              +3 new this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents Per Day */}
        <Card>
          <CardHeader>
            <CardTitle>Documents Uploaded</CardTitle>
            <CardDescription>Daily upload activity over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.documentsPerDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any) => [value, 'Documents']}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Documents by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Document Categories</CardTitle>
            <CardDescription>Distribution of documents by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.documentsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.documentsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [value, 'Documents']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Processing Time Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Performance</CardTitle>
            <CardDescription>Average OCR processing time over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.processingTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any) => [`${value}s`, 'Avg Time']}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgTime" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>Actions and documents per user this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.userActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="user" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="actions" fill="#f59e0b" name="Actions" />
                <Bar dataKey="documents" fill="#3b82f6" name="Documents" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tag Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Most Used Tags
          </CardTitle>
          <CardDescription>Popular tags across all documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.tagUsage.slice(0, 10).map((tag, index) => (
              <div key={tag.tag} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium">{tag.tag}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 max-w-[200px]">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-300 rounded-full"
                        style={{ 
                          width: `${(tag.count / Math.max(...data.tagUsage.map(t => t.count))) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">{tag.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Sample data generator for demo purposes
export function generateSampleAnalytics(): AnalyticsData {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    return {
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 50) + 10
    }
  })

  const categories = [
    { category: 'Invoices', count: 145, color: '#3b82f6' },
    { category: 'Receipts', count: 89, color: '#10b981' },
    { category: 'Contracts', count: 67, color: '#f59e0b' },
    { category: 'Reports', count: 45, color: '#ef4444' },
    { category: 'Forms', count: 34, color: '#8b5cf6' }
  ]

  const processingTimes = last30Days.map(day => ({
    date: day.date,
    avgTime: Math.random() * 5 + 2
  }))

  const users = [
    { user: 'Alice', actions: 142, documents: 67 },
    { user: 'Bob', actions: 98, documents: 45 },
    { user: 'Carol', actions: 76, documents: 34 },
    { user: 'David', actions: 54, documents: 23 },
    { user: 'Eve', actions: 32, documents: 18 }
  ]

  const tags = [
    { tag: 'urgent', count: 89 },
    { tag: 'financial', count: 76 },
    { tag: 'legal', count: 65 },
    { tag: 'hr', count: 54 },
    { tag: 'customer', count: 43 },
    { tag: 'vendor', count: 38 },
    { tag: 'tax', count: 32 },
    { tag: 'insurance', count: 28 },
    { tag: 'medical', count: 24 },
    { tag: 'education', count: 19 }
  ]

  return {
    documentsPerDay: last30Days,
    documentsByCategory: categories,
    processingTime: processingTimes,
    userActivity: users,
    tagUsage: tags,
    weeklyStats: {
      totalDocuments: 1247,
      totalProcessed: 1156,
      avgProcessingTime: 3.2,
      activeUsers: 24
    }
  }
}
