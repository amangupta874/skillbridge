import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getProjects } from '../api/projects.js';
import EmptyState from '../components/EmptyState.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import Pagination from '../components/Pagination.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import ProjectFilters from '../components/ProjectFilters.jsx';
import Spinner from '../components/Spinner.jsx';
import Button from '../components/Button.jsx';
import usePageTitle from '../utils/usePageTitle.js';

const defaultLimit = '12';

function filtersFromParams(params) {
  return {
    ...(params.get('query') && { query: params.get('query') }),
    ...(params.get('skillIds') && { skillIds: params.get('skillIds') }),
    ...(params.get('categoryId') && { categoryId: params.get('categoryId') }),
    ...(params.get('difficulty') && { difficulty: params.get('difficulty') }),
    ...(params.get('hasOpenSeats') && { hasOpenSeats: params.get('hasOpenSeats') }),
    ...(params.get('sort') && { sort: params.get('sort') }),
    ...(params.get('page') && { page: params.get('page') }),
    ...(params.get('limit') && { limit: params.get('limit') }),
  };
}

export default function ProjectsPage() {
  usePageTitle('Projects');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = filtersFromParams(searchParams);
  const page = Number(filters.page || 1);
  const limit = filters.limit || defaultLimit;
  const {
    data: projectsPage,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['projects', filters],
    queryFn: () => getProjects({ ...filters, page, limit }),
  });

  function updateFilters(nextFilters) {
    const params = new URLSearchParams();
    for (const [name, value] of Object.entries(nextFilters)) {
      if (value !== '' && value !== undefined && value !== null && !(name === 'page' && String(value) === '1')) {
        params.set(name, String(value));
      }
    }
    setSearchParams(params, { replace: true });
  }

  function clearFilters() {
    setSearchParams({}, { replace: true });
  }

  function changePage(nextPage) {
    updateFilters({ ...filters, page: String(nextPage) });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Discover projects</h1>
          <p className="mt-1 text-sm text-slate-700">Find a project and bring your skills to a team.</p>
        </div>
        <Button onClick={() => navigate('/projects/new')}>Create project</Button>
      </header>
      <ProjectFilters filters={filters} onChange={updateFilters} onClear={clearFilters} />
      {isLoading ? (
        <div className="flex flex-col items-center gap-3 py-16" data-testid="projects-loading">
          <Spinner size="lg" />
          <p className="text-sm text-slate-700">Loading projects...</p>
        </div>
      ) : error ? (
        <ErrorBanner error={error} onRetry={() => refetch()} />
      ) : projectsPage.items.length === 0 ? (
        <EmptyState title="No projects match your filters" actionLabel="Clear filters" onAction={clearFilters} />
      ) : (
        <>
          <p className="text-sm text-slate-700" aria-live="polite">{projectsPage.meta.total} projects found</p>
          <ul role="list" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projectsPage.items.map((project) => <li key={project.id}><ProjectCard project={project} /></li>)}
          </ul>
          <Pagination page={Number(projectsPage.meta.page)} totalPages={projectsPage.meta.totalPages} onPageChange={changePage} />
        </>
      )}
    </div>
  );
}
