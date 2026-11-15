import Link from 'next/link'
import { RegisterForm } from '@/app/login/auth-form'

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <section className="auth-card auth-card-register">
        <Link href="/" className="auth-back">← Back to library</Link>
        <span className="section-kicker">JOIN THE HANI COMMUNITY</span>
        <h1>Make room for<br /><em>more stories.</em></h1>
        <p className="auth-intro">Create your reader account to request books and track your borrowing.</p>
        <RegisterForm />
        <p className="auth-footnote">Your details stay with your library account.</p>
      </section>
      <aside className="auth-art"><span className="auth-art-kicker">YOUR NEXT CHAPTER</span><strong>starts with<br /><em>one page.</em></strong><span className="auth-art-mark">✳</span><span className="auth-art-foot">HANI LIBRARY&nbsp; · &nbsp;MADE FOR READERS</span></aside>
    </main>
  )
}
