-- Create function to handle expense notifications
CREATE OR REPLACE FUNCTION public.handle_expense_notification()
RETURNS TRIGGER AS $$
DECLARE
  creator_name TEXT;
  group_name TEXT;
  group_members RECORD;
BEGIN
  -- Get the name of the expense creator
  SELECT name INTO creator_name FROM public.profiles WHERE id = NEW.paid_by;
  
  -- Get the group name
  SELECT name INTO group_name FROM public.groups WHERE id = NEW.group_id;
  
  -- Insert notifications for all group members except the creator
  FOR group_members IN (
    SELECT gm.user_id
    FROM public.group_members gm
    WHERE gm.group_id = NEW.group_id AND gm.user_id != NEW.paid_by
  ) LOOP
    INSERT INTO public.notifications (
      user_id,
      type,
      content,
      related_id,
      group_id
    ) VALUES (
      group_members.user_id,
      'expense_added',
      creator_name || ' added a new expense of $' || NEW.amount::text || ' for "' || NEW.description || '" in ' || group_name || '.',
      NEW.id,
      NEW.group_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new expenses
DROP TRIGGER IF EXISTS expense_notification_trigger ON public.expenses;
CREATE TRIGGER expense_notification_trigger
  AFTER INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_expense_notification();

-- Create function to handle settlement notifications
CREATE OR REPLACE FUNCTION public.handle_settlement_notification()
RETURNS TRIGGER AS $$
DECLARE
  settler_name TEXT;
  group_name TEXT;
BEGIN
  -- Get the name of the person who settled
  SELECT name INTO settler_name FROM public.profiles WHERE id = NEW.settled_by;
  
  -- Get the group name
  SELECT name INTO group_name FROM public.groups WHERE id = NEW.group_id;
  
  -- Notify the person who paid (if they're not the one who marked it settled)
  IF NEW.from_user_id != NEW.settled_by THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      content,
      related_id,
      group_id
    ) VALUES (
      NEW.from_user_id,
      'settlement_completed',
      settler_name || ' marked your payment of $' || NEW.amount::text || ' as settled in ' || group_name || '.',
      NEW.id,
      NEW.group_id
    );
  END IF;
  
  -- Notify the person who received the payment (if they're not the one who marked it settled)
  IF NEW.to_user_id != NEW.settled_by THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      content,
      related_id,
      group_id
    ) VALUES (
      NEW.to_user_id,
      'settlement_completed',
      settler_name || ' marked a payment of $' || NEW.amount::text || ' to you as settled in ' || group_name || '.',
      NEW.id,
      NEW.group_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new settlements
DROP TRIGGER IF EXISTS settlement_notification_trigger ON public.settlements;
CREATE TRIGGER settlement_notification_trigger
  AFTER INSERT ON public.settlements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_settlement_notification();

-- Create function to handle group invitation notifications
CREATE OR REPLACE FUNCTION public.handle_group_invitation_notification()
RETURNS TRIGGER AS $$
DECLARE
  inviter_id UUID;
  inviter_name TEXT;
  group_name TEXT;
BEGIN
  -- Get the group creator (inviter)
  SELECT created_by INTO inviter_id FROM public.groups WHERE id = NEW.group_id;
  
  -- Get the inviter name
  SELECT name INTO inviter_name FROM public.profiles WHERE id = inviter_id;
  
  -- Get the group name
  SELECT name INTO group_name FROM public.groups WHERE id = NEW.group_id;
  
  -- Only create notification if the user is not the group creator
  IF NEW.user_id != inviter_id THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      content,
      group_id
    ) VALUES (
      NEW.user_id,
      'group_invitation',
      inviter_name || ' has invited you to join the group "' || group_name || '".',
      NEW.group_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new group members
DROP TRIGGER IF EXISTS group_invitation_notification_trigger ON public.group_members;
CREATE TRIGGER group_invitation_notification_trigger
  AFTER INSERT ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_group_invitation_notification();
