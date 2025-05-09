-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('expense_added', 'settlement_request', 'settlement_completed', 'group_invitation')),
  content TEXT NOT NULL,
  related_id UUID,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);

-- Create RLS policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow users to update only their own notifications (for marking as read)
CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add notifications to public schema
ALTER TABLE public.notifications OWNER TO postgres;
GRANT ALL ON TABLE public.notifications TO postgres;
GRANT ALL ON TABLE public.notifications TO service_role;
GRANT SELECT, UPDATE ON TABLE public.notifications TO authenticated;
