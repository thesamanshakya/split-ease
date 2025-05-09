export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  qr_code_url?: string;
}

export interface Group {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}

export interface Expense {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  paid_by: string;
  date: string;
  split_type: "equal" | "manual";
  created_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface Balance {
  user_id: string;
  amount: number;
}

export interface Settlement {
  id: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  settled_at: string;
  settled_by: string;
}

export interface Activity {
  id: string;
  type: "expense" | "settlement";
  group_id: string;
  group_name: string;
  date: string;
  amount: number;
  description?: string;
  paid_by?: string;
  from_user_id?: string;
  to_user_id?: string;
  settled_by?: string;
}

export type NotificationType = 'expense_added' | 'settlement_request' | 'settlement_completed' | 'group_invitation';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  content: string;
  related_id?: string;
  group_id?: string;
  created_at: string;
  read: boolean;
}
