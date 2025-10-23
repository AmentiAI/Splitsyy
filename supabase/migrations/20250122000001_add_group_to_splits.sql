-- Add group_id to splits table
-- This tracks the group that was automatically created after all participants paid

ALTER TABLE public.splits 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;

-- Add index for group lookups
CREATE INDEX IF NOT EXISTS splits_group_id_idx ON public.splits(group_id);

-- Add user_id to split_participants to track registered users
ALTER TABLE public.split_participants 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add index for user lookups
CREATE INDEX IF NOT EXISTS split_participants_user_id_idx ON public.split_participants(user_id);

-- Function to automatically create a group when a split is completed
CREATE OR REPLACE FUNCTION auto_create_group_for_split()
RETURNS TRIGGER AS $$
DECLARE
  v_group_id UUID;
  v_split_creator UUID;
  v_split_description TEXT;
  v_participant RECORD;
BEGIN
  -- Only proceed if the split just became completed and doesn't have a group yet
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.group_id IS NULL THEN
    -- Get split details
    SELECT created_by, description 
    INTO v_split_creator, v_split_description
    FROM public.splits
    WHERE id = NEW.id;
    
    -- Create a new group for this split
    INSERT INTO public.groups (
      owner_id,
      name,
      currency
    ) VALUES (
      v_split_creator,
      v_split_description || ' Group',
      'USD'
    ) RETURNING id INTO v_group_id;
    
    -- Update the split with the group_id
    UPDATE public.splits
    SET group_id = v_group_id
    WHERE id = NEW.id;
    
    -- Add the creator as owner (this happens automatically via trigger, but let's be explicit)
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (v_group_id, v_split_creator, 'owner')
    ON CONFLICT (group_id, user_id) DO NOTHING;
    
    -- Add any participants who already have user accounts
    FOR v_participant IN 
      SELECT sp.id, sp.phone, sp.name, sp.user_id
      FROM public.split_participants sp
      WHERE sp.split_id = NEW.id 
        AND sp.status = 'paid'
        AND sp.user_id IS NOT NULL
    LOOP
      INSERT INTO public.group_members (group_id, user_id, role)
      VALUES (v_group_id, v_participant.user_id, 'member')
      ON CONFLICT (group_id, user_id) DO NOTHING;
    END LOOP;
    
    -- Log the group creation
    INSERT INTO public.audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      metadata
    ) VALUES (
      v_split_creator,
      'group.auto_created_from_split',
      'group',
      v_group_id,
      jsonb_build_object(
        'split_id', NEW.id,
        'split_description', v_split_description
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create group when split becomes completed
DROP TRIGGER IF EXISTS auto_create_group_for_split_trigger ON public.splits;
CREATE TRIGGER auto_create_group_for_split_trigger
  AFTER UPDATE ON public.splits
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_group_for_split();

-- Function to add users to split groups when they register (matching by phone)
CREATE OR REPLACE FUNCTION add_user_to_split_groups()
RETURNS TRIGGER AS $$
DECLARE
  v_participant RECORD;
  v_split RECORD;
BEGIN
  -- Find any split_participants that match this user's phone (if phone exists in metadata)
  -- This assumes phone is stored in user metadata or we need to add a phone column to users table
  -- For now, we'll update split_participants when payment is processed
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN public.splits.group_id IS 'Auto-created group after all participants pay';
COMMENT ON COLUMN public.split_participants.user_id IS 'User account if participant has registered';
COMMENT ON FUNCTION auto_create_group_for_split() IS 'Automatically creates a group when all participants have paid their split';


