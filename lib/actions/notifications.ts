// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ApiResponse, Notification, PaginatedResponse, Profile, UserFilters } from '@/types'
import { getCurrentProfile } from './auth'

// ============================================================
// CREATE NOTIFICATION
// ============================================================
export async function createNotification(notification: {
  user_id: string
  title: string
  message: string
  type: Notification['type']
  related_transaction_id?: string
}): Promise<void> {
  const supabase = await createClient()
  await supabase.from('notifications').insert({
    ...notification,
    related_transaction_id: notification.related_transaction_id ?? null,
  } as any)
}

// ============================================================
// GET USER NOTIFICATIONS
// ============================================================
export async function getNotifications(page = 1, pageSize = 20): Promise<PaginatedResponse<Notification>> {
  const profile = await getCurrentProfile()
  if (!profile) return { data: [], total: 0, page, pageSize, totalPages: 0 }

  const supabase = await createClient()
  const offset = (page - 1) * pageSize

  const { data, count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' } as any)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) return { data: [], total: 0, page, pageSize, totalPages: 0 }

  const total = count ?? 0
  return {
    data: data ?? [],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// ============================================================
// GET UNREAD COUNT
// ============================================================
export async function getUnreadNotificationCount(): Promise<number> {
  const profile = await getCurrentProfile()
  if (!profile) return 0

  const supabase = await createClient()
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true } as any)
    .eq('user_id', profile.id)
    .eq('is_read', false)

  return count ?? 0
}

// ============================================================
// MARK NOTIFICATION AS READ
// ============================================================
export async function markNotificationRead(notificationId: string): Promise<ApiResponse<null>> {
  const profile = await getCurrentProfile()
  if (!profile) return { data: null, error: 'Not authenticated', success: false }

  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true } as any)
    .eq('id', notificationId)
    .eq('user_id', profile.id)

  if (error) return { data: null, error: error.message, success: false }

  revalidatePath('/notifications')
  return { data: null, error: null, success: true }
}

// ============================================================
// MARK ALL AS READ
// ============================================================
export async function markAllNotificationsRead(): Promise<ApiResponse<null>> {
  const profile = await getCurrentProfile()
  if (!profile) return { data: null, error: 'Not authenticated', success: false }

  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true } as any)
    .eq('user_id', profile.id)
    .eq('is_read', false)

  if (error) return { data: null, error: error.message, success: false }

  revalidatePath('/notifications')
  return { data: null, error: null, success: true }
}

// ============================================================
// LOG ACTIVITY
// ============================================================
export async function logActivity(userId: string, action: string, description: string, metadata?: Record<string, unknown>): Promise<void> {
  const supabase = await createClient()
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action,
    description,
    metadata: metadata ?? null,
  } as any)
}

// ============================================================
// GET ACTIVITY LOGS (Admin only)
// ============================================================
export async function getActivityLogs(page = 1, pageSize = 20) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin') return { data: [], total: 0, page, pageSize, totalPages: 0 }

  const supabase = await createClient()
  const offset = (page - 1) * pageSize

  const { data, count } = await supabase
    .from('activity_logs')
    .select('*, user:profiles(full_name, email, role)', { count: 'exact' } as any)
    .order('created_at', { ascending: false })

  const total = count ?? 0
  return {
    data: data ?? [],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// ============================================================
// GET USERS (Admin/Librarian)
// ============================================================
export async function getUsers(filters: UserFilters = {}): Promise<PaginatedResponse<Profile>> {
  const profile = await getCurrentProfile()
  if (!profile || !['admin', 'librarian'].includes(profile.role)) {
    return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }
  }

  const supabase = await createClient()
  const { search, role, is_active, page = 1, page_size = 10 } = filters
  const offset = (page - 1) * page_size

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' } as any)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,student_id.ilike.%${search}%`)
  }

  if (role && role !== 'all') {
    query = query.eq('role', role)
  }

  if (is_active !== undefined) {
    query = query.eq('is_active', is_active)
  }

  query = query.order('created_at', { ascending: false })
  query = query.range(offset, offset + page_size - 1)

  const { data, count, error } = await query

  if (error) return { data: [], total: 0, page, pageSize: page_size, totalPages: 0 }

  const total = count ?? 0
  return {
    data: data ?? [],
    total,
    page,
    pageSize: page_size,
    totalPages: Math.ceil(total / page_size),
  }
}

// ============================================================
// TOGGLE USER ACTIVE STATUS
// ============================================================
export async function toggleUserStatus(userId: string, isActive: boolean): Promise<ApiResponse<null>> {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin') {
    return { data: null, error: 'Only administrators can manage user status', success: false }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive } as any)
    .eq('id', userId)

  if (error) return { data: null, error: error.message, success: false }

  await logActivity(profile.id, 'USER_STATUS_CHANGED', `${isActive ? 'Activated' : 'Deactivated'} user: ${userId}`)
  revalidatePath('/users')
  return { data: null, error: null, success: true }
}