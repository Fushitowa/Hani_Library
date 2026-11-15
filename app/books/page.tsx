import Link from 'next/link'
import { getBooks } from '@/lib/actions/books'
import { demoBooks } from '@/lib/demo-books'
import CatalogBrowser, { type CatalogBook } from './catalog-browser'

const coverStyles = ['cover-forest', 'cover-rose', 'cover-sky', 'cover-sun', 'cover-clay', 'cover-night']

async function loadCatalog(): Promise<{ books: CatalogBook[]; isPreview: boolean; hasError: boolean }> {
  try {
    const result = await getBooks({ status: 'active', page_size: 100, sort_by: 'title' })
    if (result.data.length) {
      return {
        books: result.data.map((book, index) => {
          const category = Array.isArray(book.category) ? book.category[0] : book.category
          return {
            id: book.id,
            title: book.title,
            author: book.author,
            category: category?.name ?? 'General',
            year: book.publication_year,
            available: book.available_copies,
            total: book.total_copies,
            shelf: book.shelf_location ?? 'Location not set',
            description: book.description ?? 'Ask the library team for more information about this title.',
            cover: coverStyles[index % coverStyles.length],
          }
        }),
        isPreview: false,
        hasError: false,
      }
    }
    return { books: demoBooks.map((book) => ({ ...book, id: null })), isPreview: true, hasError: false }
  } catch {
    return { books: demoBooks.map((book) => ({ ...book, id: null })), isPreview: true, hasError: true }
  }
}

export default async function BooksPage() {
  const catalog = await loadCatalog()
  const availableCount = catalog.books.filter((book) => book.available > 0).length

  return (
    <main className="catalog-page">
      <section className="catalog-intro">
        <div className="catalog-breadcrumb"><Link href="/">Home</Link><span>/</span><span>Collection</span></div>
        <span className="section-kicker">THE HANI BOOKSHELF</span>
        <h1>Find your next<br /><span>favorite read.</span></h1>
        <p>Browse the library collection, check what is available, and send a borrowing request for a book you love.</p>
        <div className="catalog-stats"><span><strong>{catalog.books.length}</strong> {catalog.isPreview ? 'sample titles' : 'books in the collection'}</span><i /> <span><strong>{availableCount}</strong> available now</span></div>
      </section>

      {catalog.hasError && <div className="catalog-alert" role="status">We could not reach the live catalog. Showing sample titles for now. Check your Supabase settings and database migration.</div>}
      {catalog.isPreview && !catalog.hasError && <div className="catalog-alert" role="status">Your live catalog is empty, so these sample titles are shown as a preview. Add books through your library database to make them borrowable.</div>}

      <section className="catalog-section" aria-labelledby="catalog-heading">
        <div className="catalog-toolbar"><div><span className="section-kicker">THE COLLECTION</span><h2 id="catalog-heading">Books to get lost in</h2></div><span className="demo-pill">{catalog.isPreview ? 'SAMPLE PREVIEW' : 'LIVE CATALOG'}</span></div>
        <CatalogBrowser books={catalog.books} preview={catalog.isPreview} />
      </section>
    </main>
  )
}
