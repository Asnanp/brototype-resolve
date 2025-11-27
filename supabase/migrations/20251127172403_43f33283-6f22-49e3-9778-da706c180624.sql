-- Fix search_path for SLA functions
ALTER FUNCTION calculate_sla_breach_time(priority_level, TIMESTAMP WITH TIME ZONE) SET search_path = public;
ALTER FUNCTION set_sla_breach_time() SET search_path = public;