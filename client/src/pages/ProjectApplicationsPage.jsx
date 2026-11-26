import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProject } from '../api/projects.js';
import { getProjectApplications, updateApplicationStatus } from '../api/applications.js';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import Pagination from '../components/Pagination.jsx';
import SkillBadge from '../components/SkillBadge.jsx';
import Spinner from '../components/Spinner.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatLabel } from '../utils/labels.js';
import PageState from '../components/PageState.jsx';
import usePageTitle from '../utils/usePageTitle.js';

const statusOptions = [
  ['all', 'All'],
  ['PENDING', 'Pending'],
  ['ACCEPTED', 'Accepted'],
  ['REJECTED', 'Rejected'],
  ['WITHDRAWN', 'Withdrawn'],
];

export default function ProjectApplicationsPage() {
  usePageTitle('Project applications');
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState(null);
  const projectQuery = useQuery({ queryKey: ['project', id], queryFn: () => getProject(id), enabled: Boolean(id) });
  const filters = { page, limit: 12, ...(status !== 'all' && { status }) };
  const applicationsQuery = useQuery({
    queryKey: ['applications', id, filters],
    queryFn: () => getProjectApplications(id, filters),
    enabled: projectQuery.data?.myRole === 'OWNER',
  });
  const decideApplication = useMutation({
    mutationFn: ({ applicationId, nextStatus }) => updateApplicationStatus(applicationId, nextStatus),
    onSuccess: async (application) => {
      setDecision(null);
      toast.success(`Application ${formatLabel(application.status).toLowerCase()}.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['applications', id] }),
        queryClient.invalidateQueries({ queryKey: ['applications', 'mine'] }),
        queryClient.invalidateQueries({ queryKey: ['project', id] }),
      ]);
    },
    onError: (error) => {
      toast.error(error.message);
      queryClient.invalidateQueries({ queryKey: ['applications', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  if (projectQuery.isLoading) return <PageState title="Project applications"><Spinner size="lg" /></PageState>;
  if (projectQuery.error?.status === 404) return <EmptyState heading="h1" title="Project not found" description="This project is not available." actionLabel="Browse projects" onAction={() => navigate('/projects')} />;
  if (projectQuery.error) return <PageState title="Project applications"><ErrorBanner error={projectQuery.error} onRetry={() => projectQuery.refetch()} /></PageState>;
  if (projectQuery.data?.myRole !== 'OWNER') {
    return <EmptyState heading="h1" title="You are not allowed to view these applications" actionLabel="Back to project" onAction={() => navigate(`/projects/${id}`)} />;
  }

  const project = projectQuery.data;

  return (
    <div className="space-y-6">
      <header>
        <Link to={`/projects/${id}`} className="text-sm font-medium text-indigo-700 hover:text-indigo-900"><span aria-hidden="true">← </span>Back to project</Link>
        <h1 tabIndex={-1} className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Applications for {project.title}</h1>
        <Link to={`/projects/${id}/matches`} className="mt-2 inline-block text-sm font-medium text-indigo-700 hover:underline">Find teammates</Link>
        <p className="mt-2 text-sm text-slate-700">{project.seatsLeft} {project.seatsLeft === 1 ? 'seat' : 'seats'} left · {project.seatsTaken} of {project.maxTeamSize} filled</p>
      </header>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter applications by status">
        {statusOptions.map(([value, label]) => (
          <Button key={value} size="sm" variant={status === value ? 'primary' : 'secondary'} aria-pressed={status === value} onClick={() => { setStatus(value); setPage(1); }}>{label}</Button>
        ))}
      </div>
      {applicationsQuery.isLoading ? (
        <div className="flex flex-col items-center gap-3 py-16"><Spinner size="lg" /><p className="text-sm text-slate-700">Loading applications...</p></div>
      ) : applicationsQuery.error ? (
        <ErrorBanner error={applicationsQuery.error} onRetry={() => applicationsQuery.refetch()} />
      ) : applicationsQuery.data.items.length === 0 ? (
        <EmptyState title="No applications found" description={status === 'all' ? 'No one has applied to this project yet.' : `There are no ${status.toLowerCase()} applications.`} />
      ) : (
        <>
          <ul role="list" className="space-y-4">
            {applicationsQuery.data.items.map((application) => (
              <Card as="li" key={application.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{application.applicant.fullName}</h2>
                    {application.applicant.college && <p className="mt-0.5 text-sm text-slate-700">{application.applicant.college.name}</p>}
                  </div>
                  <Badge variant={application.status}>{formatLabel(application.status)}</Badge>
                </div>
                {application.applicant.topSkills.length > 0 && (
                  <ul role="list" className="mt-4 flex flex-wrap gap-2">
                    {application.applicant.topSkills.map(({ skill, level }) => <li key={skill.id}><SkillBadge skill={skill} level={formatLabel(level)} /></li>)}
                  </ul>
                )}
                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">{application.message}</p>
                <p className="mt-3 text-xs text-slate-700">Applied {new Date(application.createdAt).toLocaleDateString()}</p>
                {application.allowedTransitions.some((nextStatus) => ['ACCEPTED', 'REJECTED'].includes(nextStatus)) && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {application.allowedTransitions.includes('ACCEPTED') && <Button disabled={decideApplication.isPending} aria-haspopup="dialog" onClick={() => { decideApplication.reset(); setDecision({ application, status: 'ACCEPTED' }); }}>Accept</Button>}
                    {application.allowedTransitions.includes('REJECTED') && <Button variant="danger" disabled={decideApplication.isPending} aria-haspopup="dialog" onClick={() => { decideApplication.reset(); setDecision({ application, status: 'REJECTED' }); }}>Reject</Button>}
                  </div>
                )}
              </Card>
            ))}
          </ul>
          <Pagination label="Application pages" page={applicationsQuery.data.meta.page} totalPages={applicationsQuery.data.meta.totalPages} onPageChange={setPage} />
        </>
      )}
      <ConfirmDialog
        open={Boolean(decision)}
        title={`${decision?.status === 'ACCEPTED' ? 'Accept' : 'Reject'} ${decision?.application.applicant.fullName}'s application?`}
        message={decision?.status === 'ACCEPTED' ? 'They will join the project team if a seat is still available.' : 'This application will be marked as rejected.'}
        confirmLabel={decision?.status === 'ACCEPTED' ? 'Accept application' : 'Reject application'}
        danger={decision?.status === 'REJECTED'}
        loading={decideApplication.isPending}
        error={decideApplication.error}
        onCancel={() => { setDecision(null); decideApplication.reset(); }}
        onConfirm={() => decideApplication.mutate({ applicationId: decision.application.id, nextStatus: decision.status })}
      />
    </div>
  );
}
