import Link from 'next/link'
import { demoBooks } from '@/lib/demo-books'

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> YOUR NEXT CHAPTER STARTS HERE</span>
          <h1>A little more<br /><span>curiosity, every day.</span></h1>
          <p className="hero-description">Find your next favorite read, keep track of what you borrow, and make more room for the stories that stay with you.</p>
          <div className="hero-actions">
            <Link className="button button-dark" href="/books">Explore the collection <span aria-hidden="true">↗</span></Link>
            <Link className="button button-light" href="/dashboard">Go to dashboard</Link>
          </div>
          <div className="hero-note"><span className="avatar-stack"><i>H</i><i>B</i><i>R</i></span><span>A welcoming place for curious readers</span></div>
        </div>
        <div className="hero-art" aria-label="A stack of books ready to be borrowed">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-sparkle sparkle-one">✳</div>
          <div className="art-sparkle sparkle-two">✦</div>
          <div className="hero-book hero-book-back"><span>THE ART OF<br />SLOW LIVING</span><i>✺</i></div>
          <div className="hero-book hero-book-middle"><i>✳</i><span>GROW<br />THROUGH<br />WHAT YOU<br />GO THROUGH</span></div>
          <div className="hero-book hero-book-front"><span>THE<br /><b>BOOK</b><br />OF DAYS</span><i>HANI LIBRARY</i></div>
          <div className="art-caption"><span>OPEN A BOOK.</span><span>OPEN A WORLD.</span></div>
        </div>
        <div className="hero-bottomline"><span>GOOD BOOKS. GOOD COMPANY.</span><span>EST. FOR READERS &amp; DREAMERS&nbsp; · &nbsp;01—06</span></div>
      </section>

      <section className="collection-section" aria-labelledby="featured-heading">
        <div className="section-heading">
          <div><span className="section-kicker">A FEW GOOD PLACES TO START</span><h2 id="featured-heading">Picked for your next<br className="desktop-break" /> quiet moment.</h2></div>
          <Link className="text-link" href="/books">View all books <span aria-hidden="true">→</span></Link>
        </div>
        <div className="featured-grid">
          {demoBooks.slice(0, 3).map((book, index) => (
            <article className="featured-card" key={book.title}>
              <div className={`book-cover ${book.cover}`}><span className="cover-index">HANI LIBRARY&nbsp; / &nbsp;{String(index + 1).padStart(2, '0')}</span><span className="cover-title">{book.title}</span><span className="cover-author">{book.author}</span><span className="cover-mark">✳</span></div>
              <div className="featured-meta"><div><span className="book-category">{book.category}</span><h3>{book.title}</h3><p>{book.author}</p></div><span className={`availability ${book.available === 0 ? 'unavailable' : ''}`}>{book.available > 0 ? 'Available' : 'On loan'}</span></div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-cta"><div><span className="section-kicker">YOUR LIBRARY, AT YOUR PACE</span><h2>Find a story that feels like yours.</h2></div><Link className="button button-dark" href="/books">Browse all books <span aria-hidden="true">↗</span></Link></section>
      <p className="demo-note">Sample titles shown for preview. Your library’s live catalog can be connected through Supabase.</p>
    </div>
  )
}
