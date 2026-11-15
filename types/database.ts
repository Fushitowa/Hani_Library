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
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          student_id: string | null
          department: string | null
          contact_number: string | null
          role: 'admin' | 'librarian' | 'student'
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          student_id?: string | null
          department?: string | null
          contact_number?: string | null
          role?: 'admin' | 'librarian' | 'student'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          student_id?: string | null
          department?: string | null
          contact_number?: string | null
          role?: 'admin' | 'librarian' | 'student'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      books: {
        Row: {
          id: string
          isbn: string | null
          title: string
          author: string
          publisher: string | null
          publication_year: number | null
          category_id: string | null
          description: string | null
          cover_url: string | null
          total_copies: number
          available_copies: number
          shelf_location: string | null
          status: 'active' | 'archived' | 'discontinued'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          isbn?: string | null
          title: string
          author: string
          publisher?: string | null
          publication_year?: number | null
          category_id?: string | null
          description?: string | null
          cover_url?: string | null
          total_copies?: number
          available_copies?: number
          shelf_location?: string | null
          status?: 'active' | 'archived' | 'discontinued'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          isbn?: string | null
          title?: string
          author?: string
          publisher?: string | null
          publication_year?: number | null
          category_id?: string | null
          description?: string | null
          cover_url?: string | null
          total_copies?: number
          available_copies?: number
          shelf_location?: string | null
          status?: 'active' | 'archived' | 'discontinued'
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      borrowing_transactions: {
        Row: {
          id: string
          borrower_id: string
          book_id: string
          request_date: string
          approval_date: string | null
          borrowed_at: string | null
          due_date: string | null
          returned_at: string | null
          approved_by: string | null
          status: 'pending' | 'approved' | 'rejected' | 'borrowed' | 'returned' | 'overdue' | 'cancelled'
          renewal_count: number
          remarks: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          borrower_id: string
          book_id: string
          request_date?: string
          approval_date?: string | null
          borrowed_at?: string | null
          due_date?: string | null
          returned_at?: string | null
          approved_by?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'borrowed' | 'returned' | 'overdue' | 'cancelled'
          renewal_count?: number
          remarks?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          borrower_id?: string
          book_id?: string
          request_date?: string
          approval_date?: string | null
          borrowed_at?: string | null
          due_date?: string | null
          returned_at?: string | null
          approved_by?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'borrowed' | 'returned' | 'overdue' | 'cancelled'
          renewal_count?: number
          remarks?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error' | 'borrow_request' | 'approved' | 'rejected' | 'due_soon' | 'overdue' | 'returned'
          is_read: boolean
          related_transaction_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: 'info' | 'success' | 'warning' | 'error' | 'borrow_request' | 'approved' | 'rejected' | 'due_soon' | 'overdue' | 'returned'
          is_read?: boolean
          related_transaction_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'error' | 'borrow_request' | 'approved' | 'rejected' | 'due_soon' | 'overdue' | 'returned'
          is_read?: boolean
          related_transaction_id?: string | null
          created_at?: string
        }
      }
      borrowing_policies: {
        Row: {
          id: string
          max_books_per_user: number
          borrowing_duration_days: number
          max_renewals: number
          overdue_penalty_per_day: number
          allow_renewals: boolean
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          max_books_per_user?: number
          borrowing_duration_days?: number
          max_renewals?: number
          overdue_penalty_per_day?: number
          allow_renewals?: boolean
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          max_books_per_user?: number
          borrowing_duration_days?: number
          max_renewals?: number
          overdue_penalty_per_day?: number
          allow_renewals?: boolean
          updated_by?: string | null
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          description: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          description: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          description?: string
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      get_user_role: {
        Args: Record<string, never>
        Returns: string
      }
      approve_borrow_request: {
        Args: {
          p_transaction_id: string
          p_approved_by: string
          p_due_date: string
        }
        Returns: Database['public']['Tables']['borrowing_transactions']['Row']
      }
      return_book: {
        Args: {
          p_transaction_id: string
          p_returned_by: string
          p_remarks?: string
        }
        Returns: Database['public']['Tables']['borrowing_transactions']['Row']
      }
      mark_overdue_transactions: {
        Args: Record<string, never>
        Returns: number
      }
    }
    Enums: Record<string, never>
  }
}
