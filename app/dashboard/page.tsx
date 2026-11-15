import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { demoBooks } from '@/lib/demo-books'
import type { Profile } from '@/types'

type DashboardBook = { id: string; title: string; author: string; total_copies: number; available_copies: number }
type DashboardTransaction = {
  id: string
  status: string
  request_date: string
  due_date: string | null
  book: { title: string; author: string } | null
  borrower?: { full_name: string } | null
}

function formatStatus(status: string) {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value: string | null) {
  if (!value) return 'Date pending'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export default async function DashboardPage() {
  let profile: Profile | null = null
  let books: DashboardBook[] = []
  let transactions: DashboardTransaction[] = []
  let pendingCount = 0
  let overdueCount = 0
  let activeCount = 0
  let catalogError = false

  try {
    const supabase = await createClient()
    const [{ data: authData }, bookResult] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('books').select('id, title, author, total_copies, available_copies').eq('status', 'active').order('title').limit(200),
    ])
    if (authData.user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', authData.user.id).maybeSingle()
      profile = data as Profile | null
    }
    if (bookResult.error) catalogError = true
    else books = (bookResult.data ?? []) as DashboardBook[]

    if (profile) {
      let recentQuery = supabase.from('borrowing_transactions').select('id,status,request_date,due_date,book:books(title,author),borrower:profiles!borrowing_transactions_borrower_id_fkey(full_name)').order('request_date', { ascending: false }).limit(6)
      let pendingQuery = supabase.from('borrowing_transactions').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      let overdueQuery = supabase.from('borrowing_transactions').select('id', { count: 'exact', head: true }).eq('status', 'overdue')
      let activeQuery = supabase.from('borrowing_transactions').select('id', { count: 'exact', head: true }).in('status', ['approved', 'borrowed'])
      if (profile.role === 'student') {
        recentQuery = recentQuery.eq('borrower_id', profile.id) as typeof recentQuery
        pendingQuery = pendingQuery.eq('borrower_id', profile.id) as typeof pendingQuery
        overdueQuery = overdueQuery.eq('borrower_id', profile.id) as typeof overdueQuery
        activeQuery = activeQuery.eq('borrower_id', profile.id) as typeof activeQuery
      }
      const [recentResult, pendingResult, overdueResult, activeResult] = await Promise.all([recentQuery, pendingQuery, overdueQuery, activeQuery])
      transactions = (recentResult.data ?? []) as unknown as DashboardTransaction[]
      pendingCount = pendingResult.count ?? 0
      overdueCount = overdueResult.count ?? 0
      activeCount = activeResult.count ?? 0
    }
  } catch {
    catalogError = true
  }

  const totalCopies = books.reduce((sum, book) => sum + book.total_copies, 0)
  const availableCopies = books.reduce((sum, book) => sum + book.available_copies, 0)
  const borrowedCopies = Math.max(0, totalCopies - availableCopies)
  const isStudent = profile?.role === 'student'
  const highlights = books.slice(0, 3)

  return (
    <main className="dashboard-page">
      <section className="dashboard-welcome">
        <div>
          <span className="section-kicker">{profile ? `${profile.role.toUpperCase()} LIBRARY VIEW` : 'HANI LIBRARY'}</span>
          <h1>{profile ? `Welcome back, ${profile.full_name.split(' ')[0]}.` : 'Your library, at a glance.'}</h1>
          <p>{profile ? 'Here is what is happening with your books and requests.' : 'A clear view of the collection, availability, and recent borrowing activity.'}</p>
        </div>
        <Link className="button button-dark" href="/books">Explore books <span aria-hidden="true">↗</span></Link>
      </section>

      {catalogError && <div className="dashboard-alert" role="status">We could not load live library data. Confirm your Supabase URL and key, then apply the database migration in <code>supabase/migrations/001_initial_schema.sql</code>.</div>}

      <section className="dashboard-metrics" aria-label="Library overview">
        <article className="dashboard-metric"><span className="metric-icon">▤</span><span className="metric-label">Book titles</span><strong>{books.length.toLocaleString()}</strong><small>active titles in the catalog</small></article>
        <article className="dashboard-metric"><span className="metric-icon metric-icon-green">↗</span><span className="metric-label">Copies available</span><strong>{availableCopies.toLocaleString()}</strong><small>ready to borrow today</small></article>
        <article className="dashboard-metric"><span className="metric-icon metric-icon-gold">↗</span><span className="metric-label">Currently borrowed</span><strong>{borrowedCopies.toLocaleString()}</strong><small>copies checked out</small></article>
        <article className="dashboard-metric"><span className="metric-icon metric-icon-rose">◷</span><span className="metric-label">{isStudent ? 'My pending requests' : 'Pending requests'}</span><strong>{profile ? pendingCount.toLocaleString() : '—'}</strong><small>{profile ? 'waiting for review' : 'sign in to view requests'}</small></article>
      </section>

      {profile && overdueCount > 0 && <div className="dashboard-alert dashboard-alert-warn" role="status">You have {overdueCount} overdue {overdueCount === 1 ? 'book' : 'books'}. Please contact the library or return them as soon as possible.</div>}

      <section className="dashboard-content-grid">
        <article className="dashboard-panel activity-panel">
          <div className="dashboard-panel-heading"><div><span className="section-kicker">{profile ? 'YOUR ACCOUNT' : 'LIBRARY ACTIVITY'}</span><h2>{profile ? 'Recent borrowing activity' : 'Recent requests'}</h2></div><Link href="/borrow-requests">View all <span aria-hidden="true">→</span></Link></div>
          {transactions.length ? <div className="activity-list">
            {transactions.map((transaction) => (
              <div className="activity-row" key={transaction.id}>
                <span className="activity-avatar" aria-hidden="true">{transaction.book?.title?.slice(0, 1) ?? 'B'}</span>
                <div className="activity-main"><strong>{transaction.book?.title ?? 'Book request'}</strong><span>{isStudent ? 'Your request' : transaction.borrower?.full_name ?? 'Library member'} · {formatDate(transaction.request_date)}</span></div>
                <span className={`transaction-status status-${transaction.status}`}>{formatStatus(transaction.status)}</span>
              </div>
            ))}
          </div> : <div className="dashboard-empty"><span className="empty-icon">✳</span><h3>{profile ? 'No borrowing activity yet' : 'Your next good read is waiting'}</h3><p>{profile ? 'When you request a book, its progress will show up here.' : 'Browse the collection to see what is available. Sign in to submit a borrowing request.'}</p><Link href="/books" className="dashboard-inline-link">Browse the collection <span aria-hidden="true">→</span></Link></div>}
        </article>

        <article className="dashboard-panel quick-panel">
          <div className="dashboard-panel-heading"><div><span className="section-kicker">QUICK ACCESS</span><h2>Make yourself at home</h2></div></div>
          <Link className="quick-link" href="/books"><span className="quick-link-icon">⌕</span><span><strong>Browse the catalog</strong><small>Find a title to borrow</small></span><b aria-hidden="true">↗</b></Link>
          <Link className="quick-link" href="/borrow-requests"><span className="quick-link-icon quick-icon-amber">◷</span><span><strong>Borrow requests</strong><small>Check request progress</small></span><b aria-hidden="true">↗</b></Link>
          <Link className="quick-link" href="/profile"><span className="quick-link-icon quick-icon-blue">◉</span><span><strong>My profile</strong><small>Keep your details up to date</small></span><b aria-hidden="true">↗</b></Link>
          {profile && activeCount > 0 && <div className="loan-summary"><strong>{activeCount}</strong><span>{isStudent ? 'active books on your account' : 'active borrowings across the library'}</span></div>}
        </article>
      </section>

      <section className="dashboard-shelf">
        <div className="dashboard-panel-heading"><div><span className="section-kicker">A PLACE TO START</span><h2>{books.length ? 'On the library shelves' : 'A few reader favorites'}</h2></div><Link href="/books">See the collection <span aria-hidden="true">→</span></Link></div>
        <div className="dashboard-book-grid">{highlights.length ? highlights.map((book) => (
          <article className="dashboard-book" key={book.id}><span className="dashboard-book-mark">BOOK&nbsp; / &nbsp;{book.available_copies > 0 ? 'AVAILABLE' : 'ON LOAN'}</span><h3>{book.title}</h3><p>{book.author}</p><span className={`availability ${book.available_copies === 0 ? 'unavailable' : ''}`}>{book.available_copies} of {book.total_copies} copies available</span></article>
        )) : demoBooks.slice(0, 3).map((book) => (
          <article className="dashboard-book demo-dashboard-book" key={book.title}><span className="dashboard-book-mark">SAMPLE TITLE</span><h3>{book.title}</h3><p>{book.author}</p><span className="availability">Preview on the Books page</span></article>
        ))}</div>
        {!books.length && <p className="dashboard-preview-note">These sample titles are previews only. Add books to Supabase to show live inventory here.</p>}
      </section>
    </main>
  )
}
