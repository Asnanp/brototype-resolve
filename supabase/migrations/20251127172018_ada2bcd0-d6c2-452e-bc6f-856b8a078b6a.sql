-- Fix search_path for security functions
ALTER FUNCTION notify_admins_on_student_update() SET search_path = public;
ALTER FUNCTION notify_student_on_status_change() SET search_path = public;
ALTER FUNCTION notify_on_new_comment() SET search_path = public;