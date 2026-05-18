do $$ begin
  create policy "Public can view published listings"
    on public.listing
    for select
    using (status = 'published');
exception
  when duplicate_object then null;
end $$;

