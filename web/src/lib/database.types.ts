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
