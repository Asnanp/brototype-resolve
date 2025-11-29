-- Create AI assistant training knowledge base
CREATE TABLE IF NOT EXISTS public.ai_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  keywords TEXT[],
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_training_data ENABLE ROW LEVEL SECURITY;

-- Admins can manage training data
CREATE POLICY "Admins can manage AI training data"
  ON public.ai_training_data
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster searches
CREATE INDEX idx_ai_training_keywords ON public.ai_training_data USING GIN(keywords);
CREATE INDEX idx_ai_training_question ON public.ai_training_data USING GIN(to_tsvector('english', question));

-- Trigger for updated_at
CREATE TRIGGER update_ai_training_data_updated_at
  BEFORE UPDATE ON public.ai_training_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create canned responses if not exists (ensure it works)
CREATE TABLE IF NOT EXISTS public.complaint_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  performed_by UUID NOT NULL,
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.complaint_actions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view action logs"
  ON public.complaint_actions_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create action logs"
  ON public.complaint_actions_log
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));