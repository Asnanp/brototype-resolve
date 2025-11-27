-- Create saved filters table for advanced search
CREATE TABLE saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  filter_data JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own filters"
ON saved_filters FOR ALL
USING (user_id = auth.uid());

-- Add SLA tracking fields to complaints if not exists
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS sla_breach_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS sla_status TEXT DEFAULT 'on_track';

-- Create email preferences table
CREATE TABLE email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  notify_status_change BOOLEAN DEFAULT true,
  notify_new_comment BOOLEAN DEFAULT true,
  notify_assignment BOOLEAN DEFAULT true,
  notify_sla_warning BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own email preferences"
ON email_preferences FOR ALL
USING (user_id = auth.uid());

-- Function to calculate SLA breach time
CREATE OR REPLACE FUNCTION calculate_sla_breach_time(
  p_priority priority_level,
  p_created_at TIMESTAMP WITH TIME ZONE
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  RETURN CASE p_priority
    WHEN 'urgent' THEN p_created_at + INTERVAL '4 hours'
    WHEN 'high' THEN p_created_at + INTERVAL '24 hours'
    WHEN 'medium' THEN p_created_at + INTERVAL '72 hours'
    WHEN 'low' THEN p_created_at + INTERVAL '168 hours'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to set SLA breach time on complaint creation
CREATE OR REPLACE FUNCTION set_sla_breach_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.sla_breach_at = calculate_sla_breach_time(NEW.priority, NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_sla_on_complaint_insert
BEFORE INSERT ON complaints
FOR EACH ROW
EXECUTE FUNCTION set_sla_breach_time();

-- Function to update SLA status
CREATE OR REPLACE FUNCTION update_sla_status()
RETURNS void AS $$
BEGIN
  UPDATE complaints
  SET sla_status = CASE
    WHEN status IN ('resolved', 'closed') THEN 'met'
    WHEN now() > sla_breach_at THEN 'breached'
    WHEN now() > (sla_breach_at - INTERVAL '2 hours') THEN 'at_risk'
    ELSE 'on_track'
  END
  WHERE status NOT IN ('resolved', 'closed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Add index for better query performance
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);
CREATE INDEX idx_complaints_sla_status ON complaints(sla_status);
CREATE INDEX idx_saved_filters_user_id ON saved_filters(user_id);