// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { loginSchema, registerSchema, forgotPasswordSchema, updateProfileSchema } from '@/lib/validations/auth'
import { ApiResponse, Profile } from '@/types'

// ============================================================
// SIGN IN
// ============================================================
export async function signIn(formData: FormData): Promise<ApiResponse<null>> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const result = loginSchema.safeParse(raw)
  if (!result.success) {
    return { data: null, error: result.error.issues[0].message, success: false }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(result.data)

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ============================================================
// SIGN UP
// ============================================================
export async function signUp(formData: FormData): Promise<ApiResponse<null>> {
  const raw = {
    full_name: formData.get('full_name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirm_password: formData.get('confirm_password') as string,
    student_id: formData.get('student_id') as string || undefined,
    department: formData.get('department') as string || undefined,
    contact_number: formData.get('contact_number') as string || undefined,
  }

  const result = registerSchema.safeParse(raw)
  if (!result.success) {
    return { data: null, error: result.error.issues[0].message, success: false }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        full_name: result.data.full_name,
        student_id: result.data.student_id,
        department: result.data.department,
        contact_number: result.data.contact_number,
      },
    },
  })

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  return { data: null, error: null, success: true }
}

// ============================================================
// SIGN OUT
// ============================================================
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

// ============================================================
// FORGOT PASSWORD
// ============================================================
export async function forgotPassword(formData: FormData): Promise<ApiResponse<null>> {
  const raw = { email: formData.get('email') as string }

  const result = forgotPasswordSchema.safeParse(raw)
  if (!result.success) {
    return { data: null, error: result.error.issues[0].message, success: false }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  })

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  return { data: null, error: null, success: true }
}

// ============================================================
// GET CURRENT USER PROFILE
// ============================================================
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

// ============================================================
// UPDATE PROFILE
// ============================================================
export async function updateProfile(formData: FormData): Promise<ApiResponse<Profile>> {
  const raw = {
    full_name: formData.get('full_name') as string,
    student_id: formData.get('student_id') as string || undefined,
    department: formData.get('department') as string || undefined,
    contact_number: formData.get('contact_number') as string || undefined,
  }

  const result = updateProfileSchema.safeParse(raw)
  if (!result.success) {
    return { data: null, error: result.error.issues[0].message, success: false }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Not authenticated', success: false }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: result.data.full_name,
      student_id: result.data.student_id ?? null,
      department: result.data.department ?? null,
      contact_number: result.data.contact_number ?? null,
    })
    // @ts-ignore
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  revalidatePath('/profile')
  return { data, error: null, success: true }
}

// ============================================================
// UPDATE USER ROLE (Admin only)
// ============================================================
export async function updateUserRole(userId: string, role: 'admin' | 'librarian' | 'student'): Promise<ApiResponse<null>> {
  const supabase = await createClient()
  const profile = await getCurrentProfile()

  if (!profile || profile.role !== 'admin') {
    return { data: null, error: 'Unauthorized', success: false }
  }

  // Use admin client to bypass RLS for role changes
  const adminClient = await createAdminClient()
// @ts-ignore
const { error } = await adminClient
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  revalidatePath('/users')
  return { data: null, error: null, success: true }
}