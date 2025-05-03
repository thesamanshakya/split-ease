export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
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
  split_type: 'equal' | 'manual';
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