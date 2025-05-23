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
      users: {
        Row: {
          id: string
          auth_id: string | null
          username: string | null
          email: string | null
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          language: string | null
          currency: string | null
          email_notifications: boolean | null
          push_notifications: boolean | null
          sms_notifications: boolean | null
          theme: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          auth_id?: string | null
          username?: string | null
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          language?: string | null
          currency?: string | null
          email_notifications?: boolean | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          theme?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          auth_id?: string | null
          username?: string | null
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          language?: string | null
          currency?: string | null
          email_notifications?: boolean | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          theme?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      budget_categories: {
        Row: {
          amount: number
          budget_id: number | null
          category_id: number | null
          created_at: string | null
          id: number
        }
        Insert: {
          amount: number
          budget_id?: number | null
          category_id?: number | null
          created_at?: string | null
          id?: number
        }
        Update: {
          amount?: number
          budget_id?: number | null
          category_id?: number | null
          created_at?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      budgets: {
        Row: {
          created_at: string | null
          id: number
          month: number
          user_id: number
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          month: number
          user_id: number
          year: number
        }
        Update: {
          created_at?: string | null
          id?: number
          month?: number
          user_id?: number
          year?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: number
          is_system: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_system?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_system?: boolean | null
          name?: string
        }
        Relationships: []
      }
      financial_accounts: {
        Row: {
          account_mask: string | null
          balance: number
          created_at: string | null
          currency: string
          id: number
          institution: string | null
          is_active: boolean
          name: string
          type: string
          updated_at: string | null
          user_id: number
        }
        Insert: {
          account_mask?: string | null
          balance: number
          created_at?: string | null
          currency: string
          id?: number
          institution?: string | null
          is_active: boolean
          name: string
          type: string
          updated_at?: string | null
          user_id: number
        }
        Update: {
          account_mask?: string | null
          balance?: number
          created_at?: string | null
          currency?: string
          id?: number
          institution?: string | null
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: number | null
          created_at: string
          date: string
          description: string | null
          id: number
          is_income: boolean
          receipt_url: string | null
          type: string | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          amount: number
          category_id?: number | null
          created_at?: string
          date: string
          description?: string | null
          id?: number
          is_income?: boolean
          receipt_url?: string | null
          type?: string | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          amount?: number
          category_id?: number | null
          created_at?: string
          date?: string
          description?: string | null
          id?: number
          is_income?: boolean
          receipt_url?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
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
