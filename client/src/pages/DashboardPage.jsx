import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import EmptyState from '../components/EmptyState.jsx';

function DashboardSection({ title, description, to, linkLabel, actionLabel, emptyTitle, emptyDescription }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <Link to={to} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
          {linkLabel}
        </Link>
      </div>
      <Card>
        <EmptyState title={emptyTitle} description={emptyDescription} />
        <div className="mt-4 text-center">
          <Link to={to} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            {actionLabel}
          </Link>
        </div>
      </Card>
    </section>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl" data-testid="dashboard-greeting">
              Welcome back, <span className="text-indigo-600">{user?.fullName || user?.email || 'Student'}</span>!
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Find a project, meet teammates, or share a skill with another student.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link to="/projects"><Button variant="primary" size="md">Find Projects</Button></Link>
            <Link to="/people"><Button variant="secondary" size="md">Find People</Button></Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <DashboardSection
            title="Recommended Projects"
            description="Open projects looking for student contributors"
            to="/projects"
            linkLabel="View all projects"
            actionLabel="Browse projects"
            emptyTitle="No recommendations yet"
            emptyDescription="Browse projects to find one that fits your skills."
          />
          <DashboardSection
            title="My Applications"
            description="Track your requests to join project teams"
            to="/applications"
            linkLabel="View all applications"
            actionLabel="View applications"
            emptyTitle="No applications to show"
            emptyDescription="Your project applications will appear here."
          />
        </div>

        <div className="space-y-8">
          <DashboardSection
            title="Exchange Requests"
            description="One-to-one skill swap proposals"
            to="/exchanges"
            linkLabel="View all exchanges"
            actionLabel="Browse exchanges"
            emptyTitle="No exchange requests yet"
            emptyDescription="Your skill exchange requests will appear here."
          />
          <DashboardSection
            title="Recent Notifications"
            description="Alerts and project updates"
            to="/notifications"
            linkLabel="View all notifications"
            actionLabel="View notifications"
            emptyTitle="No notifications yet"
            emptyDescription="Updates about your activity will appear here."
          />

          <Card className="bg-gradient-to-br from-indigo-50/60 to-white p-5">
            <h3 className="mb-2 text-sm font-bold text-slate-900">Quick Shortcuts</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link to="/projects" className="rounded-lg border border-slate-200 bg-white p-2.5 text-center font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600">Browse Projects</Link>
              <Link to="/people" className="rounded-lg border border-slate-200 bg-white p-2.5 text-center font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600">Find Peers</Link>
              <Link to="/exchanges" className="rounded-lg border border-slate-200 bg-white p-2.5 text-center font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600">My Exchanges</Link>
              <Link to="/profile/edit" className="rounded-lg border border-slate-200 bg-white p-2.5 text-center font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600">Edit Profile</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
