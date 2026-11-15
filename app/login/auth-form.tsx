'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { loginAction, registerAction } from './actions'

const initialState = { error: null as string | null }

export function LoginForm({ registered = false }: { registered?: boolean }) {
  const [state, action, pending] = useActionState(loginAction, initialState)
  return (
    <>
      {registered && <p className="auth-success" role="status">Your account was created. If email confirmation is enabled, check your inbox before signing in.</p>}
      <form className="auth-form" action={action}>
        <label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required placeholder="Enter your password" /></label>
        {state.error && <p className="auth-error" role="alert">{state.error}</p>}
        <button className="button button-dark auth-submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}<span aria-hidden="true">→</span></button>
      </form>
      <p className="auth-switch">New to Hani Library? <Link href="/register">Create an account</Link></p>
    </>
  )
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialState)
  return (
    <>
      <form className="auth-form" action={action}>
        <label>Full name<input name="full_name" autoComplete="name" required placeholder="Your name" /></label>
        <label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
        <div className="auth-form-row"><label>Student ID <span>(optional)</span><input name="student_id" autoComplete="off" placeholder="e.g. 2026-00123" /></label><label>Department <span>(optional)</span><input name="department" placeholder="Your department" /></label></div>
        <label>Password<input name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" /></label>
        <label>Confirm password<input name="confirm_password" type="password" autoComplete="new-password" required minLength={8} placeholder="Enter it again" /></label>
        {state.error && <p className="auth-error" role="alert">{state.error}</p>}
        <button className="button button-dark auth-submit" disabled={pending}>{pending ? 'Creating account…' : 'Create account'}<span aria-hidden="true">→</span></button>
      </form>
      <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
    </>
  )
}
