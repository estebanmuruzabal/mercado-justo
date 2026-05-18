do $$ begin
  create policy "Public can view store"
    on public.store
    for select
    using (true);
exception
  when duplicate_object then null;
end $$;

