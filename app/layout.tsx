import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hani Library — Stories worth sharing',
  description: 'Discover your next favorite book and keep your borrowing organized with Hani Library.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link className="brand" href="/" aria-label="Hani Library home"><span className="brand-mark">h.</span><span className="brand-name">hani<span>library</span></span></Link>
            <nav className="main-nav" aria-label="Main navigation">
              <Link href="/">Home</Link><Link href="/books">Books</Link><Link href="/dashboard">Dashboard</Link>
            </nav>
            <Link className="header-cta" href="/books">Browse books <span aria-hidden="true">↗</span></Link>
          </div>
        </header>
        {children}
        <footer className="site-footer"><Link className="footer-brand" href="/">hani<span>library</span></Link><span>A little more curiosity, every day.</span><span>MADE FOR READERS&nbsp; · &nbsp;© 2026</span></footer>
      </body>
    </html>
  )
}
