import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Badge from '../components/Badge.jsx';
import SkillBadge from '../components/SkillBadge.jsx';
import {
  sampleProjects,
  sampleApplications,
  sampleExchanges,
  sampleNotifications,
} from '../api/sampleData.js';
import { formatRelativeTime, formatDate } from '../utils/date.js';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Personalized Greeting */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900" data-testid="dashboard-greeting">
              Welcome back, <span className="text-indigo-600">{user?.fullName || user?.email || 'Student'}</span>!
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
              Collaborate on peer projects, discover teammates with complementary skills, or exchange knowledge 1-on-1.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/projects">
              <Button variant="primary" size="md">
                Find Projects
              </Button>
            </Link>
            <Link to="/people">
              <Button variant="secondary" size="md">
                Find People
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Recommended Projects & Pending Applications */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recommended Projects */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recommended Projects</h2>
                <p className="text-xs text-slate-500">Open projects looking for student contributors</p>
              </div>
              <Link to="/projects" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                View all &rarr;
              </Link>
            </div>

            <div className="space-y-4">
              {sampleProjects.map((project) => (
                <Card key={project.id} className="hover:border-slate-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="OPEN" size="sm">
                          {project.seatsLeft} {project.seatsLeft === 1 ? 'seat' : 'seats'} open
                        </Badge>
                        <Badge variant={project.difficulty} size="sm">
                          {project.difficulty}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {project.category?.name}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {project.title}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {project.summary}
                      </p>

                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">Skills needed:</span>
                        {project.skills?.map((s) => (
                          <SkillBadge key={s.id} skill={s.name} level={s.minLevel} />
                        ))}
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0 pt-2 sm:pt-0">
                      <Link to={`/projects/${project.id}`}>
                        <Button variant="secondary" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* My Pending Applications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">My Applications</h2>
                <p className="text-xs text-slate-500">Track your requests to join project teams</p>
              </div>
              <Link to="/applications" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                View all &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {sampleApplications.map((app) => (
                <Card key={app.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">
                          {app.project?.title}
                        </span>
                        <Badge variant={app.status} size="sm">
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        Applied on {formatDate(app.createdAt)}
                      </p>
                    </div>
                    <Link to="/applications">
                      <Button variant="secondary" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Incoming Exchanges & Recent Notifications */}
        <div className="space-y-8">
          {/* Incoming Skill Exchanges */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Exchange Requests</h2>
                <p className="text-xs text-slate-500">1-on-1 peer skill swap proposals</p>
              </div>
              <Link to="/exchanges" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                View all &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {sampleExchanges.map((exchange) => (
                <Card key={exchange.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">
                      From {exchange.sender?.fullName}
                    </span>
                    <Badge variant={exchange.status} size="sm">
                      {exchange.status}
                    </Badge>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-2.5 text-xs space-y-1 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">They offer:</span>
                      <span className="font-medium text-slate-800">{exchange.offeredSkill?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">They want:</span>
                      <span className="font-medium text-slate-800">{exchange.requestedSkill?.name}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 italic">
                    "{exchange.message}"
                  </p>

                  <div className="pt-1">
                    <Link to="/exchanges">
                      <Button variant="secondary" size="sm" className="w-full">
                        Review Request
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Activity / Notifications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recent Notifications</h2>
                <p className="text-xs text-slate-500">Alerts and project updates</p>
              </div>
              <Link to="/notifications" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                All &rarr;
              </Link>
            </div>

            <Card className="p-0 overflow-hidden divide-y divide-slate-100">
              {sampleNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 transition-colors ${
                    !notif.isRead ? 'bg-indigo-50/40' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {!notif.isRead && (
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600"
                        aria-label="Unread notification"
                      />
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-slate-800 leading-snug">
                        {notif.message}
                      </p>
                      <span className="block text-2xs text-slate-400">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Quick Access Shortcuts */}
          <Card className="p-5 bg-gradient-to-br from-indigo-50/60 to-white">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Quick Shortcuts</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/projects"
                className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 font-medium text-slate-700 hover:text-indigo-600 text-center transition-colors"
              >
                Browse Projects
              </Link>
              <Link
                to="/people"
                className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 font-medium text-slate-700 hover:text-indigo-600 text-center transition-colors"
              >
                Find Peers
              </Link>
              <Link
                to="/exchanges"
                className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 font-medium text-slate-700 hover:text-indigo-600 text-center transition-colors"
              >
                My Exchanges
              </Link>
              <Link
                to="/profile/edit"
                className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 font-medium text-slate-700 hover:text-indigo-600 text-center transition-colors"
              >
                Edit Profile
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
