export default function BorrowRequestsPage() {
  return (
    <section className="p-4 md:p-8 lg:p-12 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-primary">Borrow Requests</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-secondary">Pending</span>
            <span className="text-2xl font-bold text-accent" id="pending-count">0</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="card h-full">
            <h3 className="text-lg font-medium mb-3">Pending Approvals</h3>
            <div className="h-80 border border-border rounded-lg flex items-center justify-center text-text-muted">
              Pending requests will appear here
            </div>
          </div>
          <div className="card h-full">
            <h3 className="text-lg font-medium mb-3">Approved Borrowings</h3>
            <div className="h-80 border border-border rounded-lg flex items-center justify-center text-text-muted">
              Approved borrowings will appear here
            </div>
          </div>
          <div className="card h-full">
            <h3 className="text-lg font-medium mb-3">Returned Books</h3>
            <div className="h-80 border border-border rounded-lg flex items-center justify-center text-text-muted">
              Returned books will appear here
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}