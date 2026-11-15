import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getProjects } from '../api/projects.js';
import Button from '../components/Button.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import Spinner from '../components/Spinner.jsx';

export default function MyProjectsPage() {
  const [tab, setTab] = useState('owned');
  const navigate = useNavigate();
  const ownedQuery = useQuery({
    queryKey: ['projects', { mine: 'owned' }],
    queryFn: () => getProjects({ mine: 'owned' }),
    enabled: tab === 'owned',
  });
  const joinedQuery = useQuery({
    queryKey: ['projects', { mine: 'member' }],
    queryFn: () => getProjects({ mine: 'member' }),
    enabled: tab === 'joined',
  });
  const query = tab === 'owned' ? ownedQuery : joinedQuery;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My projects</h1>
          <p className="mt-1 text-sm text-slate-600">Projects you own and projects you have joined.</p>
        </div>
        <Button onClick={() => navigate('/projects/new')}>Create project</Button>
      </header>
      <div role="tablist" aria-label="My projects" className="flex gap-2 border-b border-slate-200">
        <button type="button" role="tab" aria-selected={tab === 'owned'} onClick={() => setTab('owned')} className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === 'owned' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>Owned</button>
        <button type="button" role="tab" aria-selected={tab === 'joined'} onClick={() => setTab('joined')} className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === 'joined' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>Joined</button>
      </div>
      {query.isLoading ? (
        <div className="flex flex-col items-center gap-3 py-16"><Spinner size="lg" /><p className="text-sm text-slate-500">Loading projects...</p></div>
      ) : query.error ? (
        <ErrorBanner error={query.error} onRetry={() => query.refetch()} />
      ) : query.data.items.length === 0 ? (
        tab === 'owned' ? (
          <div className="space-y-4">
            <EmptyState title="You have not created any projects yet" />
            <div className="text-center"><Button onClick={() => navigate('/projects/new')}>Create project</Button></div>
          </div>
        ) : (
          <div className="space-y-4">
            <EmptyState title="You have not joined any projects yet" />
            <p className="text-center"><Link to="/projects" className="text-sm font-medium text-indigo-700 underline hover:text-indigo-900">Browse projects</Link></p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.items.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      )}
    </div>
  );
}
