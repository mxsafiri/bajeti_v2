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
      budget_allocations: {
        Row: {
          id: number
          transaction_id: number | null
          needs_amount: number
          wants_amount: number
          savings_amount: number
          needs_percentage: number
          wants_percentage: number
          savings_percentage: number
          created_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: number
          transaction_id?: number | null
          needs_amount: number
          wants_amount: number
          savings_amount: number
          needs_percentage: number
          wants_percentage: number
          savings_percentage: number
          created_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: number
          transaction_id?: number | null
          needs_amount?: number
          wants_amount?: number
          savings_amount?: number
          needs_percentage?: number
          wants_percentage?: number
          savings_percentage?: number
          created_at?: string | null
          user_id?: string | null
        }
      }
      budget_categories: {
        Row: {
          id: number
          amount: number
          budget_id: number | null
          category_id: number | null
          created_at: string | null
          allocation_type: string | null
        }
        Insert: {
          id?: number
          amount: number
          budget_id?: number | null
          category_id?: number | null
          created_at?: string | null
          allocation_type?: string | null
        }
        Update: {
          id?: number
          amount?: number
          budget_id?: number | null
          category_id?: number | null
          created_at?: string | null
          allocation_type?: string | null
        }
      }
      budgets: {
        Row: {
          id: number
          month: number
          year: number
          user_id: number
          created_at: string | null
        }
        Insert: {
          id?: number
          month: number
          year: number
          user_id: number
          created_at?: string | null
        }
        Update: {
          id?: number
          month?: number
          year?: number
          user_id?: number
          created_at?: string | null
        }
      }
      categories: {
        Row: {
          id: number
          name: string
          type: string
          is_system: boolean | null
          user_id: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          name: string
          type: string
          is_system?: boolean | null
          user_id?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          type?: string
          is_system?: boolean | null
          user_id?: number | null
          created_at?: string | null
        }
      }
      transactions: {
        Row: {
          id: number
          amount: number
          description: string
          date: string
          type: string
          category_id: number | null
          user_id: string | null
          created_at: string | null
          is_income: boolean | null
          notes: string | null
          receipt_url: string | null
          frequency: string | null
        }
        Insert: {
          id?: number
          amount: number
          description: string
          date: string
          type: string
          category_id?: number | null
          user_id?: string | null
          created_at?: string | null
          is_income?: boolean | null
          notes?: string | null
          receipt_url?: string | null
          frequency?: string | null
        }
        Update: {
          id?: number
          amount?: number
          description?: string
          date?: string
          type?: string
          category_id?: number | null
          user_id?: string | null
          created_at?: string | null
          is_income?: boolean | null
          notes?: string | null
          receipt_url?: string | null
          frequency?: string | null
        }
      }
      users: {
        Row: {
          id: string
          auth_id: string | null
          username: string
          email: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          auth_id?: string | null
          username: string
          email?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          auth_id?: string | null
          username?: string
          email?: string | null
          created_at?: string | null
          updated_at?: string | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}