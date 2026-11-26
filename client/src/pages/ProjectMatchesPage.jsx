import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProjectMatches } from '../api/matches.js';
import { getProject } from '../api/projects.js';
import EmptyState from '../components/EmptyState.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import MatchCard from '../components/MatchCard.jsx';
import Spinner from '../components/Spinner.jsx';
import PageState from '../components/PageState.jsx';
import usePageTitle from '../utils/usePageTitle.js';

export default function ProjectMatchesPage() {
  usePageTitle('Teammate matches');
  const { id } = useParams();
  const navigate = useNavigate();
  const projectPath = `/projects/${id}`;
  const projectQuery = useQuery({ queryKey: ['project', id], queryFn: () => getProject(id) });
  const isOwner = projectQuery.data?.myRole === 'OWNER';
  const matchesQuery = useQuery({
    queryKey: ['matches', id],
    queryFn: () => getProjectMatches(id),
    enabled: isOwner,
  });

  if (projectQuery.isLoading) return <PageState title="Teammate matches"><Spinner /></PageState>;
  if (projectQuery.error?.status === 404) return <EmptyState heading="h1" title="Project not found" actionLabel="Browse projects" onAction={() => navigate('/projects')} />;
  if (projectQuery.error) return <PageState title="Teammate matches"><ErrorBanner error={projectQuery.error} onRetry={() => projectQuery.refetch()} /></PageState>;
  if (!isOwner || matchesQuery.error?.status === 403) {
    return <EmptyState heading="h1" title="You are not allowed to view these matches" actionLabel="Back to project" onAction={() => navigate(projectPath)} />;
  }

  return (
    <div className="space-y-6">
      <header>
        <Link to={projectPath} className="text-sm font-medium text-indigo-700 hover:underline"><span aria-hidden="true">← </span>Back to project</Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Teammate matches for {projectQuery.data.title}</h1>
        <p className="mt-2 text-sm text-slate-700">The score helps rank candidates. It does not predict how well you’ll work together.</p>
      </header>
      {matchesQuery.isLoading && <Spinner />}
      {matchesQuery.error && <ErrorBanner error={matchesQuery.error} onRetry={() => matchesQuery.refetch()} />}
      {matchesQuery.isSuccess && (
        matchesQuery.data.length === 0 ? (
          <EmptyState title="No matching students yet" description="Check the required skills of your project" />
        ) : (
          <ul role="list" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {matchesQuery.data.map((match) => <li key={match.user.id}><MatchCard match={match} /></li>)}
          </ul>
        )
      )}
    </div>
  );
}
