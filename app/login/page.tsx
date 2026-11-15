import Link from 'next/link'
import { LoginForm } from './auth-form'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registered?: string }> }) {
  const params = await searchParams
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="auth-back">← Back to library</Link>
        <span className="section-kicker">WELCOME BACK</span>
        <h1>Good to see<br /><em>you again.</em></h1>
        <p className="auth-intro">Sign in to manage your requests and keep your reading close.</p>
        <LoginForm registered={params.registered === '1'} />
        <p className="auth-footnote">Your account is protected by Supabase authentication.</p>
      </section>
      <aside className="auth-art"><span className="auth-art-kicker">A GOOD BOOK IS</span><strong>an open<br />door to<br /><em>somewhere.</em></strong><span className="auth-art-mark">✳</span><span className="auth-art-foot">HANI LIBRARY&nbsp; · &nbsp;MADE FOR READERS</span></aside>
    </main>
  )
}
