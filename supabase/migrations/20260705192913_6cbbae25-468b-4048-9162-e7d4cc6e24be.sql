
-- Helper: check if the current user has a valid pending invitation matching workspace and role
CREATE OR REPLACE FUNCTION public.has_valid_workspace_invitation(_user_id uuid, _workspace_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_invitations wi
    JOIN auth.users u ON lower(u.email) = lower(wi.email)
    WHERE u.id = _user_id
      AND wi.workspace_id = _workspace_id
      AND wi.role = _role
      AND wi.accepted_at IS NULL
      AND wi.expires_at > now()
  )
$$;

-- Replace the overly permissive INSERT policy
DROP POLICY IF EXISTS "Users can insert own membership" ON public.workspace_members;

CREATE POLICY "Workspace admins can add members"
ON public.workspace_members FOR INSERT
WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Users can accept invitation to join workspace"
ON public.workspace_members FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND role NOT IN ('owner', 'admin')
  AND public.has_valid_workspace_invitation(auth.uid(), workspace_id, role)
);
