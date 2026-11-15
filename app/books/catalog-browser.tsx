'use client'

import { useMemo, useState } from 'react'
import { createBorrowRequest } from '@/lib/actions/borrowings'

export type CatalogBook = {
  id: string | null
  title: string
  author: string
  category: string
  year: number | null
  available: number
  total: number
  shelf: string
  description: string
  cover: string
}

export default function CatalogBrowser({ books, preview }: { books: CatalogBook[]; preview: boolean }) {
  const [search, setSearch] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [pendingBookId, setPendingBookId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, { text: string; success: boolean }>>({})

  const visibleBooks = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase()
    return books.filter((book) => {
      const matchesText = !needle || `${book.title} ${book.author} ${book.category}`.toLocaleLowerCase().includes(needle)
      return matchesText && (!availableOnly || book.available > 0)
    })
  }, [books, search, availableOnly])

  async function requestBook(book: CatalogBook) {
    if (!book.id) return
    setPendingBookId(book.id)
    setMessages((current) => ({ ...current, [book.id!]: { text: '', success: false } }))
    try {
      const result = await createBorrowRequest(book.id)
      setMessages((current) => ({
        ...current,
        [book.id!]: { text: result.success ? 'Request sent for approval.' : result.error ?? 'The request could not be completed.', success: result.success },
      }))
    } catch {
      setMessages((current) => ({ ...current, [book.id!]: { text: 'Please sign in before requesting a book.', success: false } }))
    } finally {
      setPendingBookId(null)
    }
  }

  return (
    <>
      <div className="catalog-controls">
        <label className="catalog-search"><span aria-hidden="true">⌕</span><input aria-label="Search books" placeholder="Search by title, author, or genre" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <button className={`filter-button ${availableOnly ? 'is-active' : ''}`} type="button" aria-pressed={availableOnly} onClick={() => setAvailableOnly((value) => !value)}>Available only <span aria-hidden="true">✓</span></button>
      </div>
      {visibleBooks.length ? <div className="catalog-grid">
        {visibleBooks.map((book, index) => {
          const status = book.id ? messages[book.id] : undefined
          return (
            <article className="catalog-card" key={book.id ?? `${book.title}-${index}`}>
              <div className={`book-cover ${book.cover}`}>
                <span className="cover-index">HANI LIBRARY&nbsp; / &nbsp;{String(index + 1).padStart(2, '0')}</span>
                <span className="cover-title">{book.title}</span>
                <span className="cover-author">{book.author}</span>
                <span className="cover-mark" aria-hidden="true">✳</span>
              </div>
              <div className="catalog-card-body">
                <div className="catalog-card-top"><span className="book-category">{book.category}</span><span className={`availability ${book.available === 0 ? 'unavailable' : ''}`}>{book.available > 0 ? `${book.available} available` : 'On loan'}</span></div>
                <h3>{book.title}</h3><p className="catalog-author">by {book.author}{book.year ? <> <span>·</span> {book.year}</> : null}</p>
                <p className="catalog-description">{book.description}</p>
                <div className="catalog-card-footer"><span>{book.shelf}</span><span>{book.available} / {book.total} copies</span></div>
                {preview ? <span className="preview-book-note">Preview title · not borrowable</span> : <button className="request-book-button" type="button" disabled={!book.available || pendingBookId === book.id} onClick={() => requestBook(book)}>{pendingBookId === book.id ? 'Sending request…' : book.available ? 'Request to borrow' : 'Currently unavailable'}</button>}
                {status?.text && <p className={`request-message ${status.success ? 'is-success' : ''}`} role="status">{status.text}</p>}
              </div>
            </article>
          )
        })}
      </div> : <div className="catalog-empty"><span aria-hidden="true">⌕</span><h3>No books found</h3><p>Try a different title, author, or category.</p><button type="button" onClick={() => { setSearch(''); setAvailableOnly(false) }}>Clear filters</button></div>}
      <p className="demo-note catalog-note">{preview ? 'Sample books are only a visual preview. Add titles to the Supabase catalog to enable borrowing.' : 'Borrowing requests are sent to the library team for approval.'}</p>
    </>
  )
}
