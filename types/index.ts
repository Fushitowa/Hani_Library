export type UserRole = 'admin' | 'librarian' | 'student'
export type BookStatus = 'active' | 'archived' | 'discontinued'
export type BorrowingStatus = 'pending' | 'approved' | 'rejected' | 'borrowed' | 'returned' | 'overdue' | 'cancelled'
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'borrow_request' | 'approved' | 'rejected' | 'due_soon' | 'overdue' | 'returned'

// ============================================================
// DATABASE RECORD TYPES
// ============================================================

export interface Profile {
  id: string
  full_name: string
  email: string
  student_id: string | null
  department: string | null
  contact_number: string | null
  role: UserRole
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Book {
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
  status: BookStatus
  created_at: string
  updated_at: string
  // Joined fields
  category?: Category
}

export interface BorrowingTransaction {
  id: string
  borrower_id: string
  book_id: string
  request_date: string
  approval_date: string | null
  borrowed_at: string | null
  due_date: string | null
  returned_at: string | null
  approved_by: string | null
  status: BorrowingStatus
  renewal_count: number
  remarks: string | null
  created_at: string
  updated_at: string
  // Joined fields
  borrower?: Profile
  book?: Book
  approver?: Profile
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  related_transaction_id: string | null
  created_at: string
}

export interface BorrowingPolicy {
  id: string
  max_books_per_user: number
  borrowing_duration_days: number
  max_renewals: number
  overdue_penalty_per_day: number
  allow_renewals: boolean
  updated_by: string | null
  updated_at: string
}

export interface ActivityLog {
  id: string
  user_id: string | null
  action: string
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
  user?: Profile
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================================
// DASHBOARD STAT TYPES
// ============================================================

export interface AdminStats {
  totalBooks: number
  totalCopies: number
  availableCopies: number
  borrowedBooks: number
  pendingRequests: number
  overdueBooks: number
  totalUsers: number
  totalLibrarians: number
  totalTransactions: number
}

export interface LibrarianStats {
  pendingRequests: number
  activeBorrowings: number
  overdueBooks: number
  returnedToday: number
  totalBooks: number
  availableBooks: number
}

export interface StudentStats {
  currentlyBorrowed: number
  pendingRequests: number
  approvedRequests: number
  overdueBooks: number
  totalBorrowed: number
}

// ============================================================
// FORM INPUT TYPES
// ============================================================

export interface BookFormInput {
  isbn?: string
  title: string
  author: string
  publisher?: string
  publication_year?: number
  category_id?: string
  description?: string
  total_copies: number
  available_copies: number
  shelf_location?: string
  status: BookStatus
}

export interface BorrowRequestInput {
  book_id: string
  remarks?: string
}

export interface UserFormInput {
  full_name: string
  email: string
  student_id?: string
  department?: string
  contact_number?: string
  role: UserRole
}

export interface PolicyFormInput {
  max_books_per_user: number
  borrowing_duration_days: number
  max_renewals: number
  overdue_penalty_per_day: number
  allow_renewals: boolean
}

// ============================================================
// FILTER / SEARCH TYPES
// ============================================================

export interface BookFilters {
  search?: string
  category_id?: string
  status?: BookStatus | 'all'
  available_only?: boolean
  sort_by?: 'title' | 'author' | 'created_at' | 'publication_year'
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

export interface TransactionFilters {
  search?: string
  status?: BorrowingStatus | 'all'
  borrower_id?: string
  book_id?: string
  date_from?: string
  date_to?: string
  sort_by?: 'request_date' | 'due_date' | 'created_at'
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

export interface UserFilters {
  search?: string
  role?: UserRole | 'all'
  is_active?: boolean
  page?: number
  page_size?: number
}

// ============================================================
// CHART DATA TYPES
// ============================================================

export interface MonthlyBorrowingData {
  month: string
  borrowed: number
  returned: number
}

export interface CategoryDistribution {
  name: string
  count: number
  percentage: number
}

export interface PopularBook {
  book: Book
  borrow_count: number
}
