begin;

create table if not exists public.pdf_editor_profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    full_name text not null default '' check (char_length(full_name) <= 80),
    avatar_path text
);

create table if not exists public.pdf_editor_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    file_name text not null check (char_length(file_name) <= 255),
    service text not null check (service in (
        'merge-pdf',
        'extract-pages',
        'pdf-to-word',
        'word-to-pdf',
        'pdf-to-jpg',
        'jpg-to-pdf',
        'ocr-pdf'
    )),
    edited_at timestamptz not null default now()
);

create index if not exists pdf_editor_history_user_edited_at_idx
    on public.pdf_editor_history (user_id, edited_at desc);

alter table public.pdf_editor_profiles enable row level security;
alter table public.pdf_editor_history enable row level security;

drop policy if exists pdf_editor_profiles_select_own on public.pdf_editor_profiles;
create policy pdf_editor_profiles_select_own on public.pdf_editor_profiles
    for select to authenticated
    using ((select auth.uid()) = id);

drop policy if exists pdf_editor_profiles_insert_own on public.pdf_editor_profiles;
create policy pdf_editor_profiles_insert_own on public.pdf_editor_profiles
    for insert to authenticated
    with check ((select auth.uid()) = id);

drop policy if exists pdf_editor_profiles_update_own on public.pdf_editor_profiles;
create policy pdf_editor_profiles_update_own on public.pdf_editor_profiles
    for update to authenticated
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

drop policy if exists pdf_editor_history_select_own on public.pdf_editor_history;
create policy pdf_editor_history_select_own on public.pdf_editor_history
    for select to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists pdf_editor_history_insert_own on public.pdf_editor_history;
create policy pdf_editor_history_insert_own on public.pdf_editor_history
    for insert to authenticated
    with check ((select auth.uid()) = user_id);

grant select, insert, update on public.pdf_editor_profiles to authenticated;
grant select, insert on public.pdf_editor_history to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'pdf-editor-avatars',
    'pdf-editor-avatars',
    true,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists pdf_editor_avatars_public_read on storage.objects;
create policy pdf_editor_avatars_public_read on storage.objects
    for select to public
    using (bucket_id = 'pdf-editor-avatars');

drop policy if exists pdf_editor_avatars_insert_own on storage.objects;
create policy pdf_editor_avatars_insert_own on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'pdf-editor-avatars'
        and name = ((select auth.uid())::text || '/avatar')
    );

drop policy if exists pdf_editor_avatars_update_own on storage.objects;
create policy pdf_editor_avatars_update_own on storage.objects
    for update to authenticated
    using (
        bucket_id = 'pdf-editor-avatars'
        and name = ((select auth.uid())::text || '/avatar')
    )
    with check (
        bucket_id = 'pdf-editor-avatars'
        and name = ((select auth.uid())::text || '/avatar')
    );

drop policy if exists pdf_editor_avatars_delete_own on storage.objects;
create policy pdf_editor_avatars_delete_own on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'pdf-editor-avatars'
        and name = ((select auth.uid())::text || '/avatar')
    );

commit;
