'use server'

import { redirect } from 'next/navigation'
import { signIn, signUp } from '@/lib/actions/auth'

export async function loginAction(_previousState: { error: string | null }, formData: FormData) {
  const result = await signIn(formData)
  return { error: result.error }
}

export async function registerAction(_previousState: { error: string | null }, formData: FormData) {
  const result = await signUp(formData)
  if (result.error) return { error: result.error }
  redirect('/login?registered=1')
}
