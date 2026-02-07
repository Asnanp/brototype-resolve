-- Fix handle_new_user trigger to always assign student role (prevent role escalation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  
  -- SECURITY FIX: Always assign 'student' role regardless of metadata
  -- Admin roles should only be assigned through admin-controlled processes
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$function$;

-- Fix profiles RLS: Users should only see their own profile, admins can see all
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix poll_votes RLS: Hide individual votes, only allow viewing own votes
DROP POLICY IF EXISTS "Users can view poll results" ON poll_votes;

CREATE POLICY "Users can view own votes"
ON poll_votes FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all votes"
ON poll_votes FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create secure function to get aggregated poll results only
CREATE OR REPLACE FUNCTION get_poll_results(poll_uuid uuid)
RETURNS TABLE(option_id uuid, option_text text, vote_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    po.id as option_id,
    po.option_text,
    COUNT(pv.id)::bigint as vote_count
  FROM poll_options po
  LEFT JOIN poll_votes pv ON po.id = pv.option_id
  WHERE po.poll_id = poll_uuid
  GROUP BY po.id, po.option_text
  ORDER BY po.order_index;
$$;

-- Create satisfaction_surveys table for detailed feedback
CREATE TABLE IF NOT EXISTS public.satisfaction_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  overall_rating integer NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  response_time_rating integer CHECK (response_time_rating >= 1 AND response_time_rating <= 5),
  resolution_quality_rating integer CHECK (resolution_quality_rating >= 1 AND resolution_quality_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  feedback_text text,
  would_recommend boolean,
  suggestions text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(complaint_id)
);

ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own surveys"
ON satisfaction_surveys FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own surveys"
ON satisfaction_surveys FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage surveys"
ON satisfaction_surveys FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create merged_complaints table for tracking merges
CREATE TABLE IF NOT EXISTS public.merged_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  merged_complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  merged_by uuid NOT NULL,
  merge_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(merged_complaint_id)
);

ALTER TABLE public.merged_complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage merged complaints"
ON merged_complaints FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view merged complaints"
ON merged_complaints FOR SELECT
USING (true);

-- Add is_merged flag to complaints table
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS is_merged boolean DEFAULT false;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS merged_into uuid REFERENCES complaints(id);