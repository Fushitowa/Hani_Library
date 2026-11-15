-- Add a small starter collection so a fresh library is usable immediately.
-- Safe to run more than once: existing title/author pairs are left unchanged.

INSERT INTO categories (name, description) VALUES
  ('Fantasy', 'Fantasy novels and imaginative worlds'),
  ('Classic Fiction', 'Enduring works of classic literature'),
  ('Personal Growth', 'Practical books about habits and personal development')
ON CONFLICT (name) DO NOTHING;

WITH starter_books (title, author, publisher, publication_year, category_name, description, total_copies, available_copies, shelf_location) AS (
  VALUES
    ('The Hobbit', 'J. R. R. Tolkien', 'George Allen & Unwin', 1937, 'Fantasy', 'A quiet life, an unexpected journey, and a world full of wonder.', 4, 3, 'FIC-A12'),
    ('Pride and Prejudice', 'Jane Austen', 'T. Egerton', 1813, 'Classic Fiction', 'A warm, sharp story about first impressions, family, and love.', 3, 2, 'FIC-B04'),
    ('The Little Prince', 'Antoine de Saint-Exupery', 'Reynal & Hitchcock', 1943, 'Fiction', 'A thoughtful fable about friendship, imagination, and seeing with the heart.', 2, 1, 'FIC-C18'),
    ('Atomic Habits', 'James Clear', 'Avery', 2018, 'Personal Growth', 'Practical ideas for building better routines through small, lasting changes.', 5, 4, '155.24-C02'),
    ('To Kill a Mockingbird', 'Harper Lee', 'J. B. Lippincott & Co.', 1960, 'Literature', 'A coming-of-age story exploring empathy, justice, and community.', 3, 2, 'FIC-D11'),
    ('The Alchemist', 'Paulo Coelho', 'HarperTorch', 1988, 'Fiction', 'A young shepherd follows a dream and discovers what matters along the way.', 2, 0, 'FIC-E06')
)
INSERT INTO books (
  title, author, publisher, publication_year, category_id, description,
  total_copies, available_copies, shelf_location, status
)
SELECT
  starter_books.title,
  starter_books.author,
  starter_books.publisher,
  starter_books.publication_year,
  categories.id,
  starter_books.description,
  starter_books.total_copies,
  starter_books.available_copies,
  starter_books.shelf_location,
  'active'
FROM starter_books
JOIN categories ON categories.name = starter_books.category_name
WHERE NOT EXISTS (
  SELECT 1
  FROM books
  WHERE books.title = starter_books.title
    AND books.author = starter_books.author
);
