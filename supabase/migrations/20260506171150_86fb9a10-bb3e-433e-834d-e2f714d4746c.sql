-- Restrict SECURITY DEFINER function execution
revoke execute on function public.handle_new_user_role() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from anon;

-- set_updated_at search_path
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;
revoke execute on function public.set_updated_at() from anon, authenticated;