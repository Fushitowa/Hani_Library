// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ApiResponse, BorrowingTransaction, TransactionFilters, PaginatedResponse } from '@/types'
import { getCurrentProfile } from './auth'
import { createNotification, logActivity } from './notifications'

// ============================================================
// GET TRANSACTIONS (with filters)
// ============================================================
export async function getTransactions(filters: TransactionFilters = {}): Promise<PaginatedResponse<BorrowingTransaction>> {
  const supabase = await createClient()
  const profile = await getCurrentProfile()

  if (!profile) return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }

  const {
    search,
    status,
    borrower_id,
    book_id,
    sort_by = 'created_at',
    sort_order = 'desc',
    page = 1,
    page_size = 10,
  } = filters

  const offset = (page - 1) * page_size

  let query = supabase
    .from('borrowing_transactions')
    .select(`
      *,
      borrower:profiles!borrowing_transactions_borrower_id_fkey(*),
      book:books(*),
      approver:profiles!borrowing_transactions_approved_by_fkey(*)
    `, { count: 'exact' } as any)

  // Students can only see their own transactions
  if (profile.role === 'student') {
    query = query.eq('borrower_id', profile.id)
  } else if (borrower_id) {
    query = query.eq('borrower_id', borrower_id)
  }

  if (book_id) query = query.eq('book_id', book_id)
  if (status && status !== 'all') query = query.eq('status', status)
  if (search) {
    query = query.or(`book.title.ilike.%${search}%,borrower.full_name.ilike.%${search}%`)
  }

  query = query.order(sort_by, { ascending: sort_order === 'asc' })
  query = query.range(offset, offset + page_size - 1)

  const { data, error, count } = await query

  if (error) {
    return { data: [], total: 0, page, pageSize: page_size, totalPages: 0 }
  }

  const total = count ?? 0
  return {
    data: (data as BorrowingTransaction[]) ?? [],
    total,
    page,
    pageSize: page_size,
    totalPages: Math.ceil(total / page_size),
  }
}

// ============================================================
// GET SINGLE TRANSACTION
// ============================================================
export async function getTransaction(id: string): Promise<BorrowingTransaction | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('borrowing_transactions')
    .select(`
      *,
      borrower:profiles!borrowing_transactions_borrower_id_fkey(*),
      book:books(*, category:categories(*)),
      approver:profiles!borrowing_transactions_approved_by_fkey(*)
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as BorrowingTransaction
}

// ============================================================
// CREATE BORROW REQUEST (Student action)
// ============================================================
export async function createBorrowRequest(book_id: string, remarks?: string): Promise<ApiResponse<BorrowingTransaction>> {
  const profile = await getCurrentProfile()
  if (!profile) {
    return { data: null, error: 'Not authenticated', success: false }
  }

  const supabase = await createClient()

  // Check if book is available
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', book_id)
    .eq('status', 'active')
    .single()

  if (!book) {
    return { data: null, error: 'Book not found or not available', success: false }
  }

  if (book.available_copies < 1) {
    return { data: null, error: 'No copies available for this book', success: false }
  }

  // Check for existing active request
  const { count: existingCount } = await supabase
    .from('borrowing_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('borrower_id', profile.id)
    .eq('book_id', book_id)
    .in('status', ['pending', 'approved', 'borrowed'])

  if (existingCount && existingCount > 0) {
    return { data: null, error: 'You already have an active request or borrowing for this book', success: false }
  }

  // Check borrowing limit
  const { data: policy } = await supabase.from('borrowing_policies').select('*').limit(1).single()
  const maxBooks = policy?.max_books_per_user ?? 3

  const { count: activeCount } = await supabase
    .from('borrowing_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('borrower_id', profile.id)
    .in('status', ['approved', 'borrowed'])

  if (activeCount && activeCount >= maxBooks) {
    return { data: null, error: `You have reached your borrowing limit of ${maxBooks} books`, success: false }
  }

  // Create the borrow request
  const { data, error } = await supabase
    .from('borrowing_transactions')
    .insert({
      borrower_id: profile.id,
      book_id,
      status: 'pending',
      remarks: remarks ?? null,
      request_date: new Date().toISOString(),
    } as any)
    .select(`
      *,
      borrower:profiles!borrowing_transactions_borrower_id_fkey(*),
      book:books(*)
    `)
    .single()

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  // Send notification to student
  await createNotification({
    user_id: profile.id,
    title: 'Borrow Request Submitted',
    message: `Your request to borrow "${book.title}" has been submitted and is pending approval.`,
    type: 'borrow_request',
    related_transaction_id: data.id,
  })

  // Notify librarians/admins
  const { data: staff } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'librarian'])

  if (staff) {
    await Promise.all(staff.map(s =>
      createNotification({
        user_id: s.id,
        title: 'New Borrow Request',
        message: `${profile.full_name} has requested to borrow "${book.title}".`,
        type: 'borrow_request',
        related_transaction_id: data.id,
      })
    ))
  }

  await logActivity(profile.id, 'BORROW_REQUEST', `Requested to borrow: "${book.title}"`)
  revalidatePath('/borrow-requests')
  revalidatePath('/dashboard')

  return { data: data as BorrowingTransaction, error: null, success: true }
}

// ============================================================
// APPROVE BORROW REQUEST
// ============================================================
export async function approveBorrowRequest(transactionId: string): Promise<ApiResponse<BorrowingTransaction>> {
  const profile = await getCurrentProfile()
  if (!profile || !['admin', 'librarian'].includes(profile.role)) {
    return { data: null, error: 'Unauthorized', success: false }
  }

  const supabase = await createClient()

  // Get policy for due date calculation
  const { data: policy } = await supabase.from('borrowing_policies').select('*').limit(1).single()
  const durationDays = policy?.borrowing_duration_days ?? 14
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + durationDays)

  // Use atomic function
  const { data, error } = await supabase.rpc('approve_borrow_request', {
    p_transaction_id: transactionId,
    p_approved_by: profile.id,
    p_due_date: dueDate.toISOString(),
  } as any)

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  const transaction = data as BorrowingTransaction

  // Get borrower info to send notification
  const { data: borrower } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', transaction.borrower_id)
    .single()

  const { data: book } = await supabase
    .from('books')
    .select('title')
    .eq('id', transaction.book_id)
    .single()

  if (borrower && book) {
    await createNotification({
      user_id: borrower.id,
      title: 'Borrow Request Approved',
      message: `Your request to borrow "${book.title}" has been approved. Due date: ${new Date(dueDate).toLocaleDateString()}.`,
      type: 'approved',
      related_transaction_id: transactionId,
    })
  }

  await logActivity(profile.id, 'REQUEST_APPROVED', `Approved borrow request: ${transactionId}`)
  revalidatePath('/borrow-requests')
  revalidatePath('/borrowed-books')
  revalidatePath('/dashboard')

  return { data: transaction, error: null, success: true }
}

// ============================================================
// REJECT BORROW REQUEST
// ============================================================
export async function rejectBorrowRequest(transactionId: string, remarks?: string): Promise<ApiResponse<null>> {
  const profile = await getCurrentProfile()
  if (!profile || !['admin', 'librarian'].includes(profile.role)) {
    return { data: null, error: 'Unauthorized', success: false }
  }

  const supabase = await createClient()

  const { data: transaction, error: fetchError } = await supabase
    .from('borrowing_transactions')
    .select('*, book:books(title), borrower:profiles!borrowing_transactions_borrower_id_fkey(id, full_name)')
    .eq('id', transactionId)
    .eq('status', 'pending')
    .single()

  if (fetchError || !transaction) {
    return { data: null, error: 'Transaction not found or already processed', success: false }
  }

  const { error } = await supabase
    .from('borrowing_transactions')
    .update({
      status: 'rejected',
      approval_date: new Date().toISOString(),
      approved_by: profile.id,
      remarks: remarks ?? null,
    } as any)
    .eq('id', transactionId)

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  // Notify borrower
  const book = transaction.book as { title: string } | null
  const borrower = transaction.borrower as { id: string; full_name: string } | null

  if (borrower && book) {
    await createNotification({
      user_id: borrower.id,
      title: 'Borrow Request Rejected',
      message: `Your request to borrow "${book.title}" has been rejected.${remarks ? ` Reason: ${remarks}` : ''}`,
      type: 'rejected',
      related_transaction_id: transactionId,
    })
  }

  await logActivity(profile.id, 'REQUEST_REJECTED', `Rejected borrow request: ${transactionId}`)
  revalidatePath('/borrow-requests')
  revalidatePath('/dashboard')

  return { data: null, error: null, success: true }
}

// ============================================================
// RETURN BOOK
// ============================================================
export async function returnBook(transactionId: string, remarks?: string): Promise<ApiResponse<BorrowingTransaction>> {
  const profile = await getCurrentProfile()
  if (!profile || !['admin', 'librarian'].includes(profile.role)) {
    return { data: null, error: 'Unauthorized', success: false }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc('return_book', {
    p_transaction_id: transactionId,
    p_returned_by: profile.id,
    p_remarks: remarks ?? null,
  } as any)

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  const transaction = data as BorrowingTransaction

  // Notify borrower
  const { data: borrower } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', transaction.borrower_id)
    .single()

  const { data: book } = await supabase
    .from('books')
    .select('title')
    .eq('id', transaction.book_id)
    .single()

  if (borrower && book) {
    await createNotification({
      user_id: borrower.id,
      title: 'Book Returned',
      message: `"${book.title}" has been successfully returned. Thank you!`,
      type: 'returned',
      related_transaction_id: transactionId,
    })
  }

  await logActivity(profile.id, 'BOOK_RETURNED', `Processed return for transaction: ${transactionId}`)
  revalidatePath('/returns')
  revalidatePath('/borrowed-books')
  revalidatePath('/borrow-requests')
  revalidatePath('/dashboard')

  return { data: transaction, error: null, success: true }
}

// ============================================================
// CANCEL BORROW REQUEST (Student)
// ============================================================
export async function cancelBorrowRequest(transactionId: string): Promise<ApiResponse<null>> {
  const profile = await getCurrentProfile()
  if (!profile) {
    return { data: null, error: 'Not authenticated', success: false }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('borrowing_transactions')
    .update({ status: 'cancelled' } as any)
    .eq('id', transactionId)
    .eq('borrower_id', profile.id)
    .eq('status', 'pending')

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  revalidatePath('/borrow-requests')
  revalidatePath('/dashboard')
  return { data: null, error: null, success: true }
}

// ============================================================
// MARK OVERDUE TRANSACTIONS
// ============================================================
export async function markOverdueTransactions(): Promise<ApiResponse<number>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('mark_overdue_transactions' as any)

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  return { data: data as number, error: null, success: true }
}

// ============================================================
// GET DASHBOARD STATS
// ============================================================
export async function getAdminStats() {
  const supabase = await createClient()

  const [books, users, transactions, overdue, pending] = await Promise.all([
    supabase.from('books').select('total_copies, available_copies').eq('status', 'active'),
    supabase.from('profiles').select('role'),
    supabase.from('borrowing_transactions').select('id', { count: 'exact', head: true }),
    supabase.from('borrowing_transactions').select('id', { count: 'exact', head: true }).eq('status', 'overdue'),
    supabase.from('borrowing_transactions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const booksData = books.data ?? []
  const usersData = users.data ?? []

  return {
    totalBooks: booksData.length,
    totalCopies: booksData.reduce((s, b) => s + (b as any).total_copies, 0),
    availableCopies: booksData.reduce((s, b) => s + (b as any).available_copies, 0),
    borrowedBooks: booksData.reduce((s, b) => s + (b as any).total_copies - (b as any).available_copies, 0),
    pendingRequests: pending.count ?? 0,
    overdueBooks: overdue.count ?? 0,
    totalUsers: usersData.filter((u: any) => u.role === 'student').length,
    totalLibrarians: usersData.filter((u: any) => u.role === 'librarian').length,
    totalTransactions: transactions.count ?? 0,
  }
}

export async function getStudentStats(userId: string) {
  const supabase = await createClient()

  const [borrowed, pending, approved, overdue, total] = await Promise.all([
    supabase.from('borrowing_transactions').select('id', { count: 'exact', head: true }).eq('borrower_id', userId).eq('status', 'borrowed'),
    supabase.from('borrowing_transactions').select('id', { count: 'exact', head: true }).eq('borrower_id', userId).eq('status', 'pending'),
    supabase.from('borrowing_transactions').select('id', { count: 'exact', head: true }).eq('borrower_id', userId).eq('status', 'approved'),
    supabase.from('borrowing_transactions').select('id', { count: 'exact', head: true }).eq('borrower_id', userId).eq('status', 'overdue'),
    supabase.from('borrowing_transactions').select('id', { count: 'exact', head: true }).eq('borrower_id', userId).eq('status', 'returned'),
  ])

  return {
    currentlyBorrowed: borrowed.count ?? 0,
    pendingRequests: pending.count ?? 0,
    approvedRequests: approved.count ?? 0,
    overdueBooks: overdue.count ?? 0,
    totalBorrowed: total.count ?? 0,
  }
}

// ============================================================
// MONTHLY BORROWING CHART DATA
// ============================================================
export async function getMonthlyBorrowingData() {
  const supabase = await createClient()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data } = await supabase
    .from('borrowing_transactions')
    .select('status, created_at')
    .gte('created_at', sixMonthsAgo.toISOString())
    .in('status', ['borrowed', 'returned'])

  if (!data) return []

  const monthlyMap: Record<string, { month: string; borrowed: number; returned: number }> = {}

  data.forEach((tx: any) => {
    const date = new Date(tx.created_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleString('default', { month: 'short', year: 'numeric' })

    if (!monthlyMap[key]) {
      monthlyMap[key] = { month: label, borrowed: 0, returned: 0 }
    }

    if (tx.status === 'borrowed') monthlyMap[key].borrowed++
    if (tx.status === 'returned') monthlyMap[key].returned++
  })

  return Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
}

// ============================================================
// MOST BORROWED BOOKS
// ============================================================
export async function getMostBorrowedBooks(limit = 5) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('borrowing_transactions')
    .select('book_id, books!inner(id, title, author, cover_url)')
    .not('status', 'eq', 'cancelled')

  if (!data) return []

  const countMap: Record<string, { book: { id: string; title: string; author: string; cover_url: string | null }; count: number }> = {}

  data.forEach((tx: any) => {
    const book = tx.books as { id: string; title: string; author: string; cover_url: string | null }
    if (!book) return
    if (!countMap[tx.book_id]) {
      countMap[tx.book_id] = { book, count: 0 }
    }
    countMap[tx.book_id].count++
  })

  return Object.values(countMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}