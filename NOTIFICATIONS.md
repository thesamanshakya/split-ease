# SplitEase Notifications Feature

This document describes the notifications feature implementation in SplitEase.

## Overview

The notifications system allows users to receive real-time updates about activities related to them in the application, such as:

- New expenses added to groups they belong to
- Settlement requests
- Completed settlements
- Group invitations

## Implementation Details

### Database Structure

A new `notifications` table has been added to the Supabase database with the following structure:

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('expense_added', 'settlement_request', 'settlement_completed', 'group_invitation')),
  content TEXT NOT NULL,
  related_id UUID,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT FALSE
);
```

### Database Triggers

The implementation includes database triggers that automatically create notifications when:

1. A new expense is added to a group
2. A settlement is completed
3. A user is invited to a group

### API Endpoints

Two API endpoints have been created to manage notifications:

1. `GET /api/notifications` - Fetches the user's notifications
2. `POST /api/notifications` - Marks notifications as read

### UI Components

1. **Notification Bell Icon** - Added to the Navbar component with a badge showing the number of unread notifications
2. **Notification Dropdown** - Displays a list of notifications when the bell icon is clicked

## How to Apply the Database Migration

To apply the database migration and set up the notifications feature:

1. Make sure you have the Supabase CLI installed and configured
2. Run the following command from the project root:

```bash
supabase db push
```

Or manually apply the SQL file in the Supabase dashboard:

1. Go to the Supabase dashboard for your project
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/migrations/20250509_create_notifications_table.sql`
4. Paste and execute the SQL

## Testing the Notifications Feature

To test the notifications feature:

1. Create a new group and invite another user
2. Add an expense to the group
3. Complete a settlement
4. Verify that notifications are created for these actions
5. Click the notification bell icon to view notifications
6. Click on a notification to mark it as read
