CREATE TABLE IF NOT EXISTS compliance_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_desc TEXT NOT NULL,
  intent JSONB NOT NULL,
  compliance_matrix JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE compliance_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own assessments"
  ON compliance_assessments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
