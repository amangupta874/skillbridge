import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Personalized Greeting */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900" data-testid="dashboard-greeting">
          Welcome back, <span className="text-indigo-600">{user?.fullName || user?.email || 'Student'}</span>!
        </h1>
        <p className="mt-2 text-slate-600">
          Explore student projects, discover teammates with complementary skills, or set up a peer skill exchange.
        </p>
      </div>

      {/* Quick Access Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Projects Discovery</h2>
            <p className="mt-1 text-sm text-slate-500">
              Browse projects, view required tech stacks, and find teams looking for your skills.
            </p>
          </div>
          <div className="mt-6">
            <Link to="/projects">
              <Button variant="secondary" size="sm" className="w-full">
                Browse Projects
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Skill Exchanges</h2>
            <p className="mt-1 text-sm text-slate-500">
              Trade knowledge 1-on-1 with peers: teach skills you know and learn skills you want.
            </p>
          </div>
          <div className="mt-6">
            <Link to="/exchanges">
              <Button variant="secondary" size="sm" className="w-full">
                View Exchanges
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">People & Teammates</h2>
            <p className="mt-1 text-sm text-slate-500">
              Find students by skills, interests, and availability for upcoming project collaborations.
            </p>
          </div>
          <div className="mt-6">
            <Link to="/people">
              <Button variant="secondary" size="sm" className="w-full">
                Find People
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

