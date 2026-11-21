# Hani Library

A modern book-borrowing management system designed to make library resources easier to browse, request, and manage.

## Project Overview

I created this project for my classmates and to gain practical experience in building a complete web application. The goal was to turn a familiar school activity—finding and borrowing books—into a simple, organized, and user-friendly digital experience.

Hani Library is my opportunity to apply and strengthen my skills in full-stack development, database design, authentication, and responsive interface development. It is also a learning project built around real library needs: students should be able to explore available books, view borrowing information, and submit requests, while library staff should have clear tools for organizing the collection and reviewing borrowing activity.

I chose to build this project as a classmate-friendly system rather than only as a technical exercise. By designing the application around an understandable everyday process, I could practice turning user needs into features, designing a structured database, and creating interfaces that feel clear and approachable.

## Key Features

- Responsive library dashboard
- Book catalog with title, author, and genre search
- Availability filtering
- Live book inventory from Supabase
- Student and library role profiles
- Borrowing request interface
- Borrowing and overdue status presentation
- Category, copy, and shelf-location database support
- Supabase authentication and account registration
- Database migrations and sample book data

> The project is actively being developed. Some pages, such as the borrow-request details and profile editor, currently contain interface placeholders while their complete workflows are implemented.

## User Roles

The database is prepared for three main roles:

| Role | Purpose |
| --- | --- |
| Student | Browse books, submit borrowing requests, and view personal borrowing activity |
| Librarian | Support the day-to-day management of books and borrowing requests |
| Admin | Manage library users, catalog data, policies, and system-wide information |

Role definitions are stored in the `profiles` table. Access to individual records should be enforced through Supabase Row Level Security policies before deploying the application to production.

## Technology Stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript |
| Styling | Custom CSS |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Validation | Zod |
| Package Manager | npm |

## System Components

The database schema includes:

- User profiles
- Book categories
- Book records and copy counts
- Borrowing transactions
- Notifications
- Borrowing policies
- Activity logs
- Database triggers and indexes

The SQL migrations are located in `supabase/migrations/`.

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- A Supabase project

### 1. Clone the Repository

```bash
git clone https://github.com/Fushitowa/Hani_Library.git
cd Hani_Library
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
copy .env.example .env.local
```

Then update `.env.local` with your Supabase project settings:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Keep `SUPABASE_SERVICE_ROLE_KEY` private. It must never be included in client-side code or committed to source control.

### 4. Set Up the Database

Apply the migrations in numerical order using the Supabase SQL Editor or Supabase CLI:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_seed_sample_books.sql`
3. `supabase/migrations/003_fix_signup_profile_trigger.sql`

The migrations create the library tables, relationships, indexes, update triggers, signup profile trigger, and sample catalog data.

### 5. Run the Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in a browser.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Next.js development server |
| `npm run build` | Creates a production build |
| `npm run start` | Runs the production build |

## Project Structure

```text
app/
  books/              Book catalog pages and browser interface
  borrow-requests/    Borrowing request interface
  dashboard/          Library overview and activity dashboard
  login/             Authentication pages and actions
  profile/            User profile interface
  register/           Account registration page
  globals.css        Global application styles
lib/
  actions/            Server actions
  supabase/           Supabase client configuration
supabase/
  migrations/         Database schema and seed migrations
types/
  index.ts            Shared application and database types
```

## Borrowing Workflow

The intended borrowing process is:

1. A user creates an account and signs in.
2. The user browses the book catalog.
3. The user submits a request for an available book.
4. A librarian or administrator reviews the request.
5. The borrowing status is updated after approval or rejection.
6. The due date and overdue status are tracked until the book is returned.

The database and dashboard already define the necessary statuses, but the complete staff approval and return workflow should be finished before production use.

## Security Recommendations

Before deploying Hani Library as a real public system:

- Enable Supabase Row Level Security on every table.
- Create role-specific database policies for students, librarians, and administrators.
- Never expose the Supabase service-role key to the browser.
- Store only non-sensitive configuration in `NEXT_PUBLIC_*` variables.
- Validate all server actions and database operations.
- Review authentication callback and password-reset settings.
- Protect administrative operations with server-side authorization checks.

## Development Goals

This project is intended to help me gain experience with:

- Building a responsive Next.js interface
- Organizing TypeScript application code
- Designing relational database structures
- Working with authentication and user roles
- Connecting frontend forms and pages to a backend
- Applying migration and seed files
- Managing project documentation
- Turning a real-world problem into a practical software solution

## Future Improvements

- Complete the librarian and administrator borrowing workflow
- Add an editable student profile
- Add full notification management
- Add renewal and return functionality
- Add borrowing policy configuration
- Add overdue reminder automation
- Add activity log and reporting views
- Add book cover uploads
- Add automated tests
- Deploy the application and database to a production environment

## Contributing

This project began as a personal learning project for a classroom setting. Contributions, suggestions, and ideas are welcome. For larger changes, please open an issue first to discuss the proposed improvement.

## License

Add a license file if you plan to allow others to use, modify, or distribute this project. Without an explicit license, the default copyright applies.

## Author

Created by Kent Carbonell as a classmate-focused learning project and a practical exercise in modern web development.

## Developer's Note

**Developer: Ken (Fushitowa)**

I created Hani Library as an advance gift for my classmate. What started as a way to build something useful for someone else became a meaningful reminder that code is not only a technical skill—it is also a way to turn ideas into something creative and share it with others.

My coding journey began manually, learning the fundamentals one step at a time with guidance from my older brother. I learned by writing code myself, making mistakes, fixing them, and slowly building confidence in the process. Now, I am exploring AI-assisted development and "vibe coding," combining the foundation I have learned with modern AI tools to create projects more thoughtfully and efficiently.

This project represents growth: the patience to learn from the basics, the curiosity to explore new ways of building, and the joy of making something that can be useful to a friend. Thank you for being part of the journey.
