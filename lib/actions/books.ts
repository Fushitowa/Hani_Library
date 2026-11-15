// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { bookSchema, categorySchema } from '@/lib/validations/book'
import { ApiResponse, Book, BookFilters, Category, PaginatedResponse } from '@/types'
import { getCurrentProfile } from './auth'
import { logActivity } from './notifications'

// ============================================================
// GET BOOKS (with filters and pagination)
// ============================================================
export async function getBooks(filters: BookFilters = {}): Promise<PaginatedResponse<Book>> {
  const supabase = await createClient()
  const {
    search,
    category_id,
    status = 'active',
    available_only = false,
    sort_by = 'title',
    sort_order = 'asc',
    page = 1,
    page_size = 12,
  } = filters

  const offset = (page - 1) * page_size

  let query = supabase
    .from('books')
    .select('*, category:categories(*)', { count: 'exact' })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (available_only) {
    query = query.gt('available_copies', 0)
  }

  if (category_id) {
    query = query.eq('category_id', category_id)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%,publisher.ilike.%${search}%`)
  }

  query = query.order(sort_by, { ascending: sort_order === 'asc' })
  query = query.range(offset, offset + page_size - 1)

  const { data, error, count } = await query

  if (error) {
    return { data: [], total: 0, page, pageSize: page_size, totalPages: 0 }
  }

  const total = count ?? 0
  return {
    data: (data as Book[]) ?? [],
    total,
    page,
    pageSize: page_size,
    totalPages: Math.ceil(total / page_size),
  }
}

// ============================================================
// GET SINGLE BOOK
// ============================================================
export async function getBook(id: string): Promise<Book | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('books')
    .select('*, category:categories(*)')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Book
}

// ============================================================
// CREATE BOOK
// ============================================================
export async function createBook(formData: FormData): Promise<ApiResponse<Book>> {
  const profile = await getCurrentProfile()
  if (!profile || !['admin', 'librarian'].includes(profile.role)) {
    return { data: null, error: 'Unauthorized', success: false }
  }

  const raw = {
    isbn: formData.get('isbn') as string || undefined,
    title: formData.get('title') as string,
    author: formData.get('author') as string,
    publisher: formData.get('publisher') as string || undefined,
    publication_year: formData.get('publication_year') ? Number(formData.get('publication_year')) : undefined,
    category_id: formData.get('category_id') as string || undefined,
    description: formData.get('description') as string || undefined,
    total_copies: Number(formData.get('total_copies')),
    available_copies: Number(formData.get('available_copies')),
    shelf_location: formData.get('shelf_location') as string || undefined,
    status: (formData.get('status') as string || 'active') as 'active' | 'archived' | 'discontinued',
  }

  const result = bookSchema.safeParse(raw)
  if (!result.success) {
    return { data: null, error: result.error.issues[0].message, success: false }
  }

  const supabase = await createClient()

  // Handle cover image upload
  let cover_url: string | null = null
  const coverFile = formData.get('cover_image') as File | null
  if (coverFile && coverFile.size > 0) {
    const fileName = `${Date.now()}-${coverFile.name.replace(/\s/g, '_')}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('book-covers')
      .upload(fileName, coverFile, { cacheControl: '3600', upsert: false })

    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage.from('book-covers').getPublicUrl(uploadData.path)
      cover_url = urlData.publicUrl
    }
  }

  const { data, error } = await supabase
    .from('books')
    .insert({
      ...result.data,
      cover_url,
      category_id: result.data.category_id ?? null,
      isbn: result.data.isbn ?? null,
      publisher: result.data.publisher ?? null,
      publication_year: result.data.publication_year ?? null,
      description: result.data.description ?? null,
      shelf_location: result.data.shelf_location ?? null,
    })
    // @ts-ignore
    .select('*, category:categories(*)')
    .single()

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  await logActivity(profile.id, 'BOOK_CREATED', `Added new book: "${result.data.title}" by ${result.data.author}`)

  revalidatePath('/manage-books')
  revalidatePath('/books')
  return { data: data as Book, error: null, success: true }
}

// ============================================================
// UPDATE BOOK
// ============================================================
export async function updateBook(id: string, formData: FormData): Promise<ApiResponse<Book>> {
  const profile = await getCurrentProfile()
  if (!profile || !['admin', 'librarian'].includes(profile.role)) {
    return { data: null, error: 'Unauthorized', success: false }
  }

  const raw = {
    isbn: formData.get('isbn') as string || undefined,
    title: formData.get('title') as string,
    author: formData.get('author') as string,
    publisher: formData.get('publisher') as string || undefined,
    publication_year: formData.get('publication_year') ? Number(formData.get('publication_year')) : undefined,
    category_id: formData.get('category_id') as string || undefined,
    description: formData.get('description') as string || undefined,
    total_copies: Number(formData.get('total_copies')),
    available_copies: Number(formData.get('available_copies')),
    shelf_location: formData.get('shelf_location') as string || undefined,
    status: (formData.get('status') as string || 'active') as 'active' | 'archived' | 'discontinued',
  }

  const result = bookSchema.safeParse(raw)
  if (!result.success) {
    return { data: null, error: result.error.issues[0].message, success: false }
  }

  const supabase = await createClient()

  // Handle cover image upload
  let cover_url: string | undefined = undefined
  const coverFile = formData.get('cover_image') as File | null
  if (coverFile && coverFile.size > 0) {
    const fileName = `${Date.now()}-${coverFile.name.replace(/\s/g, '_')}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('book-covers')
      .upload(fileName, coverFile, { cacheControl: '3600', upsert: false })

    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage.from('book-covers').getPublicUrl(uploadData.path)
      cover_url = urlData.publicUrl
    }
  }

const updateData = {
    ...result.data,
    ...(cover_url !== undefined && { cover_url }),
    category_id: result.data.category_id ?? null,
  }

  // @ts-ignore
  const { data, error } = await supabase
    .from('books')
    .update(updateData)
    .eq('id', id)
    .select('*, category:categories(*)')
    .single()

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  await logActivity(profile.id, 'BOOK_UPDATED', `Updated book: "${result.data.title}"`)
  revalidatePath('/manage-books')
  revalidatePath('/books')
  revalidatePath(`/books/${id}`)
  return { data: data as Book, error: null, success: true }
}

// ============================================================
// DELETE BOOK
// ============================================================
export async function deleteBook(id: string): Promise<ApiResponse<null>> {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin') {
    return { data: null, error: 'Only administrators can delete books', success: false }
  }

  const supabase = await createClient()

  // Check if book has active transactions
  const { count } = await supabase
    .from('borrowing_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('book_id', id)
    .in('status', ['borrowed', 'approved', 'pending'])

  if (count && count > 0) {
    return { data: null, error: 'Cannot delete book with active borrowings. Archive it instead.', success: false }
  }

  const { error } = await supabase.from('books').delete().eq('id', id)

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  await logActivity(profile.id, 'BOOK_DELETED', `Deleted book ID: ${id}`)
  revalidatePath('/manage-books')
  revalidatePath('/books')
  return { data: null, error: null, success: true }
}

// ============================================================
// ARCHIVE BOOK
// ============================================================
export async function archiveBook(id: string): Promise<ApiResponse<null>> {
  const profile = await getCurrentProfile()
  if (!profile || !['admin', 'librarian'].includes(profile.role)) {
    return { data: null, error: 'Unauthorized', success: false }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('books')
    .update({ status: 'archived' })
    // @ts-ignore
    .eq('id', id)

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  await logActivity(profile.id, 'BOOK_ARCHIVED', `Archived book ID: ${id}`)
  revalidatePath('/manage-books')
  revalidatePath('/books')
  return { data: null, error: null, success: true }
}

// ============================================================
// GET CATEGORIES
// ============================================================
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return data ?? []
}

// ============================================================
// CREATE CATEGORY
// ============================================================
export async function createCategory(formData: FormData): Promise<ApiResponse<Category>> {
  const profile = await getCurrentProfile()
  if (!profile || !['admin', 'librarian'].includes(profile.role)) {
    return { data: null, error: 'Unauthorized', success: false }
  }

  const raw = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || undefined,
  }

  const result = categorySchema.safeParse(raw)
  if (!result.success) {
    return { data: null, error: result.error.issues[0].message, success: false }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: result.data.name,
      description: result.data.description,
    })
    // @ts-ignore
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  revalidatePath('/manage-books')
  return { data, error: null, success: true }
}

// ============================================================
// BOOK INVENTORY STATS
// ============================================================
export async function getBookStats() {
  const supabase = await createClient()

const [booksResult, borrowedResult] = await Promise.all([
    supabase.from('books').select('total_copies, available_copies, status').eq('status', 'active'),
    supabase.from('borrowing_transactions').select('id', { count: 'exact', head: true }).in('status', ['borrowed', 'overdue']),
  ])

  const books = booksResult.data ?? []
  const totalBooks = books.length
  const totalCopies = books.reduce((sum, b) => sum + (b as any).total_copies, 0)
  const availableCopies = books.reduce((sum, b) => sum + (b as any).available_copies, 0)
  const borrowedCount = borrowedResult.count ?? 0

  return { totalBooks, totalCopies, availableCopies, borrowedCount }
}