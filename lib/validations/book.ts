import { z } from 'zod'

export const bookSchema = z.object({
  isbn: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(500),
  author: z.string().min(1, 'Author is required').max(255),
  publisher: z.string().optional(),
  publication_year: z.coerce.number()
    .min(1000, 'Invalid year')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future')
    .optional()
    .nullable(),
  category_id: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  total_copies: z.coerce.number().min(1, 'Must have at least 1 copy'),
  available_copies: z.coerce.number().min(0, 'Available copies cannot be negative'),
  shelf_location: z.string().optional(),
  status: z.enum(['active', 'archived', 'discontinued']).default('active'),
}).refine(data => data.available_copies <= data.total_copies, {
  message: 'Available copies cannot exceed total copies',
  path: ['available_copies'],
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().optional(),
})

export type BookInput = z.infer<typeof bookSchema>
export type CategoryInput = z.infer<typeof categorySchema>
