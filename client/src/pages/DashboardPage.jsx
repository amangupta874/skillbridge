import { useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMyApplications } from '../api/applications.js';
import { getExchanges } from '../api/exchanges.js';
import { getProjects } from '../api/projects.js';
import { getUserById } from '../api/users.js';
import { getNotifications } from '../api/notifications.js';
import { useAuth } from '../context/AuthContext.jsx';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import NotificationList from '../components/NotificationList.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import { formatLabel } from '../utils/labels.js';
import Spinner from '../components/Spinner.jsx';

function DashboardSection({ title, description, to, linkLabel, children }) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 id={titleId} className="text-lg font-bold text-slate-900">{title}</h2>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
        <Link to={to} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
          {linkLabel}
        </Link>
      </div>
      <Card>
        {children}
      </Card>
    </section>
  );
}

function DashboardResults({ query, emptyTitle, emptyTo, emptyLink, children }) {
  if (query.isLoading) return <Spinner />;
  if (query.error) return <ErrorBanner error={query.error} onRetry={() => query.refetch()} />;

  if (!query.data?.items.length) {
    return (
      <div className="space-y-4 text-center">
        <EmptyState title={emptyTitle} />
        {emptyTo && <Link to={emptyTo} className="text-sm font-medium text-indigo-700 underline">{emptyLink}</Link>}
      </div>
    );
  }

  return children(query.data.items);
}

function RecommendedProjects({ userId }) {
  const profileQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId),
  });
  const skillIds = profileQuery.data?.skills.map(({ skill }) => skill.id).join(',');
  const filters = { skillIds, hasOpenSeats: true, limit: 3 };
  const projectsQuery = useQuery({
    queryKey: ['projects', filters],
    queryFn: () => getProjects(filters),
    enabled: Boolean(skillIds),
  });

  if (profileQuery.isLoading) return <Spinner />;
  if (profileQuery.error) {
    return <ErrorBanner error={profileQuery.error} onRetry={() => profileQuery.refetch()} />;
  }

  return (
    <DashboardResults
      query={projectsQuery}
      emptyTitle={skillIds ? 'No open projects match your skills yet' : 'Add skills to your profile to see projects that fit you'}
      emptyTo={skillIds ? '/projects' : '/profile/edit'}
      emptyLink={skillIds ? 'Browse projects' : 'Edit profile'}
    >
      {(projects) => (
        <ul className="space-y-4">
          {projects.slice(0, 3).map((project) => (
            <li key={project.id}><ProjectCard project={project} heading="h3" /></li>
          ))}
        </ul>
      )}
    </DashboardResults>
  );
}

const applicationFilters = { status: 'PENDING', limit: 3 };
const exchangeFilters = { box: 'incoming', status: 'PENDING', limit: 3 };
const ownedFilters = { mine: 'owned', limit: 3 };

const notificationFilters = { page: 1, limit: 5 };

export default function DashboardPage() {
  const { user } = useAuth();
  const applicationsQuery = useQuery({
    queryKey: ['applications', 'mine', applicationFilters],
    queryFn: () => getMyApplications(applicationFilters),
  });
  const exchangesQuery = useQuery({
    queryKey: ['exchanges', exchangeFilters],
    queryFn: () => getExchanges(exchangeFilters),
  });
  const ownedQuery = useQuery({
    queryKey: ['projects', ownedFilters],
    queryFn: () => getProjects(ownedFilters),
  });
  const notificationsQuery = useQuery({
    queryKey: ['notifications', notificationFilters],
    queryFn: () => getNotifications(notificationFilters),
  });

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
            title="Recommended projects"
            description="Open projects looking for student contributors"
            to="/projects"
            linkLabel="View all projects"
          >
            <RecommendedProjects userId={user.id} />
          </DashboardSection>
          <DashboardSection
            title="My applications"
            description="Pending requests to join project teams"
            to="/applications"
            linkLabel="View all"
          >
            <DashboardResults query={applicationsQuery} emptyTitle="You have no pending applications">
              {(applications) => (
                <ul className="divide-y divide-slate-200">
                  {applications.map((application) => (
                    <li key={application.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <Link to={`/projects/${application.project.id}`} className="font-medium text-indigo-700 underline">
                        {application.project.title}
                      </Link>
                      <Badge variant={application.status}>{formatLabel(application.status)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardResults>
          </DashboardSection>
          <DashboardSection title="My projects" to="/my-projects" linkLabel="View my projects">
            <DashboardResults query={ownedQuery} emptyTitle="You have not created any projects yet">
              {(projects) => (
                <ul className="divide-y divide-slate-200">
                  {projects.map((project) => (
                    <li key={project.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <Link to={`/projects/${project.id}`} className="font-medium text-indigo-700 underline">
                        {project.title}
                      </Link>
                      <Badge variant={project.status}>{formatLabel(project.status)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardResults>
          </DashboardSection>
        </div>

        <div className="space-y-8">
          <DashboardSection
            title="Incoming exchange requests"
            description="Pending skill swap proposals"
            to="/exchanges"
            linkLabel="View all"
          >
            <DashboardResults query={exchangesQuery} emptyTitle="You have no pending incoming exchange requests">
              {(exchanges) => (
                <ul className="divide-y divide-slate-200">
                  {exchanges.map((exchange) => (
                    <li key={exchange.id} className="py-2 text-sm text-slate-700">
                      <Link to={`/users/${exchange.sender.id}`} className="font-medium text-indigo-700 underline">
                        {exchange.sender.fullName}
                      </Link>
                      {' offers '}{exchange.offeredSkill.name}{' for '}{exchange.requestedSkill.name}
                    </li>
                  ))}
                </ul>
              )}
            </DashboardResults>
          </DashboardSection>
          <DashboardSection
            title="Recent notifications"
            description="Alerts and project updates"
            to="/notifications"
            linkLabel="View all notifications"
          >
            {notificationsQuery.isLoading && <Spinner />}
            {notificationsQuery.error && <ErrorBanner error={notificationsQuery.error} onRetry={() => notificationsQuery.refetch()} />}
            {notificationsQuery.isSuccess && (
              notificationsQuery.data.items.length === 0
                ? <EmptyState title="You have no notifications yet" />
                : <NotificationList notifications={notificationsQuery.data.items} />
            )}
          </DashboardSection>

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
