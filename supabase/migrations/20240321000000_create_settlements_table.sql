-- Create settlements table
create table if not exists settlements (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references groups not null,
  from_user_id uuid references auth.users not null,
  to_user_id uuid references auth.users not null,
  amount decimal not null,
  settled_at timestamp with time zone default now() not null,
  settled_by uuid references auth.users not null
);

-- Set up Row Level Security (RLS)
alter table settlements enable row level security;

-- Create policies
create policy "Settlements are viewable by group members"
  on settlements for select
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = settlements.group_id
      and group_members.user_id = auth.uid()
    )
  );

create policy "Users can create settlements where they are the payer"
  on settlements for insert
  with check (
    auth.uid() = from_user_id and
    auth.uid() = settled_by
  );
