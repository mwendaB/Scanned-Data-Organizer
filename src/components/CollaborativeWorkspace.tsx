'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { Users, Plus, Settings, UserPlus, Activity, Eye, Edit, Trash2, Crown, Shield, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface WorkspaceMember {
  id: string
  user_id: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  joined_at: string
  user: {
    email: string
    avatar_url?: string
    full_name?: string
  }
}

interface Workspace {
  id: string
  name: string
  description: string
  owner_id: string
  settings: any
  created_at: string
  updated_at: string
  members?: WorkspaceMember[]
}

interface CollaborationSession {
  id: string
  user_id: string
  document_id: string
  cursor_position: any
  selection: any
  is_active: boolean
  last_activity: string
  user: {
    email: string
    avatar_url?: string
    full_name?: string
  }
}

interface CollaborativeWorkspaceProps {
  currentUserId: string
  workspace?: Workspace
  onWorkspaceChange?: (workspace: Workspace) => void
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  editor: Edit,
  viewer: Eye
}

const roleColors = {
  owner: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  admin: 'bg-red-100 text-red-800 border-red-300',
  editor: 'bg-blue-100 text-blue-800 border-blue-300',
  viewer: 'bg-gray-100 text-gray-800 border-gray-300'
}

export function CollaborativeWorkspace({ currentUserId, workspace, onWorkspaceChange }: CollaborativeWorkspaceProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(workspace || null)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [activeSessions, setActiveSessions] = useState<CollaborationSession[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'editor' | 'viewer'>('viewer')
  const [loading, setLoading] = useState(false)
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('')

  // Load workspaces
  const loadWorkspaces = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          workspace_members!inner(*)
        `)
        .or(`owner_id.eq.${currentUserId},workspace_members.user_id.eq.${currentUserId}`)

      if (error) throw error
      setWorkspaces(data || [])
    } catch (error) {
      console.error('Error loading workspaces:', error)
    }
  }, [currentUserId])

  // Load workspace members
  const loadMembers = useCallback(async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          *,
          user:auth.users(email, raw_user_meta_data)
        `)
        .eq('workspace_id', workspaceId)

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Error loading members:', error)
    }
  }, [])

  // Load active collaboration sessions
  const loadActiveSessions = useCallback(async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('collaboration_sessions')
        .select(`
          *,
          user:auth.users(email, raw_user_meta_data)
        `)
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .gte('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Active within 5 minutes

      if (error) throw error
      setActiveSessions(data || [])
    } catch (error) {
      console.error('Error loading active sessions:', error)
    }
  }, [])

  // Real-time subscriptions
  useEffect(() => {
    if (!selectedWorkspace) return

    // Subscribe to workspace member changes
    const membersChannel = supabase
      .channel(`workspace-members-${selectedWorkspace.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'workspace_members', filter: `workspace_id=eq.${selectedWorkspace.id}` },
        () => loadMembers(selectedWorkspace.id)
      )
      .subscribe()

    // Subscribe to collaboration sessions
    const sessionsChannel = supabase
      .channel(`collaboration-sessions-${selectedWorkspace.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'collaboration_sessions', filter: `workspace_id=eq.${selectedWorkspace.id}` },
        () => loadActiveSessions(selectedWorkspace.id)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(membersChannel)
      supabase.removeChannel(sessionsChannel)
    }
  }, [selectedWorkspace, loadMembers, loadActiveSessions])

  useEffect(() => {
    loadWorkspaces()
  }, [loadWorkspaces])

  useEffect(() => {
    if (selectedWorkspace) {
      loadMembers(selectedWorkspace.id)
      loadActiveSessions(selectedWorkspace.id)
      onWorkspaceChange?.(selectedWorkspace)
    }
  }, [selectedWorkspace, loadMembers, loadActiveSessions, onWorkspaceChange])

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name: newWorkspaceName,
          description: newWorkspaceDescription,
          owner_id: currentUserId,
          settings: {}
        })
        .select()
        .single()

      if (error) throw error

      // Add creator as owner member
      await supabase
        .from('workspace_members')
        .insert({
          workspace_id: data.id,
          user_id: currentUserId,
          role: 'owner'
        })

      setNewWorkspaceName('')
      setNewWorkspaceDescription('')
      setIsCreatingWorkspace(false)
      loadWorkspaces()
    } catch (error) {
      console.error('Error creating workspace:', error)
    } finally {
      setLoading(false)
    }
  }

  const inviteMember = async () => {
    if (!selectedWorkspace || !newMemberEmail.trim()) return

    setLoading(true)
    try {
      // First, check if user exists
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', newMemberEmail)
        .single()

      if (userError || !userData) {
        throw new Error('User not found. Please ensure they have an account.')
      }

      const { error } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: selectedWorkspace.id,
          user_id: userData.id,
          role: newMemberRole,
          invited_by: currentUserId
        })

      if (error) throw error

      setNewMemberEmail('')
      setNewMemberRole('viewer')
      loadMembers(selectedWorkspace.id)
    } catch (error) {
      console.error('Error inviting member:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateMemberRole = async (memberId: string, newRole: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error
      loadMembers(selectedWorkspace!.id)
    } catch (error) {
      console.error('Error updating member role:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeMember = async (memberId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
      loadMembers(selectedWorkspace!.id)
    } catch (error) {
      console.error('Error removing member:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUserInitials = (email: string, fullName?: string) => {
    if (fullName) {
      return fullName.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email.split('@')[0].slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Workspace Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Collaborative Workspaces
          </CardTitle>
          <CardDescription>
            Manage shared workspaces and collaborate with team members in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select
              value={selectedWorkspace?.id || ''}
              onValueChange={(value) => {
                const workspace = workspaces.find(w => w.id === value)
                setSelectedWorkspace(workspace || null)
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setIsCreatingWorkspace(true)}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Workspace
            </Button>
          </div>

          {/* Create Workspace Form */}
          <AnimatePresence>
            {isCreatingWorkspace && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 p-4 border rounded-lg bg-muted/50"
              >
                <Input
                  placeholder="Workspace name"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newWorkspaceDescription}
                  onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={createWorkspace} disabled={loading || !newWorkspaceName.trim()}>
                    Create
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreatingWorkspace(false)}>
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {selectedWorkspace && (
        <>
          {/* Active Collaborators */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Active Collaborators
                <Badge variant="secondary">{activeSessions.length}</Badge>
              </CardTitle>
              <CardDescription>
                Team members currently working in this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeSessions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {activeSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={session.user.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(session.user.email, session.user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">
                        {session.user.full_name || session.user.email.split('@')[0]}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No active collaborators</p>
              )}
            </CardContent>
          </Card>

          {/* Workspace Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Workspace Members
                <Badge variant="secondary">{members.length}</Badge>
              </CardTitle>
              <CardDescription>
                Manage team members and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Invite Member */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-6">
                <Input
                  placeholder="Email address"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="md:col-span-2"
                />
                <Select value={newMemberRole} onValueChange={(value: any) => setNewMemberRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={inviteMember} disabled={loading || !newMemberEmail.trim()}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              </div>

              {/* Members List */}
              <div className="space-y-3">
                {members.map((member) => {
                  const RoleIcon = roleIcons[member.role]
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.user.avatar_url} />
                          <AvatarFallback>
                            {getUserInitials(member.user.email, member.user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.user.full_name || member.user.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={roleColors[member.role]}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {member.role}
                        </Badge>
                        {member.user_id !== currentUserId && member.role !== 'owner' && (
                          <div className="flex gap-1">
                            <Select
                              value={member.role}
                              onValueChange={(value) => updateMemberRole(member.id, value)}
                            >
                              <SelectTrigger className="w-24 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeMember(member.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
