export type DemoBook = {
  title: string
  author: string
  category: string
  year: number
  available: number
  total: number
  shelf: string
  description: string
  cover: string
  initials: string
}

export const demoBooks: DemoBook[] = [
  {
    title: 'The Hobbit',
    author: 'J. R. R. Tolkien',
    category: 'Fantasy',
    year: 1937,
    available: 3,
    total: 4,
    shelf: 'FIC · A12',
    description: 'A quiet life, an unexpected journey, and a world full of wonder.',
    cover: 'cover-forest',
    initials: 'TH',
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    category: 'Classic fiction',
    year: 1813,
    available: 2,
    total: 3,
    shelf: 'FIC · B04',
    description: 'A sharp, warm-hearted story about first impressions and finding your own way.',
    cover: 'cover-rose',
    initials: 'P&P',
  },
  {
    title: 'The Little Prince',
    author: 'Antoine de Saint-Exupéry',
    category: 'Fiction',
    year: 1943,
    available: 1,
    total: 2,
    shelf: 'FIC · C18',
    description: 'A thoughtful fable about friendship, imagination, and seeing with the heart.',
    cover: 'cover-sky',
    initials: 'LP',
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Personal growth',
    year: 2018,
    available: 4,
    total: 5,
    shelf: '155.24 · C02',
    description: 'Practical ideas for building better routines through small, lasting changes.',
    cover: 'cover-sun',
    initials: 'AH',
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    category: 'Classic fiction',
    year: 1960,
    available: 2,
    total: 3,
    shelf: 'FIC · D11',
    description: 'A coming-of-age story exploring empathy, justice, and community.',
    cover: 'cover-clay',
    initials: 'TK',
  },
  {
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    category: 'Fiction',
    year: 1988,
    available: 0,
    total: 2,
    shelf: 'FIC · E06',
    description: 'A young shepherd follows a dream and discovers what matters along the way.',
    cover: 'cover-night',
    initials: 'TA',
  },
]
