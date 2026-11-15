export default function ProfilePage() {
  return (
    <section className="p-4 md:p-8 lg:p-12 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="card">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-primary mb-4">Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-text-secondary mb-2">Full Name</p>
                <p className="font-medium" id="profile-name">Loading...</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-2">Role</p>
                <p className="font-medium" id="profile-role">Loading...</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-2">Student ID</p>
                <p className="font-medium" id="profile-student-id">Loading...</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-2">Department</p>
                <p className="font-medium" id="profile-department">Loading...</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <button className="btn btn-secondary">
                Update Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}