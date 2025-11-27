-- Create storage bucket for complaint attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-attachments', 'complaint-attachments', false);

-- Storage policies for complaint attachments
CREATE POLICY "Users can view their own complaint attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'complaint-attachments' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM complaints c
      WHERE c.id::text = (storage.foldername(name))[2]
      AND (c.student_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  )
);

CREATE POLICY "Users can upload attachments to their complaints"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'complaint-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM complaints c
    WHERE c.id::text = (storage.foldername(name))[2]
    AND c.student_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'complaint-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'complaint-attachments'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Function to notify admins when student updates complaint
CREATE OR REPLACE FUNCTION notify_admins_on_student_update()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  student_name TEXT;
BEGIN
  -- Get student name
  SELECT full_name INTO student_name
  FROM profiles
  WHERE user_id = NEW.student_id;

  -- Only notify if the update was made by the student (not admin)
  IF auth.uid() = NEW.student_id THEN
    -- Notify all admins
    FOR admin_record IN 
      SELECT DISTINCT user_id 
      FROM user_roles 
      WHERE role = 'admin'
    LOOP
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        complaint_id
      ) VALUES (
        admin_record.user_id,
        'Student Updated Complaint',
        student_name || ' updated complaint: ' || NEW.title,
        'info',
        NEW.id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for complaint updates
CREATE TRIGGER on_complaint_student_update
AFTER UPDATE ON complaints
FOR EACH ROW
WHEN (OLD.updated_at IS DISTINCT FROM NEW.updated_at)
EXECUTE FUNCTION notify_admins_on_student_update();

-- Function to notify student on complaint status change
CREATE OR REPLACE FUNCTION notify_student_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status changed and it's an admin making the change
  IF OLD.status IS DISTINCT FROM NEW.status 
     AND has_role(auth.uid(), 'admin'::app_role) THEN
    
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      complaint_id
    ) VALUES (
      NEW.student_id,
      'Complaint Status Updated',
      'Your complaint "' || NEW.title || '" status changed to: ' || NEW.status,
      CASE 
        WHEN NEW.status = 'resolved' THEN 'success'
        WHEN NEW.status = 'rejected' THEN 'error'
        ELSE 'info'
      END,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for status changes
CREATE TRIGGER on_complaint_status_change
AFTER UPDATE ON complaints
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION notify_student_on_status_change();

-- Function to notify student on new comment
CREATE OR REPLACE FUNCTION notify_on_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  complaint_owner UUID;
  commenter_name TEXT;
BEGIN
  -- Get complaint owner
  SELECT student_id INTO complaint_owner
  FROM complaints
  WHERE id = NEW.complaint_id;
  
  -- Get commenter name
  SELECT full_name INTO commenter_name
  FROM profiles
  WHERE user_id = NEW.user_id;
  
  -- Notify student if admin commented (and it's not the student commenting)
  IF NEW.user_id != complaint_owner AND has_role(NEW.user_id, 'admin'::app_role) THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      complaint_id
    ) VALUES (
      complaint_owner,
      'New Comment on Your Complaint',
      commenter_name || ' commented on your complaint',
      'info',
      NEW.complaint_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new comments
CREATE TRIGGER on_comment_created
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION notify_on_new_comment();