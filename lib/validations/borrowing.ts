import { z } from 'zod'

export const borrowRequestSchema = z.object({
  book_id: z.string().uuid('Invalid book ID'),
  remarks: z.string().max(500).optional(),
})

export const returnBookSchema = z.object({
  transaction_id: z.string().uuid('Invalid transaction ID'),
  remarks: z.string().max(500).optional(),
})

export const borrowingPolicySchema = z.object({
  max_books_per_user: z.coerce.number().min(1).max(20),
  borrowing_duration_days: z.coerce.number().min(1).max(365),
  max_renewals: z.coerce.number().min(0).max(10),
  overdue_penalty_per_day: z.coerce.number().min(0),
  allow_renewals: z.boolean(),
})

export const userManagementSchema = z.object({
  full_name: z.string().min(2).max(255),
  email: z.string().email(),
  student_id: z.string().optional(),
  department: z.string().optional(),
  contact_number: z.string().optional(),
  role: z.enum(['admin', 'librarian', 'student']),
  is_active: z.boolean().default(true),
})

export type BorrowRequestInput = z.infer<typeof borrowRequestSchema>
export type ReturnBookInput = z.infer<typeof returnBookSchema>
export type BorrowingPolicyInput = z.infer<typeof borrowingPolicySchema>
export type UserManagementInput = z.infer<typeof userManagementSchema>
