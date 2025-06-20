-- Add version history and collaboration features
-- Version history table
CREATE TABLE data_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  parsed_data_id UUID NOT NULL REFERENCES parsed_data(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  previous_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  new_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete', 'restore')),
  change_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Collaborative workspace table
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Workspace members table
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(workspace_id, user_id)
);

-- Real-time collaboration sessions
CREATE TABLE collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cursor_position JSONB DEFAULT '{}'::jsonb,
  selection JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activity log for analytics
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update documents table to include workspace
ALTER TABLE documents ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
ALTER TABLE parsed_data ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_data_versions_document_id ON data_versions(document_id);
CREATE INDEX idx_data_versions_parsed_data_id ON data_versions(parsed_data_id);
CREATE INDEX idx_data_versions_user_id ON data_versions(user_id);
CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX idx_collaboration_sessions_workspace_id ON collaboration_sessions(workspace_id);
CREATE INDEX idx_collaboration_sessions_document_id ON collaboration_sessions(document_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_workspace_id ON activity_log(workspace_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);

-- Enable RLS
ALTER TABLE data_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data_versions
CREATE POLICY "Users can view version history of their data" ON data_versions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create version history for their data" ON data_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for workspaces
CREATE POLICY "Users can view workspaces they own or are members of" ON workspaces
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_id = workspaces.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own workspaces" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Workspace owners can update their workspaces" ON workspaces
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Workspace owners can delete their workspaces" ON workspaces
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for workspace_members
CREATE POLICY "Users can view workspace members if they're members" ON workspace_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id 
      AND wm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners and admins can manage members" ON workspace_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id 
      AND wm.user_id = auth.uid() 
      AND wm.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for collaboration_sessions
CREATE POLICY "Users can view collaboration sessions in their workspaces" ON collaboration_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_id = collaboration_sessions.workspace_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own collaboration sessions" ON collaboration_sessions
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for activity_log
CREATE POLICY "Users can view activity in their workspaces" ON activity_log
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_id = activity_log.workspace_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activity logs" ON activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for version management
CREATE OR REPLACE FUNCTION create_data_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a version entry when data is updated
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO data_versions (
      user_id, document_id, parsed_data_id, version_number,
      previous_data, new_data, change_type, changes
    )
    SELECT 
      NEW.user_id,
      NEW.document_id,
      NEW.id,
      COALESCE((
        SELECT MAX(version_number) + 1 
        FROM data_versions 
        WHERE parsed_data_id = NEW.id
      ), 1),
      to_jsonb(OLD),
      to_jsonb(NEW),
      'update',
      jsonb_build_object(
        'changed_fields', 
        (SELECT jsonb_object_agg(key, value) 
         FROM jsonb_each(to_jsonb(NEW)) 
         WHERE to_jsonb(OLD) ->> key IS DISTINCT FROM value)
      );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for version history
CREATE TRIGGER trigger_create_data_version
  AFTER UPDATE ON parsed_data
  FOR EACH ROW
  EXECUTE FUNCTION create_data_version();

-- Function to log activities
CREATE OR REPLACE FUNCTION log_activity(
  p_action TEXT,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_workspace_id UUID DEFAULT NULL,
  p_document_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO activity_log (user_id, workspace_id, document_id, action, details)
  VALUES (auth.uid(), p_workspace_id, p_document_id, p_action, p_details)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
