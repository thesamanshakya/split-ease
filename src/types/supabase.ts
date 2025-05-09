export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          name: string
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          created_by?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          group_id: string
          description: string
          amount: number
          paid_by: string
          date: string
          split_type: "equal" | "manual"
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          description: string
          amount: number
          paid_by: string
          date: string
          split_type: "equal" | "manual"
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          description?: string
          amount?: number
          paid_by?: string
          date?: string
          split_type?: "equal" | "manual"
          created_at?: string
        }
      }
      expense_splits: {
        Row: {
          id: string
          expense_id: string
          user_id: string
          amount: number
        }
        Insert: {
          id?: string
          expense_id: string
          user_id: string
          amount: number
        }
        Update: {
          id?: string
          expense_id?: string
          user_id?: string
          amount?: number
        }
      }
      settlements: {
        Row: {
          id: string
          group_id: string
          from_user_id: string
          to_user_id: string
          amount: number
          settled_at: string
          settled_by: string
        }
        Insert: {
          id?: string
          group_id: string
          from_user_id: string
          to_user_id: string
          amount: number
          settled_at?: string
          settled_by: string
        }
        Update: {
          id?: string
          group_id?: string
          from_user_id?: string
          to_user_id?: string
          amount?: number
          settled_at?: string
          settled_by?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url?: string
          qr_code_url?: string
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string
          qr_code_url?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string
          qr_code_url?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'expense_added' | 'settlement_request' | 'settlement_completed' | 'group_invitation'
          content: string
          related_id: string | null
          group_id: string | null
          created_at: string
          read: boolean
        }
        Insert: {
          id?: string
          user_id: string
          type: 'expense_added' | 'settlement_request' | 'settlement_completed' | 'group_invitation'
          content: string
          related_id?: string | null
          group_id?: string | null
          created_at?: string
          read?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'expense_added' | 'settlement_request' | 'settlement_completed' | 'group_invitation'
          content?: string
          related_id?: string | null
          group_id?: string | null
          created_at?: string
          read?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
