import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { BorrowingStatus, NotificationType, UserRole } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================
// DATE UTILITIES
// ============================================================

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) return formatDate(dateString)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

export function getDaysOverdue(dueDateString: string | null): number {
  if (!dueDateString) return 0
  const dueDate = new Date(dueDateString)
  const now = new Date()
  if (now <= dueDate) return 0
  return Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
}

export function getDaysUntilDue(dueDateString: string | null): number {
  if (!dueDateString) return 0
  const dueDate = new Date(dueDateString)
  const now = new Date()
  if (now >= dueDate) return 0
  return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function calculateDueDate(durationDays: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + durationDays)
  return date
}

// ============================================================
// STATUS UTILITIES
// ============================================================

export function getBorrowingStatusColor(status: BorrowingStatus): string {
  const colors: Record<BorrowingStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-blue-100 text-blue-800 border-blue-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    borrowed: 'bg-green-100 text-green-800 border-green-200',
    returned: 'bg-gray-100 text-gray-800 border-gray-200',
    overdue: 'bg-orange-100 text-orange-800 border-orange-200',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-800'
}

export function getBorrowingStatusLabel(status: BorrowingStatus): string {
  const labels: Record<BorrowingStatus, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    borrowed: 'Borrowed',
    returned: 'Returned',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
  }
  return labels[status] ?? status
}

export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    admin: 'bg-purple-100 text-purple-800',
    librarian: 'bg-blue-100 text-blue-800',
    student: 'bg-green-100 text-green-800',
  }
  return colors[role] ?? 'bg-gray-100 text-gray-800'
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'Administrator',
    librarian: 'Librarian',
    student: 'Student',
  }
  return labels[role] ?? role
}

export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    borrow_request: '📚',
    approved: '✅',
    rejected: '❌',
    due_soon: '⏰',
    overdue: '🚨',
    returned: '📗',
  }
  return icons[type] ?? '🔔'
}

// ============================================================
// STRING UTILITIES
// ============================================================

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ============================================================
// PAGINATION UTILITIES
// ============================================================

export function getPaginationRange(page: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  if (page <= 3) {
    return [1, 2, 3, 4, '...', totalPages]
  }

  if (page >= totalPages - 2) {
    return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, '...', page - 1, page, page + 1, '...', totalPages]
}

// ============================================================
// FILE UTILITIES
// ============================================================

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  return validTypes.includes(file.type)
}

export function isValidImageSize(file: File, maxMB = 5): boolean {
  return file.size <= maxMB * 1024 * 1024
}

// ============================================================
// NUMBER UTILITIES
// ============================================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}
