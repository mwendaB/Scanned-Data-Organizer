-- Add document comments table for review system
CREATE TABLE IF NOT EXISTS document_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  content TEXT NOT NULL,
  comment_type TEXT NOT NULL CHECK (comment_type IN ('review', 'feedback', 'question', 'approval')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'pending')),
  parent_id UUID REFERENCES document_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_comments_document_id ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_user_id ON document_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_parent_id ON document_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_status ON document_comments(status);

-- Enable RLS
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view comments on documents they have access to" ON document_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = document_comments.document_id 
            AND (documents.uploaded_by = auth.uid() OR documents.workspace_id IN (
                SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can create comments on documents they have access to" ON document_comments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = document_comments.document_id 
            AND (documents.uploaded_by = auth.uid() OR documents.workspace_id IN (
                SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can update their own comments" ON document_comments
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON document_comments
    FOR DELETE USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for document_comments
CREATE TRIGGER update_document_comments_updated_at BEFORE UPDATE ON document_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
