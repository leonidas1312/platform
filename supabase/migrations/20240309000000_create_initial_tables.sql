
-- Create a table for user profiles
create table profiles (
  id uuid references auth.users on delete cascade,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  primary key (id)
);

-- Create a table for GitHub tokens
create table github_tokens (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  token text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
alter table github_tokens enable row level security;

-- Create policies
create policy "Users can view their own profile."
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile."
  on profiles for update
  using ( auth.uid() = id );

create policy "Users can view their own tokens."
  on github_tokens for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own tokens."
  on github_tokens for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own tokens."
  on github_tokens for update
  using ( auth.uid() = user_id );

-- Function to handle new user signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.user_metadata->>'full_name',
    new.user_metadata->>'avatar_url'

  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
