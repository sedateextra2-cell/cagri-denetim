-- Kullanıcı profilleri tablosu (Supabase Auth ile bağlantılı)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'denetim' check (role in ('admin','departman_lideri','denetim')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Dahili -> departman atamaları tablosu
create table public.ext_dept_map (
  id serial primary key,
  company_code text not null,
  extension text not null,
  department text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(company_code, extension)
);

-- RLS (Row Level Security) aktif et
alter table public.profiles enable row level security;
alter table public.ext_dept_map enable row level security;

-- Profiller: herkes kendi profilini okuyabilir
create policy "Kullanici kendi profilini okur" on public.profiles
  for select using (auth.uid() = id);

-- Profiller: admin ve departman lideri herkesi görebilir
create policy "Yonetici profilleri okur" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('admin','departman_lideri')
    )
  );

-- Profiller: sadece admin güncelleyebilir
create policy "Admin profil gunceller" on public.profiles
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

-- ext_dept_map: herkes okuyabilir (giriş yapmış)
create policy "Giris yapmis okur" on public.ext_dept_map
  for select using (auth.role() = 'authenticated');

-- ext_dept_map: admin ve departman lideri yazabilir
create policy "Yonetici yazar" on public.ext_dept_map
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('admin','departman_lideri')
    )
  );

-- Yeni kullanıcı kaydında profil otomatik oluştur
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'denetim')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
