import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyApplications, updateApplicationStatus } from '../api/applications.js';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import Pagination from '../components/Pagination.jsx';
import Spinner from '../components/Spinner.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatLabel } from '../utils/labels.js';
import usePageTitle from '../utils/usePageTitle.js';

const statusOptions = [
  ['all', 'All'],
  ['PENDING', 'Pending'],
  ['ACCEPTED', 'Accepted'],
  ['REJECTED', 'Rejected'],
  ['WITHDRAWN', 'Withdrawn'],
];

export default function ApplicationsPage() {
  usePageTitle('My applications');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [applicationToWithdraw, setApplicationToWithdraw] = useState(null);
  const filters = { page, limit: 12, ...(status !== 'all' && { status }) };
  const applicationsQuery = useQuery({
    queryKey: ['applications', 'mine', filters],
    queryFn: () => getMyApplications(filters),
  });
  const withdrawApplication = useMutation({
    mutationFn: (applicationId) => updateApplicationStatus(applicationId, 'WITHDRAWN'),
    onSuccess: async () => {
      setApplicationToWithdraw(null);
      toast.success('Your application was withdrawn.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['applications'] }),
        queryClient.invalidateQueries({ queryKey: ['project'] }),
      ]);
    },
    onError: (error) => {
      toast.error(error.message);
      queryClient.invalidateQueries({ queryKey: ['applications', 'mine'] });
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 tabIndex={-1} className="text-2xl font-bold tracking-tight text-slate-900">My applications</h1>
        <p className="mt-1 text-sm text-slate-700">Track the projects you have applied to.</p>
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
        status === 'all' ? (
          <EmptyState title="You have not applied to any project yet" actionLabel="Browse projects" onAction={() => navigate('/projects')} />
        ) : (
          <EmptyState title={`No ${status.toLowerCase()} applications`} description="Try another status filter." />
        )
      ) : (
        <>
          <ul role="list" className="space-y-4">
            {applicationsQuery.data.items.map((application) => (
              <Card as="li" key={application.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">
                    <Link to={`/projects/${application.project.id}`} className="rounded-sm hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600">{application.project.title}</Link>
                  </h2>
                  <Badge variant={application.status}>{formatLabel(application.status)}</Badge>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{application.message}</p>
                <p className="mt-3 text-xs text-slate-700">Applied {new Date(application.createdAt).toLocaleDateString()}</p>
                {application.allowedTransitions.includes('WITHDRAWN') && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <Button variant="secondary" disabled={withdrawApplication.isPending} aria-haspopup="dialog" onClick={() => { withdrawApplication.reset(); setApplicationToWithdraw(application); }}>Withdraw application</Button>
                  </div>
                )}
              </Card>
            ))}
          </ul>
          <Pagination label="Application pages" page={applicationsQuery.data.meta.page} totalPages={applicationsQuery.data.meta.totalPages} onPageChange={setPage} />
        </>
      )}
      <ConfirmDialog
        open={Boolean(applicationToWithdraw)}
        title="Withdraw your application?"
        message={`Your application to ${applicationToWithdraw?.project.title} will be withdrawn.`}
        confirmLabel="Withdraw application"
        danger
        loading={withdrawApplication.isPending}
        error={withdrawApplication.error}
        onCancel={() => { setApplicationToWithdraw(null); withdrawApplication.reset(); }}
        onConfirm={() => withdrawApplication.mutate(applicationToWithdraw.id)}
      />
    </div>
  );
}
