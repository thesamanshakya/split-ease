# SplitEase - Bill Splitting App

SplitEase is a web application that helps groups of people split bills easily. Users can create groups, add expenses, and track who owes what to whom.

## Features

- User authentication with Supabase
- Create and manage groups
- Add expenses with equal or custom splits
- Track balances between group members
- Visualize who owes what to whom
- Settle up debts

## Technologies Used

- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- Supabase (Authentication and Database)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account

### Setup Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Set up the following tables in your Supabase database:

#### profiles

```sql
create table profiles (
  id uuid references auth.users primary key,
  name text not null,
  email text not null,
  avatar_url text,
  updated_at timestamp with time zone
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile."
  on profiles for update
  using ( auth.uid() = id );
```

#### groups

```sql
create table groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default now() not null
);

-- Set up Row Level Security (RLS)
alter table groups enable row level security;

-- Create policies
create policy "Groups are viewable by members"
  on groups for select
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = id
      and group_members.user_id = auth.uid()
    )
  );

create policy "Users can create groups"
  on groups for insert
  with check ( auth.uid() = created_by );

create policy "Groups can be updated by creator"
  on groups for update
  using ( auth.uid() = created_by );
```

#### group_members

```sql
create table group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references groups not null,
  user_id uuid references auth.users not null,
  joined_at timestamp with time zone default now() not null,
  unique(group_id, user_id)
);

-- Set up Row Level Security (RLS)
alter table group_members enable row level security;

-- Create policies
create policy "Group members are viewable by group members"
  on group_members for select
  using (
    exists (
      select 1 from group_members as gm
      where gm.group_id = group_id
      and gm.user_id = auth.uid()
    )
  );

create policy "Users can join groups"
  on group_members for insert
  with check ( auth.uid() = user_id );

create policy "Group creator can add members"
  on group_members for insert
  with check (
    exists (
      select 1 from groups
      where groups.id = group_id
      and groups.created_by = auth.uid()
    )
  );
```

#### expenses

```sql
create table expenses (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references groups not null,
  description text not null,
  amount decimal not null,
  paid_by uuid references auth.users not null,
  date date not null,
  split_type text not null check (split_type in ('equal', 'manual')),
  created_at timestamp with time zone default now() not null
);

-- Set up Row Level Security (RLS)
alter table expenses enable row level security;

-- Create policies
create policy "Expenses are viewable by group members"
  on expenses for select
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = group_id
      and group_members.user_id = auth.uid()
    )
  );

create policy "Users can create expenses for their groups"
  on expenses for insert
  with check (
    exists (
      select 1 from group_members
      where group_members.group_id = group_id
      and group_members.user_id = auth.uid()
    )
  );
```

#### expense_splits

```sql
create table expense_splits (
  id uuid default uuid_generate_v4() primary key,
  expense_id uuid references expenses not null,
  user_id uuid references auth.users not null,
  amount decimal not null,
  unique(expense_id, user_id)
);

-- Set up Row Level Security (RLS)
alter table expense_splits enable row level security;

-- Create policies
create policy "Expense splits are viewable by group members"
  on expense_splits for select
  using (
    exists (
      select 1 from expenses
      join group_members on expenses.group_id = group_members.group_id
      where expenses.id = expense_id
      and group_members.user_id = auth.uid()
    )
  );

create policy "Users can create expense splits for their groups"
  on expense_splits for insert
  with check (
    exists (
      select 1 from expenses
      join group_members on expenses.group_id = group_members.group_id
      where expenses.id = expense_id
      and group_members.user_id = auth.uid()
    )
  );
```

### Application Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/src/app` - Next.js application routes
- `/src/components` - React components
- `/src/types` - TypeScript type definitions
- `/src/utils` - Utility functions, including Supabase client

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com).
