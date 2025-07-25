-- Add custom feedback templates table
CREATE TABLE custom_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for custom_templates
ALTER TABLE custom_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can only access their own templates
CREATE POLICY "Teachers can manage their own custom templates" ON custom_templates
  FOR ALL USING (auth.uid() = teacher_id);

-- Add indexes for better performance
CREATE INDEX idx_custom_templates_teacher_id ON custom_templates(teacher_id);
CREATE INDEX idx_custom_templates_created_at ON custom_templates(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_custom_templates_updated_at 
  BEFORE UPDATE ON custom_templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();