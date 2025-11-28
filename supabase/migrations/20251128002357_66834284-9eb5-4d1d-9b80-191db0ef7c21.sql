-- Create assignment rules table
CREATE TABLE IF NOT EXISTS public.assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  conditions JSONB NOT NULL,
  assigned_to UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assignment_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for assignment rules
CREATE POLICY "Admins can manage assignment rules"
  ON public.assignment_rules
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to auto-assign complaints based on rules
CREATE OR REPLACE FUNCTION public.auto_assign_complaint()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  rule RECORD;
  matches BOOLEAN;
  condition JSONB;
BEGIN
  -- Only run for new complaints without assignment
  IF NEW.assigned_to IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Get active rules ordered by priority (higher priority first)
  FOR rule IN 
    SELECT * FROM assignment_rules 
    WHERE is_active = true 
    ORDER BY priority DESC
  LOOP
    matches := true;
    
    -- Check category condition
    IF rule.conditions ? 'category_id' THEN
      IF NEW.category_id::text != rule.conditions->>'category_id' THEN
        matches := false;
      END IF;
    END IF;
    
    -- Check priority condition
    IF matches AND rule.conditions ? 'priority' THEN
      IF NEW.priority::text != rule.conditions->>'priority' THEN
        matches := false;
      END IF;
    END IF;
    
    -- Check keywords condition
    IF matches AND rule.conditions ? 'keywords' THEN
      DECLARE
        keywords TEXT[];
        keyword TEXT;
        found BOOLEAN := false;
      BEGIN
        keywords := ARRAY(SELECT jsonb_array_elements_text(rule.conditions->'keywords'));
        FOREACH keyword IN ARRAY keywords
        LOOP
          IF NEW.title ILIKE '%' || keyword || '%' OR NEW.description ILIKE '%' || keyword || '%' THEN
            found := true;
            EXIT;
          END IF;
        END LOOP;
        IF NOT found THEN
          matches := false;
        END IF;
      END;
    END IF;
    
    -- If all conditions match, assign to this admin
    IF matches THEN
      NEW.assigned_to := rule.assigned_to;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-assignment
DROP TRIGGER IF EXISTS trigger_auto_assign_complaint ON public.complaints;
CREATE TRIGGER trigger_auto_assign_complaint
  BEFORE INSERT ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_complaint();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_assignment_rules_active ON public.assignment_rules(is_active, priority DESC);