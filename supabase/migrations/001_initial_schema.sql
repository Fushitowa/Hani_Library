-- ============================================================
-- BOOK BORROWING MANAGEMENT SYSTEM
-- Initial Database Schema Migration
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: categories
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),



  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: profiles (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  student_id VARCHAR(50) UNIQUE,
  department VARCHAR(100),
  contact_number VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'librarian', 'student')),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: books
-- ============================================================
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  isbn VARCHAR(20),
  title VARCHAR(500) NOT NULL,
  author VARCHAR(255) NOT NULL,
  publisher VARCHAR(255),
  publication_year INTEGER CHECK (publication_year >= 1000 AND publication_year <= 9999),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  cover_url TEXT,
  total_copies INTEGER NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
  available_copies INTEGER NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
  shelf_location VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'discontinued')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT available_lte_total CHECK (available_copies <= total_copies)
);

-- ============================================================
-- TABLE: borrowing_transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS borrowing_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  borrower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  request_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approval_date TIMESTAMPTZ,
  borrowed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'borrowed', 'returned', 'overdue', 'cancelled')),
  renewal_count INTEGER NOT NULL DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'borrow_request', 'approved', 'rejected', 'due_soon', 'overdue', 'returned')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  related_transaction_id UUID REFERENCES borrowing_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: borrowing_policies
-- ============================================================
CREATE TABLE IF NOT EXISTS borrowing_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  max_books_per_user INTEGER NOT NULL DEFAULT 3 CHECK (max_books_per_user > 0),
  borrowing_duration_days INTEGER NOT NULL DEFAULT 14 CHECK (borrowing_duration_days > 0),
  max_renewals INTEGER NOT NULL DEFAULT 2 CHECK (max_renewals >= 0),
  overdue_penalty_per_day DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (overdue_penalty_per_day >= 0),
  allow_renewals BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: activity_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

CREATE INDEX IF NOT EXISTS idx_borrowing_borrower ON borrowing_transactions(borrower_id);
CREATE INDEX IF NOT EXISTS idx_borrowing_book ON borrowing_transactions(book_id);
CREATE INDEX IF NOT EXISTS idx_borrowing_status ON borrowing_transactions(status);
CREATE INDEX IF NOT EXISTS idx_borrowing_due_date ON borrowing_transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_borrowing_request_date ON borrowing_transactions(request_date);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- ============================================================
-- FUNCTION: auto-update updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_borrowing_updated_at
  BEFORE UPDATE ON borrowing_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCTION: handle new user (create profile on signup)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    student_id,
    department,
    contact_number,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'User'),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'student_id', ''),
    NULLIF(NEW.raw_user_meta_data->>'department', ''),
    NULLIF(NEW.raw_user_meta_data->>'contact_number', ''),
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCTION: borrow book (atomic transaction)
-- ============================================================
CREATE OR REPLACE FUNCTION borrow_book(
  p_borrower_id UUID,
  p_book_id UUID,
  p_due_date TIMESTAMPTZ,
  p_approved_by UUID
)
RETURNS borrowing_transactions AS $$
DECLARE
  v_transaction borrowing_transactions;
  v_available INTEGER;
  v_policy borrowing_policies%ROWTYPE;
  v_active_count INTEGER;
BEGIN
  -- Lock the book row to prevent race conditions
  SELECT available_copies INTO v_available
  FROM books
  WHERE id = p_book_id AND status = 'active'
  FOR UPDATE;

  IF v_available IS NULL THEN
    RAISE EXCEPTION 'Book not found or not available for borrowing';
  END IF;

  IF v_available < 1 THEN
    RAISE EXCEPTION 'No copies available for this book';
  END IF;

  -- Get borrowing policy
  SELECT * INTO v_policy FROM borrowing_policies LIMIT 1;

  -- Check active borrowing count for user
  SELECT COUNT(*) INTO v_active_count
  FROM borrowing_transactions
  WHERE borrower_id = p_borrower_id
    AND status IN ('approved', 'borrowed');

  IF v_active_count >= COALESCE(v_policy.max_books_per_user, 3) THEN
    RAISE EXCEPTION 'Borrowing limit reached. Maximum allowed: %', COALESCE(v_policy.max_books_per_user, 3);
  END IF;

  -- Check for duplicate active request
  IF EXISTS (
    SELECT 1 FROM borrowing_transactions
    WHERE borrower_id = p_borrower_id
      AND book_id = p_book_id
      AND status IN ('pending', 'approved', 'borrowed')
  ) THEN
    RAISE EXCEPTION 'You already have an active request or borrowing for this book';
  END IF;

  -- Decrement available copies
  UPDATE books
  SET available_copies = available_copies - 1
  WHERE id = p_book_id;

  -- Update transaction to borrowed status
  UPDATE borrowing_transactions
  SET
    status = 'borrowed',
    borrowed_at = NOW(),
    due_date = p_due_date,
    approved_by = p_approved_by,
    approval_date = NOW()
  WHERE borrower_id = p_borrower_id
    AND book_id = p_book_id
    AND status = 'approved'
  RETURNING * INTO v_transaction;

  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: approve borrow request
-- ============================================================
CREATE OR REPLACE FUNCTION approve_borrow_request(
  p_transaction_id UUID,
  p_approved_by UUID,
  p_due_date TIMESTAMPTZ
)
RETURNS borrowing_transactions AS $$
DECLARE
  v_transaction borrowing_transactions;
  v_available INTEGER;
  v_policy borrowing_policies%ROWTYPE;
  v_active_count INTEGER;
BEGIN
  -- Get and lock transaction
  SELECT * INTO v_transaction
  FROM borrowing_transactions
  WHERE id = p_transaction_id AND status = 'pending'
  FOR UPDATE;

  IF v_transaction.id IS NULL THEN
    RAISE EXCEPTION 'Transaction not found or not in pending status';
  END IF;

  -- Lock and check book availability
  SELECT available_copies INTO v_available
  FROM books
  WHERE id = v_transaction.book_id AND status = 'active'
  FOR UPDATE;

  IF v_available IS NULL OR v_available < 1 THEN
    RAISE EXCEPTION 'Book is no longer available';
  END IF;

  -- Get policy
  SELECT * INTO v_policy FROM borrowing_policies LIMIT 1;

  -- Check borrowing limit
  SELECT COUNT(*) INTO v_active_count
  FROM borrowing_transactions
  WHERE borrower_id = v_transaction.borrower_id
    AND status IN ('approved', 'borrowed')
    AND id != p_transaction_id;

  IF v_active_count >= COALESCE(v_policy.max_books_per_user, 3) THEN
    RAISE EXCEPTION 'Borrower has reached their borrowing limit';
  END IF;

  -- Decrement inventory
  UPDATE books
  SET available_copies = available_copies - 1
  WHERE id = v_transaction.book_id;

  -- Update transaction
  UPDATE borrowing_transactions
  SET
    status = 'borrowed',
    approval_date = NOW(),
    borrowed_at = NOW(),
    due_date = p_due_date,
    approved_by = p_approved_by
  WHERE id = p_transaction_id
  RETURNING * INTO v_transaction;

  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: return book (atomic transaction)
-- ============================================================
CREATE OR REPLACE FUNCTION return_book(
  p_transaction_id UUID,
  p_returned_by UUID,
  p_remarks TEXT DEFAULT NULL
)
RETURNS borrowing_transactions AS $$
DECLARE
  v_transaction borrowing_transactions;
BEGIN
  -- Get and lock the transaction
  SELECT * INTO v_transaction
  FROM borrowing_transactions
  WHERE id = p_transaction_id
    AND status IN ('borrowed', 'overdue')
  FOR UPDATE;

  IF v_transaction.id IS NULL THEN
    RAISE EXCEPTION 'Transaction not found or book already returned';
  END IF;

  -- Restore available copies
  UPDATE books
  SET available_copies = available_copies + 1
  WHERE id = v_transaction.book_id;

  -- Mark transaction as returned
  UPDATE borrowing_transactions
  SET
    status = 'returned',
    returned_at = NOW(),
    remarks = COALESCE(p_remarks, remarks)
  WHERE id = p_transaction_id
  RETURNING * INTO v_transaction;

  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: mark overdue transactions
-- ============================================================
CREATE OR REPLACE FUNCTION mark_overdue_transactions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE borrowing_transactions
  SET status = 'overdue'
  WHERE status = 'borrowed'
    AND due_date < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SEED DATA: Default categories
-- ============================================================
INSERT INTO categories (name, description) VALUES
  ('Fiction', 'Novels, short stories, and other fictional works'),
  ('Non-Fiction', 'Factual books, biographies, and educational content'),
  ('Science & Technology', 'Books on science, engineering, and technology'),
  ('History', 'Historical accounts and historical analysis'),
  ('Mathematics', 'Mathematics, statistics, and related fields'),
  ('Literature', 'Classic and contemporary literary works'),
  ('Philosophy', 'Philosophy, ethics, and critical thinking'),
  ('Psychology', 'Psychology, mental health, and behavior'),
  ('Business', 'Business, economics, and management'),
  ('Arts & Design', 'Visual arts, design, and creative works'),
  ('Reference', 'Encyclopedias, dictionaries, and reference materials'),
  ('Computer Science', 'Programming, algorithms, and computer systems')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED DATA: Default borrowing policy
-- ============================================================
INSERT INTO borrowing_policies (max_books_per_user, borrowing_duration_days, max_renewals, overdue_penalty_per_day, allow_renewals)
VALUES (3, 14, 2, 5.00, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowing_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS HELPER FUNCTION: get current user role
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- RLS POLICIES: profiles
-- ============================================================
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Admins and librarians can read all profiles
CREATE POLICY "Staff can read all profiles"
  ON profiles FOR SELECT
  USING (get_user_role() IN ('admin', 'librarian'));

-- Users can update their own profile (not role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Admins can update any profile including role
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (get_user_role() = 'admin');

-- Allow insert via trigger (service role)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================
-- RLS POLICIES: books
-- ============================================================
-- Everyone can read active books
CREATE POLICY "Anyone can read active books"
  ON books FOR SELECT
  USING (status = 'active' OR get_user_role() IN ('admin', 'librarian'));

-- Only admin/librarian can insert books
CREATE POLICY "Staff can insert books"
  ON books FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'librarian'));

-- Only admin/librarian can update books
CREATE POLICY "Staff can update books"
  ON books FOR UPDATE
  USING (get_user_role() IN ('admin', 'librarian'));

-- Only admin can delete books
CREATE POLICY "Admins can delete books"
  ON books FOR DELETE
  USING (get_user_role() = 'admin');

-- ============================================================
-- RLS POLICIES: categories
-- ============================================================
CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  USING (TRUE);

CREATE POLICY "Staff can manage categories"
  ON categories FOR ALL
  USING (get_user_role() IN ('admin', 'librarian'));

-- ============================================================
-- RLS POLICIES: borrowing_transactions
-- ============================================================
-- Students can read their own transactions
CREATE POLICY "Students can read own transactions"
  ON borrowing_transactions FOR SELECT
  USING (borrower_id = auth.uid());

-- Staff can read all transactions
CREATE POLICY "Staff can read all transactions"
  ON borrowing_transactions FOR SELECT
  USING (get_user_role() IN ('admin', 'librarian'));

-- Students can create pending requests
CREATE POLICY "Students can create borrow requests"
  ON borrowing_transactions FOR INSERT
  WITH CHECK (
    borrower_id = auth.uid() AND
    status = 'pending'
  );

-- Students can cancel their own pending requests
CREATE POLICY "Students can cancel own pending requests"
  ON borrowing_transactions FOR UPDATE
  USING (
    borrower_id = auth.uid() AND
    status = 'pending'
  )
  WITH CHECK (
    borrower_id = auth.uid() AND
    status = 'cancelled'
  );

-- Staff can update all transactions
CREATE POLICY "Staff can update all transactions"
  ON borrowing_transactions FOR UPDATE
  USING (get_user_role() IN ('admin', 'librarian'));

-- ============================================================
-- RLS POLICIES: notifications
-- ============================================================
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications (mark read)"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Staff can read all notifications"
  ON notifications FOR SELECT
  USING (get_user_role() IN ('admin', 'librarian'));

-- ============================================================
-- RLS POLICIES: borrowing_policies
-- ============================================================
CREATE POLICY "Anyone can read policies"
  ON borrowing_policies FOR SELECT
  USING (TRUE);

CREATE POLICY "Only admins can manage policies"
  ON borrowing_policies FOR ALL
  USING (get_user_role() = 'admin');

-- ============================================================
-- RLS POLICIES: activity_logs
-- ============================================================
CREATE POLICY "Admins can read all logs"
  ON activity_logs FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "Service can insert logs"
  ON activity_logs FOR INSERT
  WITH CHECK (TRUE);
