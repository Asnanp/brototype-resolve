-- Create complaint templates table
CREATE TABLE IF NOT EXISTS public.complaint_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title_template TEXT NOT NULL,
  description_template TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  default_priority public.priority_level DEFAULT 'medium',
  fields JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create polls table
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  allow_multiple BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  target_audience TEXT DEFAULT 'all', -- 'all', 'students', 'admins'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create poll options table
CREATE TABLE IF NOT EXISTS public.poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  option_text TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create poll votes table
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, user_id, option_id)
);

-- Enable RLS
ALTER TABLE public.complaint_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for complaint templates
CREATE POLICY "Admins can manage templates"
  ON public.complaint_templates
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view active templates"
  ON public.complaint_templates
  FOR SELECT
  USING (is_active = true);

-- RLS Policies for polls
CREATE POLICY "Admins can manage polls"
  ON public.polls
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active polls"
  ON public.polls
  FOR SELECT
  USING ((is_active = true) AND ((ends_at IS NULL) OR (ends_at > now())));

-- RLS Policies for poll options
CREATE POLICY "Anyone can view poll options"
  ON public.poll_options
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage poll options"
  ON public.poll_options
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for poll votes
CREATE POLICY "Users can view poll results"
  ON public.poll_votes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own votes"
  ON public.poll_votes
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own votes"
  ON public.poll_votes
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own votes"
  ON public.poll_votes
  FOR DELETE
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_templates_active ON public.complaint_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_polls_active ON public.polls(is_active, ends_at);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON public.poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user ON public.poll_votes(user_id);

-- Create function to update activity log on complaint changes
CREATE OR REPLACE FUNCTION public.log_complaint_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log status changes
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO activity_logs (entity_type, entity_id, action, user_id, details)
    VALUES (
      'complaint',
      NEW.id,
      'status_changed',
      auth.uid(),
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'ticket_number', NEW.ticket_number
      )
    );
  END IF;

  -- Log assignment changes
  IF TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO activity_logs (entity_type, entity_id, action, user_id, details)
    VALUES (
      'complaint',
      NEW.id,
      'assigned',
      auth.uid(),
      jsonb_build_object(
        'assigned_to', NEW.assigned_to,
        'ticket_number', NEW.ticket_number
      )
    );
  END IF;

  -- Log priority changes
  IF TG_OP = 'UPDATE' AND OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO activity_logs (entity_type, entity_id, action, user_id, details)
    VALUES (
      'complaint',
      NEW.id,
      'priority_changed',
      auth.uid(),
      jsonb_build_object(
        'old_priority', OLD.priority,
        'new_priority', NEW.priority,
        'ticket_number', NEW.ticket_number
      )
    );
  END IF;

  -- Log new complaints
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (entity_type, entity_id, action, user_id, details)
    VALUES (
      'complaint',
      NEW.id,
      'created',
      NEW.student_id,
      jsonb_build_object(
        'ticket_number', NEW.ticket_number,
        'title', NEW.title
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for activity logging
DROP TRIGGER IF EXISTS trigger_log_complaint_activity ON public.complaints;
CREATE TRIGGER trigger_log_complaint_activity
  AFTER INSERT OR UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.log_complaint_activity();

-- Function to log comment activity
CREATE OR REPLACE FUNCTION public.log_comment_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  ticket_num TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT ticket_number INTO ticket_num FROM complaints WHERE id = NEW.complaint_id;
    
    INSERT INTO activity_logs (entity_type, entity_id, action, user_id, details)
    VALUES (
      'comment',
      NEW.id,
      CASE WHEN NEW.is_internal THEN 'internal_comment_added' ELSE 'comment_added' END,
      NEW.user_id,
      jsonb_build_object(
        'complaint_id', NEW.complaint_id,
        'ticket_number', ticket_num,
        'is_internal', NEW.is_internal
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for comment activity logging
DROP TRIGGER IF EXISTS trigger_log_comment_activity ON public.comments;
CREATE TRIGGER trigger_log_comment_activity
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_comment_activity();